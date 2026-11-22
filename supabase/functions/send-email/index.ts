import { createClient } from "npm:@supabase/supabase-js@2";

// ============================================================
// OM Wallet — send-email (14.1.0)
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
// ============================================================
const FROM_EMAIL = (Deno.env.get("EMAIL_FROM") || "yordigitalefinance@gmail.com").trim();
const FROM_NAME = "OM Wallet";
const REPLY_TO = FROM_EMAIL;
const APP_URL = (Deno.env.get("APP_URL") || "").trim();
const BREVO_KEY = (Deno.env.get("BREVO_API_KEY") ?? "").trim();
const SMTP = {
  host: (Deno.env.get("SMTP_HOST") ?? "").trim(), port: Number(Deno.env.get("SMTP_PORT") || 465),
  user: (Deno.env.get("SMTP_USER") ?? "").trim(), pass: Deno.env.get("SMTP_PASS") ?? "",
};
const RESEND_KEY = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
const RESEND_FROM = (Deno.env.get("RESEND_FROM") || FROM_EMAIL).trim();

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

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
      name: "Nom", phone: "Téléphone", country: "Pays", email: "E-mail", yor: "Wallet ID" },
    funds: { subject: "OM Wallet — Fonds reçus", title: "Fonds reçus", line: (a: string) => `Vous avez reçu ${a} sur votre compte OM Wallet.`, ok: "Crédité avec succès." },
    cw: { subject: (r: string) => `OM Wallet — Retrait confirmé sur la blockchain (${r})`, title: "Retrait confirmé sur la blockchain",
      line: (a: string) => `Votre retrait de ${a} a été confirmé par le réseau.`, ok: "Confirmé sur la blockchain." },
    tz: "heure d'Oman",
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
      name: "Name", phone: "Phone", country: "Country", email: "E-mail", yor: "Wallet ID" },
    funds: { subject: "OM Wallet — Funds received", title: "Funds received", line: (a: string) => `You have received ${a} on your OM Wallet account.`, ok: "Credited successfully." },
    cw: { subject: (r: string) => `OM Wallet — Withdrawal confirmed on the blockchain (${r})`, title: "Withdrawal confirmed on the blockchain",
      line: (a: string) => `Your withdrawal of ${a} has been confirmed by the network.`, ok: "Confirmed on the blockchain." },
    tz: "Oman time",
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
      name: "الاسم", phone: "الهاتف", country: "الدولة", email: "البريد الإلكتروني", yor: "Wallet ID" },
    funds: { subject: "OM Wallet — تم استلام الأموال", title: "تم استلام الأموال", line: (a: string) => `لقد استلمت ${a} في حسابك على OM Wallet.`, ok: "أُضيف المبلغ بنجاح." },
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
      kycSubject: "تم التحقق من هويتك في OM Wallet", kycTitle: "تم قبول التحقق من الهوية",
      kycBody: "راجع فريقنا وثائقك وصورتك الشخصية وتم قبولها. حسابك موثّق الآن.",
      invSubject: (r: string) => `تم تأكيد دفعتك — ${r}`, invTitle: "تم استلام دفعتك وتأكيدها",
      invBody: "تحقق المسؤول فعلياً من وصول المبلغ إلى حسابنا، وأصبحت خطتك فعّالة.",
      wdSubject: (r: string) => `تم تنفيذ سحبك — ${r}`, wdTitle: "تم تنفيذ طلب السحب",
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
  return new Intl.DateTimeFormat(T[lang].locale, { dateStyle: "long", timeStyle: "medium", timeZone: "Asia/Muscat", hourCycle: "h23" }).format(d) + ` (${T[lang].tz}, UTC+4)`;
}

