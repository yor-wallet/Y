-- ============================================================
-- OM Wallet 14.5.0 — Swap / Spot market order (CRYPTO_SWAP), confirmed by the administrator
--
-- What it does
--   1. public.swap_quotes: a price quote fixed by the server (Binance public price, fetched by the Edge function `crypto-swap`
--      with the service role — the client never sets a price or an amount to receive). A quote lives 30 seconds and is used once.
--   2. public.swap_execute(quote, idempotency key, PIN grant): same rules as an internal transfer — PIN grant consumed, one request
--      per idempotency key, the amount sold is HELD (available → locked) and a PENDING transaction (kind CRYPTO_SWAP,
--      meta.confirm = 'ADMIN') is created. Nothing is credited here. The user only sees « en cours ».
--   3. public.admin_tx_confirm: new CRYPTO_SWAP branch — at the administrator's single confirmation, the held amount is debited
--      and the asset bought is credited at the quoted amount (price fixed at the request); two ledger lines; one notification.
--      Refuse (admin_tx_reject) and Pause (admin_tx_pause) already work unchanged: they release / keep the hold on (asset, network).
--   4. E-mail: exactly one per swap — trg_tx_confirmed_sender_email now queues SWAP_CONFIRMED (instead of TRANSFER_CONFIRMED)
--      for a swap, only once the transaction is CONFIRMED (after the credit). admin_tx_confirm sends no FUNDS_RECEIVED for a swap.
--   5. admin_tx_list returns the swap details; the administrator's action e-mail carries them.
--
-- Data safety: no table, row or column is dropped or modified; only functions are replaced (previous definitions saved in
-- public.function_backups, tag '20261124_crypto_swap'; restore with 20261124_crypto_swap_rollback.sql). Historical amounts untouched.
-- ============================================================

-- 0. backups of every function this migration replaces
insert into public.function_backups (tag, name, definition)
select '20261124_crypto_swap', p.proname, pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('admin_tx_confirm', 'admin_tx_list', 'trg_tx_confirmed_sender_email', 'trg_admin_tx_action_email');

-- 1. quotes (written only by the Edge function with the service role; read by their owner)
create table if not exists public.swap_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  from_asset text not null, from_network text not null,
  to_asset text not null, to_network text not null,
  from_amount numeric(38,10) not null check (from_amount > 0),
  to_amount numeric(38,10) not null check (to_amount > 0),
  price numeric(38,18) not null check (price > 0),                -- units of to_asset per 1 from_asset
  px_from_usdt numeric(38,18) not null check (px_from_usdt > 0),
  px_to_usdt numeric(38,18) not null check (px_to_usdt > 0),
  usd_value numeric(38,10) not null,
  source text not null,                                           -- e.g. 'binance:data-api.binance.vision'
  side text,                                                      -- 'BUY' / 'SELL' when it comes from the Spot screen, else null
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  transaction_id uuid references public.transactions(id),
  constraint swap_quotes_from_fk foreign key (from_asset, from_network) references public.asset_networks(asset, network),
  constraint swap_quotes_to_fk foreign key (to_asset, to_network) references public.asset_networks(asset, network),
  constraint swap_quotes_distinct check (from_asset <> to_asset)
);
create index if not exists swap_quotes_user_created on public.swap_quotes (user_id, created_at desc);
create index if not exists swap_quotes_tx on public.swap_quotes (transaction_id);
alter table public.swap_quotes enable row level security;
drop policy if exists swap_quotes_own_read on public.swap_quotes;
create policy swap_quotes_own_read on public.swap_quotes for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.swap_quotes from anon, authenticated;
grant select on public.swap_quotes to authenticated;   -- own rows only (RLS); written by the service role

-- 2. execute a quote: hold + PENDING transaction (no credit)
create or replace function public._swap_execute_impl(p_quote uuid, p_idempotency_key text)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_user uuid := (select auth.uid()); q public.swap_quotes; v_rows int; v_cached jsonb; v_result jsonb;
  v_yor text; v_name text; v_bal numeric; v_tx uuid; v_ref text; v_fa text; v_ta text;
