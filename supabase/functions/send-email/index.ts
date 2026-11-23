import { createClient } from "npm:@supabase/supabase-js@2";

// ============================================================
// OM Wallet — send-email (14.3) — clés des fournisseurs : Supabase Vault (prioritaire) ou secrets de la fonction
// File d'attente : public.email_logs (créée par la base, jamais par le navigateur). Authentification : secret partagé gardé en base.
//
// FOURNISSEURS (le premier configuré qui accepte l'envoi gagne ; un refus de configuration passe au suivant) :
//   1. Brevo        — secret BREVO_API_KEY (clé API v3). L'expéditeur EMAIL_FROM doit être vérifié dans ce compte Brevo.
//   2. SMTP (TLS)   — secrets SMTP_HOST, SMTP_PORT (465), SMTP_USER, SMTP_PASS. Ex. Gmail : smtp.gmail.com / 465 / adresse / mot de passe d'application.
//   3. Resend       — secret RESEND_API_KEY ; RESEND_FROM = adresse d'un domaine vérifié chez Resend.
// EMAIL_FROM (facultatif) : adresse d'expédition. Aucun secret n'est jamais renvoyé ni écrit dans la base.
//
// RÈGLES (14.1.0, confirmation des transactions par l'administrateur) :
//   - FUNDS_RECEIVED : UN e-mail au destinataire, créé par admin_tx_confirm dans la même transaction que le crédit. Il n'est envoyé que si
//     la transaction est CONFIRMED, a une heure de confirmation, et que le grand livre montre le crédit du destinataire.
//   - CRYPTO_WITHDRAWAL_CONFIRMED : un e-mail après la confirmation réseau (hash réel enregistré).
//   - TX_SENDER / TX_RECEIVER (ancien processus) : remplacés, jamais envoyés (statut SKIPPED, raison écrite).
//   - ADMIN_TX_ACTION (14.3) : e-mail à chaque administrateur dès qu'un envoi est enregistré, avec trois boutons (Confirmer / Refuser / Pause).
//     Chaque bouton ouvre la page de confirmation /admin-action avec un jeton personnel, créé AU MOMENT de l'envoi (issue_admin_action_links :
//     seul le haché est stocké en base ; la file d'e-mails ne contient jamais de jeton utilisable ; un renvoi remplace le jeu précédent).
//   - TRANSFER_CONFIRMED (14.3) : e-mail détaillé à l'expéditeur quand l'administrateur confirme (le destinataire reçoit FUNDS_RECEIVED).
// ============================================================
const FROM_EMAIL = (Deno.env.get("EMAIL_FROM") || "yordigitalefinance@gmail.com").trim();
const FROM_NAME = "OM Wallet";
const REPLY_TO = FROM_EMAIL;
const APP_URL = (Deno.env.get("APP_URL") || "https://yor-wallet.vercel.app").trim();
let BREVO_KEY = (Deno.env.get("BREVO_API_KEY") ?? "").trim();
const SMTP = {
  host: (Deno.env.get("SMTP_HOST") ?? "").trim(), port: Number(Deno.env.get("SMTP_PORT") || 465),
  user: (Deno.env.get("SMTP_USER") ?? "").trim(), pass: Deno.env.get("SMTP_PASS") ?? "",
};
let RESEND_KEY = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
let KEY_SOURCE = BREVO_KEY ? "env" : "none";
const RESEND_FROM = (Deno.env.get("RESEND_FROM") || FROM_EMAIL).trim();

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

/* 14.1.2 — provider keys kept in Supabase Vault (encrypted) take precedence over the Edge Function secrets; read by the service role only
   (public.get_email_provider_secret), re-read at most every 5 minutes, never returned or logged. */
let keysAt = 0;
async function loadKeys(): Promise<void> {
  if (Date.now() - keysAt < 300000) return;
  keysAt = Date.now();
  const read = async (name: string) => { try { const { data } = await sb.rpc("get_email_provider_secret", { p_name: name }); return data ? String(data).trim() : ""; } catch { return ""; } };
  const [b, sp, rs] = await Promise.all([read("brevo_api_key"), read("smtp_pass"), read("resend_api_key")]);
  if (b){ BREVO_KEY = b; KEY_SOURCE = "vault"; }
  if (sp) SMTP.pass = sp;
  if (rs) RESEND_KEY = rs;
}

type Lang = "fr" | "en" | "ar";
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

// OM Wallet palette (application : css/glass.css)
const SKY = "#369EDB", SKY_LIGHT = "#BFE8FF", INK = "#102A43", BG = "#F4FAFF";

