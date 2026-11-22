-- ============================================================
-- OM Wallet 14.3 — e-mail de l'administrateur avec trois boutons (Confirmer / Refuser / Mettre en pause) + e-mail de confirmation détaillé
--
-- 1. Dès qu'un envoi interne est enregistré (FIAT_TRANSFER / CRYPTO_TRANSFER en PENDING, meta.confirm = ADMIN), chaque administrateur actif reçoit
--    immédiatement un e-mail avec trois boutons. (La notification dans l'application existe déjà : _notify_admins('TX_CONFIRM_REQUIRED').)
-- 2. Chaque bouton est un lien signé : un jeton aléatoire de 256 bits, propre à l'administrateur, à la transaction et à l'action, stocké HACHÉ,
--    valable 72 h. Le lien ouvre une page de confirmation (admin-action.html) : l'action n'est exécutée que par le clic sur le bouton de cette page
--    (un lien qui agirait au simple chargement serait déclenché par les antivirus / aperçus de messagerie).
-- 3. Mettre en pause : la transaction reste PENDING (montant toujours réservé), marquée meta.paused ; elle peut ensuite être confirmée ou refusée.
-- 4. À la confirmation : notification dans l'application (déjà créée par admin_tx_confirm) + e-mail « Fonds reçus » au destinataire (déjà créé) +
--    NOUVEAU : e-mail « Transfert confirmé » avec les détails à l'expéditeur.
-- 5. Côté utilisateur : le texte « awaiting confirmation » des notifications d'envoi devient « in progress ».
--
-- Aucune donnée n'est supprimée ni modifiée. Les définitions remplacées sont sauvegardées dans function_backups (tag 20261123_admin_email_actions).
-- ============================================================

insert into public.function_backups (tag, name, definition)
select '20261123_admin_email_actions', p.oid::regprocedure::text, pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('_transfer_fiat_impl', '_transfer_crypto_impl', 'admin_tx_list')
  and not exists (select 1 from public.function_backups b where b.tag = '20261123_admin_email_actions');

-- 5) libellé neutre côté utilisateur dans les notifications d'envoi
do $$
declare r record; v text;
begin
  for r in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('_transfer_fiat_impl', '_transfer_crypto_impl') loop
    v := pg_get_functiondef(r.oid);
    if position(' · awaiting confirmation' in v) > 0 or position('''Transfer pending''' in v) > 0 then
      execute replace(replace(v, ' · awaiting confirmation', ' · in progress'), '''Transfer pending''', '''Transfer in progress''');
    end if;
  end loop;
end $$;

-- 2) liens d'action
create table if not exists public.admin_action_links (
  id         uuid primary key default gen_random_uuid(),
  tx_id      uuid not null references public.transactions(id),
  admin_id   uuid not null references public.profiles(id),
  action     text not null check (action in ('CONFIRM', 'REJECT', 'PAUSE')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
alter table public.admin_action_links enable row level security;
revoke all on public.admin_action_links from anon, authenticated;
create index if not exists admin_action_links_tx_idx on public.admin_action_links (tx_id);

-- 3) pause
create or replace function public.admin_tx_pause(p_tx uuid) returns jsonb
language plpgsql security definer set search_path to ''
as $$
declare v_admin uuid := (select auth.uid()); t public.transactions;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into t from public.transactions where id = p_tx for update;
  if t.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if coalesce(t.meta ->> 'confirm', '') <> 'ADMIN' then raise exception 'not_confirmable' using errcode = '22023'; end if;
  if t.status <> 'PENDING' then raise exception 'invalid_state' using errcode = '22023'; end if;
  if coalesce((t.meta ->> 'paused')::boolean, false) then return jsonb_build_object('ok', true, 'already', true, 'status', 'PENDING', 'paused', true); end if;
  update public.transactions set meta = meta || jsonb_build_object('paused', true, 'pausedAt', clock_timestamp(), 'pausedBy', v_admin) where id = t.id;
  insert into public.tx_events (transaction_id, user_id, status, label) values (t.id, t.sender_id, 'PENDING', 'ADMIN_PAUSED');
  insert into public.audit_log (actor_id, action, target_id, details) values (v_admin, 'TX_PAUSED', t.sender_id,
    jsonb_build_object('transaction', t.id, 'reference', t.reference, 'amount', t.amount, 'asset', t.asset));
  return jsonb_build_object('ok', true, 'status', 'PENDING', 'paused', true);
end $$;
revoke all on function public.admin_tx_pause(uuid) from public, anon;
grant execute on function public.admin_tx_pause(uuid) to authenticated;

-- la liste du centre de contrôle : indique les transactions en pause
create or replace function public.admin_tx_list(p_status text default 'PENDING', p_limit integer default 100) returns jsonb
language plpgsql stable security definer set search_path to ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'created_at') desc) from (
    select jsonb_build_object('id', t.id, 'reference', t.reference, 'kind', t.kind, 'asset', t.asset, 'network', t.network, 'amount', t.amount,
      'status', t.status, 'paused', coalesce((t.meta ->> 'paused')::boolean, false), 'created_at', t.created_at, 'confirmed_at', t.confirmed_at, 'note', t.note,
      'sender', jsonb_build_object('name', nullif(btrim(coalesce(s.first_name,'') || ' ' || coalesce(s.last_name,'')), ''), 'yor_id', s.yor_id, 'phone', s.phone),
      'receiver', jsonb_build_object('name', nullif(btrim(coalesce(r.first_name,'') || ' ' || coalesce(r.last_name,'')), ''), 'yor_id', r.yor_id, 'phone', r.phone, 'has_email', coalesce(r.email, '') <> ''),
      'email', (select jsonb_build_object('status', e.status, 'sent_at', e.sent_at) from public.email_logs e where e.idempotency_key = 'FUNDS_RECEIVED:' || t.id)) as x
    from public.transactions t left join public.profiles s on s.id = t.sender_id left join public.profiles r on r.id = t.receiver_id
    where t.meta ->> 'confirm' = 'ADMIN' and (p_status is null or t.status = upper(p_status))
    order by t.created_at desc limit greatest(1, least(coalesce(p_limit, 100), 500))) q), '[]'::jsonb);
