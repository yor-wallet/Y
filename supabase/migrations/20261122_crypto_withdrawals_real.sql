-- OM Wallet 14.0 — dépôts et retraits crypto RÉELS (ajouts seulement ; aucune donnée n'est supprimée ni modifiée).
--
-- 1) DÉPÔTS : les adresses de crypto_wallets sont produites par _gen_address() avec random() — aucune clé privée n'existe pour elles : tout envoi vers
--    ces adresses serait PERDU. get_receive_address() ne renvoie donc plus d'adresse : elle répond « deposit_address_unavailable ».
--    Les lignes de crypto_wallets (soldes, adresses internes) sont conservées telles quelles.
-- 2) RETRAITS CRYPTO : _crypto_send_external_impl() marque un envoi externe « CONFIRMED » sans rien envoyer sur la blockchain. Les nouveaux retraits passent
--    par un circuit manuel, comme les retraits bancaires : la demande débite le solde et reste « PENDING » ; un administrateur la prend en charge
--    (PROCESSING), envoie réellement les fonds depuis le portefeuille de la plateforme et saisit le hash de la transaction (COMPLETED) ; ou la rejette
--    (REJECTED, remboursement). Le client peut annuler tant qu'elle est PENDING (CANCELLED, remboursement).
--    Les règles existantes des retraits s'appliquent (withdraw_enabled, require_kyc_for_withdraw, 3 demandes ouvertes au plus, code PIN).
-- Retour arrière : 20261122_crypto_withdrawals_real_rollback.sql

create or replace function public.get_receive_address(p_asset text, p_network text)
  returns text language plpgsql security definer set search_path to ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  raise exception 'deposit_address_unavailable' using errcode = '22023';
end $$;

create table if not exists public.crypto_withdrawals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id),
  transaction_id uuid references public.transactions(id),
  reference      text not null unique,
  asset          text not null,
  network        text not null,
  address        text not null,
  memo           text,
  amount         numeric not null check (amount > 0),
  fee            numeric not null default 0 check (fee >= 0),
  status         text not null default 'PENDING' check (status in ('PENDING','PROCESSING','COMPLETED','REJECTED','CANCELLED')),
  tx_hash        text,
  admin_note     text,
  decided_by     uuid references public.profiles(id),
  idem           text not null,
  created_at     timestamptz not null default now(),
  processing_at  timestamptz,
  completed_at   timestamptz,
  decided_at     timestamptz,
  unique (user_id, idem)
);
alter table public.crypto_withdrawals enable row level security;
revoke all on public.crypto_withdrawals from anon, authenticated;
create index if not exists crypto_withdrawals_user_idx on public.crypto_withdrawals (user_id, created_at desc);
create index if not exists crypto_withdrawals_status_idx on public.crypto_withdrawals (status, created_at desc);

-- format of a destination address for each supported network (checksums are also verified by the app before sending)
create or replace function public._crypto_address_ok(p_network text, p_address text) returns boolean
  language sql immutable set search_path to ''
as $$
  select case lower(coalesce(p_network, ''))
    when 'bitcoin'  then p_address ~ '^(bc1[02-9ac-hj-np-z]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$'
    when 'litecoin' then p_address ~ '^(ltc1[02-9ac-hj-np-z]{11,71}|[LM3][1-9A-HJ-NP-Za-km-z]{26,33})$'
    when 'ethereum' then p_address ~ '^0x[0-9a-fA-F]{40}$'
    when 'bsc'      then p_address ~ '^0x[0-9a-fA-F]{40}$'
    when 'polygon'  then p_address ~ '^0x[0-9a-fA-F]{40}$'
    when 'tron'     then p_address ~ '^T[1-9A-HJ-NP-Za-km-z]{33}$'
    when 'solana'   then p_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'
    when 'xrp'      then p_address ~ '^r[1-9A-HJ-NP-Za-km-z]{24,34}$'
    else false end
$$;
-- format of a blockchain transaction hash for each network
create or replace function public._crypto_hash_ok(p_network text, p_hash text) returns boolean
  language sql immutable set search_path to ''
