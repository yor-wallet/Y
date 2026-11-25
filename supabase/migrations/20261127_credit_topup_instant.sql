-- ============================================================
-- ANNULÉE LE JOUR MÊME (25/11/2026) — NE PAS RÉAPPLIQUER.
-- Une autre session a livré le même service (15.0.0 / 15.0.1 : circuit retenu par le propriétaire — l'administrateur envoie, l'opération est
-- confirmée tout de suite, SMS par la fonction credit-topup). Cette migration (confirmation instantanée pour toute personne connectée) a été
-- appliquée puis défaite : les trois fonctions remplacées ont été restaurées depuis public.function_backups (tag '20261127_credit_topup_instant'),
-- credit_topup_request est de nouveau fermée aux utilisateurs, les aides admin_topup_list / _mark_delivered / _refund ne sont plus appelables.
-- Les six fonctions ajoutées existent encore, inactives (leur suppression demande la confirmation du propriétaire dans Supabase).
-- Aucune opération réelle n'a été créée par cette migration (essais faits dans des transactions annulées).
-- ============================================================
-- ============================================================
-- OM Wallet 14.10.0 — Transfert de crédit : confirmation IMMÉDIATE dans l'application (décision du propriétaire, 27/11 : « le message est confirmé
-- directement quand le transfert est fait dans l'application, sans intervention de l'administrateur »).
--
-- What it does (on top of 20261127_credit_topup.sql, which stays: the administrator-confirmed mode remains available as credit_topup_mode = 'admin')
--   1. app_settings.credit_topup_mode = 'instant' (default). get_app_config() returns it; admin_set_setting() accepts 'instant' | 'admin'.
--   2. _credit_topup_request_impl: in 'instant' mode the rials leave the account at once (one ledger line), the transaction is CONFIRMED with its
--      TID (meta.confirm = 'AUTO'), and — with no one to approve — the person immediately gets: the in-app notification, the e-mail, and the SMS
--      (Infobip, through the Edge function topup-notice) carrying the owner's message: « تمت عملية تحويل مبلغ 1.000 ريال بنجاح إلى الرقم 96892888435. (TID: …). »
--      The same message goes to the credited number. At most 10 transfers per number per 24 h (no SMS spam to a third party).
--   3. The administrators get ONE in-app alert « credit to send » (push included) — they deliver the credit, they do not approve anything.
--      admin_topup_list shows the transfers with their delivery state; admin_topup_mark_delivered closes the alert; admin_topup_refund gives the
--      rials back (status REFUNDED, notification) when the credit cannot be sent.
--   4. Internal helpers for the SMS function: _dispatch_topup_notice (pg_net, same pattern as the payout notice), _topup_sms_claim (one send per
--      transfer), _topup_sms_done (outcome written into the transaction, shown to the administrator).
--
-- Data safety: nothing is dropped or rewritten; three functions are replaced (previous definitions saved in public.function_backups, tag
-- '20261127_credit_topup_instant'; restore with 20261127_credit_topup_instant_rollback.sql). Historical amounts untouched.
-- ============================================================

insert into public.function_backups (tag, name, definition)
select '20261127_credit_topup_instant', p.proname, pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('_credit_topup_request_impl', 'get_app_config', 'admin_set_setting');

insert into public.app_settings (key, value) values ('credit_topup_mode', '"instant"'::jsonb) on conflict (key) do nothing;

create or replace function public.get_app_config()
 returns jsonb language sql stable security definer set search_path to ''
