-- OM Wallet 15.0.1 — Transfert de crédit : circuit retenu par le propriétaire (appliqué le 25/11/2026, testé dans une transaction annulée).
-- Seul l'administrateur envoie un transfert de crédit : opérateur + numéro + montant + Envoyer = opération CONFIRMÉE tout de suite
-- (admin_topup_send), SMS aussitôt (fonction Edge credit-topup, appelée par la base). Aucun mouvement de solde (le transfert réel se fait chez
-- l'opérateur), aucun code, aucune deuxième validation. TID : celui de l'opérateur s'il est saisi, sinon un numéro OM Wallet.
-- Les utilisateurs ordinaires ne peuvent plus créer de demande (credit_topup_request leur est fermée). Rien n'est supprimé.
-- Retour arrière : revoke execute on function public.admin_topup_send(text,text,numeric,text,text) from authenticated;
--                  grant execute on function public.credit_topup_request(text,text,numeric,text,uuid) to authenticated;
revoke execute on function public.credit_topup_request(text, text, numeric, text, uuid) from authenticated;
drop trigger if exists topup_confirmed_sms on public.transactions;
-- dispatch_topup_sms(uuid), topup_note_sms(uuid,text) et admin_topup_send(...) : voir le journal 15.0.1 et supabase/functions/credit-topup/index.ts
