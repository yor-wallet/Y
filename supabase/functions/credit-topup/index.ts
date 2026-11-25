import { createClient } from "npm:@supabase/supabase-js@2";
import { buildSmsText, formatAmount, infobipResult, infobipUrl, mapDbError, normalizeOperator, parseProvider, senderName, type Outcome } from "./lib.ts";

// ============================================================
// credit-topup (15.0.0)
//  A. MODE SMS (circuit retenu par le propriétaire) : seul l'administrateur fait le transfert de crédit ; dès qu'il valide, l'opération est
//     CONFIRMÉE (admin_tx_confirm / admin_topup_confirm) et la base appelle cette fonction (x-webhook-secret + { tx_id }) : le SMS part UNE fois
//     à l'expéditeur, avec le vrai montant, le vrai numéro et le TID de l'opération :
//     « تمت عملية تحويل مبلغ 1.000 ريال بنجاح إلى الرقم 96892888435. (TID: ...). »  Jamais de SMS pour une opération non confirmée.
//  B. MODE FOURNISSEUR (facultatif, inactif sans secrets TOPUP_PROVIDER_URL / TOPUP_PROVIDER_KEY) : transfert automatique par une API de recharge.
// Infobip : INFOBIP_API_KEY, INFOBIP_BASE_URL ; nom d'expéditeur : TOPUP_SMS_SENDER (défaut Omanbaking, le nom déjà en service ; jamais OM Wallet ni un opérateur / Bank Muscat).
// ============================================================
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "content-type": "application/json", "cache-control": "no-store" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** one SMS through Infobip -> { status, id, detail } (nothing is thrown: a failure is a status) */
async function deliverSms(to: string, text: string): Promise<{ status: string; id: string | null; detail: Record<string, unknown> }> {
  const key = Deno.env.get("INFOBIP_API_KEY"), url = infobipUrl(Deno.env.get("INFOBIP_BASE_URL")), from = senderName(Deno.env.get("TOPUP_SMS_SENDER"));
  const digits = String(to ?? "").replace(/[^0-9]/g, "");
  if (!key || !url || !from) return { status: "failed", id: null, detail: { error: "sms_not_configured" } };
  if (!/^[1-9][0-9]{7,14}$/.test(digits)) return { status: "failed", id: null, detail: { error: "sender_phone_missing" } };
  try {
    const res = await fetch(url, { method: "POST", redirect: "error", signal: AbortSignal.timeout(12000),
      headers: { Authorization: `App ${key}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ messages: [{ from, destinations: [{ to: digits, messageId: crypto.randomUUID() }], text }] }) });
    const r = infobipResult(res.ok, await res.json().catch(() => null));
    return { status: r.status, id: r.id, detail: { http: res.status } };
  } catch {
    return { status: "processing", id: null, detail: { error: "delivery_unknown" } };   // the platform may have accepted it: never sent twice
  }
}

const maskPhone = (p: string) => String(p ?? "").replace(/^(.{4}).*(.{3})$/, "$1****$2");

/** A. the administrator confirmed a credit transfer: ONE SMS to the sender */
async function smsForConfirmed(req: Request): Promise<Response> {
  const { data: secret } = await sb.rpc("get_webhook_secret");
  if (!secret || !safeEqual(String(req.headers.get("x-webhook-secret") ?? ""), String(secret))) return json({ error: "unauthorized" }, 401);
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const txId = String(b.tx_id ?? "");
  if (!UUID.test(txId)) return json({ error: "invalid_input" }, 400);
  const { data: tx } = await sb.from("transactions").select("id, kind, status, amount, sender_id, meta").eq("id", txId).maybeSingle();
  if (!tx || tx.kind !== "CREDIT_TOPUP") return json({ ok: false, skip: "not_a_credit_transfer" }, 200);
  if (tx.status !== "CONFIRMED") return json({ ok: false, skip: "not_confirmed" }, 200);      // never an SMS before the confirmation
  const top = (tx.meta ?? {}).topup ?? {};
  const phone = String(top.phone ?? ""), tid = String(top.tid ?? "");
  let text: string;
  try { text = buildSmsText(tx.amount, phone, tid); } catch { return json({ ok: false, skip: "invalid_event" }, 200); }
  const { data: prof } = await sb.from("profiles").select("phone").eq("id", tx.sender_id).maybeSingle();
  const to = String(prof?.phone ?? "");
  // the unique event_id of sms_log is the "already sent" guard: a second call for the same operation sends nothing
  const { error: claimErr } = await sb.from("sms_log").insert({ event_id: `topup:${txId}`, to_masked: maskPhone(to), template: "topup_confirmed", lang: "ar", status: "processing", provider_response: {} });
  if (claimErr) return json({ ok: true, duplicate: true }, 200);
  const r = await deliverSms(to, text);
  await sb.from("sms_log").update({ status: r.status, provider_message_id: r.id, provider_response: r.detail, updated_at: new Date().toISOString() }).eq("event_id", `topup:${txId}`);
  await sb.rpc("topup_note_sms", { p_tx: txId, p_status: r.status });
  return json({ ok: ["accepted", "delivered"].includes(r.status), status: r.status }, 200);
}

// ---------- B. provider mode (optional) ----------
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
  const r = await deliverSms(to, text);
  const digits = String(to ?? "").replace(/[^0-9]/g, "");
  await sb.rpc("topup_record_sms", { p_tx: txId, p_to: digits ? `+${digits}` : "", p_status: r.status, p_provider_id: r.id, p_detail: r.detail });
  return r.status;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (req.headers.has("x-webhook-secret")) return await smsForConfirmed(req);            // A. called by the database, never by a person

  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ ok: false, error: "unauthenticated" }, 401);
  const { data: u } = await sb.auth.getUser(jwt);
  const uid = u?.user?.id;
  if (!uid) return json({ ok: false, error: "unauthenticated" }, 401);

  // the provider mode must be fully configured BEFORE anything is held: no amount is ever reserved for a service that cannot run
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
  if (tx.status && tx.status !== "PENDING") return json(tx);

  const { data: claimed } = await sb.rpc("topup_provider_claim", { p_tx: txId });
  if (claimed !== true) return json({ ok: true, status: "PENDING", transaction_id: txId, reference: tx.reference }, 202);

  const out = await callProvider(pUrl, pKey, { reference: String(tx.reference), operator, phone: String(tx.phone), amount: Number(tx.amount) });

  if (out.kind === "success") {
    const { data: done, error: sErr } = await sb.rpc("_topup_settle", { p_tx: txId, p_tid: out.tid, p_provider_ref: out.ref, p_actor: null, p_source: "PROVIDER" });
    if (sErr) {
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
