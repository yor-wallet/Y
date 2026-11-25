// Credit transfer (Omantel · Ooredoo · Vodafone): pure rules, no network and no database here (tested under Node).
//
// PROVIDER CONTRACT (the owner's side — operator or recharge wholesaler). One POST per operation, JSON:
//   request : { reference, operator: "OMANTEL"|"OOREDOO"|"VODAFONE", msisdn: "96892888435", amount: "1.000", currency: "OMR" }
//             headers: Authorization: Bearer <TOPUP_PROVIDER_KEY>, Idempotency-Key: <reference>
//   success : HTTP 2xx + { status: "SUCCESS" | "SUCCESSFUL" | "COMPLETED" | "OK", tid | transaction_id | transactionId | txn_id: "<the operator's TID>" }
//   refused : HTTP 4xx (not 408 / 425 / 429), or HTTP 2xx + { status: "FAILED" | "REJECTED" | "DECLINED" | "INVALID" | "ERROR" }
//   anything else (network error, timeout, 5xx, 408 / 425 / 429, unknown body, success WITHOUT a TID) is "unknown": the operation stays « in
//   progress », the amount stays held, nothing is confirmed or sent by SMS, and nothing is sent again to the provider.
// If the real provider uses other field names, only parseProvider() below changes.

export type Outcome =
  | { kind: "success"; tid: string; ref: string }
  | { kind: "failed"; reason: string }
  | { kind: "unknown"; reason: string };

export const OPERATORS = ["OMANTEL", "OOREDOO", "VODAFONE"] as const;

export function normalizeOperator(v: unknown): string | null {
  const o = String(v ?? "").trim().toUpperCase();
  return (OPERATORS as readonly string[]).includes(o) ? o : null;
}

/** « 1.000 » — three decimals, as the owner's message shows */
export function formatAmount(n: unknown): string {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) throw new Error("invalid_amount");
  return x.toFixed(3);
}

/** The sender's confirmation, in the owner's exact wording, with the REAL amount, number and TID. */
export function buildSmsText(amount: unknown, phone: string, tid: string): string {
  if (!/^968[79][0-9]{7}$/.test(phone)) throw new Error("invalid_phone");
  if (!/^[0-9A-Za-z._-]{4,40}$/.test(tid)) throw new Error("invalid_tid");
  return `تمت عملية تحويل مبلغ ${formatAmount(amount)} ريال بنجاح إلى الرقم ${phone}. (TID: ${tid}).`;
}

/** SMS sender name: the owner chooses it (Infobip registration). Default « Omanbaking » = the sender already in service for transfer SMS (owner's choice, 06/11/2026).
 *  Never « OM Wallet », and never the name of an operator or of Bank Muscat. */
const FORBIDDEN_SENDERS = ["omwallet", "omantel", "ooredoo", "vodafone", "bankmuscat", "bmct", "nawras", "omanmobile", "omanmobiletelecom"];
export const DEFAULT_SENDER = "Omanbaking";
export function senderName(v: string | undefined | null): string | null {
  const s = String(v ?? DEFAULT_SENDER).trim();
  if (!/^[A-Za-z0-9]{1,11}$/.test(s)) return null;
  if (FORBIDDEN_SENDERS.includes(s.toLowerCase())) return null;
  return s;
}

const OK_WORDS = ["SUCCESS", "SUCCESSFUL", "COMPLETED", "OK"];
const KO_WORDS = ["FAILED", "REJECTED", "DECLINED", "INVALID", "ERROR"];
const TID_KEYS = ["tid", "TID", "transaction_id", "transactionId", "txn_id"];

export function parseProvider(http: number, body: unknown): Outcome {
  const o = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const st = String(o.status ?? o.Status ?? o.result ?? "").trim().toUpperCase();
  if (http >= 200 && http < 300) {
    if (OK_WORDS.includes(st)) {
      for (const k of TID_KEYS) {
        const v = o[k];
        if ((typeof v === "string" || typeof v === "number") && /^[0-9A-Za-z._-]{4,40}$/.test(String(v))) {
          return { kind: "success", tid: String(v), ref: String(o.provider_ref ?? o.ref ?? "").slice(0, 120) };
        }
      }
      return { kind: "unknown", reason: "success_without_tid" };
    }
    if (KO_WORDS.includes(st)) return { kind: "failed", reason: `provider_${st.toLowerCase()}` };
    return { kind: "unknown", reason: "unrecognized_body" };
  }
  if (http >= 400 && http < 500 && ![408, 425, 429].includes(http)) return { kind: "failed", reason: `provider_http_${http}` };
  return { kind: "unknown", reason: `provider_http_${http}` };
}

/** Database error codes the app understands (everything else becomes a generic error: raw messages are never shown). */
const KNOWN = ["unauthenticated", "idempotency_key_required", "service_unavailable", "invalid_operator", "invalid_phone", "invalid_amount", "below_minimum",
  "limit_per_transaction", "limit_daily", "too_many_open", "insufficient_balance", "sender_inactive", "sender_account_missing", "pin_required"];
export function mapDbError(message: string | undefined | null): string {
  const m = String(message ?? "");
  return KNOWN.find((k) => m.includes(k)) ?? "server_error";
}

/** Infobip base URL: https, host « <id>.api.infobip.com » only (a secret must never be sent to another host). */
export function infobipUrl(base: string | undefined | null): string | null {
  try {
    const u = new URL(String(base ?? "").includes("://") ? String(base) : `https://${base}`);
    if (u.protocol !== "https:" || !/^[a-z0-9-]+\.api\.infobip\.com$/i.test(u.hostname) || u.port || u.username || u.password || u.search || u.hash || !["", "/"].includes(u.pathname)) return null;
    return `${u.origin}/sms/2/text/advanced`;
  } catch { return null; }
}

/** Infobip answer -> { status, id } (accepted only when the platform really accepted it) */
export function infobipResult(ok: boolean, data: unknown): { status: "accepted" | "delivered" | "failed" | "processing"; id: string | null } {
  const m = (data as { messages?: Array<{ messageId?: string; status?: { groupName?: string } }> })?.messages?.[0];
  const g = String(m?.status?.groupName ?? "").toUpperCase();
  const id = typeof m?.messageId === "string" ? m.messageId.slice(0, 200) : null;
  if (!ok || ["REJECTED", "UNDELIVERABLE", "EXPIRED"].includes(g)) return { status: "failed", id };
  if (!id || !["PENDING", "DELIVERED"].includes(g)) return { status: "processing", id };
  return { status: g === "DELIVERED" ? "delivered" : "accepted", id };
}
