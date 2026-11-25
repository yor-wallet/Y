-- ============================================================
-- OM Wallet 15.0.0 — « Transfert de crédit » (Omantel · Ooredoo · Vodafone), confirmé tout de suite, sans administrateur
--
-- Règle du propriétaire : le message est confirmé directement quand le transfert est fait dans l'application, sans intervention de
-- l'administrateur ; l'expéditeur reçoit : « تمت عملية تحويل مبلغ 1.000 ريال بنجاح إلى الرقم 96892888435. (TID: ...) ».
-- Règle d'honnêteté : « réussi » n'est écrit que lorsque le FOURNISSEUR (opérateur / grossiste de recharge, géré par le propriétaire) a
-- répondu « réussi » avec son vrai TID. Rien n'est jamais confirmé, ni envoyé par SMS, sur une réponse inconnue ou en échec.
--
-- Fonctionnement :
--   1. la fonction Edge `credit-topup` (service) crée l'opération par topup_auto_create : montant MIS DE CÔTÉ (disponible → réservé),
--      opération « PENDING » de confirmation AUTO (jamais de bouton ni d'e-mail pour un administrateur) ;
--   2. elle appelle le fournisseur UNE seule fois (topup_provider_claim empêche tout second appel pour la même opération) ;
--   3. « réussi » + TID → topup_auto_settle : le montant réservé sort du compte, grand livre, notification (texte du propriétaire),
--      UN seul e-mail ; puis le SMS est envoyé ;  « refusé » → topup_auto_fail : montant rendu ;  incertain → reste « en cours »,
--      montant réservé, à résoudre par admin_topup_resolve après vérification chez le fournisseur (jamais de nouvel envoi à l'aveugle).
--
-- Sécurité des données : aucune table, ligne ni colonne supprimée ni modifiée ; seules des fonctions sont ajoutées ou remplacées
-- (ancienne _credit_topup_request_impl sauvegardée dans public.function_backups, tag '20261126_credit_topup_auto').
-- credit_topup_request (ancien circuit à confirmation par l'administrateur, qui fabriquait un TID au hasard) n'est plus appelable par
-- les utilisateurs : aucune application ne s'en servait. Retour arrière : 20261126_credit_topup_auto_rollback.sql
-- ============================================================

-- 0. sauvegarde de la fonction remplacée
insert into public.function_backups (tag, name, definition)
select '20261126_credit_topup_auto', p.proname, pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = '_credit_topup_request_impl';

-- 1. création de l'opération : même contrôles qu'avant ; en mode AUTO : pas de notification ni d'e-mail pour l'administrateur
create or replace function public._credit_topup_request_impl(p_operator text, p_phone text, p_amount numeric, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_auto boolean := coalesce(current_setting('app.topup_auto', true), '') = '1';
  v_op text := upper(btrim(coalesce(p_operator, '')));
  v_opname text;
  v_digits text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_amt numeric(12,3);
  v_min numeric := public._setting_num('credit_topup_min', 0.5);
  v_max numeric := public._setting_num('credit_topup_max', 20);
  v_day numeric := public._setting_num('credit_topup_day_max', 50);
  v_today numeric; v_rows int; v_cached jsonb; v_result jsonb; v_yor text; v_name text; v_bal numeric; v_tx uuid; v_ref text; v_amt_txt text;
begin
  if v_user is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 then raise exception 'idempotency_key_required' using errcode = '22023'; end if;
  if not public._setting_bool('credit_topup_enabled', true) then raise exception 'service_unavailable' using errcode = '22023'; end if;
  v_opname := case v_op when 'OMANTEL' then 'Omantel' when 'OOREDOO' then 'Ooredoo' when 'VODAFONE' then 'Vodafone' end;
  if v_opname is null then raise exception 'invalid_operator' using errcode = '22023'; end if;
  -- an Omani mobile number: 8 digits starting with 7 or 9, typed with or without the country code (968, +968, 00968)
  if v_digits ~ '^00968[79][0-9]{7}$' then v_digits := substr(v_digits, 3); end if;
  if v_digits ~ '^[79][0-9]{7}$' then v_digits := '968' || v_digits; end if;
  if v_digits !~ '^968[79][0-9]{7}$' then raise exception 'invalid_phone' using errcode = '22023'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount' using errcode = '22023'; end if;
  v_amt := round(p_amount, 3);
  if v_amt < v_min then raise exception 'below_minimum' using errcode = '22023'; end if;
  if v_amt > v_max then raise exception 'limit_per_transaction' using errcode = '22023'; end if;
  insert into public.idempotency_keys (user_id, key) values (v_user, p_idempotency_key) on conflict do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    select result into v_cached from public.idempotency_keys where user_id = v_user and key = p_idempotency_key;
    return v_cached;
  end if;
  select p.yor_id, coalesce(nullif(btrim(p.first_name || ' ' || p.last_name), ''), p.yor_id) into v_yor, v_name
    from public.profiles p where p.id = v_user and p.status = 'ACTIVE';
  if v_yor is null then raise exception 'sender_inactive' using errcode = '42501'; end if;
  select coalesce(sum(amount), 0) into v_today from public.transactions
    where sender_id = v_user and kind = 'CREDIT_TOPUP' and status in ('PENDING', 'CONFIRMED')
      and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  if v_today + v_amt > v_day then raise exception 'limit_daily' using errcode = '22023'; end if;
  if (select count(*) from public.transactions where sender_id = v_user and kind = 'CREDIT_TOPUP' and status = 'PENDING') >= 5 then
    raise exception 'too_many_open' using errcode = '22023';
  end if;
  perform 1 from public.accounts where user_id = v_user and currency = 'OMR' for update;
  select available_balance into v_bal from public.accounts where user_id = v_user and currency = 'OMR';
  if not found then raise exception 'sender_account_missing' using errcode = 'P0002'; end if;
  if v_bal < v_amt then raise exception 'insufficient_balance' using errcode = '23514'; end if;
  update public.accounts set available_balance = available_balance - v_amt, reserved_balance = reserved_balance + v_amt, updated_at = now()
    where user_id = v_user and currency = 'OMR';
  v_amt_txt := to_char(v_amt, 'FM999990.000');
  v_ref := public.new_tx_reference();
  insert into public.transactions (reference, kind, sender_id, receiver_id, sender_yor_id, receiver_yor_id, asset, amount, fee, total, note, status, meta)
  values (v_ref, 'CREDIT_TOPUP', v_user, v_user, v_yor, v_yor, 'OMR', v_amt, 0, v_amt, left('Credit transfer ' || v_opname || ' ' || v_digits, 140), 'PENDING',
    jsonb_build_object('confirm', case when v_auto then 'AUTO' else 'ADMIN' end,
      'topup', jsonb_build_object('operator', v_op, 'operatorName', v_opname, 'phone', v_digits, 'amount', v_amt, 'currency', 'OMR')))
  returning id into v_tx;
  insert into public.tx_events (transaction_id, user_id, status, label)
    values (v_tx, v_user, 'PENDING', case when v_auto then 'AWAITING_PROVIDER' else 'AWAITING_ADMIN' end);
  insert into public.notifications (user_id, type, title, message, transaction_id, data)
    values (v_user, 'TOPUP_PENDING', 'Credit transfer in progress', v_amt_txt || ' OMR → ' || v_opname || ' ' || v_digits || ' · in progress', v_tx,
      jsonb_build_object('reference', v_ref, 'status', 'PENDING', 'amount', v_amt, 'currency', 'OMR', 'operator', v_op, 'phone', v_digits));
  if not v_auto then
    perform public._notify_admins('TX_CONFIRM_REQUIRED', 'Credit transfer to confirm', v_name || ' · ' || v_opname || ' ' || v_digits || ' · ' || v_amt_txt || ' OMR (' || v_ref || ')',
      jsonb_build_object('transaction', v_tx, 'reference', v_ref, 'amount', v_amt, 'asset', 'OMR', 'operator', v_op, 'phone', v_digits));
  end if;
  v_result := jsonb_build_object('ok', true, 'transaction_id', v_tx, 'reference', v_ref, 'status', 'PENDING', 'operator', v_op, 'phone', v_digits, 'amount', v_amt, 'currency', 'OMR');
  update public.idempotency_keys set result = v_result where user_id = v_user and key = p_idempotency_key;
  return v_result;
end $$;

-- 2. entrée du service (fonction Edge uniquement) : agit POUR la personne, vérifie son code PIN
create or replace function public.topup_auto_create(p_user uuid, p_operator text, p_phone text, p_amount numeric, p_idempotency_key text, p_pin_grant uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c jsonb;
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_user::text, 'role', 'authenticated')::text, true);
  perform set_config('app.topup_auto', '1', true);
  c := public._idem_replay(p_idempotency_key);
  if c is not null then return c; end if;
  if public._dy_enabled() then return public._dy_block('credit_topup_request', p_amount); end if;
  perform public._consume_grant(p_pin_grant);
  return public._credit_topup_request_impl(p_operator, p_phone, p_amount, p_idempotency_key);
end $$;

-- 3. un seul appel au fournisseur par opération (true = cet appel est le bon ; false = déjà tenté, ne rien renvoyer)
create or replace function public.topup_provider_claim(p_tx uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update public.transactions
     set meta = meta || jsonb_build_object('topup', (meta -> 'topup') || jsonb_build_object('providerState', 'SENT', 'providerSentAt', clock_timestamp()))
   where id = p_tx and kind = 'CREDIT_TOPUP' and status = 'PENDING' and coalesce(meta ->> 'confirm', '') = 'AUTO'
     and coalesce(meta -> 'topup' ->> 'providerState', '') = '';
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- 4. le fournisseur a répondu « réussi » avec son TID : on débite, on confirme, UNE notification, UN e-mail
create or replace function public._topup_settle(p_tx uuid, p_tid text, p_provider_ref text, p_actor uuid, p_source text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  t public.transactions; v_top jsonb; v_tphone text; v_sbal numeric; v_at timestamptz; v_amt text;
  v_tid text := btrim(coalesce(p_tid, '')); v_mail text; v_phone text;
begin
  if v_tid !~ '^[0-9A-Za-z._-]{4,40}$' then raise exception 'invalid_tid' using errcode = '22023'; end if;
  select * into t from public.transactions where id = p_tx for update;
  if t.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if t.kind <> 'CREDIT_TOPUP' or coalesce(t.meta ->> 'confirm', '') <> 'AUTO' then raise exception 'not_confirmable' using errcode = '22023'; end if;
  select phone into v_phone from public.profiles where id = t.sender_id;
  if t.status = 'CONFIRMED' then
    return jsonb_build_object('ok', true, 'already', true, 'status', 'CONFIRMED', 'tid', t.meta -> 'topup' ->> 'tid', 'phone', t.meta -> 'topup' ->> 'phone',
      'amount', t.amount, 'sender_phone', v_phone, 'reference', t.reference);
  end if;
  if t.status <> 'PENDING' then raise exception 'invalid_state' using errcode = '22023'; end if;
  v_top := t.meta -> 'topup'; v_tphone := v_top ->> 'phone';
  if v_top is null or t.sender_id <> t.receiver_id or t.asset <> 'OMR' or coalesce(v_tphone, '') !~ '^968[79][0-9]{7}$' then
    raise exception 'not_confirmable' using errcode = '22023';
  end if;
  if exists (select 1 from public.transactions x where x.kind = 'CREDIT_TOPUP' and x.id <> t.id and x.meta -> 'topup' ->> 'tid' = v_tid) then
    raise exception 'tid_in_use' using errcode = '22023';
  end if;
  perform 1 from public.accounts where user_id = t.sender_id and currency = 'OMR' for update;
  update public.accounts set balance = balance - t.amount, reserved_balance = reserved_balance - t.amount, updated_at = now()
    where user_id = t.sender_id and currency = 'OMR' and reserved_balance >= t.amount returning balance into v_sbal;
  if v_sbal is null then raise exception 'hold_missing' using errcode = '23514'; end if;
  insert into public.ledger_entries (transaction_id, user_id, asset, delta, balance_after) values (t.id, t.sender_id, 'OMR', -t.amount, v_sbal);
  v_at := clock_timestamp();
  v_top := v_top || jsonb_build_object('tid', v_tid, 'tidSource', p_source, 'providerRef', left(coalesce(p_provider_ref, ''), 120), 'providerState', 'CONFIRMED');
  update public.transactions set status = 'CONFIRMED', confirmed_at = v_at, meta = meta || jsonb_build_object('confirmedAt', v_at, 'topup', v_top) where id = t.id;
  insert into public.tx_events (transaction_id, user_id, status, label) values (t.id, t.sender_id, 'CONFIRMED', 'PROVIDER_CONFIRMED');
  v_amt := to_char(t.amount, 'FM999990.000');
  -- the owner's wording (Arabic), with the REAL amount, number and TID
  insert into public.notifications (user_id, type, title, message, transaction_id, data)
    values (t.sender_id, 'TOPUP_CONFIRMED', 'تحويل الرصيد', 'تمت عملية تحويل مبلغ ' || v_amt || ' ريال بنجاح إلى الرقم ' || v_tphone || '. (TID: ' || v_tid || ').', t.id,
      jsonb_build_object('reference', t.reference, 'amount', t.amount, 'currency', 'OMR', 'operator', v_top ->> 'operator', 'phone', v_tphone, 'tid', v_tid, 'confirmedAt', v_at));
  insert into public.audit_log (actor_id, action, target_id, details)
    values (coalesce(p_actor, t.sender_id), 'TOPUP_CONFIRMED', t.sender_id,
      jsonb_build_object('transaction', t.id, 'reference', t.reference, 'amount', t.amount, 'operator', v_top ->> 'operator', 'phone', v_tphone, 'tid', v_tid, 'source', p_source));
  -- the single e-mail of this transfer, after the debit (the generic trigger only handles administrator-confirmed operations)
  select email into v_mail from public.profiles where id = t.sender_id;
  if coalesce(v_mail, '') <> '' then
    insert into public.email_logs (user_id, transaction_id, email_type, recipient_email, idempotency_key, payload)
    values (t.sender_id, t.id, 'CREDIT_TOPUP_CONFIRMED', v_mail, 'CREDIT_TOPUP_CONFIRMED:' || t.id,
      jsonb_build_object('reference', t.reference, 'amount', t.amount, 'asset', 'OMR', 'confirmed_at', v_at, 'topup', v_top))
    on conflict (idempotency_key) do nothing;
    perform public.dispatch_email_worker(null);
  end if;
  return jsonb_build_object('ok', true, 'already', false, 'status', 'CONFIRMED', 'tid', v_tid, 'phone', v_tphone, 'amount', t.amount, 'sender_phone', v_phone, 'reference', t.reference);
end $$;

-- 5. le fournisseur a répondu « refusé » : le montant réservé est rendu
create or replace function public._topup_fail(p_tx uuid, p_reason text, p_actor uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare t public.transactions; v_rows int;
begin
  select * into t from public.transactions where id = p_tx for update;
  if t.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if t.kind <> 'CREDIT_TOPUP' or coalesce(t.meta ->> 'confirm', '') <> 'AUTO' then raise exception 'not_confirmable' using errcode = '22023'; end if;
  if t.status = 'REJECTED' then return jsonb_build_object('ok', true, 'already', true, 'status', 'REJECTED'); end if;
  if t.status <> 'PENDING' then raise exception 'invalid_state' using errcode = '22023'; end if;
  update public.accounts set available_balance = available_balance + t.amount, reserved_balance = reserved_balance - t.amount, updated_at = now()
    where user_id = t.sender_id and currency = 'OMR' and reserved_balance >= t.amount;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then raise exception 'hold_missing' using errcode = '23514'; end if;
  update public.transactions set status = 'REJECTED',
    meta = meta || jsonb_build_object('rejectReason', left(btrim(coalesce(p_reason, '')), 300), 'rejectedAt', clock_timestamp(),
                                      'topup', (meta -> 'topup') || jsonb_build_object('providerState', 'FAILED'))
    where id = t.id;
  insert into public.tx_events (transaction_id, user_id, status, label) values (t.id, t.sender_id, 'REJECTED', 'PROVIDER_FAILED');
  insert into public.notifications (user_id, type, title, message, transaction_id, data)
    values (t.sender_id, 'TRANSFER_REJECTED', 'Credit transfer failed', trim(trailing '.' from trim(trailing '0' from t.amount::text)) || ' OMR returned to your balance', t.id,
      jsonb_build_object('amount', t.amount, 'currency', 'OMR', 'reference', t.reference, 'reason', left(btrim(coalesce(p_reason, '')), 300)));
  insert into public.audit_log (actor_id, action, target_id, details)
    values (coalesce(p_actor, t.sender_id), 'TOPUP_FAILED', t.sender_id, jsonb_build_object('transaction', t.id, 'reference', t.reference, 'amount', t.amount, 'reason', left(btrim(coalesce(p_reason, '')), 300)));
  return jsonb_build_object('ok', true, 'already', false, 'status', 'REJECTED');
end $$;

-- 6. réponse incertaine du fournisseur (coupure, délai dépassé) : reste « en cours », montant réservé, à résoudre après vérification
create or replace function public.topup_auto_mark_unknown(p_tx uuid, p_note text)
returns void language sql security definer set search_path = '' as $$
  update public.transactions
     set meta = meta || jsonb_build_object('topup', (meta -> 'topup') || jsonb_build_object('providerState', 'UNKNOWN', 'providerNote', left(coalesce(p_note, ''), 300), 'providerUnknownAt', clock_timestamp()))
   where id = p_tx and kind = 'CREDIT_TOPUP' and status = 'PENDING' and coalesce(meta ->> 'confirm', '') = 'AUTO';
$$;

-- 7. le SMS de confirmation a été envoyé (ou a échoué) : trace dans sms_log (numéro masqué) et dans l'opération
create or replace function public.topup_record_sms(p_tx uuid, p_to text, p_status text, p_provider_id text, p_detail jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.sms_log (event_id, to_masked, template, lang, status, provider_message_id, provider_response)
  values ('topup:' || p_tx, regexp_replace(coalesce(p_to, ''), '^(.{4}).*(.{3})$', '\1****\2'), 'topup_confirmed', 'ar', left(coalesce(p_status, 'failed'), 30), left(p_provider_id, 200), coalesce(p_detail, '{}'::jsonb));
  update public.transactions
     set meta = meta || jsonb_build_object('topup', (meta -> 'topup') || jsonb_build_object('sms', left(coalesce(p_status, 'failed'), 30)))
   where id = p_tx and kind = 'CREDIT_TOPUP';
exception when others then
  raise warning 'topup_record_sms: %', sqlerrm;
end $$;

-- 8. résolution d'une opération « incertaine » par l'administrateur, APRÈS vérification chez le fournisseur : réussi (avec le VRAI TID) ou refusé
create or replace function public.admin_topup_resolve(p_tx uuid, p_outcome text, p_tid text default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_admin uuid := (select auth.uid()); r jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if lower(coalesce(p_outcome, '')) = 'success' then
    if coalesce(btrim(p_tid), '') = '' then raise exception 'tid_required' using errcode = '22023'; end if;
    r := public._topup_settle(p_tx, p_tid, 'admin_resolve', v_admin, 'OPERATOR');
  elsif lower(coalesce(p_outcome, '')) = 'failed' then
    r := public._topup_fail(p_tx, coalesce(nullif(btrim(p_note), ''), 'provider_failed'), v_admin);
  else
    raise exception 'invalid_outcome' using errcode = '22023';
  end if;
  return r;
end $$;

-- 9. droits : les fonctions du service ne sont appelables que par le serveur ; l'ancien circuit à TID au hasard est fermé aux utilisateurs
revoke all on function public.topup_auto_create(uuid, text, text, numeric, text, uuid) from public, anon, authenticated;
revoke all on function public.topup_provider_claim(uuid) from public, anon, authenticated;
revoke all on function public._topup_settle(uuid, text, text, uuid, text) from public, anon, authenticated;
revoke all on function public._topup_fail(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.topup_auto_mark_unknown(uuid, text) from public, anon, authenticated;
revoke all on function public.topup_record_sms(uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.admin_topup_resolve(uuid, text, text, text) from public, anon;
grant execute on function public.topup_auto_create(uuid, text, text, numeric, text, uuid) to service_role;
grant execute on function public.topup_provider_claim(uuid) to service_role;
grant execute on function public._topup_settle(uuid, text, text, uuid, text) to service_role;
grant execute on function public._topup_fail(uuid, text, uuid) to service_role;
grant execute on function public.topup_auto_mark_unknown(uuid, text) to service_role;
grant execute on function public.topup_record_sms(uuid, text, text, text, jsonb) to service_role;
grant execute on function public.admin_topup_resolve(uuid, text, text, text) to authenticated, service_role;
revoke execute on function public.credit_topup_request(text, text, numeric, text, uuid) from authenticated;
