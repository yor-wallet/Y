-- ============================================================
-- OM Wallet 14.1.0 — CONFIRMATION DES TRANSACTIONS PAR L'ADMINISTRATEUR (remplace les anciens processus de validation)
--
-- 1. Un transfert interne (FIAT_TRANSFER, CRYPTO_TRANSFER) est ENREGISTRÉ en PENDING : le montant de l'expéditeur est mis en réserve
--    (available -> reserved / locked), le destinataire n'est PAS crédité, aucun e-mail n'est créé.
-- 2. L'administrateur clique « Confirmer la transaction » (admin_tx_confirm) : UNE action, sans autre autorisation ni second administrateur.
--    Dans la même transaction de base de données : débit réel de l'expéditeur, crédit du destinataire, écritures du grand livre,
--    statut CONFIRMED, heure exacte (confirmed_at = clock_timestamp()), administrateur, journal d'audit, notifications, et UN e-mail
--    FUNDS_RECEIVED au destinataire. L'e-mail ne peut pas exister sans le crédit (même transaction) ; sa clé d'idempotence
--    « FUNDS_RECEIVED:<tx> » rend un second e-mail impossible ; une seconde confirmation ne crédite rien (verrou + statut).
-- 3. Les anciens e-mails automatiques TX_SENDER / TX_RECEIVER ne sont plus créés (un seul e-mail par transaction).
-- 4. Blockchain externe (retraits crypto) : l'approbation (admin_crypto_withdrawal_process) déclenche l'exécution ; le statut final
--    et l'e-mail CRYPTO_WITHDRAWAL_CONFIRMED attendent la confirmation du réseau (hash réel, admin_crypto_withdrawal_complete).
--
-- Aucune donnée n'est supprimée. Ajouts : deux colonnes nullables (transactions.confirmed_at, confirmed_by), une table de sauvegarde.
-- Les définitions remplacées sont sauvegardées mot pour mot dans public.function_backups : le retour arrière les ré-exécute
-- (voir 20261122_admin_tx_confirmation_rollback.sql).
-- ============================================================

-- 0) sauvegarde exacte des fonctions remplacées (une seule fois)
create table if not exists public.function_backups (
  id bigserial primary key, tag text not null, name text not null, definition text not null, saved_at timestamptz not null default now());
alter table public.function_backups enable row level security;
revoke all on public.function_backups from anon, authenticated;
insert into public.function_backups (tag, name, definition)
select '20261122_admin_tx_confirmation', p.oid::regprocedure::text, pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('_transfer_fiat_impl', '_transfer_crypto_impl', 'trg_tx_email', 'admin_crypto_withdrawal_complete')
  and not exists (select 1 from public.function_backups b where b.tag = '20261122_admin_tx_confirmation');

-- 1) heure exacte et auteur de la confirmation
alter table public.transactions add column if not exists confirmed_at timestamptz;
alter table public.transactions add column if not exists confirmed_by uuid;

-- 2) transfert interne en monnaie : enregistré, montant réservé, en attente de l'administrateur
create or replace function public._transfer_fiat_impl(p_to_yor_id text, p_amount numeric, p_currency text default 'OMR', p_note text default null, p_idempotency_key text default null)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare
  v_sender uuid := (select auth.uid());
  v_cur text := upper(coalesce(p_currency, 'OMR'));
  v_to text := upper(btrim(coalesce(p_to_yor_id, '')));
  v_amt numeric(38,10);
  v_recv uuid; v_recv_name text; v_recv_yor text; v_send_name text; v_send_yor text;
  v_sbal numeric; v_rows int; v_tx uuid; v_ref text; v_cached jsonb; v_result jsonb;