as $$
  select case lower(coalesce(p_network, ''))
    when 'ethereum' then p_hash ~ '^0x[0-9a-fA-F]{64}$'
    when 'bsc'      then p_hash ~ '^0x[0-9a-fA-F]{64}$'
    when 'polygon'  then p_hash ~ '^0x[0-9a-fA-F]{64}$'
    when 'solana'   then p_hash ~ '^[1-9A-HJ-NP-Za-km-z]{64,90}$'
    else p_hash ~ '^[0-9a-fA-F]{64}$' end      -- bitcoin, litecoin, tron, xrp
$$;
-- network fee charged in the withdrawn asset: only when the asset is the native coin of the network (tokens: the platform pays the network fee)
create or replace function public._crypto_withdraw_fee(p_asset text, p_network text) returns numeric
  language sql stable security definer set search_path to ''
as $$
  select case when (upper(p_asset), lower(p_network)) in (('BTC','bitcoin'),('LTC','litecoin'),('ETH','ethereum'),('BNB','bsc'),('SOL','solana'),('XRP','xrp'))
    then coalesce((select fee from public.network_fees where network = lower(p_network)), 0) else 0 end
$$;

create or replace function public.crypto_withdraw_request(p_asset text, p_network text, p_address text, p_memo text, p_amount numeric, p_idempotency_key text, p_pin_grant uuid default null)
  returns jsonb language plpgsql security definer set search_path to ''
as $$
declare
  v_u uuid := (select auth.uid()); v_asset text := upper(btrim(coalesce(p_asset, ''))); v_net text := lower(btrim(coalesce(p_network, '')));
  v_addr text := btrim(coalesce(p_address, '')); v_memo text := nullif(left(btrim(coalesce(p_memo, '')), 40), ''); v_amt numeric; v_fee numeric; v_total numeric;
  v_yor text; v_name text; ex public.crypto_withdrawals; v_id uuid; v_tx uuid; v_ref text;