begin
  if v_user is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 then raise exception 'idempotency_key_required' using errcode = '22023'; end if;
  insert into public.idempotency_keys (user_id, key) values (v_user, p_idempotency_key) on conflict do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then select result into v_cached from public.idempotency_keys where user_id = v_user and key = p_idempotency_key; return v_cached; end if;

  select * into q from public.swap_quotes where id = p_quote and user_id = v_user for update;
  if q.id is null then raise exception 'quote_not_found' using errcode = 'P0002'; end if;
  if q.used_at is not null then raise exception 'quote_used' using errcode = '22023'; end if;
  if q.expires_at <= now() then raise exception 'quote_expired' using errcode = '22023'; end if;

  select p.yor_id, coalesce(nullif(btrim(p.first_name || ' ' || p.last_name), ''), p.yor_id) into v_yor, v_name
    from public.profiles p where p.id = v_user and p.status = 'ACTIVE';
  if v_yor is null then raise exception 'sender_inactive' using errcode = '42501'; end if;

  perform 1 from public.crypto_wallets where user_id = v_user and asset = q.from_asset and network = q.from_network for update;
  select available_balance into v_bal from public.crypto_wallets where user_id = v_user and asset = q.from_asset and network = q.from_network;
  if not found then raise exception 'sender_wallet_missing' using errcode = 'P0002'; end if;
  if v_bal < q.from_amount then raise exception 'insufficient_balance' using errcode = '23514'; end if;
  update public.crypto_wallets set available_balance = available_balance - q.from_amount, locked_balance = locked_balance + q.from_amount
    where user_id = v_user and asset = q.from_asset and network = q.from_network;

  v_fa := trim(trailing '.' from trim(trailing '0' from q.from_amount::text));
  v_ta := trim(trailing '.' from trim(trailing '0' from q.to_amount::text));
  v_ref := public.new_tx_reference();
  insert into public.transactions (reference, kind, sender_id, receiver_id, sender_yor_id, receiver_yor_id, asset, network, amount, fee, total, note, status, meta)
    values (v_ref, 'CRYPTO_SWAP', v_user, v_user, v_yor, v_yor, q.from_asset, q.from_network, q.from_amount, 0, q.from_amount,
            left('Swap ' || v_fa || ' ' || q.from_asset || ' → ' || v_ta || ' ' || q.to_asset, 140), 'PENDING',
            jsonb_build_object('confirm', 'ADMIN', 'swap', jsonb_build_object(
              'quote_id', q.id, 'from_asset', q.from_asset, 'from_network', q.from_network, 'from_amount', q.from_amount,
              'to_asset', q.to_asset, 'to_network', q.to_network, 'to_amount', q.to_amount, 'price', q.price,
              'px_from_usdt', q.px_from_usdt, 'px_to_usdt', q.px_to_usdt, 'usd_value', q.usd_value, 'source', q.source,
              'side', q.side, 'quoted_at', q.created_at)))
    returning id into v_tx;
  update public.swap_quotes set used_at = clock_timestamp(), transaction_id = v_tx where id = q.id;
  insert into public.tx_events (transaction_id, user_id, status, label) values (v_tx, v_user, 'PENDING', 'AWAITING_ADMIN');
  insert into public.notifications (user_id, type, title, message, transaction_id, data) values
    (v_user, 'SWAP_PENDING', 'Swap in progress', v_fa || ' ' || q.from_asset || ' → ' || v_ta || ' ' || q.to_asset || ' · in progress', v_tx,
     jsonb_build_object('reference', v_ref, 'status', 'PENDING', 'from_asset', q.from_asset, 'from_amount', q.from_amount, 'to_asset', q.to_asset, 'to_amount', q.to_amount));
  perform public._notify_admins('TX_CONFIRM_REQUIRED', 'Swap to confirm',
    v_name || ' · ' || v_fa || ' ' || q.from_asset || ' → ' || v_ta || ' ' || q.to_asset || ' (' || v_ref || ')',
    jsonb_build_object('transaction', v_tx, 'reference', v_ref, 'amount', q.from_amount, 'asset', q.from_asset, 'network', q.from_network,
                       'to_asset', q.to_asset, 'to_amount', q.to_amount));

  v_result := jsonb_build_object('ok', true, 'transaction_id', v_tx, 'reference', v_ref, 'status', 'PENDING',
    'from_asset', q.from_asset, 'from_network', q.from_network, 'from_amount', q.from_amount,
    'to_asset', q.to_asset, 'to_network', q.to_network, 'to_amount', q.to_amount, 'price', q.price);
  update public.idempotency_keys set result = v_result where user_id = v_user and key = p_idempotency_key;
  return v_result;