begin
  if v_sender is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount' using errcode = '22023'; end if;
  v_amt := round(p_amount, 6);
  if v_amt <= 0 then raise exception 'invalid_amount' using errcode = '22023'; end if;
  if v_cur not in ('OMR','XOF','USD','AED','SAR') then raise exception 'unsupported_currency' using errcode = '22023'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 then raise exception 'idempotency_key_required' using errcode = '22023'; end if;
  insert into public.idempotency_keys (user_id, key) values (v_sender, p_idempotency_key) on conflict do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then select result into v_cached from public.idempotency_keys where user_id = v_sender and key = p_idempotency_key; return v_cached; end if;

  select p.yor_id, coalesce(nullif(btrim(p.first_name || ' ' || p.last_name), ''), p.yor_id) into v_send_yor, v_send_name
    from public.profiles p where p.id = v_sender and p.status = 'ACTIVE';
  if v_send_yor is null then raise exception 'sender_inactive' using errcode = '42501'; end if;
  select p.id, p.yor_id, coalesce(nullif(btrim(p.first_name || ' ' || p.last_name), ''), p.yor_id) into v_recv, v_recv_yor, v_recv_name
    from public.profiles p where p.yor_id = v_to and p.status = 'ACTIVE';
  if v_recv is null then raise exception 'recipient_not_found' using errcode = 'P0002'; end if;
  if v_recv = v_sender then raise exception 'self_transfer' using errcode = '22023'; end if;

  perform 1 from public.accounts where user_id = v_sender and currency = v_cur for update;
  select available_balance into v_sbal from public.accounts where user_id = v_sender and currency = v_cur;
  if not found then raise exception 'sender_account_missing' using errcode = 'P0002'; end if;
  if v_sbal < v_amt then raise exception 'insufficient_balance' using errcode = '23514'; end if;
  -- réserve : le montant n'est plus disponible, il ne quitte le compte qu'à la confirmation
  update public.accounts set available_balance = available_balance - v_amt, reserved_balance = reserved_balance + v_amt, updated_at = now()
    where user_id = v_sender and currency = v_cur;

  v_ref := public.new_tx_reference();
  insert into public.transactions (reference, kind, sender_id, receiver_id, sender_yor_id, receiver_yor_id, asset, amount, fee, total, note, status, meta)
    values (v_ref, 'FIAT_TRANSFER', v_sender, v_recv, v_send_yor, v_recv_yor, v_cur, v_amt, 0, v_amt, left(p_note, 140), 'PENDING', jsonb_build_object('confirm', 'ADMIN'))
    returning id into v_tx;
  insert into public.tx_events (transaction_id, user_id, status, label) values (v_tx, v_sender, 'PENDING', 'AWAITING_ADMIN');
  insert into public.notifications (user_id, type, title, message, transaction_id, data) values
    (v_sender, 'TRANSFER_PENDING', 'Transfer pending', trim(trailing '.' from trim(trailing '0' from v_amt::text)) || ' ' || v_cur || ' to ' || v_recv_name || ' · awaiting confirmation',
     v_tx, jsonb_build_object('amount', v_amt, 'currency', v_cur, 'to', v_recv_name, 'toYorId', v_recv_yor, 'reference', v_ref, 'status', 'PENDING'));
  perform public._notify_admins('TX_CONFIRM_REQUIRED', 'Transaction to confirm', v_send_name || ' → ' || v_recv_name || ' · ' || v_amt::text || ' ' || v_cur || ' (' || v_ref || ')',
    jsonb_build_object('transaction', v_tx, 'reference', v_ref, 'amount', v_amt, 'currency', v_cur));

  v_result := jsonb_build_object('ok', true, 'transaction_id', v_tx, 'reference', v_ref, 'status', 'PENDING', 'amount', v_amt, 'currency', v_cur,
    'receiver', jsonb_build_object('yor_id', v_recv_yor, 'name', v_recv_name));
  update public.idempotency_keys set result = v_result where user_id = v_sender and key = p_idempotency_key;
  return v_result;
end $$;

-- 3) transfert interne en crypto : même règle (réserve dans locked_balance)
create or replace function public._transfer_crypto_impl(p_to_yor_id text, p_asset text, p_network text, p_amount numeric, p_note text default null, p_idempotency_key text default null)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare
  v_sender uuid := (select auth.uid());
  v_asset text := upper(btrim(coalesce(p_asset, ''))); v_net text := lower(btrim(coalesce(p_network, ''))); v_to text := upper(btrim(coalesce(p_to_yor_id, '')));
  v_amt numeric(38,10); v_recv uuid; v_recv_name text; v_recv_yor text; v_send_name text; v_send_yor text;
  v_sbal numeric; v_rows int; v_tx uuid; v_ref text; v_cached jsonb; v_result jsonb;