begin
  if v_u is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 then raise exception 'idempotency_key_required' using errcode = '22023'; end if;
  select * into ex from public.crypto_withdrawals where user_id = v_u and idem = p_idempotency_key;
  if ex.id is not null then
    return jsonb_build_object('ok', true, 'id', ex.id, 'reference', ex.reference, 'status', ex.status, 'replayed', true, 'transaction_id', ex.transaction_id);
  end if;
  perform public._consume_grant(p_pin_grant);
  select yor_id, coalesce(nullif(btrim(first_name || ' ' || last_name), ''), yor_id) into v_yor, v_name from public.profiles where id = v_u and status = 'ACTIVE';
  if v_yor is null then raise exception 'sender_inactive' using errcode = '42501'; end if;
  if not public._setting_bool('withdraw_enabled', true) then raise exception 'withdraw_disabled' using errcode = '22023'; end if;
  if public._setting_bool('require_kyc_for_withdraw', true) and not public._kyc_ok(v_u) then raise exception 'kyc_required' using errcode = '22023'; end if;
  if not exists (select 1 from public.asset_networks where asset = v_asset and network = v_net) then raise exception 'unsupported_asset_network' using errcode = '22023'; end if;
  if not public._crypto_address_ok(v_net, v_addr) then raise exception 'invalid_address' using errcode = '22023'; end if;
  if exists (select 1 from public.crypto_wallets where lower(address) = lower(v_addr)) then raise exception 'internal_address_not_allowed' using errcode = '22023'; end if;
  if v_net = 'xrp' and v_memo is not null and v_memo !~ '^[0-9]{1,10}$' then raise exception 'invalid_memo' using errcode = '22023'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount' using errcode = '22023'; end if;
  v_amt := round(p_amount, 8);
  if v_amt <= 0 then raise exception 'invalid_amount' using errcode = '22023'; end if;
  if (select count(*) from public.crypto_withdrawals where user_id = v_u and status in ('PENDING','PROCESSING')) >= 3 then raise exception 'too_many_open' using errcode = '54000'; end if;
  v_fee := round(public._crypto_withdraw_fee(v_asset, v_net), 8); v_total := v_amt + v_fee;
  v_ref := public.new_tx_reference();
  insert into public.transactions (reference, kind, sender_id, sender_yor_id, asset, network, amount, fee, total, status, meta)
    values (v_ref, 'CRYPTO_SEND', v_u, v_yor, v_asset, v_net, v_amt, v_fee, v_total, 'PENDING',
            jsonb_strip_nulls(jsonb_build_object('flow', 'CRYPTO_WITHDRAWAL', 'payout', 'MANUAL', 'address', v_addr, 'memo', v_memo, 'networkFee', v_fee)))
    returning id into v_tx;
  perform public._debit_wallets(v_u, v_asset, v_total, v_tx);             -- any network of the asset; raises insufficient_balance
  insert into public.crypto_withdrawals (user_id, transaction_id, reference, asset, network, address, memo, amount, fee, idem)
    values (v_u, v_tx, v_ref, v_asset, v_net, v_addr, v_memo, v_amt, v_fee, p_idempotency_key) returning id into v_id;
  update public.transactions set meta = meta || jsonb_build_object('withdrawal', v_id) where id = v_tx;
  insert into public.tx_events (transaction_id, user_id, status, label) values (v_tx, v_u, 'PENDING', 'SUBMITTED');
  insert into public.notifications (user_id, type, title, message, transaction_id, data) values
    (v_u, 'CRYPTO_WITHDRAWAL', 'Withdrawal requested', v_amt::text || ' ' || v_asset || ' · ' || v_ref, v_tx,
     jsonb_build_object('status', 'PENDING', 'asset', v_asset, 'network', v_net, 'amount', v_amt, 'reference', v_ref));
  perform public._notify_admins('CRYPTO_WITHDRAWAL_REQUEST', 'Crypto withdrawal request', v_name || ' requests ' || v_amt::text || ' ' || v_asset || ' (' || v_ref || ')',
    jsonb_build_object('withdrawal', v_id, 'reference', v_ref, 'asset', v_asset, 'network', v_net, 'amount', v_amt));
  insert into public.audit_log (actor_id, action, target_id, details) values (v_u, 'CRYPTO_WITHDRAWAL_REQUESTED', v_u, jsonb_build_object('id', v_id, 'reference', v_ref, 'asset', v_asset, 'network', v_net, 'amount', v_amt));
  return jsonb_build_object('ok', true, 'id', v_id, 'reference', v_ref, 'status', 'PENDING', 'transaction_id', v_tx, 'amount', v_amt, 'fee', v_fee, 'total', v_total, 'asset', v_asset, 'network', v_net);
end $$;

-- refund helper (reject / cancel): the full amount + fee goes back to the wallet of the withdrawal network
create or replace function public._crypto_withdraw_release(p_id uuid, p_status text, p_actor uuid, p_note text) returns void
  language plpgsql security definer set search_path to ''
as $$
declare w public.crypto_withdrawals;
begin
  select * into w from public.crypto_withdrawals where id = p_id for update;
  perform public._credit_wallet(w.user_id, w.asset, w.network, w.amount + w.fee, w.transaction_id);
  update public.crypto_withdrawals set status = p_status, decided_by = p_actor, decided_at = now(), admin_note = left(p_note, 300) where id = w.id;
  perform public.tx_set_status(w.transaction_id, case when p_status = 'CANCELLED' then 'CANCELLED' else 'REJECTED' end, p_status);
  perform public.tx_set_status(w.transaction_id, 'REFUNDED', 'FUNDS_RETURNED');
end $$;

create or replace function public.crypto_withdraw_cancel(p_id uuid) returns jsonb
  language plpgsql security definer set search_path to ''
as $$
declare v_u uuid := (select auth.uid()); w public.crypto_withdrawals;
begin
  if v_u is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  select * into w from public.crypto_withdrawals where id = p_id and user_id = v_u for update;
  if w.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if w.status <> 'PENDING' then raise exception 'invalid_state' using errcode = '22023'; end if;
  perform public._crypto_withdraw_release(w.id, 'CANCELLED', v_u, 'cancelled by the customer');
  insert into public.audit_log (actor_id, action, target_id, details) values (v_u, 'CRYPTO_WITHDRAWAL_CANCELLED', v_u, jsonb_build_object('id', w.id, 'reference', w.reference));
  return jsonb_build_object('ok', true, 'status', 'CANCELLED');