end $function$;

create or replace function public.swap_execute(p_quote uuid, p_idempotency_key text, p_pin_grant uuid default null)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare c jsonb;
begin
  c := public._idem_replay(p_idempotency_key); if c is not null then return c; end if;
  perform public._consume_grant(p_pin_grant);
  return public._swap_execute_impl(p_quote, p_idempotency_key);
end $function$;

revoke all on function public._swap_execute_impl(uuid, text) from public, anon, authenticated;
grant execute on function public._swap_execute_impl(uuid, text) to service_role;
revoke all on function public.swap_execute(uuid, text, uuid) from public, anon;
grant execute on function public.swap_execute(uuid, text, uuid) to authenticated, service_role;

-- 3. administrator's confirmation: CRYPTO_SWAP branch (FIAT / CRYPTO transfer branches unchanged)
create or replace function public.admin_tx_confirm(p_tx uuid)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_admin uuid := (select auth.uid()); t public.transactions; v_sbal numeric; v_rbal numeric; v_at timestamptz;
  v_mail text; v_sname text; v_rname text; v_amt text;
  v_to_asset text; v_to_net text; v_to_amt numeric; v_to_txt text;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into t from public.transactions where id = p_tx for update;
  if t.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if coalesce(t.meta ->> 'confirm', '') <> 'ADMIN' then raise exception 'not_confirmable' using errcode = '22023'; end if;
  if t.status = 'CONFIRMED' then
    return jsonb_build_object('ok', true, 'already', true, 'id', t.id, 'reference', t.reference, 'amount', t.amount, 'asset', t.asset, 'confirmed_at', t.confirmed_at);
  end if;
  if t.status <> 'PENDING' then raise exception 'invalid_state' using errcode = '22023'; end if;
  if t.sender_id is null or t.receiver_id is null then raise exception 'not_confirmable' using errcode = '22023'; end if;

  if t.kind = 'CRYPTO_SWAP' then
    -- one person: sell the held amount, receive the quoted amount of the other asset (price fixed at the request)
    v_to_asset := t.meta -> 'swap' ->> 'to_asset'; v_to_net := t.meta -> 'swap' ->> 'to_network'; v_to_amt := (t.meta -> 'swap' ->> 'to_amount')::numeric;
    if v_to_asset is null or v_to_net is null or v_to_amt is null or v_to_amt <= 0 or t.sender_id <> t.receiver_id
       or not exists (select 1 from public.asset_networks where asset = v_to_asset and network = v_to_net) then
      raise exception 'not_confirmable' using errcode = '22023';
    end if;
    insert into public.crypto_wallets (user_id, asset, network) values (t.sender_id, v_to_asset, v_to_net) on conflict (user_id, asset, network) do nothing;
    perform 1 from public.crypto_wallets where user_id = t.sender_id and ((asset = t.asset and network = t.network) or (asset = v_to_asset and network = v_to_net))
      order by asset, network for update;
    update public.crypto_wallets set balance = balance - t.amount, locked_balance = locked_balance - t.amount
      where user_id = t.sender_id and asset = t.asset and network = t.network and locked_balance >= t.amount returning balance into v_sbal;
    if v_sbal is null then raise exception 'hold_missing' using errcode = '23514'; end if;
    update public.crypto_wallets set balance = balance + v_to_amt, available_balance = available_balance + v_to_amt
      where user_id = t.sender_id and asset = v_to_asset and network = v_to_net returning balance into v_rbal;
    insert into public.ledger_entries (transaction_id, user_id, asset, delta, balance_after) values
      (t.id, t.sender_id, t.asset, -t.amount, v_sbal), (t.id, t.sender_id, v_to_asset, v_to_amt, v_rbal);

    v_at := clock_timestamp();
    update public.transactions set status = 'CONFIRMED', confirmed_at = v_at, confirmed_by = v_admin,
      meta = meta || jsonb_build_object('confirmedAt', v_at) where id = t.id;
    insert into public.tx_events (transaction_id, user_id, status, label) values (t.id, t.sender_id, 'CONFIRMED', 'ADMIN_CONFIRMED');
    v_amt := trim(trailing '.' from trim(trailing '0' from t.amount::text));
    v_to_txt := trim(trailing '.' from trim(trailing '0' from v_to_amt::text));
    insert into public.notifications (user_id, type, title, message, transaction_id, data) values
      (t.sender_id, 'SWAP_CONFIRMED', 'Swap confirmed', v_amt || ' ' || t.asset || ' → ' || v_to_txt || ' ' || v_to_asset, t.id,
       jsonb_build_object('reference', t.reference, 'from_asset', t.asset, 'from_amount', t.amount, 'to_asset', v_to_asset, 'to_amount', v_to_amt, 'confirmedAt', v_at));
    -- the single e-mail of this swap (SWAP_CONFIRMED) is queued by trg_tx_confirmed_sender_email, after this credit
    insert into public.audit_log (actor_id, action, target_id, details) values (v_admin, 'TX_CONFIRMED', t.sender_id,
      jsonb_build_object('transaction', t.id, 'reference', t.reference, 'kind', t.kind, 'amount', t.amount, 'asset', t.asset,
                         'to_asset', v_to_asset, 'to_amount', v_to_amt, 'confirmed_at', v_at));
    select coalesce(nullif(btrim(first_name || ' ' || last_name), ''), yor_id), email into v_rname, v_mail from public.profiles where id = t.sender_id;
    return jsonb_build_object('ok', true, 'id', t.id, 'reference', t.reference, 'amount', t.amount, 'asset', t.asset, 'status', 'CONFIRMED',
      'to_asset', v_to_asset, 'to_amount', v_to_amt, 'confirmed_at', v_at, 'recipient', v_rname, 'email', coalesce(v_mail, '') <> '');
  end if;

  if t.kind = 'FIAT_TRANSFER' then
    insert into public.accounts (user_id, type, name, currency) values (t.receiver_id, 'MAIN', 'Main ' || t.asset, t.asset) on conflict (user_id, currency) do nothing;
    perform 1 from public.accounts where currency = t.asset and user_id in (t.sender_id, t.receiver_id) order by user_id for update;
    update public.accounts set balance = balance - t.amount, reserved_balance = reserved_balance - t.amount, updated_at = now()
      where user_id = t.sender_id and currency = t.asset and reserved_balance >= t.amount returning balance into v_sbal;
    if v_sbal is null then raise exception 'hold_missing' using errcode = '23514'; end if;
    update public.accounts set balance = balance + t.amount, available_balance = available_balance + t.amount, updated_at = now()
      where user_id = t.receiver_id and currency = t.asset returning balance into v_rbal;
  elsif t.kind = 'CRYPTO_TRANSFER' then
    insert into public.crypto_wallets (user_id, asset, network) values (t.receiver_id, t.asset, t.network) on conflict (user_id, asset, network) do nothing;
    perform 1 from public.crypto_wallets where asset = t.asset and network = t.network and user_id in (t.sender_id, t.receiver_id) order by user_id for update;
    update public.crypto_wallets set balance = balance - t.amount, locked_balance = locked_balance - t.amount
      where user_id = t.sender_id and asset = t.asset and network = t.network and locked_balance >= t.amount returning balance into v_sbal;
    if v_sbal is null then raise exception 'hold_missing' using errcode = '23514'; end if;
    update public.crypto_wallets set balance = balance + t.amount, available_balance = available_balance + t.amount
      where user_id = t.receiver_id and asset = t.asset and network = t.network returning balance into v_rbal;
  else
    raise exception 'not_confirmable' using errcode = '22023';
  end if;
  insert into public.ledger_entries (transaction_id, user_id, asset, delta, balance_after) values
    (t.id, t.sender_id, t.asset, -t.amount, v_sbal), (t.id, t.receiver_id, t.asset, t.amount, v_rbal);

  v_at := clock_timestamp();
  update public.transactions set status = 'CONFIRMED', confirmed_at = v_at, confirmed_by = v_admin,
    meta = meta || jsonb_build_object('confirmedAt', v_at) where id = t.id;
  insert into public.tx_events (transaction_id, user_id, status, label) values (t.id, t.sender_id, 'CONFIRMED', 'ADMIN_CONFIRMED'), (t.id, t.receiver_id, 'CONFIRMED', 'ADMIN_CONFIRMED');

  select coalesce(nullif(btrim(first_name || ' ' || last_name), ''), yor_id) into v_sname from public.profiles where id = t.sender_id;
  select coalesce(nullif(btrim(first_name || ' ' || last_name), ''), yor_id), email into v_rname, v_mail from public.profiles where id = t.receiver_id;
  v_amt := trim(trailing '.' from trim(trailing '0' from t.amount::text));
  insert into public.notifications (user_id, type, title, message, transaction_id, data) values
    (t.receiver_id, case when t.kind = 'CRYPTO_TRANSFER' then 'CRYPTO_RECEIVED' else 'TRANSFER_RECEIVED' end, 'Money received',
       'You received ' || v_amt || ' ' || t.asset || ' from ' || v_sname, t.id,
       jsonb_build_object('amount', t.amount, 'currency', t.asset, 'asset', t.asset, 'from', v_sname, 'reference', t.reference, 'confirmedAt', v_at)),
    (t.sender_id, case when t.kind = 'CRYPTO_TRANSFER' then 'CRYPTO_SENT' else 'TRANSFER_SENT' end, 'Transfer sent',
       v_amt || ' ' || t.asset || ' sent to ' || v_rname, t.id,
       jsonb_build_object('amount', t.amount, 'currency', t.asset, 'asset', t.asset, 'to', v_rname, 'reference', t.reference, 'confirmedAt', v_at));

  if coalesce(v_mail, '') <> '' then
    insert into public.email_logs (user_id, transaction_id, email_type, recipient_email, idempotency_key, payload)
      values (t.receiver_id, t.id, 'FUNDS_RECEIVED', v_mail, 'FUNDS_RECEIVED:' || t.id,
              jsonb_build_object('reference', t.reference, 'amount', t.amount, 'asset', t.asset, 'confirmed_at', v_at))
      on conflict (idempotency_key) do nothing;
  end if;

  insert into public.audit_log (actor_id, action, target_id, details) values (v_admin, 'TX_CONFIRMED', t.receiver_id,
    jsonb_build_object('transaction', t.id, 'reference', t.reference, 'kind', t.kind, 'amount', t.amount, 'asset', t.asset, 'confirmed_at', v_at));
  return jsonb_build_object('ok', true, 'id', t.id, 'reference', t.reference, 'amount', t.amount, 'asset', t.asset, 'status', 'CONFIRMED',
    'confirmed_at', v_at, 'recipient', v_rname, 'email', coalesce(v_mail, '') <> '');