const T: Record<Lang, Row> = {
  fr: {
    dir: "ltr", locale: "fr-FR",
    welcomeSubject: "Bienvenue sur OM Wallet", welcomeSubjectReward: (a: string) => `Bienvenue sur OM Wallet — ${a} offerts`,
    welcomeTitle: (n: string) => `Bienvenue sur OM Wallet, ${n} !`,
    welcomeBody: "Votre compte est confirmé. Vous pouvez dès maintenant gérer vos actifs en toute sécurité avec OM Wallet.",
    rewardLine: (a: string) => `Cadeau de bienvenue : ${a} ont été ajoutés à votre portefeuille.`,
    open: "Ouvrir OM Wallet", supportLine: "Besoin d'aide ? Écrivez-nous :", company: "OM Wallet", privacy: "Confidentialité", terms: "Conditions",
    f: { amount: "Montant", ref: "Référence", date: "Date et heure", status: "Statut", network: "Réseau", address: "Adresse de destination", hash: "Hash de la transaction",
      name: "Nom", phone: "Téléphone", country: "Pays", email: "E-mail", yor: "Wallet ID", from: "De", to: "À", note: "Note" },
    funds: { subject: "OM Wallet — Fonds reçus", title: "Fonds reçus", line: (a: string) => `Vous avez reçu ${a} sur votre compte OM Wallet.`, ok: "Crédité avec succès." },
    act: { subject: (r: string) => `OM Wallet — Transfert à traiter (${r})`, title: "Un transfert attend votre décision", intro: (a: string) => `Un transfert de ${a} vient d'être enregistré. Choisissez une action :`,
      confirm: "Confirmer", reject: "Refuser", pause: "Mettre en pause", expires: "Ces boutons sont personnels et valables 72 heures. Chacun ouvre une page de confirmation." },
    tc: { subject: (r: string) => `OM Wallet — Transfert confirmé (${r})`, title: "Transfert confirmé", line: (a: string, to: string) => `Votre transfert de ${a} vers ${to} a été confirmé.`, ok: "Confirmé avec succès." },
    cw: { subject: (r: string) => `OM Wallet — Retrait confirmé sur la blockchain (${r})`, title: "Retrait confirmé sur la blockchain",
      line: (a: string) => `Votre retrait de ${a} a été confirmé par le réseau.`, ok: "Confirmé sur la blockchain." },
    tz: "heure d'Oman",
    val: {
      kycSubject: "OM Wallet — Votre identité est vérifiée", kycTitle: "Vérification d'identité acceptée",
      kycBody: "Notre équipe a examiné vos documents et votre photo, et les a acceptés. Votre compte est maintenant vérifié.",
      invSubject: (r: string) => `OM Wallet — Paiement confirmé (${r})`, invTitle: "Votre paiement est reçu et confirmé",
      invBody: "L'administrateur a vérifié la réception réelle du montant sur notre compte ; votre plan est actif.",
      wdSubject: (r: string) => `OM Wallet — Retrait effectué (${r})`, wdTitle: "Votre demande de retrait est exécutée",
      wdBody: "L'administrateur a confirmé le virement du montant vers votre compte bancaire. Son apparition sur votre relevé peut prendre un peu de temps selon la banque.",
      plan: "Plan", days: "Durée (jours)", bank: "Banque", bankRef: "Référence du virement bancaire",
      plans: { ESSENTIAL: "Essentiel", GROWTH: "Croissance", PREMIUM: "Premium" },
    },
    admin: { subject: (n: string) => `Nouveau membre : ${n}`, title: "Un nouveau membre vient de s'inscrire", intro: "Voici ses informations d'inscription." },
    sec: {
      SEC_PASSWORD_CHANGED: ["Votre mot de passe a été modifié", "Le mot de passe de votre compte OM Wallet vient d'être modifié."],
      SEC_EMAIL_CHANGED: ["L'adresse e-mail de votre compte a changé", "L'adresse e-mail de votre compte OM Wallet vient d'être modifiée"],
      SEC_PIN_CHANGED: ["Votre code PIN a été modifié", "Le code PIN de votre compte OM Wallet vient d'être modifié."],
      SEC_NEW_DEVICE: ["Nouvelle connexion à votre compte", "Une connexion à votre compte OM Wallet a été détectée depuis un nouvel appareil."],
      warn: "Si ce n'est pas vous, contactez immédiatement notre support :",
    },
  },
  en: {
    dir: "ltr", locale: "en-GB",
    welcomeSubject: "Welcome to OM Wallet", welcomeSubjectReward: (a: string) => `Welcome to OM Wallet — ${a} on us`,
    welcomeTitle: (n: string) => `Welcome to OM Wallet, ${n}!`,
    welcomeBody: "Your account is confirmed. You can now manage your assets securely with OM Wallet.",
    rewardLine: (a: string) => `Welcome gift: ${a} has been added to your wallet.`,
    open: "Open OM Wallet", supportLine: "Need help? Write to us:", company: "OM Wallet", privacy: "Privacy", terms: "Terms",
    f: { amount: "Amount", ref: "Reference", date: "Date and time", status: "Status", network: "Network", address: "Destination address", hash: "Transaction hash",
      name: "Name", phone: "Phone", country: "Country", email: "E-mail", yor: "Wallet ID", from: "From", to: "To", note: "Note" },
    funds: { subject: "OM Wallet — Funds received", title: "Funds received", line: (a: string) => `You have received ${a} on your OM Wallet account.`, ok: "Credited successfully." },
    act: { subject: (r: string) => `OM Wallet — Transfer to review (${r})`, title: "A transfer is waiting for your decision", intro: (a: string) => `A transfer of ${a} has just been recorded. Choose an action:`,
      confirm: "Confirm", reject: "Refuse", pause: "Pause", expires: "These buttons are personal and valid for 72 hours. Each one opens a confirmation page." },
    tc: { subject: (r: string) => `OM Wallet — Transfer confirmed (${r})`, title: "Transfer confirmed", line: (a: string, to: string) => `Your transfer of ${a} to ${to} has been confirmed.`, ok: "Confirmed successfully." },
    cw: { subject: (r: string) => `OM Wallet — Withdrawal confirmed on the blockchain (${r})`, title: "Withdrawal confirmed on the blockchain",
      line: (a: string) => `Your withdrawal of ${a} has been confirmed by the network.`, ok: "Confirmed on the blockchain." },
    tz: "Oman time",
    val: {
      kycSubject: "OM Wallet — Your identity is verified", kycTitle: "Identity verification accepted",
      kycBody: "Our team reviewed your documents and your photo and accepted them. Your account is now verified.",
      invSubject: (r: string) => `OM Wallet — Payment confirmed (${r})`, invTitle: "Your payment is received and confirmed",
      invBody: "The administrator checked that the amount really reached our account; your plan is active.",
      wdSubject: (r: string) => `OM Wallet — Withdrawal paid (${r})`, wdTitle: "Your withdrawal request is paid",
      wdBody: "The administrator confirmed the transfer of the amount to your bank account. It may take some time to appear on your statement, depending on the bank.",
      plan: "Plan", days: "Duration (days)", bank: "Bank", bankRef: "Bank transfer reference",
      plans: { ESSENTIAL: "Essential", GROWTH: "Growth", PREMIUM: "Premium" },
    },
    admin: { subject: (n: string) => `New member: ${n}`, title: "A new member just signed up", intro: "Here are their sign-up details." },
    sec: {
      SEC_PASSWORD_CHANGED: ["Your password was changed", "The password of your OM Wallet account was just changed."],
      SEC_EMAIL_CHANGED: ["Your account e-mail address changed", "The e-mail address of your OM Wallet account was just changed"],
      SEC_PIN_CHANGED: ["Your PIN was changed", "The PIN of your OM Wallet account was just changed."],
      SEC_NEW_DEVICE: ["New sign-in to your account", "A sign-in to your OM Wallet account was detected from a new device."],
      warn: "If this wasn't you, contact our support immediately:",
    },
  },
  ar: {
    dir: "rtl", locale: "ar-OM-u-nu-latn",
    welcomeSubject: "مرحباً بك في OM Wallet", welcomeSubjectReward: (a: string) => `مرحباً بك في OM Wallet — ${a} هدية منّا`,
    welcomeTitle: (n: string) => `مرحباً بك في OM Wallet يا ${n}!`,
    welcomeBody: "تم تأكيد حسابك. يمكنك الآن إدارة أصولك بأمان مع OM Wallet.",
    rewardLine: (a: string) => `هدية الترحيب: تمت إضافة ${a} إلى محفظتك.`,
    open: "فتح OM Wallet", supportLine: "هل تحتاج إلى مساعدة؟ راسلنا:", company: "OM Wallet", privacy: "الخصوصية", terms: "الشروط",
    f: { amount: "المبلغ", ref: "المرجع", date: "التاريخ والوقت", status: "الحالة", network: "الشبكة", address: "عنوان الوجهة", hash: "معرّف المعاملة",
      name: "الاسم", phone: "الهاتف", country: "الدولة", email: "البريد الإلكتروني", yor: "Wallet ID", from: "من", to: "إلى", note: "ملاحظة" },
    funds: { subject: "OM Wallet — تم استلام الأموال", title: "تم استلام الأموال", line: (a: string) => `لقد استلمت ${a} في حسابك على OM Wallet.`, ok: "أُضيف المبلغ بنجاح." },
    act: { subject: (r: string) => `OM Wallet — تحويل بانتظار قرارك (${r})`, title: "تحويل ينتظر قرارك", intro: (a: string) => `تم تسجيل تحويل بقيمة \u2066${a}\u2069 للتو. اختر إجراءً:`,
      confirm: "تأكيد", reject: "رفض", pause: "إيقاف مؤقت", expires: "هذه الأزرار شخصية وصالحة لمدة 72 ساعة، وكل زر يفتح صفحة تأكيد." },
    tc: { subject: (r: string) => `OM Wallet — تم تأكيد التحويل (${r})`, title: "تم تأكيد التحويل", line: (a: string, to: string) => `تم تأكيد تحويلك بقيمة \u2066${a}\u2069 إلى \u2068${to}\u2069.`, ok: "تم التأكيد بنجاح." },
    cw: { subject: (r: string) => `OM Wallet — تم تأكيد السحب على البلوكشين (${r})`, title: "تم تأكيد السحب على البلوكشين",
      line: (a: string) => `أكّدت الشبكة سحبك بقيمة ${a}.`, ok: "مؤكد على البلوكشين." },
    tz: "بتوقيت عُمان",
    admin: { subject: (n: string) => `عضو جديد: ${n}`, title: "انضم عضو جديد للتو", intro: "هذه بيانات التسجيل الخاصة به." },
    sec: {
      SEC_PASSWORD_CHANGED: ["تم تغيير كلمة المرور", "تم تغيير كلمة مرور حسابك في OM Wallet للتو."],
      SEC_EMAIL_CHANGED: ["تم تغيير البريد الإلكتروني لحسابك", "تم تغيير البريد الإلكتروني لحسابك في OM Wallet للتو"],
      SEC_PIN_CHANGED: ["تم تغيير رمز PIN", "تم تغيير رمز PIN لحسابك في OM Wallet للتو."],
      SEC_NEW_DEVICE: ["تسجيل دخول جديد إلى حسابك", "تم رصد تسجيل دخول إلى حسابك في OM Wallet من جهاز جديد."],
      warn: "إذا لم تكن أنت، تواصل مع الدعم فوراً:",
    },
    val: {
      kycSubject: "OM Wallet — تم التحقق من هويتك", kycTitle: "تم قبول التحقق من الهوية",
      kycBody: "راجع فريقنا وثائقك وصورتك الشخصية وتم قبولها. حسابك موثّق الآن.",
      invSubject: (r: string) => `OM Wallet — تم تأكيد دفعتك (${r})`, invTitle: "تم استلام دفعتك وتأكيدها",
      invBody: "تحقق المسؤول فعلياً من وصول المبلغ إلى حسابنا، وأصبحت خطتك فعّالة.",
      wdSubject: (r: string) => `OM Wallet — تم تنفيذ سحبك (${r})`, wdTitle: "تم تنفيذ طلب السحب",
      wdBody: "أكّد المسؤول تحويل المبلغ إلى حسابك المصرفي. قد يستغرق ظهوره في كشف الحساب بعض الوقت حسب البنك.",
      plan: "الخطة", days: "المدة (أيام)", bank: "البنك", bankRef: "مرجع التحويل المصرفي",
      plans: { ESSENTIAL: "الأساسية", GROWTH: "النمو", PREMIUM: "بريميوم" },
    },
  },
};