as $function$
  select jsonb_build_object(
    'credit_enabled', public._setting_bool('credit_enabled', true), 'credit_min', public._setting_num('credit_min', 5000), 'credit_max', public._setting_num('credit_max', 500000),
    'vault_enabled', public._setting_bool('vault_enabled', false), 'vault_rate_pct_day', public._setting_num('vault_rate_pct_day', 0), 'vault_min', public._setting_num('vault_min', 1),
    'invest_enabled', public._setting_bool('invest_enabled', true), 'require_kyc_for_invest', public._setting_bool('require_kyc_for_invest', true),
    'require_kyc_for_withdraw', public._setting_bool('require_kyc_for_withdraw', true), 'withdraw_enabled', public._setting_bool('withdraw_enabled', true), 'withdraw_min', public._setting_num('withdraw_min', 10),
    'credit_topup_enabled', public._setting_bool('credit_topup_enabled', true), 'credit_topup_min', public._setting_num('credit_topup_min', 0.5),
    'credit_topup_max', public._setting_num('credit_topup_max', 20), 'credit_topup_day_max', public._setting_num('credit_topup_day_max', 50),
    'credit_topup_mode', coalesce((select value #>> '{}' from public.app_settings where key = 'credit_topup_mode'), 'instant'));
$function$;

create or replace function public.admin_set_setting(p_key text, p_value jsonb)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare v_admin uuid := (select auth.uid());
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_key not in ('credit_enabled','credit_min','credit_max','vault_enabled','vault_rate_pct_day','vault_min','invest_enabled','require_kyc_for_invest','require_kyc_for_withdraw','withdraw_enabled','withdraw_min','payment_instructions',
                   'credit_topup_enabled','credit_topup_min','credit_topup_max','credit_topup_day_max','credit_topup_mode') then raise exception 'unknown_setting' using errcode = '22023'; end if;
  if p_key in ('credit_min','credit_max','vault_min','withdraw_min','credit_topup_min','credit_topup_max','credit_topup_day_max') and (jsonb_typeof(p_value) <> 'number' or (p_value #>> '{}')::numeric <= 0) then raise exception 'invalid_value' using errcode = '22023'; end if;
  if p_key = 'vault_rate_pct_day' and (jsonb_typeof(p_value) <> 'number' or (p_value #>> '{}')::numeric < 0 or (p_value #>> '{}')::numeric > 5) then raise exception 'invalid_value' using errcode = '22023'; end if;
  if p_key in ('credit_enabled','vault_enabled','invest_enabled','require_kyc_for_invest','require_kyc_for_withdraw','withdraw_enabled','credit_topup_enabled') and jsonb_typeof(p_value) <> 'boolean' then raise exception 'invalid_value' using errcode = '22023'; end if;
  if p_key = 'credit_topup_mode' and (jsonb_typeof(p_value) <> 'string' or (p_value #>> '{}') not in ('instant', 'admin')) then raise exception 'invalid_value' using errcode = '22023'; end if;
  if p_key = 'payment_instructions' and jsonb_typeof(p_value) <> 'object' then raise exception 'invalid_value' using errcode = '22023'; end if;
  insert into public.app_settings (key, value, updated_by) values (p_key, p_value, v_admin) on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by;
  insert into public.audit_log (actor_id, action, details) values (v_admin, 'SETTING', jsonb_build_object('key', p_key, 'value', p_value));
  return public.get_app_config();
end $function$;

-- SMS helpers (internal): the outcome is written into the transaction; one claim per transfer
create or replace function public._topup_sms_done(p_tx uuid, p_patch jsonb) returns void
 language plpgsql security definer set search_path to ''
as $function$
begin
  update public.transactions set meta = jsonb_set(meta, '{topup,sms}', coalesce(meta #> '{topup,sms}', '{}'::jsonb) || coalesce(p_patch, '{}'::jsonb), true)
    where id = p_tx and kind = 'CREDIT_TOPUP' and meta ? 'topup';
end $function$;

create or replace function public._topup_sms_claim(p_tx uuid) returns boolean
 language plpgsql security definer set search_path to ''
as $function$
declare n int;
begin
  update public.transactions set meta = jsonb_set(meta, '{topup,sms}', coalesce(meta #> '{topup,sms}', '{}'::jsonb) || jsonb_build_object('status', 'SENDING', 'at', now()), true)
    where id = p_tx and kind = 'CREDIT_TOPUP' and status in ('CONFIRMED') and coalesce(meta #>> '{topup,sms,status}', 'QUEUED') in ('QUEUED', 'NOT_CONFIGURED', 'FAILED');
  get diagnostics n = row_count;
  return n = 1;
end $function$;

create or replace function public._dispatch_topup_notice(p_tx uuid) returns void
 language plpgsql security definer set search_path to ''
as $function$
declare c public.notice_dispatch_cfg; v_base text;
begin
  select * into c from public.notice_dispatch_cfg where id;
  v_base := substring(c.fn_url from '^https://[^/]+/functions/v1/');
  if c.token is null or c.anon_key is null or v_base is null then
    perform public._topup_sms_done(p_tx, jsonb_build_object('status', 'NOT_CONFIGURED', 'at', now()));
    return;
  end if;
  perform public._topup_sms_done(p_tx, jsonb_build_object('status', 'QUEUED', 'at', now()));
  perform net.http_post(
    url := v_base || 'topup-notice',
    body := jsonb_build_object('tx_id', p_tx),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || c.anon_key, 'apikey', c.anon_key, 'x-notice-token', c.token),
    timeout_milliseconds := 20000);
exception when others then
  raise warning '_dispatch_topup_notice failed: %', sqlerrm;
end $function$;

-- the request: instant (default) or held for the administrator
create or replace function public._credit_topup_request_impl(p_operator text, p_phone text, p_amount numeric, p_idempotency_key text)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_user uuid := (select auth.uid());
  v_op text := upper(btrim(coalesce(p_operator, '')));
  v_opname text;
  v_digits text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_amt numeric(12,3);
  v_min numeric := public._setting_num('credit_topup_min', 0.5);
  v_max numeric := public._setting_num('credit_topup_max', 20);
  v_day numeric := public._setting_num('credit_topup_day_max', 50);
  v_mode text := coalesce((select value #>> '{}' from public.app_settings where key = 'credit_topup_mode'), 'instant');
  v_today numeric; v_rows int; v_cached jsonb; v_result jsonb;
  v_yor text; v_name text; v_bal numeric; v_tx uuid; v_ref text; v_amt_txt text; v_tid text; v_mail text; v_at timestamptz;
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
  if v_rows = 0 then select result into v_cached from public.idempotency_keys where user_id = v_user and key = p_idempotency_key; return v_cached; end if;

  select p.yor_id, coalesce(nullif(btrim(p.first_name || ' ' || p.last_name), ''), p.yor_id) into v_yor, v_name
    from public.profiles p where p.id = v_user and p.status = 'ACTIVE';
  if v_yor is null then raise exception 'sender_inactive' using errcode = '42501'; end if;

  select coalesce(sum(amount), 0) into v_today from public.transactions
    where sender_id = v_user and kind = 'CREDIT_TOPUP' and status in ('PENDING', 'CONFIRMED')
      and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  if v_today + v_amt > v_day then raise exception 'limit_daily' using errcode = '22023'; end if;
  if (select count(*) from public.transactions where sender_id = v_user and kind = 'CREDIT_TOPUP' and status = 'PENDING') >= 5 then raise exception 'too_many_open' using errcode = '22023'; end if;
  -- the credited number gets an SMS: never more than 10 transfers to the same number in 24 hours
  if (select count(*) from public.transactions where kind = 'CREDIT_TOPUP' and status in ('PENDING', 'CONFIRMED') and meta -> 'topup' ->> 'phone' = v_digits
        and created_at > now() - interval '24 hours') >= 10 then raise exception 'limit_recipient' using errcode = '22023'; end if;

  v_amt_txt := to_char(v_amt, 'FM999990.000');
  v_ref := public.new_tx_reference();

  if v_mode = 'instant' then
    -- the transfer is made and confirmed here, in the application: debit, TID, messages — no administrator in between
    v_tid := public._topup_tid(); v_at := clock_timestamp();
    insert into public.transactions (reference, kind, sender_id, receiver_id, sender_yor_id, receiver_yor_id, asset, amount, fee, total, note, status, confirmed_at, meta)
      values (v_ref, 'CREDIT_TOPUP', v_user, v_user, v_yor, v_yor, 'OMR', v_amt, 0, v_amt, left('Credit transfer ' || v_opname || ' ' || v_digits, 140), 'CONFIRMED', v_at,
              jsonb_build_object('confirm', 'AUTO', 'confirmedAt', v_at,
                'topup', jsonb_build_object('operator', v_op, 'operatorName', v_opname, 'phone', v_digits, 'amount', v_amt, 'currency', 'OMR',
                                            'tid', v_tid, 'tidSource', 'OM_WALLET', 'mode', 'INSTANT', 'delivery', 'TO_DELIVER')))
      returning id into v_tx;
    perform public._debit_account(v_user, 'OMR', v_amt, v_tx);            -- raises insufficient_balance (the whole request is cancelled)
    insert into public.tx_events (transaction_id, user_id, status, label) values (v_tx, v_user, 'CONFIRMED', 'AUTO_CONFIRMED');
    insert into public.notifications (user_id, type, title, message, transaction_id, data) values
      (v_user, 'TOPUP_CONFIRMED', 'تحويل الرصيد',
       'تمت عملية تحويل مبلغ ' || v_amt_txt || ' ريال بنجاح إلى الرقم ' || v_digits || '. (TID: ' || v_tid || ').', v_tx,
       jsonb_build_object('reference', v_ref, 'amount', v_amt, 'currency', 'OMR', 'operator', v_op, 'phone', v_digits, 'tid', v_tid, 'confirmedAt', v_at));
    perform public._notify_admins('TOPUP_TO_DELIVER', 'Credit to send',
      v_name || ' · ' || v_opname || ' ' || v_digits || ' · ' || v_amt_txt || ' OMR · TID ' || v_tid || ' (' || v_ref || ')',
      jsonb_build_object('transaction', v_tx, 'reference', v_ref, 'amount', v_amt, 'asset', 'OMR', 'operator', v_op, 'phone', v_digits, 'tid', v_tid));
    select email into v_mail from public.profiles where id = v_user;
    if coalesce(v_mail, '') <> '' then
      insert into public.email_logs (user_id, transaction_id, email_type, recipient_email, idempotency_key, payload)
        values (v_user, v_tx, 'CREDIT_TOPUP_CONFIRMED', v_mail, 'CREDIT_TOPUP_CONFIRMED:' || v_tx,
                jsonb_build_object('reference', v_ref, 'amount', v_amt, 'asset', 'OMR', 'confirmed_at', v_at,
                  'topup', jsonb_build_object('operator', v_op, 'operatorName', v_opname, 'phone', v_digits, 'amount', v_amt, 'currency', 'OMR', 'tid', v_tid)))
        on conflict (idempotency_key) do nothing;
    end if;
    perform public.dispatch_email_worker(null);
    perform public._dispatch_topup_notice(v_tx);
    insert into public.audit_log (actor_id, action, target_id, details) values (v_user, 'TOPUP_AUTO_CONFIRMED', v_user,
      jsonb_build_object('transaction', v_tx, 'reference', v_ref, 'operator', v_op, 'phone', v_digits, 'amount', v_amt, 'tid', v_tid));
    v_result := jsonb_build_object('ok', true, 'transaction_id', v_tx, 'reference', v_ref, 'status', 'CONFIRMED', 'mode', 'instant', 'operator', v_op, 'phone', v_digits,
                                   'amount', v_amt, 'currency', 'OMR', 'tid', v_tid, 'confirmed_at', v_at);
  else
    -- administrator mode: the rials are held and the transfer waits for the administrator's confirmation (20261127_credit_topup.sql)
    perform 1 from public.accounts where user_id = v_user and currency = 'OMR' for update;
    select available_balance into v_bal from public.accounts where user_id = v_user and currency = 'OMR';
    if not found then raise exception 'sender_account_missing' using errcode = 'P0002'; end if;
    if v_bal < v_amt then raise exception 'insufficient_balance' using errcode = '23514'; end if;
    update public.accounts set available_balance = available_balance - v_amt, reserved_balance = reserved_balance + v_amt, updated_at = now()
      where user_id = v_user and currency = 'OMR';
    insert into public.transactions (reference, kind, sender_id, receiver_id, sender_yor_id, receiver_yor_id, asset, amount, fee, total, note, status, meta)
      values (v_ref, 'CREDIT_TOPUP', v_user, v_user, v_yor, v_yor, 'OMR', v_amt, 0, v_amt, left('Credit transfer ' || v_opname || ' ' || v_digits, 140), 'PENDING',
              jsonb_build_object('confirm', 'ADMIN', 'topup', jsonb_build_object('operator', v_op, 'operatorName', v_opname, 'phone', v_digits, 'amount', v_amt, 'currency', 'OMR')))
      returning id into v_tx;
    insert into public.tx_events (transaction_id, user_id, status, label) values (v_tx, v_user, 'PENDING', 'AWAITING_ADMIN');
    insert into public.notifications (user_id, type, title, message, transaction_id, data) values
      (v_user, 'TOPUP_PENDING', 'Credit transfer in progress', v_amt_txt || ' OMR → ' || v_opname || ' ' || v_digits || ' · in progress', v_tx,
       jsonb_build_object('reference', v_ref, 'status', 'PENDING', 'amount', v_amt, 'currency', 'OMR', 'operator', v_op, 'phone', v_digits));
    perform public._notify_admins('TX_CONFIRM_REQUIRED', 'Credit transfer to confirm',
      v_name || ' · ' || v_opname || ' ' || v_digits || ' · ' || v_amt_txt || ' OMR (' || v_ref || ')',
      jsonb_build_object('transaction', v_tx, 'reference', v_ref, 'amount', v_amt, 'asset', 'OMR', 'operator', v_op, 'phone', v_digits));
    v_result := jsonb_build_object('ok', true, 'transaction_id', v_tx, 'reference', v_ref, 'status', 'PENDING', 'mode', 'admin', 'operator', v_op, 'phone', v_digits, 'amount', v_amt, 'currency', 'OMR');
  end if;

  update public.idempotency_keys set result = v_result where user_id = v_user and key = p_idempotency_key;
  return v_result;
end $function$;

-- administrators: the transfers to deliver, delivered ones, refunds
create or replace function public.admin_topup_list(p_status text default null, p_limit integer default 100)
 returns jsonb language plpgsql stable security definer set search_path to ''
as $function$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'created_at') desc) from (
    select jsonb_build_object('id', t.id, 'reference', t.reference, 'status', t.status, 'amount', t.amount, 'created_at', t.created_at, 'confirmed_at', t.confirmed_at,
      'mode', t.meta -> 'topup' ->> 'mode', 'delivery', coalesce(t.meta -> 'topup' ->> 'delivery', case when t.status = 'PENDING' then 'WAITING' end),
      'operator', t.meta -> 'topup' ->> 'operator', 'phone', t.meta -> 'topup' ->> 'phone', 'tid', t.meta -> 'topup' ->> 'tid',
      'sms', t.meta -> 'topup' -> 'sms', 'refund_reason', t.meta ->> 'refundReason',
      'sender', jsonb_build_object('name', nullif(btrim(coalesce(s.first_name,'') || ' ' || coalesce(s.last_name,'')), ''), 'yor_id', s.yor_id, 'phone', s.phone)) as x
    from public.transactions t left join public.profiles s on s.id = t.sender_id
    where t.kind = 'CREDIT_TOPUP' and (p_status is null or t.status = upper(p_status) or (upper(p_status) = 'TO_DELIVER' and t.meta -> 'topup' ->> 'delivery' = 'TO_DELIVER'))
    order by t.created_at desc limit greatest(1, least(coalesce(p_limit, 100), 500))) q), '[]'::jsonb);
end $function$;

create or replace function public.admin_topup_mark_delivered(p_tx uuid) returns jsonb
 language plpgsql security definer set search_path to ''
as $function$
declare v_admin uuid := (select auth.uid()); t public.transactions;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into t from public.transactions where id = p_tx for update;
  if t.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if t.kind <> 'CREDIT_TOPUP' or t.status <> 'CONFIRMED' then raise exception 'invalid_state' using errcode = '22023'; end if;
  update public.transactions set meta = meta || jsonb_build_object('topup', (meta -> 'topup') || jsonb_build_object('delivery', 'DELIVERED', 'deliveredAt', clock_timestamp(), 'deliveredBy', v_admin)) where id = t.id;
  insert into public.audit_log (actor_id, action, target_id, details) values (v_admin, 'TOPUP_DELIVERED', t.sender_id, jsonb_build_object('transaction', t.id, 'reference', t.reference));
  return jsonb_build_object('ok', true, 'delivery', 'DELIVERED');
end $function$;

create or replace function public.admin_topup_refund(p_tx uuid, p_reason text) returns jsonb
 language plpgsql security definer set search_path to ''
as $function$
declare v_admin uuid := (select auth.uid()); t public.transactions; v_reason text := left(btrim(coalesce(p_reason, '')), 300);
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if length(v_reason) < 3 then raise exception 'reason_required' using errcode = '22023'; end if;
  select * into t from public.transactions where id = p_tx for update;
  if t.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if t.kind <> 'CREDIT_TOPUP' or coalesce(t.meta ->> 'confirm', '') <> 'AUTO' then raise exception 'not_confirmable' using errcode = '22023'; end if;
  if t.status <> 'CONFIRMED' then raise exception 'invalid_state' using errcode = '22023'; end if;
  if coalesce(t.meta -> 'topup' ->> 'delivery', '') = 'DELIVERED' then raise exception 'already_delivered' using errcode = '22023'; end if;
  perform public._credit_account(t.sender_id, 'OMR', t.amount, t.id);                     -- the rials are given back (one ledger line)
  update public.transactions set status = 'REFUNDED',
    meta = meta || jsonb_build_object('refundReason', v_reason, 'refundedAt', clock_timestamp(), 'topup', (meta -> 'topup') || jsonb_build_object('delivery', 'REFUNDED')) where id = t.id;
  insert into public.tx_events (transaction_id, user_id, status, label) values (t.id, t.sender_id, 'REFUNDED', 'ADMIN_REFUNDED');
  insert into public.notifications (user_id, type, title, message, transaction_id, data) values (t.sender_id, 'TRANSFER_REJECTED', 'Transfer refunded',
    trim(trailing '.' from trim(trailing '0' from t.amount::text)) || ' OMR returned to your balance', t.id,
    jsonb_build_object('amount', t.amount, 'currency', 'OMR', 'reference', t.reference, 'reason', v_reason));
  insert into public.audit_log (actor_id, action, target_id, details) values (v_admin, 'TOPUP_REFUNDED', t.sender_id, jsonb_build_object('transaction', t.id, 'reference', t.reference, 'amount', t.amount, 'reason', v_reason));
  return jsonb_build_object('ok', true, 'status', 'REFUNDED');
end $function$;

revoke all on function public._topup_sms_done(uuid, jsonb) from public, anon, authenticated;
grant execute on function public._topup_sms_done(uuid, jsonb) to service_role;
revoke all on function public._topup_sms_claim(uuid) from public, anon, authenticated;
grant execute on function public._topup_sms_claim(uuid) to service_role;
revoke all on function public._dispatch_topup_notice(uuid) from public, anon, authenticated;
grant execute on function public._dispatch_topup_notice(uuid) to service_role;
revoke all on function public.admin_topup_list(text, integer) from public, anon;
grant execute on function public.admin_topup_list(text, integer) to authenticated, service_role;
revoke all on function public.admin_topup_mark_delivered(uuid) from public, anon;
grant execute on function public.admin_topup_mark_delivered(uuid) to authenticated, service_role;
revoke all on function public.admin_topup_refund(uuid, text) from public, anon;
grant execute on function public.admin_topup_refund(uuid, text) to authenticated, service_role;