end $function$;

-- 4. the person's single e-mail after the administrator's confirmation: SWAP_CONFIRMED for a swap, TRANSFER_CONFIRMED otherwise
create or replace function public.trg_tx_confirmed_sender_email()
 returns trigger language plpgsql security definer set search_path to ''
as $function$
declare v_mail text; v_type text := case when new.kind = 'CRYPTO_SWAP' then 'SWAP_CONFIRMED' else 'TRANSFER_CONFIRMED' end;
begin
  select email into v_mail from public.profiles where id = new.sender_id;
  if coalesce(v_mail, '') <> '' then
    insert into public.email_logs (user_id, transaction_id, email_type, recipient_email, idempotency_key, payload)
      values (new.sender_id, new.id, v_type, v_mail, v_type || ':' || new.id,
        jsonb_build_object('reference', new.reference, 'amount', new.amount, 'asset', new.asset, 'network', new.network, 'confirmed_at', new.confirmed_at)
          || case when new.kind = 'CRYPTO_SWAP' then jsonb_build_object('swap', new.meta -> 'swap') else '{}'::jsonb end)
      on conflict (idempotency_key) do nothing;
  end if;
  perform public.dispatch_email_worker(null);
  return new;
exception when others then
  raise warning 'trg_tx_confirmed_sender_email: %', sqlerrm;
  begin insert into public.audit_log (actor_id, action, target_id, details) values (null, 'TRIGGER_FAILED', null, jsonb_build_object('trigger', 'trg_tx_confirmed_sender_email', 'transaction', new.id, 'error', sqlerrm)); exception when others then null; end;
  return new;
