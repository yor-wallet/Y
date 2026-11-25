/* topup-notice — logique PURE (aucun réseau, aucune base), testable avec `node` (tests/ux/topup-sms.test.mjs).
   Envoi par Infobip (API SMS v3) : mêmes secrets que send-notice (INFOBIP_API_KEY, INFOBIP_BASE_URL). Nom d'expéditeur : secret TOPUP_SMS_SENDER
   (≤ 11 lettres / chiffres), « OMWallet » par défaut ; un nom de banque n'est jamais utilisé. */

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Comparaison à durée constante du jeton interne. Deux chaînes vides ne sont jamais égales. */
export function safeEqual(a: unknown, b: unknown): boolean {
  const x = String(a ?? ""), y = String(b ?? "");
  if (!x || x.length !== y.length) return false;
  let r = 0;
  for (let i = 0; i < x.length; i++) r |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return r === 0;
}

export const DEFAULT_SENDER = "OMWallet";
const BANK_LIKE = /bank|baking|muscat|oman|mtq|nbo|visa|master/i;
export const topupSender = (raw: string | undefined): string => {
  const v = String(raw ?? "").trim();
  return /^[A-Za-z0-9]{3,11}$/.test(v) && !BANK_LIKE.test(v) ? v : DEFAULT_SENDER;
};

/** Numéro → chiffres internationaux (« 96892888435 »), ou null. « +968… », « 00968… » ou 8 chiffres omanais (7 / 9) sont acceptés. */
export function e164Digits(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s || /[A-Za-z]/.test(s)) return null;
  let d = s.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (!s.startsWith("+") && /^[79]\d{7}$/.test(d)) d = "968" + d;
  return /^\d{8,15}$/.test(d) ? d : null;
}

const INVISIBLE_RE = new RegExp("[\\s" + [[0x200b, 0x200f], [0x202a, 0x202e], [0x2060, 0x2069], [0xfeff, 0xfeff]].map(([a, b]) => String.fromCharCode(a) + "-" + String.fromCharCode(b)).join("") + "]", "g");
export const cleanSecret = (raw: unknown) => String(raw ?? "").replace(INVISIBLE_RE, "");
const KEY_RE = /^[A-Za-z0-9._:-]{16,256}$/;

export type SmsRequest = { url: string; headers: Record<string, string>; body: string } | { error: string };

/** Requête Infobip (POST /sms/3/messages). [sender] absent = le nom d'expéditeur par défaut du compte. */
export function infobipRequest(env: { key?: string; base?: string }, toDigits: string, text: string, sender?: string): SmsRequest {
  const to = String(toDigits ?? "").replace(/\D/g, "");
  if (to.length < 8 || to.length > 15) return { error: "invalid_phone" };
  const key = cleanSecret(env.key);
  if (!key) return { error: "provider not configured: INFOBIP_API_KEY secret missing" };
  if (!KEY_RE.test(key)) return { error: "provider not configured: INFOBIP_API_KEY is not a valid key" };
  const base = cleanSecret(env.base || "https://api.infobip.com").replace(/\/+$/, "");
  if (!/^https:\/\/([a-z0-9-]+\.)*infobip\.com$/i.test(base)) return { error: "provider not configured: INFOBIP_BASE_URL must be https://….infobip.com" };
  const message: Record<string, unknown> = { destinations: [{ to }], content: { text } };
  if (sender) message.sender = sender;
  return { url: `${base}/sms/3/messages`, headers: { Authorization: `App ${key}`, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ messages: [message] }) };
}

export type Outcome =
  | { kind: "sent"; messageId: string | null }
  | { kind: "sender"; reason: string }        // le nom d'expéditeur n'est pas accepté sur cette route : on réessaie une fois avec celui du compte
  | { kind: "failed"; reason: string };

const CREDIT_RE = /insufficient|balance|funds|credit/i;
const SENDER_RE = /sender|not_registered|not_allowed|route|permission/i;

/** Infobip : 2xx avec messages[0].status.groupId (1 = accepté par l'opérateur, 3 = remis) ; tout autre groupe ou toute erreur = refus. */
export function classify(status: number, text: string): Outcome {
  // deno-lint-ignore no-explicit-any
  let b: Record<string, any> = {};
  try { b = JSON.parse(text); } catch { /* corps non JSON */ }
  const m = Array.isArray(b.messages) ? b.messages[0] : null;
  if (status >= 200 && status < 300 && m?.status) {
    const g = Number(m.status.groupId);
    if (g === 1 || g === 3) return { kind: "sent", messageId: m.messageId != null ? String(m.messageId) : null };
    const info = `${m.status.name ?? m.status.groupName ?? ""} ${m.status.description ?? ""}`.trim().slice(0, 160);
    if (CREDIT_RE.test(info)) return { kind: "failed", reason: `sms_credits_missing: ${info}` };
    if (SENDER_RE.test(info)) return { kind: "sender", reason: `sender_or_route: ${info}` };
    return { kind: "failed", reason: `provider_rejected: ${info}` };
  }
  const ex = b.requestError?.serviceException;
  const msg = String(ex?.text ?? ex?.messageId ?? text ?? "").slice(0, 160);
  if (CREDIT_RE.test(msg)) return { kind: "failed", reason: `sms_credits_missing: ${msg}` };
  if (status === 401 || status === 403) return { kind: "failed", reason: `provider_auth: ${msg}` };
  if ((status === 400 || status === 422) && SENDER_RE.test(msg)) return { kind: "sender", reason: `sender_or_route: ${msg}` };
  return { kind: "failed", reason: `infobip ${status}: ${msg}` };
}