begin
  if v_sender is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount' using errcode = '22023'; end if;
  v_amt := round(p_amount, 8);
  if v_amt <= 0 then raise exception 'invalid_amount' using errcode = '22023'; end if;
  if not exists (select 1 from public.asset_networks where asset = v_asset and network = v_net) then raise exception 'unsupported_asset_network' using errcode = '22023'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 then raise exception 'idempotency_key_required' using errcode = '22023'; end if;
  insert into public.idempotency_keys (user_id, key) values (v_sender, p_idempotency_key) on conflict do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then select result into v_cached from public.idempotency_keys where user_id = v_sender and key = p_idempotency_key; return v_cached; end if;

  select p.yor_id, coalesce(nullif(btrim(p.first_name || ' ' || p.last_name), ''), p.yor_id) into v_send_yor, v_send_name
    from public.profiles p where p.id = v_sender and p.status = 'ACTIVE';
  if v_send_yor is null then raise exception 'sender_inactive' using errcode = '42501'; end if;
  select p.id, p.yor_id, coalesce(nullif(btrim(p.first_name || ' ' || p.last_name), ''), p.yor_id) into v_recv, v_recv_yor, v_recv_name
    from public.profiles p where p.yor_id = v_to and p.status = 'ACTIVE';
  if v_recv is null then raise exception 'recipient_not_found' using errcode = 'P0002'; end if;
  if v_recv = v_sender then raise exception 'self_transfer' using errcode = '22023'; end if;

  perform 1 from public.crypto_wallets where user_id = v_sender and asset = v_asset and network = v_net for update;
  select available_balance into v_sbal from public.crypto_wallets where user_id = v_sender and asset = v_asset and network = v_net;
  if not found then raise exception 'sender_wallet_missing' using errcode = 'P0002'; end if;
  if v_sbal < v_amt then raise exception 'insufficient_balance' using errcode = '23514'; end if;
  update public.crypto_wallets set available_balance = available_balance - v_amt, locked_balance = locked_balance + v_amt
    where user_id = v_sender and asset = v_asset and network = v_net;

  v_ref := public.new_tx_reference();
  insert into public.transactions (reference, kind, sender_id, receiver_id, sender_yor_id, receiver_yor_id, asset, network, amount, fee, total, note, status, meta)
    values (v_ref, 'CRYPTO_TRANSFER', v_sender, v_recv, v_send_yor, v_recv_yor, v_asset, v_net, v_amt, 0, v_amt, left(p_note, 140), 'PENDING', jsonb_build_object('confirm', 'ADMIN'))
    returning id into v_tx;
  insert into public.tx_events (transaction_id, user_id, status, label) values (v_tx, v_sender, 'PENDING', 'AWAITING_ADMIN');
  insert into public.notifications (user_id, type, title, message, transaction_id, data) values
    (v_sender, 'TRANSFER_PENDING', 'Transfer pending', trim(trailing '.' from trim(trailing '0' from v_amt::text)) || ' ' || v_asset || ' to ' || v_recv_name || ' · awaiting confirmation',
     v_tx, jsonb_build_object('amount', v_amt, 'asset', v_asset, 'network', v_net, 'to', v_recv_name, 'reference', v_ref, 'status', 'PENDING'));
  perform public._notify_admins('TX_CONFIRM_REQUIRED', 'Transaction to confirm', v_send_name || ' → ' || v_recv_name || ' · ' || v_amt::text || ' ' || v_asset || ' (' || v_ref || ')',
    jsonb_build_object('transaction', v_tx, 'reference', v_ref, 'amount', v_amt, 'asset', v_asset, 'network', v_net));

  v_result := jsonb_build_object('ok', true, 'transaction_id', v_tx, 'reference', v_ref, 'status', 'PENDING', 'amount', v_amt, 'asset', v_asset, 'network', v_net,
    'receiver', jsonb_build_object('yor_id', v_recv_yor, 'name', v_recv_name));
  update public.idempotency_keys set result = v_result where user_id = v_sender and key = p_idempotency_key;
  return v_result;
end $$;

