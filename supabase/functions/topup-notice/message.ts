/* send-email — transfert de crédit (14.10.0) : logique PURE (aucun réseau, aucune base), testable avec `node` (tests/ux/topup-message.test.mjs).

   Le message de confirmation est celui du propriétaire (25/11), en arabe, avec le VRAI montant, le VRAI numéro et le TID :
     « تمت عملية تحويل مبلغ 1.000 ريال بنجاح إلى الرقم 96892888435. (TID: 872499275195989578). »
   Il n'est écrit que lorsque l'administrateur a confirmé (jamais à la demande). Français et anglais : mêmes valeurs, mêmes mots-clés. */

export type Lang = "fr" | "en" | "ar";

export const OPERATORS: Record<string, string> = { OMANTEL: "Omantel", OOREDOO: "Ooredoo", VODAFONE: "Vodafone" };
export const operatorName = (op: unknown): string => OPERATORS[String(op ?? "").toUpperCase()] ?? String(op ?? "");

/** « 96892888435 » → « +968 9288 8435 » (affichage) ; toute autre valeur est rendue telle quelle. */
export function fmtOmanPhone(raw: unknown): string {
  const m = /^968([79]\d{3})(\d{4})$/.exec(String(raw ?? "").replace(/\D/g, ""));
  return m ? `+968 ${m[1]} ${m[2]}` : String(raw ?? "");
}

/** Montant en rials omanais avec 3 décimales, point décimal, chiffres latins : « 1.000 ». */
export const omr3 = (n: unknown): string => Number(n).toFixed(3);

/** Le message exact de la confirmation. [isolate] entoure les nombres d'isolats gauche-droite (affichage correct dans un texte arabe de l'e-mail). */
export function topupMessage(lang: Lang, amount: unknown, phone: unknown, tid: unknown, isolate = false): string {
  const a = omr3(amount), p = String(phone ?? "").replace(/\D/g, ""), id = String(tid ?? "").trim();
  const i = (s: string) => (isolate ? `⁦${s}⁩` : s);
  if (lang === "ar") return `تمت عملية تحويل مبلغ ${i(a)} ريال بنجاح إلى الرقم ${i(p)}. (TID: ${i(id)}).`;
  if (lang === "fr") return `Le transfert de crédit de ${a.replace(".", ",")} OMR vers le numéro ${p} a été effectué avec succès. (TID : ${id}).`;   // virgule décimale : « 1.000 » se lirait « mille »
  return `The credit transfer of OMR ${a} to number ${p} was completed successfully. (TID: ${id}).`;
}
