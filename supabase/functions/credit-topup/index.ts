import { createClient } from "npm:@supabase/supabase-js@2";
import { buildSmsText, formatAmount, infobipResult, infobipUrl, mapDbError, normalizeOperator, parseProvider, senderName, type Outcome } from "./lib.ts";

// ============================================================
// credit-topup (15.0.0) — « Transfert de crédit » Omantel · Ooredoo · Vodafone, confirmé tout de suite, sans administrateur.
// Règles : « réussi » seulement sur la réponse « réussi » + TID du fournisseur ; jamais de confirmation ni de SMS sur une réponse
// inconnue ou en échec ; UN seul appel au fournisseur par opération ; le SMS ne part qu'une fois, après le crédit.
// Secrets (donnés par le propriétaire, jamais écrits ailleurs) : TOPUP_PROVIDER_URL, TOPUP_PROVIDER_KEY ; Infobip : INFOBIP_API_KEY,
// INFOBIP_BASE_URL ; nom d'expéditeur : TOPUP_SMS_SENDER (défaut OMPAY ; jamais OM Wallet ni le nom d'un opérateur / d'une banque).
// ============================================================
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "content-type": "application/json", "cache-control": "no-store" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

async function callProvider(url: string, key: string, tx: { reference: string; operator: string; phone: string; amount: number }): Promise<Outcome> {
  try {
    const res = await fetch(url, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(25000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json", "Idempotency-Key": tx.reference },
      body: JSON.stringify({ reference: tx.reference, operator: tx.operator, msisdn: tx.phone, amount: formatAmount(tx.amount), currency: "OMR" }),
    });
    return parseProvider(res.status, await res.json().catch(() => null));
  } catch (e) {
    return { kind: "unknown", reason: `provider_unreachable:${String((e as Error)?.name ?? "error").slice(0, 40)}` };
  }
}

async function sendSms(txId: string, to: string, text: string): Promise<string> {
  const key = Deno.env.get("INFOBIP_API_KEY"), url = infobipUrl(Deno.env.get("INFOBIP_BASE_URL")), from = senderName(Deno.env.get("TOPUP_SMS_SENDER"));
  const digits = String(to ?? "").replace(/[^0-9]/g, "");
  let status = "failed", id: string | null = null, detail: Record<string, unknown> = {};
  if (!key || !url || !from) detail = { error: "sms_not_configured" };
  else if (!/^[1-9][0-9]{7,14}$/.test(digits)) detail = { error: "sender_phone_missing" };
  else {
    try {
      const res = await fetch(url, { method: "POST", redirect: "error", signal: AbortSignal.timeout(12000),
        headers: { Authorization: `App ${key}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ messages: [{ from, destinations: [{ to: digits, messageId: crypto.randomUUID() }], text }] }) });
      const r = infobipResult(res.ok, await res.json().catch(() => null));
      status = r.status; id = r.id; detail = { http: res.status };
    } catch { status = "processing"; detail = { error: "delivery_unknown" }; }   // the provider may have accepted it: never sent twice
  }
  await sb.rpc("topup_record_sms", { p_tx: txId, p_to: digits ? `+${digits}` : "", p_status: status, p_provider_id: id, p_detail: detail });
  return status;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ ok: false, error: "unauthenticated" }, 401);
  const { data: u } = await sb.auth.getUser(jwt);
  const uid = u?.user?.id;
  if (!uid) return json({ ok: false, error: "unauthenticated" }, 401);

  // the service must be fully configured BEFORE anything is held: no amount is ever reserved for a service that cannot run
  const pUrl = Deno.env.get("TOPUP_PROVIDER_URL") ?? "", pKey = Deno.env.get("TOPUP_PROVIDER_KEY") ?? "";
  if (!/^https:\/\/[^\s/]+/i.test(pUrl) || pKey.length < 8 || !senderName(Deno.env.get("TOPUP_SMS_SENDER"))) return json({ ok: false, error: "service_unavailable" }, 503);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ ok: false, error: "bad_request" }, 400); }
  const operator = normalizeOperator(b.operator), amount = Number(b.amount), key = String(b.idempotency_key ?? ""), grant = String(b.pin_grant ?? "");
  if (!operator) return json({ ok: false, error: "invalid_operator" }, 400);
  if (!Number.isFinite(amount) || amount <= 0) return json({ ok: false, error: "invalid_amount" }, 400);
  if (key.length < 8 || key.length > 100) return json({ ok: false, error: "idempotency_key_required" }, 400);
  if (!UUID.test(grant)) return json({ ok: false, error: "pin_required" }, 400);

  const { data: created, error: cErr } = await sb.rpc("topup_auto_create", { p_user: uid, p_operator: operator, p_phone: String(b.phone ?? ""), p_amount: amount, p_idempotency_key: key, p_pin_grant: grant });
  if (cErr) return json({ ok: false, error: mapDbError(cErr.message) }, 400);
  const tx = created as Record<string, unknown> | null;
  if (!tx || !tx.transaction_id) return json({ ok: false, error: String((tx as Record<string, unknown> | null)?.error ?? "blocked") }, 403);
  const txId = String(tx.transaction_id);
  if (tx.status && tx.status !== "PENDING") return json(tx);                       // an earlier answer to the same request (already settled)

  const { data: claimed } = await sb.rpc("topup_provider_claim", { p_tx: txId });
  if (claimed !== true) return json({ ok: true, status: "PENDING", transaction_id: txId, reference: tx.reference }, 202);   // already being handled: never a second call

  const out = await callProvider(pUrl, pKey, { reference: String(tx.reference), operator, phone: String(tx.phone), amount: Number(tx.amount) });

  if (out.kind === "success") {
    const { data: done, error: sErr } = await sb.rpc("_topup_settle", { p_tx: txId, p_tid: out.tid, p_provider_ref: out.ref, p_actor: null, p_source: "PROVIDER" });
    if (sErr) {                                                                  // the provider said yes but we could not record it: NEVER hide it
      await sb.rpc("topup_auto_mark_unknown", { p_tx: txId, p_note: `settle_failed:${mapDbError(sErr.message)}:${out.tid}` });
      return json({ ok: true, status: "PENDING", transaction_id: txId, reference: tx.reference }, 202);
    }
    const d = done as Record<string, unknown>;
    let sms = "skipped";
    if (d.already !== true) sms = await sendSms(txId, String(d.sender_phone ?? ""), buildSmsText(d.amount, String(d.phone), String(d.tid)));
    return json({ ok: true, status: "CONFIRMED", transaction_id: txId, reference: tx.reference, tid: d.tid, phone: d.phone, amount: d.amount, sms });
  }
  if (out.kind === "failed") {
    await sb.rpc("_topup_fail", { p_tx: txId, p_reason: out.reason, p_actor: null });
    return json({ ok: false, status: "REJECTED", error: "provider_refused", transaction_id: txId, reference: tx.reference }, 422);
  }
  await sb.rpc("topup_auto_mark_unknown", { p_tx: txId, p_note: out.reason });
  return json({ ok: true, status: "PENDING", transaction_id: txId, reference: tx.reference }, 202);
});