const FIAT_DEC: Record<string, number> = { OMR: 3, XOF: 0, USD: 2, AED: 2, SAR: 2 };
const NETWORK_NAMES: Record<string, string> = {
  bitcoin: "Bitcoin", ethereum: "Ethereum (ERC20)", bsc: "BNB Smart Chain (BEP20)", polygon: "Polygon", tron: "TRON (TRC20)", solana: "Solana", xrp: "XRP Ledger", litecoin: "Litecoin",
};
const dispId = (v: unknown) => String(v ?? "").replace(/^YOR-/i, "FRD-");     // same display as the app (js/core/helpers.js dispId)
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const countryName = (iso: string, lang: Lang) => { try { return new Intl.DisplayNames([lang], { type: "region" }).of(iso) ?? iso; } catch { return iso; } };
function num(n: unknown, asset: string, lang: Lang): string {
  const dec = FIAT_DEC[asset];
  return new Intl.NumberFormat(T[lang].locale, { minimumFractionDigits: dec ?? 0, maximumFractionDigits: dec ?? 8 }).format(Number(n));
}
const money = (n: unknown, asset: string, lang: Lang) => `${num(n, asset, lang)} ${asset}`;
/* exact time of the event, in Oman time (Asia/Muscat, UTC+4), with seconds */
function when(iso: string, lang: Lang): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(T[lang].locale, { dateStyle: "long", timeStyle: "medium", timeZone: "Asia/Muscat", hourCycle: "h23" }).format(d) + ` (${T[lang].tz}${lang === "ar" ? "، " : ", "}UTC+4)`;
}