end $$;

-- 1) e-mail à chaque administrateur dès l'enregistrement de l'envoi
create or replace function public.trg_admin_tx_action_email() returns trigger
language plpgsql security definer set search_path to ''
as $$
declare a record; t_c text; t_r text; t_p text; v_sname text; v_rname text;
begin
  select coalesce(nullif(btrim(first_name || ' ' || last_name), ''), yor_id) into v_sname from public.profiles where id = new.sender_id;
  select coalesce(nullif(btrim(first_name || ' ' || last_name), ''), yor_id) into v_rname from public.profiles where id = new.receiver_id;
  for a in select id, email from public.profiles where role = 'admin' and status = 'ACTIVE' and coalesce(email, '') <> '' loop
    t_c := encode(extensions.gen_random_bytes(32), 'hex'); t_r := encode(extensions.gen_random_bytes(32), 'hex'); t_p := encode(extensions.gen_random_bytes(32), 'hex');
    insert into public.admin_action_links (tx_id, admin_id, action, token_hash, expires_at) values
      (new.id, a.id, 'CONFIRM', encode(extensions.digest(t_c, 'sha256'), 'hex'), now() + interval '72 hours'),
      (new.id, a.id, 'REJECT',  encode(extensions.digest(t_r, 'sha256'), 'hex'), now() + interval '72 hours'),
      (new.id, a.id, 'PAUSE',   encode(extensions.digest(t_p, 'sha256'), 'hex'), now() + interval '72 hours');
    insert into public.email_logs (user_id, transaction_id, email_type, recipient_email, idempotency_key, payload)
      values (a.id, new.id, 'ADMIN_TX_ACTION', a.email, 'ADMIN_TX_ACTION:' || new.id || ':' || a.id,
        jsonb_build_object('reference', new.reference, 'kind', new.kind, 'amount', new.amount, 'asset', new.asset, 'network', new.network, 'note', new.note,
          'sender', v_sname, 'receiver', v_rname, 'created_at', new.created_at, 'tokens', jsonb_build_object('confirm', t_c, 'reject', t_r, 'pause', t_p)))
      on conflict (idempotency_key) do nothing;
  end loop;
  perform public.dispatch_email_worker(null);          -- immédiat (asynchrone, après validation de la transaction)
  return new;
exception when others then
  return new;                                           -- un problème d'e-mail ne bloque jamais une transaction financière
end $$;
revoke all on function public.trg_admin_tx_action_email() from public, anon, authenticated;
create trigger tx_admin_action_email after insert on public.transactions for each row
  when (new.status = 'PENDING' and coalesce(new.meta ->> 'confirm', '') = 'ADMIN') execute function public.trg_admin_tx_action_email();

-- 4) e-mail « Transfert confirmé » (détails) à l'expéditeur, une seule fois, quand l'administrateur confirme
create or replace function public.trg_tx_confirmed_sender_email() returns trigger
language plpgsql security definer set search_path to ''
as $$
declare v_mail text;
begin
  select email into v_mail from public.profiles where id = new.sender_id;
  if coalesce(v_mail, '') <> '' then
    insert into public.email_logs (user_id, transaction_id, email_type, recipient_email, idempotency_key, payload)
      values (new.sender_id, new.id, 'TRANSFER_CONFIRMED', v_mail, 'TRANSFER_CONFIRMED:' || new.id,
        jsonb_build_object('reference', new.reference, 'amount', new.amount, 'asset', new.asset, 'network', new.network, 'confirmed_at', new.confirmed_at))
      on conflict (idempotency_key) do nothing;
  end if;
  perform public.dispatch_email_worker(null);
  return new;
