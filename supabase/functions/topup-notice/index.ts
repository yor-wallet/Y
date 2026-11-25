import { createClient } from "npm:@supabase/supabase-js@2";
import { topupMessage, type Lang } from "./message.ts";
import { classify, e164Digits, infobipRequest, safeEqual, topupSender, UUID } from "./sms.ts";

/* topup-notice : les deux SMS d'un transfert de crédit (Omantel / Ooredoo / Vodafone), envoyés par Infobip DÈS QUE le transfert est confirmé dans l'application.
   - à l'EXPÉDITEUR : « تمت عملية تحويل مبلغ 1.000 ريال بنجاح إلى الرقم 96892888435. (TID: …). » (dans sa langue : arabe, français, anglais) ;
   - au NUMÉRO CRÉDITÉ : le même message, en arabe.
   Appelée par la base (pg_net, _dispatch_topup_notice) au moment où le transfert est enregistré et confirmé — jamais par l'application, jamais avant la confirmation.
   Authentification : jeton interne de la base (en-tête x-notice-token = notice_dispatch_cfg.token), comparé à durée constante ; sinon 401.
   Un seul envoi par transfert (_topup_sms_claim). Le résultat (SENT / PARTIAL / FAILED, identifiants Infobip, raison d'un refus) est écrit dans
   transactions.meta.topup.sms — jamais de numéro de téléphone — et lu par l'administrateur. Un échec n'annule rien : la confirmation, la notification et l'e-mail restent.
   Secrets : INFOBIP_API_KEY, INFOBIP_BASE_URL (ceux de send-notice) ; TOPUP_SMS_SENDER (facultatif, ≤ 11 lettres / chiffres, « OMWallet » par défaut, jamais un nom de banque). */

const KEY = Deno.env.get("INFOBIP_API_KEY") ?? undefined, BASE = Deno.env.get("INFOBIP_BASE_URL") ?? undefined;
const SENDER = topupSender(Deno.env.get("TOPUP_SMS_SENDER") ?? undefined);
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-notice-token", "access-control-allow-methods": "POST, OPTIONS" };
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", ...CORS } });
const nowIso = () => new Date().toISOString();

type Sent = { status: "SENT" | "FAILED"; messageId?: string | null; error?: string };
async function sendOne(to: string, text: string): Promise<Sent> {
  try {
    let req = infobipRequest({ key: KEY, base: BASE }, to, text, SENDER);
    if ("error" in req) return { status: "FAILED", error: req.error };
    let res = await fetch(req.url, { method: "POST", headers: req.headers, body: req.body, signal: AbortSignal.timeout(15000) });
    let out = classify(res.status, await res.text());
    if (out.kind === "sender") {                       // the sender name is not registered on this route: one more try with the account's own default sender
      req = infobipRequest({ key: KEY, base: BASE }, to, text);
      if ("error" in req) return { status: "FAILED", error: req.error };
      res = await fetch(req.url, { method: "POST", headers: req.headers, body: req.body, signal: AbortSignal.timeout(15000) });
      out = classify(res.status, await res.text());
    }
    return out.kind === "sent" ? { status: "SENT", messageId: out.messageId } : { status: "FAILED", error: out.reason };
  } catch (e) {
    return { status: "FAILED", error: `network: ${String(e)}`.slice(0, 160) };
  }
}

async function langOf(userId: string): Promise<{ lang: Lang; confirmPhone: string | null }> {
  const { data } = await sb.from("user_docs").select("data").eq("user_id", userId).eq("doc_name", "preferences").maybeSingle();
  const l = data?.data?.language;
  return { lang: l === "fr" || l === "en" || l === "ar" ? l : "ar", confirmPhone: data?.data?.confirmPhone ? String(data.data.confirmPhone) : null };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const presented = req.headers.get("x-notice-token") ?? "";
  const { data: cfg } = await sb.from("notice_dispatch_cfg").select("token").eq("id", true).maybeSingle();
  if (!presented || !safeEqual(presented, cfg?.token)) return json({ error: "unauthorized" }, 401);

  let body: Row = {};
  try { body = await req.json(); } catch { /* corps vide */ }
  const txId = String(body.tx_id ?? "");
  if (!UUID.test(txId)) return json({ error: "invalid_tx_id" }, 400);

  const { data: tx } = await sb.from("transactions").select("id, kind, status, sender_id, amount, meta").eq("id", txId).maybeSingle();
  const tp: Row = tx?.meta?.topup ?? {};
  if (!tx || tx.kind !== "CREDIT_TOPUP" || tx.status !== "CONFIRMED" || !tp.phone || !tp.tid) return json({ ok: false, status: "SKIPPED" });
  const { data: claimed, error } = await sb.rpc("_topup_sms_claim", { p_tx: txId });          // one send per transfer
  if (error) return json({ ok: false, status: "ERROR" }, 500);
  if (claimed !== true) return json({ ok: true, status: "ALREADY_HANDLED" });

  const { data: prof } = await sb.from("profiles").select("phone").eq("id", tx.sender_id).maybeSingle();
  const { lang, confirmPhone } = await langOf(tx.sender_id);
  const senderTo = e164Digits(confirmPhone) ?? e164Digits(prof?.phone);
  const creditedTo = e164Digits(tp.phone);

  const patch: Row = { at: nowIso(), provider: "infobip", senderId: SENDER };
  const jobs: Promise<void>[] = [];
  if (senderTo) jobs.push(sendOne(senderTo, topupMessage(lang, tx.amount, tp.phone, tp.tid)).then((r) => { patch.sender = r; }));
  else patch.sender = { status: "SKIPPED", error: "no_sender_phone" };
  if (creditedTo && creditedTo !== senderTo) jobs.push(sendOne(creditedTo, topupMessage("ar", tx.amount, tp.phone, tp.tid)).then((r) => { patch.recipient = r; }));
  else patch.recipient = { status: "SKIPPED", error: creditedTo ? "same_as_sender" : "invalid_phone" };
  await Promise.all(jobs);

  const sent = ["sender", "recipient"].filter((k) => patch[k]?.status === "SENT").length;
  const wanted = ["sender", "recipient"].filter((k) => patch[k]?.status !== "SKIPPED").length;
  patch.status = wanted === 0 ? "FAILED" : sent === wanted ? "SENT" : sent > 0 ? "PARTIAL" : "FAILED";
  await sb.rpc("_topup_sms_done", { p_tx: txId, p_patch: patch });
  return json({ ok: patch.status === "SENT", status: patch.status });
});