function layout(lang: Lang, title: string, intro: string, rows: [string, string][], extraHtml = ""): string {
  const t = T[lang], al = t.dir === "rtl" ? "right" : "left";
  // only a long value WITHOUT spaces (address, hash) may break anywhere; a sentence or a date wraps between words
  const wrap = (v: string) => (v.length > 28 && !/\s/.test(v) ? ";word-break:break-all;overflow-wrap:anywhere" : "");
  const nb = (v: string) => v.replace(/OM Wallet/g, "OM\u00a0Wallet");
  const body = rows.map(([k, v]) =>
    `<tr><td style="padding:10px 0;color:#74879A;font-size:14px;text-align:${al};border-bottom:1px solid #E6F2FB">${esc(k)}</td>` +
    `<td style="padding:10px 0;color:${INK};font-size:14px;font-weight:700;text-align:${t.dir === "rtl" ? "left" : "right"};border-bottom:1px solid #E6F2FB${wrap(v)}" dir="auto">${esc(v)}</td></tr>`).join("");
  const links = APP_URL ? `<a href="${esc(APP_URL)}" style="color:#74879A">${esc(t.privacy)}</a> · <a href="${esc(APP_URL)}" style="color:#74879A">${esc(t.terms)}</a>` : "";
  return `<!doctype html><html lang="${lang}" dir="${t.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>` +
    `<body style="margin:0;background:${BG};font-family:-apple-system,'Segoe UI',Tahoma,'Geeza Pro','Noto Sans Arabic','Noto Naskh Arabic',Arial,Helvetica,sans-serif" dir="${t.dir}">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">` +
    `<table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:22px;overflow:hidden;border:1px solid ${SKY_LIGHT}" cellpadding="0" cellspacing="0">` +
    `<tr><td style="background:linear-gradient(135deg,#78C9F4,${SKY});background-color:${SKY};padding:22px 28px;text-align:${al}">` +
    `<span style="display:inline-block;background:#fff;color:${SKY};font-size:16px;font-weight:900;border-radius:10px;padding:6px 9px;vertical-align:middle">OM</span>` +
    `<span style="color:#fff;font-size:21px;font-weight:800;margin:0 10px;vertical-align:middle">OM Wallet</span></td></tr>` +
    `<tr><td style="padding:28px;text-align:${al}"><h1 style="margin:0 0 12px;font-size:22px;color:${INK}">${esc(title)}</h1>` +
    (intro ? `<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${INK}">${esc(nb(intro))}</p>` : "") +
    (rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table>` : "") +
    extraHtml + `</td></tr>` +
    `<tr><td style="padding:18px 28px;background:${BG};font-size:12px;line-height:1.6;color:#74879A;text-align:${al}">` +
    `${esc(t.supportLine)} <a href="mailto:${REPLY_TO}" style="color:${SKY}">${REPLY_TO}</a><br>${esc(t.company)}${links ? "<br>" + links : ""}</td></tr>` +
    `</table></td></tr></table></body></html>`;
}
const button = (label: string) => APP_URL ? `<p style="margin:24px 0 0;text-align:center"><a href="${esc(APP_URL)}" style="display:inline-block;background:${SKY};color:#fff;text-decoration:none;font-weight:800;padding:13px 28px;border-radius:14px;font-size:15px">${esc(label)}</a></p>` : "";
const rewardBox = (text: string) => `<div style="margin:0 0 18px;padding:14px 16px;border-radius:14px;background:#EAF6FF;border:1px solid ${SKY};color:${INK};font-size:15px;font-weight:700;line-height:1.5">${esc(text)}</div>`;
const textOf = (title: string, lines: string[]) => [title, "", ...lines, "", "OM Wallet"].join("\n");

const AR_COUNTRIES = ["OM", "AE", "SA", "QA", "KW", "BH", "EG", "JO", "LB", "IQ", "SY", "YE", "MA", "DZ", "TN", "LY", "SD", "PS", "MR"];
const FR_COUNTRIES = ["FR", "BE", "CH", "LU", "MC", "ML", "CI", "SN", "BF", "NE", "GN", "BJ", "TG", "CM", "GA", "CG", "CD", "MG", "TD", "CF", "HT"];
/* the language the person chose in the app (Arabic, English, French); if none was ever saved, the language of their country */
async function langOf(userId: string | null): Promise<Lang> {
  if (!userId) return "en";
  const { data } = await sb.from("user_docs").select("data").eq("user_id", userId).eq("doc_name", "preferences").maybeSingle();
  const l = data?.data?.language;
  if (l === "fr" || l === "ar" || l === "en") return l;
  const { data: p } = await sb.from("profiles").select("country").eq("id", userId).maybeSingle();
  const c = String(p?.country ?? "").toUpperCase();
  return AR_COUNTRIES.includes(c) ? "ar" : FR_COUNTRIES.includes(c) ? "fr" : "en";
}

type Built = { subject: string; html: string; text?: string } | { skip: string; retry?: boolean };

async function build(log: Row, lang: Lang): Promise<Built> {
  const t = T[lang];
  const type: string = log.email_type;

  if (type === "FUNDS_RECEIVED") {
    // Never before the credit: the transaction must be CONFIRMED, carry its confirmation time, and the ledger must show the recipient's credit.
    const { data: tx } = await sb.from("transactions").select("id, reference, amount, asset, status, confirmed_at, receiver_id, meta").eq("id", log.transaction_id).maybeSingle();
    if (!tx) return { skip: "transaction_not_found" };
    if (tx.status !== "CONFIRMED" || !tx.confirmed_at) return { skip: `not_credited_${tx.status}`, retry: tx.status === "PENDING" };
    if (tx.receiver_id !== log.user_id) return { skip: "not_the_recipient" };
    const { data: led } = await sb.from("ledger_entries").select("delta").eq("transaction_id", tx.id).eq("user_id", log.user_id);
    const credited = (led ?? []).reduce((s: number, r: Row) => s + Number(r.delta), 0);
    if (!(credited > 0)) return { skip: "ledger_missing", retry: true };
    const amt = money(credited, tx.asset, lang), at = when(tx.confirmed_at, lang);
    const rows: [string, string][] = [[t.f.ref, dispId(tx.reference)], [t.f.date, at], [t.f.status, t.funds.ok]];
    return {
      subject: t.funds.subject,
      html: layout(lang, t.funds.title, t.funds.line(amt), rows, button(t.open)),
      text: textOf(t.funds.title, [t.funds.line(amt), "", `${t.f.ref} : ${dispId(tx.reference)}`, `${t.f.date} : ${at}`, `${t.f.status} : ${t.funds.ok}`]),
    };
  }

  if (type === "ADMIN_TX_ACTION") {
    // three personal buttons; only while the transaction is still undecided (never offer a button for a closed transaction).
    // The links are minted now (the database keeps only their hash); a null answer means: not pending any more, or not an active administrator.
    const p: Row = log.payload ?? {};
    const { data: tk, error: linkErr } = await sb.rpc("issue_admin_action_links", { p_tx: log.transaction_id, p_admin: log.user_id });
    if (linkErr) return { skip: "links_failed", retry: true };
    if (!tk || !tk.confirm || !tk.reject || !tk.pause) return { skip: "already_decided_or_not_admin" };
    const amt = money(p.amount, String(p.asset), lang);
    const rows: [string, string][] = [[t.f.ref, dispId(p.reference)], [t.f.amount, amt], [t.f.from, String(p.sender ?? "")], [t.f.to, String(p.receiver ?? "")]];
    if (p.network) rows.push([t.f.network, NETWORK_NAMES[String(p.network)] ?? String(p.network)]);
    if (p.note) rows.push([t.f.note, String(p.note)]);
    rows.push([t.f.date, when(String(p.created_at ?? log.created_at), lang)]);
    const url = (tok: string) => `${APP_URL}/admin-action#t=${tok}`;
    const btn = (label: string, color: string, tok: string) => `<a href="${esc(url(String(tok)))}" style="display:inline-block;margin:6px;background:${color};color:#fff;text-decoration:none;font-weight:800;padding:13px 22px;border-radius:14px;font-size:15px">${esc(label)}</a>`;
    const extra = `<div style="margin:24px 0 0;text-align:center">${btn(t.act.confirm, "#1FAF72", tk.confirm)}${btn(t.act.reject, "#D94F5B", tk.reject)}${btn(t.act.pause, "#E5A332", tk.pause)}</div>` +
      `<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#74879A">${esc(t.act.expires)}</p>`;
    return { subject: t.act.subject(dispId(p.reference)), html: layout(lang, t.act.title, t.act.intro(amt), rows, extra),
      text: textOf(t.act.title, [t.act.intro(amt), "", ...rows.map(([k, v]) => `${k} : ${v}`), "", `${t.act.confirm} : ${url(String(tk.confirm))}`, `${t.act.reject} : ${url(String(tk.reject))}`, `${t.act.pause} : ${url(String(tk.pause))}`, "", t.act.expires]) };
  }

  if (type === "TRANSFER_CONFIRMED") {
    // to the sender, once, and only when the transaction really is CONFIRMED (same guard as FUNDS_RECEIVED)
    const { data: tx } = await sb.from("transactions").select("id, reference, amount, asset, network, status, confirmed_at, sender_id, receiver_id").eq("id", log.transaction_id).maybeSingle();
    if (!tx) return { skip: "transaction_not_found" };
    if (tx.status !== "CONFIRMED" || !tx.confirmed_at) return { skip: `not_confirmed_${tx.status}`, retry: tx.status === "PENDING" };
    if (tx.sender_id !== log.user_id) return { skip: "not_the_sender" };
    const { data: rcv } = await sb.from("profiles").select("first_name, last_name, yor_id").eq("id", tx.receiver_id).maybeSingle();
    const to = (`${rcv?.first_name ?? ""} ${rcv?.last_name ?? ""}`.trim()) || dispId(rcv?.yor_id);
    const amt = money(tx.amount, tx.asset, lang), at = when(tx.confirmed_at, lang);
    const rows: [string, string][] = [[t.f.ref, dispId(tx.reference)], [t.f.amount, amt], [t.f.to, to]];
    if (tx.network) rows.push([t.f.network, NETWORK_NAMES[tx.network] ?? tx.network]);
    rows.push([t.f.date, at], [t.f.status, t.tc.ok]);
    return { subject: t.tc.subject(dispId(tx.reference)), html: layout(lang, t.tc.title, t.tc.line(amt, to), rows, button(t.open)),
      text: textOf(t.tc.title, [t.tc.line(amt, to), "", ...rows.map(([k, v]) => `${k} : ${v}`)]) };
  }

  if (type === "CRYPTO_WITHDRAWAL_CONFIRMED") {
    const p: Row = log.payload ?? {};
    const { data: w } = await sb.from("crypto_withdrawals").select("status, tx_hash, amount, asset, network, address, reference, completed_at").eq("reference", p.reference).maybeSingle();
    if (!w) return { skip: "withdrawal_not_found" };
    if (w.status !== "COMPLETED" || !w.tx_hash) return { skip: `not_confirmed_${w.status}` };       // waits for the network confirmation
    const amt = money(w.amount, w.asset, lang), at = when(w.completed_at, lang);
    const rows: [string, string][] = [[t.f.ref, String(w.reference)], [t.f.network, NETWORK_NAMES[w.network] ?? w.network], [t.f.address, String(w.address)],
      [t.f.hash, String(w.tx_hash)], [t.f.date, at], [t.f.status, t.cw.ok]];
    return { subject: t.cw.subject(String(w.reference)), html: layout(lang, t.cw.title, t.cw.line(amt), rows, button(t.open)),
      text: textOf(t.cw.title, [t.cw.line(amt), "", ...rows.map(([k, v]) => `${k} : ${v}`)]) };
  }

  if (type === "TX_SENDER" || type === "TX_RECEIVER") return { skip: "superseded_by_admin_confirmation" };   // 14.1.0: one e-mail per transaction

  if (type === "WELCOME") {
    const { data: p } = await sb.from("profiles").select("first_name, welcome_email_sent_at").eq("id", log.user_id).maybeSingle();
    if (!p) return { skip: "profile_not_found" };
    if (p.welcome_email_sent_at) return { skip: "welcome_already_sent" };
    const name = (p.first_name || "").trim();
    const { data: bonus } = await sb.from("transactions").select("amount, asset").eq("receiver_id", log.user_id).eq("kind", "SIGNUP_BONUS").maybeSingle();
    const amt = bonus ? money(bonus.amount, bonus.asset, lang) : "";
    return { subject: amt ? t.welcomeSubjectReward(amt) : t.welcomeSubject,
      html: layout(lang, t.welcomeTitle(name).replace(" ,", ","), t.welcomeBody, [], (amt ? rewardBox(t.rewardLine(amt)) : "") + button(t.open)) };
  }
  // validation e-mails: in the person's language (Arabic, English or French), like every other e-mail
  if (type === "KYC_APPROVED") return { subject: t.val.kycSubject, html: layout(lang, t.val.kycTitle, t.val.kycBody, [], button(t.open)), text: textOf(t.val.kycTitle, [t.val.kycBody]) };
  if (type === "INVEST_CONFIRMED") {
    const p: Row = log.payload ?? {};
    const rows: [string, string][] = [[t.f.ref, dispId(p.reference)], [t.val.plan, t.val.plans[String(p.plan)] ?? String(p.plan ?? "")], [t.f.amount, money(p.amount, "OMR", lang)], [t.val.days, String(p.days ?? "")]];
    return { subject: t.val.invSubject(dispId(p.reference)), html: layout(lang, t.val.invTitle, t.val.invBody, rows, button(t.open)), text: textOf(t.val.invTitle, [t.val.invBody, "", ...rows.map(([k, v]) => `${k} : ${v}`)]) };
  }
  if (type === "WITHDRAWAL_PAID") {
    const p: Row = log.payload ?? {};
    let bank = lang === "ar" ? String(p.bank_ar ?? "") : "";
    if (lang !== "ar" || !bank) {                 // the bank's name in the person's language (oman_banks has en / fr / ar)
      const { data: w } = await sb.from("withdrawal_requests").select("bank_code, bank_name").eq("reference", p.reference).maybeSingle();
      if (w?.bank_code) { const { data: b } = await sb.from("oman_banks").select("name_en, name_fr, name_ar").eq("code", w.bank_code).maybeSingle(); bank = String((b && (b[`name_${lang}`] || b.name_en)) || w.bank_name || bank); }
    }
    const rows: [string, string][] = [[t.f.ref, dispId(p.reference)], [t.f.amount, money(p.amount, "OMR", lang)]];
    if (bank) rows.push([t.val.bank, bank]);
    if (p.bank_ref) rows.push([t.val.bankRef, String(p.bank_ref)]);
    return { subject: t.val.wdSubject(dispId(p.reference)), html: layout(lang, t.val.wdTitle, t.val.wdBody, rows, button(t.open)), text: textOf(t.val.wdTitle, [t.val.wdBody, "", ...rows.map(([k, v]) => `${k} : ${v}`)]) };
  }
  if (type === "ADMIN_NEW_USER") {
    const p: Row = log.payload ?? {};
    const name = String(p.name ?? "").trim() || dispId(p.yor_id);
    const rows: [string, string][] = [[t.f.name, name], [t.f.phone, String(p.phone ?? "")]];
    if (p.country) rows.push([t.f.country, `${countryName(String(p.country), lang)} (${p.country})`]);
    if (p.email) rows.push([t.f.email, String(p.email)]);
    if (p.yor_id) rows.push([t.f.yor, dispId(p.yor_id)]);
    rows.push([t.f.date, when(p.at ?? log.created_at, lang)]);
    return { subject: t.admin.subject(name), html: layout(lang, t.admin.title, t.admin.intro, rows, button(t.open)) };
  }
  if (type.startsWith("SEC_")) {
    const pair = t.sec[type];
    if (!pair) return { skip: "unknown_security_type" };
    const extra = `<p style="margin:20px 0 0;font-size:14px;color:#b91c1c">${esc(t.sec.warn)} <a href="mailto:${REPLY_TO}" style="color:#b91c1c">${REPLY_TO}</a></p>`;
    let intro = pair[1];
    if (type === "SEC_EMAIL_CHANGED" && log.payload?.new_email) intro += ` (${log.payload.new_email}).`;
    return { subject: pair[0], html: layout(lang, pair[0], intro, [], extra) };
  }
  return { skip: "unknown_email_type" };
}