end $function$;

-- 5. the administrator's action e-mail carries the swap details
create or replace function public.trg_admin_tx_action_email()
 returns trigger language plpgsql security definer set search_path to ''
as $function$
declare a record; v_sname text; v_rname text;
begin
  select coalesce(nullif(btrim(first_name || ' ' || last_name), ''), yor_id) into v_sname from public.profiles where id = new.sender_id;
  select coalesce(nullif(btrim(first_name || ' ' || last_name), ''), yor_id) into v_rname from public.profiles where id = new.receiver_id;
  for a in select id, email from public.profiles where role = 'admin' and status = 'ACTIVE' and coalesce(email, '') <> '' loop
    insert into public.email_logs (user_id, transaction_id, email_type, recipient_email, idempotency_key, payload)
      values (a.id, new.id, 'ADMIN_TX_ACTION', a.email, 'ADMIN_TX_ACTION:' || new.id || ':' || a.id,
        jsonb_build_object('reference', new.reference, 'kind', new.kind, 'amount', new.amount, 'asset', new.asset, 'network', new.network, 'note', new.note,
          'sender', v_sname, 'receiver', v_rname, 'created_at', new.created_at)
          || case when new.kind = 'CRYPTO_SWAP' then jsonb_build_object('swap', new.meta -> 'swap') else '{}'::jsonb end)
      on conflict (idempotency_key) do nothing;
  end loop;
  perform public.dispatch_email_worker(null);
  return new;