-- 4) LE bouton : confirmer = créditer + enregistrer l'heure + un seul e-mail
create or replace function public.admin_tx_confirm(p_tx uuid) returns jsonb
language plpgsql security definer set search_path to ''
as $$
declare
  v_admin uuid := (select auth.uid()); t public.transactions; v_sbal numeric; v_rbal numeric; v_at timestamptz;
  v_mail text; v_sname text; v_rname text; v_amt text;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into t from public.transactions where id = p_tx for update;               -- deux clics simultanés : le second attend puis voit CONFIRMED
  if t.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if coalesce(t.meta ->> 'confirm', '') <> 'ADMIN' then raise exception 'not_confirmable' using errcode = '22023'; end if;
  if t.status = 'CONFIRMED' then
    return jsonb_build_object('ok', true, 'already', true, 'id', t.id, 'reference', t.reference, 'amount', t.amount, 'asset', t.asset, 'confirmed_at', t.confirmed_at);
  end if;
  if t.status <> 'PENDING' then raise exception 'invalid_state' using errcode = '22023'; end if;
  if t.sender_id is null or t.receiver_id is null then raise exception 'not_confirmable' using errcode = '22023'; end if;

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

  v_at := clock_timestamp();                                                          -- l'heure exacte de la confirmation
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

  -- UN e-mail au destinataire, créé dans la même transaction que le crédit (il n'existe pas sans lui) ; la clé interdit un doublon
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
end $$;

-- 5) refus (la réserve revient à l'expéditeur ; aucun e-mail)
create or replace function public.admin_tx_reject(p_tx uuid, p_reason text) returns jsonb
language plpgsql security definer set search_path to ''
as $$
declare v_admin uuid := (select auth.uid()); t public.transactions; v_ok int;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'reason_required' using errcode = '22023'; end if;
  select * into t from public.transactions where id = p_tx for update;
  if t.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if coalesce(t.meta ->> 'confirm', '') <> 'ADMIN' then raise exception 'not_confirmable' using errcode = '22023'; end if;
  if t.status <> 'PENDING' then raise exception 'invalid_state' using errcode = '22023'; end if;
  if t.kind = 'FIAT_TRANSFER' then
    update public.accounts set available_balance = available_balance + t.amount, reserved_balance = reserved_balance - t.amount, updated_at = now()
      where user_id = t.sender_id and currency = t.asset and reserved_balance >= t.amount;
  else
    update public.crypto_wallets set available_balance = available_balance + t.amount, locked_balance = locked_balance - t.amount
      where user_id = t.sender_id and asset = t.asset and network = t.network and locked_balance >= t.amount;
  end if;
  get diagnostics v_ok = row_count;
  if v_ok = 0 then raise exception 'hold_missing' using errcode = '23514'; end if;
  update public.transactions set status = 'REJECTED', meta = meta || jsonb_build_object('rejectReason', left(btrim(p_reason), 300), 'rejectedAt', clock_timestamp()) where id = t.id;
  insert into public.tx_events (transaction_id, user_id, status, label) values (t.id, t.sender_id, 'REJECTED', 'ADMIN_REJECTED');
  insert into public.notifications (user_id, type, title, message, transaction_id, data) values (t.sender_id, 'TRANSFER_REJECTED', 'Transfer refused',
    trim(trailing '.' from trim(trailing '0' from t.amount::text)) || ' ' || t.asset || ' returned to your balance', t.id,
    jsonb_build_object('amount', t.amount, 'currency', t.asset, 'reference', t.reference, 'reason', left(btrim(p_reason), 300)));
  insert into public.audit_log (actor_id, action, target_id, details) values (v_admin, 'TX_REJECTED', t.sender_id,
    jsonb_build_object('transaction', t.id, 'reference', t.reference, 'amount', t.amount, 'asset', t.asset, 'reason', left(btrim(p_reason), 300)));
  return jsonb_build_object('ok', true, 'status', 'REJECTED');
end $$;

-- 6) la liste du centre de contrôle (en attente / confirmées / refusées), avec l'état réel de l'e-mail
create or replace function public.admin_tx_list(p_status text default 'PENDING', p_limit integer default 100) returns jsonb
language plpgsql stable security definer set search_path to ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'created_at') desc) from (
    select jsonb_build_object('id', t.id, 'reference', t.reference, 'kind', t.kind, 'asset', t.asset, 'network', t.network, 'amount', t.amount,
      'status', t.status, 'created_at', t.created_at, 'confirmed_at', t.confirmed_at, 'note', t.note,
      'sender', jsonb_build_object('name', nullif(btrim(coalesce(s.first_name,'') || ' ' || coalesce(s.last_name,'')), ''), 'yor_id', s.yor_id, 'phone', s.phone),
      'receiver', jsonb_build_object('name', nullif(btrim(coalesce(r.first_name,'') || ' ' || coalesce(r.last_name,'')), ''), 'yor_id', r.yor_id, 'phone', r.phone, 'has_email', coalesce(r.email, '') <> ''),
      'email', (select jsonb_build_object('status', e.status, 'sent_at', e.sent_at) from public.email_logs e where e.idempotency_key = 'FUNDS_RECEIVED:' || t.id)) as x
    from public.transactions t left join public.profiles s on s.id = t.sender_id left join public.profiles r on r.id = t.receiver_id
    where t.meta ->> 'confirm' = 'ADMIN' and (p_status is null or t.status = upper(p_status))
    order by t.created_at desc limit greatest(1, least(coalesce(p_limit, 100), 500))) q), '[]'::jsonb);