/* ---------------- providers ---------------- */
type Mail = { to: string; subject: string; html: string; text?: string; tag: string };
type Sent = { ok: true; provider: string; id: string | null } | { ok: false; provider: string; config: boolean; error: string };

let brevoFrom: string | null = null, brevoFromAt = 0;   // the sender actually accepted by the Brevo account (re-checked every 30 min)
async function brevoVerifiedSender(): Promise<string | null> {
  try {
    const s = await fetch("https://api.brevo.com/v3/senders", { headers: { "api-key": BREVO_KEY, accept: "application/json" } });
    if (!s.ok) return null;
    const list = (((await s.json()) as Row).senders ?? []) as Row[];
    const mine = list.find((x) => x.active && String(x.email).toLowerCase() === FROM_EMAIL.toLowerCase());
    const any = list.find((x) => x.active);
    return String((mine ?? any)?.email ?? "") || null;
  } catch { return null; }
}
async function viaBrevo(m: Mail): Promise<Sent> {
  const post = (from: string) => fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: { "api-key": BREVO_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { name: FROM_NAME, email: from }, replyTo: { name: FROM_NAME, email: REPLY_TO }, to: [{ email: m.to }],
      subject: m.subject, htmlContent: m.html, textContent: m.text, tags: [m.tag] }),
  });
  if (brevoFrom && Date.now() - brevoFromAt > 1800000) brevoFrom = null;     // the configured address may have been verified since
  let res = await post(brevoFrom || FROM_EMAIL);
  let text = await res.text();
  if (res.status === 400 && /sender/i.test(text)) {        // the address is not a verified sender of this account: use the verified one, once
    const v = await brevoVerifiedSender();
    if (v && v !== (brevoFrom || FROM_EMAIL)) { brevoFrom = v; brevoFromAt = Date.now(); res = await post(v); text = await res.text(); }
  }
  if (res.ok) { let b: Row = {}; try { b = JSON.parse(text); } catch { /* */ } return { ok: true, provider: "brevo", id: b.messageId ?? null }; }
  return { ok: false, provider: "brevo", config: res.status === 401 || res.status === 403 || (res.status === 400 && /sender/i.test(text)), error: `brevo ${res.status}: ${text}`.slice(0, 300) };
}

