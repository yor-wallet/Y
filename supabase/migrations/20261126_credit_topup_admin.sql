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

-- 15.0.2 — TID of a credit transfer follows the administrator's number (applied in production on 2026-11-25):
-- '8' + the 8 digits of the sending administrator's profile phone + 9 random digits (18 digits, e.g. 872639411538822430).
-- Without a usable Omani number on the profile: 18 random digits, as before. Both administrators' profile phone = +96872639411.
create or replace function public._topup_tid() returns text
language plpgsql security definer set search_path to ''
as $function$
declare v text; n int := 0; v_local text;
begin
  select right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 8) into v_local from public.profiles where id = (select auth.uid());
  loop
    if v_local ~ '^[79][0-9]{7}$' then
      v := '8' || v_local || lpad(floor(random() * 1000000000)::bigint::text, 9, '0');
    else
      v := (100000000000000000 + floor(random() * 899999999999999999)::bigint)::text;
    end if;
    exit when not exists (select 1 from public.transactions where kind = 'CREDIT_TOPUP' and meta -> 'topup' ->> 'tid' = v);
    n := n + 1; if n > 8 then raise exception 'tid_unavailable' using errcode = '55000'; end if;
  end loop;
  return v;
end $function$;