exception when others then
  return new;
end $$;
revoke all on function public.trg_tx_confirmed_sender_email() from public, anon, authenticated;
create trigger tx_confirmed_sender_email after update of status on public.transactions for each row
  when (new.status = 'CONFIRMED' and old.status is distinct from 'CONFIRMED' and coalesce(new.meta ->> 'confirm', '') = 'ADMIN') execute function public.trg_tx_confirmed_sender_email();

-- lecture d'un lien (page de confirmation) — rôle service seulement
create or replace function public.admin_link_info(p_token text) returns jsonb
language plpgsql stable security definer set search_path to ''
as $$
declare l public.admin_action_links; t public.transactions; v_s text; v_r text; v_a text;
begin
  select * into l from public.admin_action_links where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if l.id is null then return jsonb_build_object('error', 'invalid_link'); end if;
  if l.expires_at < now() then return jsonb_build_object('error', 'expired'); end if;
  select * into t from public.transactions where id = l.tx_id;
  select coalesce(nullif(btrim(first_name || ' ' || last_name), ''), yor_id) into v_s from public.profiles where id = t.sender_id;
  select coalesce(nullif(btrim(first_name || ' ' || last_name), ''), yor_id) into v_r from public.profiles where id = t.receiver_id;
  select coalesce(nullif(btrim(first_name || ' ' || last_name), ''), yor_id) into v_a from public.profiles where id = l.admin_id;
  return jsonb_build_object('action', l.action, 'admin', v_a, 'transaction', jsonb_build_object('reference', t.reference, 'kind', t.kind, 'asset', t.asset, 'network', t.network,
    'amount', t.amount, 'status', t.status, 'paused', coalesce((t.meta ->> 'paused')::boolean, false), 'sender', v_s, 'receiver', v_r, 'note', t.note, 'created_at', t.created_at, 'confirmed_at', t.confirmed_at));
end $$;
revoke all on function public.admin_link_info(text) from public, anon, authenticated;
grant execute on function public.admin_link_info(text) to service_role;

-- exécution d'une action depuis le lien — rôle service seulement. Réutilise exactement admin_tx_confirm / admin_tx_reject / admin_tx_pause
-- (mêmes contrôles, même idempotence) en agissant au nom de l'administrateur propriétaire du lien.
create or replace function public.admin_link_apply(p_token text, p_reason text default null) returns jsonb
language plpgsql security definer set search_path to ''
as $$
declare l public.admin_action_links; t public.transactions; res jsonb; v_target text;
begin
  select * into l from public.admin_action_links where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') for update;
  if l.id is null then return jsonb_build_object('ok', false, 'error', 'invalid_link'); end if;
  if l.expires_at < now() then return jsonb_build_object('ok', false, 'error', 'expired'); end if;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', l.admin_id, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', l.admin_id::text, true);
  if not public.is_admin() then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  v_target := case l.action when 'CONFIRM' then 'CONFIRMED' when 'REJECT' then 'REJECTED' else 'PENDING' end;
  begin
    if l.action = 'CONFIRM' then res := public.admin_tx_confirm(l.tx_id);
    elsif l.action = 'REJECT' then res := public.admin_tx_reject(l.tx_id, coalesce(nullif(btrim(p_reason), ''), 'Refused by the administrator'));
    else res := public.admin_tx_pause(l.tx_id);
    end if;
  exception when others then
    select * into t from public.transactions where id = l.tx_id;
    if sqlerrm = 'invalid_state' and t.status = v_target and l.action <> 'PAUSE' then
      return jsonb_build_object('ok', true, 'already', true, 'status', t.status);
    end if;
    return jsonb_build_object('ok', false, 'error', sqlerrm, 'status', t.status);
  end;
  update public.admin_action_links set used_at = coalesce(used_at, now()) where id = l.id;
  insert into public.audit_log (actor_id, action, target_id, details) values (l.admin_id, 'TX_ACTION_VIA_EMAIL', null, jsonb_build_object('transaction', l.tx_id, 'action', l.action));
  return coalesce(res, '{}'::jsonb) || jsonb_build_object('ok', true, 'action', l.action);
end $$;
revoke all on function public.admin_link_apply(text, text) from public, anon, authenticated;
grant execute on function public.admin_link_apply(text, text) to service_role;