end $$;

create or replace function public.crypto_withdraw_overview() returns jsonb
  language plpgsql stable security definer set search_path to ''
as $$
declare v_u uuid := (select auth.uid());
begin
  if v_u is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  return jsonb_build_object(
    'enabled', public._setting_bool('withdraw_enabled', true),
    'kyc_required', public._setting_bool('require_kyc_for_withdraw', true) and not public._kyc_ok(v_u),
    'networks', coalesce((select jsonb_agg(jsonb_build_object('asset', a.asset, 'network', a.network, 'fee', public._crypto_withdraw_fee(a.asset, a.network)) order by a.asset, a.network) from public.asset_networks a), '[]'::jsonb),
    'balances', coalesce((select jsonb_object_agg(asset, avail) from (select asset, sum(available_balance) avail from public.crypto_wallets where user_id = v_u group by asset) s), '{}'::jsonb),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'reference', w.reference, 'asset', w.asset, 'network', w.network, 'address', w.address, 'memo', w.memo,
        'amount', w.amount, 'fee', w.fee, 'status', w.status, 'tx_hash', w.tx_hash, 'admin_note', w.admin_note, 'transaction_id', w.transaction_id,
        'created_at', w.created_at, 'processing_at', w.processing_at, 'completed_at', w.completed_at, 'decided_at', w.decided_at) order by w.created_at desc)
      from public.crypto_withdrawals w where w.user_id = v_u), '[]'::jsonb));
end $$;

-- administrators
create or replace function public.admin_crypto_withdrawal_list(p_status text default null, p_limit integer default 200) returns jsonb
  language plpgsql stable security definer set search_path to ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(x order by x->>'created_at' desc) from (
    select jsonb_build_object('id', w.id, 'reference', w.reference, 'asset', w.asset, 'network', w.network, 'address', w.address, 'memo', w.memo, 'amount', w.amount, 'fee', w.fee,
      'status', w.status, 'tx_hash', w.tx_hash, 'admin_note', w.admin_note, 'created_at', w.created_at, 'processing_at', w.processing_at, 'completed_at', w.completed_at,
      'user_id', w.user_id, 'yor_id', p.yor_id, 'full_name', nullif(btrim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''), 'phone', p.phone) as x
    from public.crypto_withdrawals w join public.profiles p on p.id = w.user_id
    where p_status is null or w.status = upper(p_status)
    order by w.created_at desc limit greatest(1, least(coalesce(p_limit, 200), 500))) s), '[]'::jsonb);
end $$;

create or replace function public.admin_crypto_withdrawal_process(p_id uuid) returns jsonb
  language plpgsql security definer set search_path to ''
as $$
declare v_admin uuid := (select auth.uid()); w public.crypto_withdrawals;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into w from public.crypto_withdrawals where id = p_id for update;
  if w.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if w.status <> 'PENDING' then raise exception 'invalid_state' using errcode = '22023'; end if;
  update public.crypto_withdrawals set status = 'PROCESSING', processing_at = now(), decided_by = v_admin where id = w.id;
  perform public.tx_set_status(w.transaction_id, 'PROCESSING', 'APPROVED');
  insert into public.notifications (user_id, type, title, message, transaction_id, data) values (w.user_id, 'CRYPTO_WITHDRAWAL', 'Withdrawal in progress', w.amount::text || ' ' || w.asset || ' · ' || w.reference, w.transaction_id,
    jsonb_build_object('status', 'PROCESSING', 'reference', w.reference, 'asset', w.asset, 'amount', w.amount));
  insert into public.audit_log (actor_id, action, target_id, details) values (v_admin, 'CRYPTO_WITHDRAWAL_PROCESSING', w.user_id, jsonb_build_object('id', w.id, 'reference', w.reference));
  return jsonb_build_object('ok', true, 'status', 'PROCESSING');
end $$;

create or replace function public.admin_crypto_withdrawal_complete(p_id uuid, p_tx_hash text) returns jsonb
  language plpgsql security definer set search_path to ''