async function viaResend(m: Mail): Promise<Sent> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { authorization: `Bearer ${RESEND_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: `${FROM_NAME} <${RESEND_FROM}>`, to: [m.to], reply_to: REPLY_TO, subject: m.subject, html: m.html, text: m.text, tags: [{ name: "type", value: m.tag }] }),
  });
  const text = await res.text();
  if (res.ok) { let b: Row = {}; try { b = JSON.parse(text); } catch { /* */ } return { ok: true, provider: "resend", id: b.id ?? null }; }
  return { ok: false, provider: "resend", config: res.status === 401 || res.status === 403 || res.status === 422, error: `resend ${res.status}: ${text}`.slice(0, 300) };
}

function b64(s: string): string {
  const bytes = new TextEncoder().encode(s); let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
const b64lines = (s: string) => b64(s).replace(/.{1,76}/g, "$&\r\n");
const encWord = (s: string) => `=?UTF-8?B?${b64(s)}?=`;

/* minimal SMTP client over implicit TLS (port 465): EHLO, AUTH PLAIN, MAIL, RCPT, DATA. Ports 25 / 587 are closed on Supabase Edge Functions. */
async function viaSmtp(m: Mail): Promise<Sent> {
  const enc = new TextEncoder(), dec = new TextDecoder();
  let conn: Deno.TlsConn | null = null; let buf = "";
  const timer = setTimeout(() => { try { conn?.close(); } catch { /* */ } }, 25000);
  const reply = async (): Promise<{ code: number; text: string }> => {
    const chunk = new Uint8Array(4096);
    while (true) {
      const lines = buf.split("\r\n");
      for (let i = 0; i < lines.length - 1; i++) if (/^\d{3} /.test(lines[i])) { buf = lines.slice(i + 1).join("\r\n"); return { code: Number(lines[i].slice(0, 3)), text: lines.slice(0, i + 1).join(" | ") }; }
      const n = await conn!.read(chunk); if (n === null) throw new Error("connection closed");
      buf += dec.decode(chunk.subarray(0, n));
    }
  };
  const cmd = async (line: string, ok: number[]) => { await conn!.write(enc.encode(line + "\r\n")); const r = await reply(); if (!ok.includes(r.code)) throw Object.assign(new Error(`smtp ${r.code}: ${r.text}`), { code: r.code }); return r; };
  try {
    conn = await Deno.connectTls({ hostname: SMTP.host, port: SMTP.port });
    const hi = await reply(); if (hi.code !== 220) throw new Error(`smtp greeting ${hi.code}`);
    await cmd("EHLO om-wallet", [250]);
    await cmd("AUTH PLAIN " + b64("\u0000" + SMTP.user + "\u0000" + SMTP.pass), [235]);
    const from = FROM_EMAIL || SMTP.user;
    await cmd(`MAIL FROM:<${from}>`, [250]);
    await cmd(`RCPT TO:<${m.to}>`, [250, 251]);
    await cmd("DATA", [354]);
    const boundary = "omw_" + crypto.randomUUID().replace(/-/g, "");
    const id = `<${crypto.randomUUID()}@om-wallet>`;
    const msg = [
      `From: ${encWord(FROM_NAME)} <${from}>`, `To: <${m.to}>`, `Reply-To: <${REPLY_TO}>`, `Subject: ${encWord(m.subject)}`,
      `Date: ${new Date().toUTCString()}`, `Message-ID: ${id}`, "MIME-Version: 1.0", `Content-Type: multipart/alternative; boundary="${boundary}"`, "",
      `--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", b64lines(m.text || m.subject),
      `--${boundary}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", b64lines(m.html),
      `--${boundary}--`, "",
    ].join("\r\n");
    await conn.write(enc.encode(msg + "\r\n.\r\n"));
    const done = await reply(); if (done.code !== 250) throw Object.assign(new Error(`smtp ${done.code}: ${done.text}`), { code: done.code });
    try { await cmd("QUIT", [221]); } catch { /* the message is accepted already */ }
    return { ok: true, provider: "smtp", id };
  } catch (e) {
    const code = Number((e as Row)?.code || 0);
    return { ok: false, provider: "smtp", config: code === 535 || code === 534 || code === 530 || code === 553 || code === 550 && /sender|from/i.test(String(e)), error: String((e as Error)?.message || e).slice(0, 300) };
  } finally { clearTimeout(timer); try { conn?.close(); } catch { /* */ } }
}

const PROVIDERS: { name: string; on: () => boolean; send: (m: Mail) => Promise<Sent> }[] = [
  { name: "brevo", on: () => !!BREVO_KEY, send: viaBrevo },
  { name: "smtp", on: () => !!(SMTP.host && SMTP.user && SMTP.pass), send: viaSmtp },
  { name: "resend", on: () => !!RESEND_KEY, send: viaResend },
];
async function deliver(m: Mail): Promise<{ sent?: Sent; errors: string[]; allConfig: boolean }> {
  const errors: string[] = []; let allConfig = true;
  for (const p of PROVIDERS.filter((x) => x.on())) {
    let r: Sent;
    try { r = await p.send(m); } catch (e) { r = { ok: false, provider: p.name, config: false, error: String(e).slice(0, 300) }; }
    if (r.ok) return { sent: r, errors, allConfig: false };
    errors.push(r.error); if (!r.config) allConfig = false;
  }
  if (!errors.length) errors.push("no e-mail provider configured (BREVO_API_KEY, SMTP_* or RESEND_API_KEY)");
  return { errors, allConfig };
}

const retryDelayMin = (attempts: number) => Math.min(2 ** attempts, 60);

async function process(log: Row, dryRun = false): Promise<Row> {
  const lang: Lang = await langOf(log.user_id);
  const built = await build(log, lang);
  if ("skip" in built) {
    if (dryRun) return { id: log.id, skip: built.skip };
    if (built.retry) {
      await sb.from("email_logs").update({ status: "FAILED", locked_at: null, attempts: log.attempts + 1, error_message: built.skip,
        next_attempt_at: new Date(Date.now() + retryDelayMin(log.attempts + 1) * 60000).toISOString() }).eq("id", log.id);
      return { id: log.id, status: "FAILED", error: built.skip };
    }
    await sb.from("email_logs").update({ status: "SKIPPED", locked_at: null, error_message: built.skip, recipient_language: lang }).eq("id", log.id);
    return { id: log.id, status: "SKIPPED", reason: built.skip };
  }
  if (dryRun) return { id: log.id, lang, to: log.recipient_email, from: FROM_EMAIL, subject: built.subject, html: built.html, text: built.text };

  const out = await deliver({ to: log.recipient_email, subject: built.subject, html: built.html, text: built.text, tag: log.email_type });
  if (out.sent && out.sent.ok) {
    await sb.from("email_logs").update({ status: "SENT", locked_at: null, sent_at: new Date().toISOString(), recipient_language: lang,
      brevo_message_id: `${out.sent.provider}:${out.sent.id ?? ""}`.slice(0, 200), error_message: null, attempts: log.attempts + 1 }).eq("id", log.id);
    if (log.email_type === "WELCOME") await sb.from("profiles").update({ welcome_email_sent_at: new Date().toISOString() }).eq("id", log.user_id).is("welcome_email_sent_at", null);
    return { id: log.id, status: "SENT", provider: out.sent.provider };
  }
  const msg = out.errors.join(" || ").slice(0, 500);
  if (out.allConfig) {
    // configuration problem (key, sender): keep it waiting without burning its attempts
    await sb.from("email_logs").update({ status: "PENDING", locked_at: null, recipient_language: lang, error_message: msg,
      next_attempt_at: new Date(Date.now() + 10 * 60000).toISOString() }).eq("id", log.id);
    return { id: log.id, status: "PENDING", error: msg };
  }
  const attempts = log.attempts + 1;
  await sb.from("email_logs").update({ status: "FAILED", locked_at: null, attempts, recipient_language: lang, error_message: msg,
    next_attempt_at: new Date(Date.now() + retryDelayMin(attempts) * 60000).toISOString() }).eq("id", log.id);
  return { id: log.id, status: "FAILED", error: msg };
}

/* configuration check for the administrator: which providers are set and whether Brevo accepts the key and the sender. No secret is returned. */
async function check(): Promise<Row> {
  const out: Row = { from: FROM_EMAIL, providers: {} };
  out.providers.brevo = { configured: !!BREVO_KEY, source: KEY_SOURCE };
  if (BREVO_KEY) {
    try {
      const a = await fetch("https://api.brevo.com/v3/account", { headers: { "api-key": BREVO_KEY, accept: "application/json" } });
      out.providers.brevo.key_valid = a.ok; out.providers.brevo.http = a.status;
      if (a.ok) {
        const s = await fetch("https://api.brevo.com/v3/senders", { headers: { "api-key": BREVO_KEY, accept: "application/json" } });
        const j: Row = s.ok ? await s.json() : {};
        const list = (j.senders ?? []) as Row[];
        out.providers.brevo.sender_verified = list.some((x) => String(x.email).toLowerCase() === FROM_EMAIL.toLowerCase() && x.active);
        out.providers.brevo.fallback_sender_available = list.some((x) => x.active);
        out.providers.brevo.senders = list.filter((x) => x.active).length;
      } else { await a.text(); }
    } catch (e) { out.providers.brevo.error = String(e).slice(0, 200); }
  }
  out.providers.smtp = { configured: !!(SMTP.host && SMTP.user && SMTP.pass), host: SMTP.host || null, port: SMTP.port };
  out.providers.resend = { configured: !!RESEND_KEY, from: RESEND_KEY ? RESEND_FROM : null };
  return out;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req: Request) => {
  const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const given = req.headers.get("x-webhook-secret") ?? "";
  const { data: secret } = await sb.rpc("get_webhook_secret");
  if (!given || !secret || !safeEqual(given, String(secret))) return json({ error: "unauthorized" }, 401);
  let body: Row = {};
  try { body = await req.json(); } catch { /* empty body = sweep */ }
  await loadKeys();

  if (body.check) return json(await check());
  if (body.dry_run && body.log_id) {
    const { data: log } = await sb.from("email_logs").select("*").eq("id", body.log_id).maybeSingle();
    if (!log) return json({ error: "not_found" }, 404);
    return json(await process(log, true));
  }
  const { data: logs, error } = await sb.rpc("claim_email_logs", { p_id: body.log_id ?? null, p_limit: 20 });
  if (error) return json({ error: error.message }, 500);
  const results: Row[] = [];
  for (const log of (logs ?? []) as Row[]) {
    try { results.push(await process(log)); }
    catch (e) {
      await sb.from("email_logs").update({ status: "FAILED", locked_at: null, attempts: log.attempts + 1, error_message: String(e).slice(0, 500),
        next_attempt_at: new Date(Date.now() + retryDelayMin(log.attempts + 1) * 60000).toISOString() }).eq("id", log.id);
      results.push({ id: log.id, status: "FAILED", error: String(e) });
    }
  }
  return json({ processed: results.length, results });
});