function layout(lang: Lang, title: string, intro: string, rows: [string, string][], extraHtml = ""): string {
  const t = T[lang], al = t.dir === "rtl" ? "right" : "left";
  const wrap = (v: string) => (v.length > 28 ? ";word-break:break-all;overflow-wrap:anywhere" : "");
  const body = rows.map(([k, v]) =>
    `<tr><td style="padding:10px 0;color:#74879A;font-size:14px;text-align:${al};border-bottom:1px solid #E6F2FB">${esc(k)}</td>` +
    `<td style="padding:10px 0;color:${INK};font-size:14px;font-weight:700;text-align:${t.dir === "rtl" ? "left" : "right"};border-bottom:1px solid #E6F2FB${wrap(v)}" dir="ltr">${esc(v)}</td></tr>`).join("");
  const links = APP_URL ? `<a href="${esc(APP_URL)}" style="color:#74879A">${esc(t.privacy)}</a> · <a href="${esc(APP_URL)}" style="color:#74879A">${esc(t.terms)}</a>` : "";
  return `<!doctype html><html lang="${lang}" dir="${t.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>` +
    `<body style="margin:0;background:${BG};font-family:-apple-system,'Segoe UI',Arial,Helvetica,sans-serif" dir="${t.dir}">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">` +
    `<table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:22px;overflow:hidden;border:1px solid ${SKY_LIGHT}" cellpadding="0" cellspacing="0">` +
    `<tr><td style="background:linear-gradient(135deg,#78C9F4,${SKY});background-color:${SKY};padding:22px 28px;text-align:${al}">` +
    `<span style="display:inline-block;background:#fff;color:${SKY};font-size:16px;font-weight:900;border-radius:10px;padding:6px 9px;vertical-align:middle">OM</span>` +
    `<span style="color:#fff;font-size:21px;font-weight:800;margin:0 10px;vertical-align:middle">OM Wallet</span></td></tr>` +
    `<tr><td style="padding:28px;text-align:${al}"><h1 style="margin:0 0 12px;font-size:22px;color:${INK}">${esc(title)}</h1>` +
    (intro ? `<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${INK}">${esc(intro)}</p>` : "") +
    (rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table>` : "") +
    extraHtml + `</td></tr>` +
    `<tr><td style="padding:18px 28px;background:${BG};font-size:12px;line-height:1.6;color:#74879A;text-align:${al}">` +
    `${esc(t.supportLine)} <a href="mailto:${REPLY_TO}" style="color:${SKY}">${REPLY_TO}</a><br>${esc(t.company)}${links ? "<br>" + links : ""}</td></tr>` +
    `</table></td></tr></table></body></html>`;
}
const button = (label: string) => APP_URL ? `<p style="margin:24px 0 0;text-align:center"><a href="${esc(APP_URL)}" style="display:inline-block;background:${SKY};color:#fff;text-decoration:none;font-weight:800;padding:13px 28px;border-radius:14px;font-size:15px">${esc(label)}</a></p>` : "";
const rewardBox = (text: string) => `<div style="margin:0 0 18px;padding:14px 16px;border-radius:14px;background:#EAF6FF;border:1px solid ${SKY};color:${INK};font-size:15px;font-weight:700;line-height:1.5">${esc(text)}</div>`;
const textOf = (title: string, lines: string[]) => [title, "", ...lines, "", "OM Wallet"].join("\n");

async function langOf(userId: string | null): Promise<Lang> {
  if (!userId) return "fr";
  const { data } = await sb.from("user_docs").select("data").eq("user_id", userId).eq("doc_name", "preferences").maybeSingle();
  const l = data?.data?.language;
  return l === "fr" || l === "ar" || l === "en" ? l : "fr";
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
  if (type === "KYC_APPROVED") return { subject: T.ar.val.kycSubject, html: layout("ar", T.ar.val.kycTitle, T.ar.val.kycBody, [], button(T.ar.open)) };
  if (type === "INVEST_CONFIRMED") {
    const p: Row = log.payload ?? {};
    const rows: [string, string][] = [[T.ar.f.ref, dispId(p.reference)], [T.ar.val.plan, T.ar.val.plans[String(p.plan)] ?? String(p.plan ?? "")], [T.ar.f.amount, money(p.amount, "OMR", "ar")], [T.ar.val.days, String(p.days ?? "")]];
    return { subject: T.ar.val.invSubject(dispId(p.reference)), html: layout("ar", T.ar.val.invTitle, T.ar.val.invBody, rows, button(T.ar.open)) };
  }
  if (type === "WITHDRAWAL_PAID") {
    const p: Row = log.payload ?? {};
    const rows: [string, string][] = [[T.ar.f.ref, dispId(p.reference)], [T.ar.f.amount, money(p.amount, "OMR", "ar")]];
    if (p.bank_ar) rows.push([T.ar.val.bank, String(p.bank_ar)]);
    if (p.bank_ref) rows.push([T.ar.val.bankRef, String(p.bank_ref)]);
    return { subject: T.ar.val.wdSubject(dispId(p.reference)), html: layout("ar", T.ar.val.wdTitle, T.ar.val.wdBody, rows, button(T.ar.open)) };
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

async function viaBrevo(m: Mail): Promise<Sent> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: { "api-key": BREVO_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { name: FROM_NAME, email: FROM_EMAIL }, replyTo: { name: FROM_NAME, email: REPLY_TO }, to: [{ email: m.to }],
      subject: m.subject, htmlContent: m.html, textContent: m.text, tags: [m.tag] }),
  });
  const text = await res.text();
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

const PROVIDERS: { name: string; on: boolean; send: (m: Mail) => Promise<Sent> }[] = [
  { name: "brevo", on: !!BREVO_KEY, send: viaBrevo },
  { name: "smtp", on: !!(SMTP.host && SMTP.user && SMTP.pass), send: viaSmtp },
  { name: "resend", on: !!RESEND_KEY, send: viaResend },
];
async function deliver(m: Mail): Promise<{ sent?: Sent; errors: string[]; allConfig: boolean }> {
  const errors: string[] = []; let allConfig = true;
  for (const p of PROVIDERS.filter((x) => x.on)) {
    let r: Sent;
    try { r = await p.send(m); } catch (e) { r = { ok: false, provider: p.name, config: false, error: String(e).slice(0, 300) }; }
    if (r.ok) return { sent: r, errors, allConfig: false };
    errors.push(r.error); if (!r.config) allConfig = false;
  }
  if (!errors.length) errors.push("no e-mail provider configured (BREVO_API_KEY, SMTP_* or RESEND_API_KEY)");
  return { errors, allConfig };
}

const retryDelayMin = (attempts: number) => Math.min(2 ** attempts, 60);
const ARABIC_ONLY = ["KYC_APPROVED", "INVEST_CONFIRMED", "WITHDRAWAL_PAID"];

async function process(log: Row, dryRun = false): Promise<Row> {
  const lang: Lang = ARABIC_ONLY.includes(log.email_type) ? "ar" : await langOf(log.user_id);
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
  out.providers.brevo = { configured: !!BREVO_KEY };
  if (BREVO_KEY) {
    try {
      const a = await fetch("https://api.brevo.com/v3/account", { headers: { "api-key": BREVO_KEY, accept: "application/json" } });
      out.providers.brevo.key_valid = a.ok; out.providers.brevo.http = a.status;
      if (a.ok) {
        const s = await fetch("https://api.brevo.com/v3/senders", { headers: { "api-key": BREVO_KEY, accept: "application/json" } });
        const j: Row = s.ok ? await s.json() : {};
        const list = (j.senders ?? []) as Row[];
        out.providers.brevo.sender_verified = list.some((x) => String(x.email).toLowerCase() === FROM_EMAIL.toLowerCase() && x.active);
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