as $$
declare v_admin uuid := (select auth.uid()); w public.crypto_withdrawals; v_hash text := btrim(coalesce(p_tx_hash, ''));
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into w from public.crypto_withdrawals where id = p_id for update;
  if w.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if w.status not in ('PENDING','PROCESSING') then raise exception 'invalid_state' using errcode = '22023'; end if;
  if not public._crypto_hash_ok(w.network, v_hash) then raise exception 'invalid_tx_hash' using errcode = '22023'; end if;
  if exists (select 1 from public.crypto_withdrawals where lower(tx_hash) = lower(v_hash) and id <> w.id) then raise exception 'tx_hash_already_used' using errcode = '22023'; end if;
  update public.crypto_withdrawals set status = 'COMPLETED', tx_hash = v_hash, completed_at = now(), decided_by = v_admin, decided_at = now() where id = w.id;
  update public.transactions set meta = meta || jsonb_build_object('tx_hash', v_hash) where id = w.transaction_id;
  perform public.tx_set_status(w.transaction_id, 'COMPLETED', 'SENT_ON_CHAIN');
  insert into public.notifications (user_id, type, title, message, transaction_id, data) values (w.user_id, 'CRYPTO_WITHDRAWAL', 'Withdrawal sent', w.amount::text || ' ' || w.asset || ' · ' || w.reference, w.transaction_id,
    jsonb_build_object('status', 'COMPLETED', 'reference', w.reference, 'asset', w.asset, 'network', w.network, 'amount', w.amount, 'tx_hash', v_hash));
  insert into public.audit_log (actor_id, action, target_id, details) values (v_admin, 'CRYPTO_WITHDRAWAL_COMPLETED', w.user_id, jsonb_build_object('id', w.id, 'reference', w.reference, 'tx_hash', v_hash));
  return jsonb_build_object('ok', true, 'status', 'COMPLETED', 'tx_hash', v_hash);
end $$;

create or replace function public.admin_crypto_withdrawal_reject(p_id uuid, p_reason text) returns jsonb
  language plpgsql security definer set search_path to ''
as $$
declare v_admin uuid := (select auth.uid()); w public.crypto_withdrawals;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required' using errcode = '22023'; end if;
  select * into w from public.crypto_withdrawals where id = p_id for update;
  if w.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if w.status not in ('PENDING','PROCESSING') then raise exception 'invalid_state' using errcode = '22023'; end if;
  perform public._crypto_withdraw_release(w.id, 'REJECTED', v_admin, p_reason);
  insert into public.notifications (user_id, type, title, message, transaction_id, data) values (w.user_id, 'CRYPTO_WITHDRAWAL', 'Withdrawal declined', left(p_reason, 200), w.transaction_id,
    jsonb_build_object('status', 'REJECTED', 'reference', w.reference, 'asset', w.asset, 'amount', w.amount, 'reason', left(p_reason, 300)));
  insert into public.audit_log (actor_id, action, target_id, details) values (v_admin, 'CRYPTO_WITHDRAWAL_REJECTED', w.user_id, jsonb_build_object('id', w.id, 'reference', w.reference, 'reason', left(p_reason, 300)));
  return jsonb_build_object('ok', true, 'status', 'REJECTED');
end $$;

revoke all on function public._crypto_address_ok(text, text), public._crypto_hash_ok(text, text), public._crypto_withdraw_fee(text, text), public._crypto_withdraw_release(uuid, text, uuid, text) from public, anon, authenticated;
revoke all on function public.crypto_withdraw_request(text, text, text, text, numeric, text, uuid), public.crypto_withdraw_cancel(uuid), public.crypto_withdraw_overview(),
  public.admin_crypto_withdrawal_list(text, integer), public.admin_crypto_withdrawal_process(uuid), public.admin_crypto_withdrawal_complete(uuid, text), public.admin_crypto_withdrawal_reject(uuid, text) from public, anon;
grant execute on function public.crypto_withdraw_request(text, text, text, text, numeric, text, uuid), public.crypto_withdraw_cancel(uuid), public.crypto_withdraw_overview(),
  public.admin_crypto_withdrawal_list(text, integer), public.admin_crypto_withdrawal_process(uuid), public.admin_crypto_withdrawal_complete(uuid, text), public.admin_crypto_withdrawal_reject(uuid, text) to authenticated;