end $$;

-- 7) un seul e-mail par transaction : les anciens e-mails expéditeur / destinataire ne sont plus créés ;
--    les avis SMS existants restent, sauf pour une transaction confirmée par l'administrateur (son avis est l'e-mail FUNDS_RECEIVED)
create or replace function public.trg_tx_email() returns trigger
language plpgsql security definer set search_path to ''
as $$
begin
  if coalesce(new.meta ->> 'confirm', '') = 'ADMIN' then return new; end if;
  if new.status in ('CONFIRMED','SUCCESS','COMPLETED') and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    begin
      perform public.enqueue_recipient_notices(new.id);
    exception when others then null;
    end;
  end if;
  return new;
end $$;

-- 8) blockchain externe : l'e-mail attend la confirmation du réseau (hash réel), un seul
create or replace function public.admin_crypto_withdrawal_complete(p_id uuid, p_tx_hash text) returns jsonb
  language plpgsql security definer set search_path to ''
as $$
declare v_admin uuid := (select auth.uid()); w public.crypto_withdrawals; v_hash text := btrim(coalesce(p_tx_hash, '')); v_mail text; v_at timestamptz;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into w from public.crypto_withdrawals where id = p_id for update;
  if w.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if w.status not in ('PENDING','PROCESSING') then raise exception 'invalid_state' using errcode = '22023'; end if;
  if not public._crypto_hash_ok(w.network, v_hash) then raise exception 'invalid_tx_hash' using errcode = '22023'; end if;
  if exists (select 1 from public.crypto_withdrawals where lower(tx_hash) = lower(v_hash) and id <> w.id) then raise exception 'tx_hash_already_used' using errcode = '22023'; end if;
  v_at := clock_timestamp();
  update public.crypto_withdrawals set status = 'COMPLETED', tx_hash = v_hash, completed_at = v_at, decided_by = v_admin, decided_at = v_at where id = w.id;
  update public.transactions set meta = meta || jsonb_build_object('tx_hash', v_hash), confirmed_at = v_at, confirmed_by = v_admin where id = w.transaction_id;
  perform public.tx_set_status(w.transaction_id, 'COMPLETED', 'SENT_ON_CHAIN');
  insert into public.notifications (user_id, type, title, message, transaction_id, data) values (w.user_id, 'CRYPTO_WITHDRAWAL', 'Withdrawal sent', w.amount::text || ' ' || w.asset || ' · ' || w.reference, w.transaction_id,
    jsonb_build_object('status', 'COMPLETED', 'reference', w.reference, 'asset', w.asset, 'network', w.network, 'amount', w.amount, 'tx_hash', v_hash));
  select email into v_mail from public.profiles where id = w.user_id;
  if coalesce(v_mail, '') <> '' then
    insert into public.email_logs (user_id, transaction_id, email_type, recipient_email, idempotency_key, payload)
      values (w.user_id, w.transaction_id, 'CRYPTO_WITHDRAWAL_CONFIRMED', v_mail, 'CRYPTO_WITHDRAWAL_CONFIRMED:' || w.id,
              jsonb_build_object('reference', w.reference, 'amount', w.amount, 'asset', w.asset, 'network', w.network, 'address', w.address, 'tx_hash', v_hash, 'confirmed_at', v_at))
      on conflict (idempotency_key) do nothing;
  end if;
  insert into public.audit_log (actor_id, action, target_id, details) values (v_admin, 'CRYPTO_WITHDRAWAL_COMPLETED', w.user_id, jsonb_build_object('id', w.id, 'reference', w.reference, 'tx_hash', v_hash, 'confirmed_at', v_at));
  return jsonb_build_object('ok', true, 'status', 'COMPLETED', 'tx_hash', v_hash, 'confirmed_at', v_at);
end $$;

revoke all on function public.admin_tx_confirm(uuid), public.admin_tx_reject(uuid, text), public.admin_tx_list(text, integer) from public, anon;
grant execute on function public.admin_tx_confirm(uuid), public.admin_tx_reject(uuid, text), public.admin_tx_list(text, integer) to authenticated;
revoke all on function public._transfer_fiat_impl(text, numeric, text, text, text), public._transfer_crypto_impl(text, text, text, numeric, text, text) from public, anon, authenticated;