exception when others then
  raise warning 'trg_admin_tx_action_email: %', sqlerrm;
  begin insert into public.audit_log (actor_id, action, target_id, details) values (null, 'TRIGGER_FAILED', null, jsonb_build_object('trigger', 'trg_admin_tx_action_email', 'transaction', new.id, 'error', sqlerrm)); exception when others then null; end;
  return new;
end $function$;

-- 6. administrator's list: swap details + the swap's own e-mail status
create or replace function public.admin_tx_list(p_status text default 'PENDING'::text, p_limit integer default 100)
 returns jsonb language plpgsql stable security definer set search_path to ''
as $function$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'created_at') desc) from (
    select jsonb_build_object('id', t.id, 'reference', t.reference, 'kind', t.kind, 'asset', t.asset, 'network', t.network, 'amount', t.amount,
      'status', t.status, 'paused', coalesce((t.meta ->> 'paused')::boolean, false), 'created_at', t.created_at, 'confirmed_at', t.confirmed_at, 'note', t.note,
      'swap', t.meta -> 'swap',
      'sender', jsonb_build_object('name', nullif(btrim(coalesce(s.first_name,'') || ' ' || coalesce(s.last_name,'')), ''), 'yor_id', s.yor_id, 'phone', s.phone),
      'receiver', jsonb_build_object('name', nullif(btrim(coalesce(r.first_name,'') || ' ' || coalesce(r.last_name,'')), ''), 'yor_id', r.yor_id, 'phone', r.phone, 'has_email', coalesce(r.email, '') <> ''),
      'email', (select jsonb_build_object('status', e.status, 'sent_at', e.sent_at) from public.email_logs e
                where e.idempotency_key = case when t.kind = 'CRYPTO_SWAP' then 'SWAP_CONFIRMED:' else 'FUNDS_RECEIVED:' end || t.id)) as x
    from public.transactions t left join public.profiles s on s.id = t.sender_id left join public.profiles r on r.id = t.receiver_id
    where t.meta ->> 'confirm' = 'ADMIN' and (p_status is null or t.status = upper(p_status))
    order by t.created_at desc limit greatest(1, least(coalesce(p_limit, 100), 500))) q), '[]'::jsonb);
end $function$;
