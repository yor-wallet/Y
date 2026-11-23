-- OM Wallet 14.3.1 — durcissement des liens de l'e-mail admin (revue de code) :
--  1. un lien est À USAGE UNIQUE : une fois utilisé, un second appel ne fait rien (il répond « already ») ; une décision finale (confirmer / refuser)
--     rend inutilisables tous les autres liens de la même transaction ;
--  2. aucun jeton utilisable n'est plus stocké en clair dans la file d'e-mails : le déclencheur n'enregistre que la demande d'e-mail, et les liens
--     (stockés hachés) sont créés par issue_admin_action_links() AU MOMENT de l'envoi, uniquement pour une transaction encore en attente ;
--     tout jeu de liens précédent du même administrateur pour cette transaction est désactivé ;
--  3. les déclencheurs « au mieux » n'avalent plus leurs erreurs en silence : avertissement + ligne dans audit_log.
-- Aucune donnée n'est supprimée ni modifiée.

create or replace function public.issue_admin_action_links(p_tx uuid, p_admin uuid) returns jsonb
language plpgsql security definer set search_path to ''
as $$
declare t public.transactions; t_c text; t_r text; t_p text;
begin
  select * into t from public.transactions where id = p_tx;
  if t.id is null or t.status <> 'PENDING' or coalesce(t.meta ->> 'confirm', '') <> 'ADMIN' then return null; end if;
  if not exists (select 1 from public.profiles where id = p_admin and role = 'admin' and status = 'ACTIVE') then return null; end if;
  update public.admin_action_links set used_at = now() where tx_id = p_tx and admin_id = p_admin and used_at is null;
  t_c := encode(extensions.gen_random_bytes(32), 'hex'); t_r := encode(extensions.gen_random_bytes(32), 'hex'); t_p := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.admin_action_links (tx_id, admin_id, action, token_hash, expires_at) values
    (p_tx, p_admin, 'CONFIRM', encode(extensions.digest(t_c, 'sha256'), 'hex'), now() + interval '72 hours'),
    (p_tx, p_admin, 'REJECT',  encode(extensions.digest(t_r, 'sha256'), 'hex'), now() + interval '72 hours'),
    (p_tx, p_admin, 'PAUSE',   encode(extensions.digest(t_p, 'sha256'), 'hex'), now() + interval '72 hours');
  return jsonb_build_object('confirm', t_c, 'reject', t_r, 'pause', t_p);
end $$;
revoke all on function public.issue_admin_action_links(uuid, uuid) from public, anon, authenticated;
grant execute on function public.issue_admin_action_links(uuid, uuid) to service_role;

create or replace function public.trg_admin_tx_action_email() returns trigger
language plpgsql security definer set search_path to ''
as $$
declare a record; v_sname text; v_rname text;
begin
  select coalesce(nullif(btrim(first_name || ' ' || last_name), ''), yor_id) into v_sname from public.profiles where id = new.sender_id;
  select coalesce(nullif(btrim(first_name || ' ' || last_name), ''), yor_id) into v_rname from public.profiles where id = new.receiver_id;
  for a in select id, email from public.profiles where role = 'admin' and status = 'ACTIVE' and coalesce(email, '') <> '' loop
    insert into public.email_logs (user_id, transaction_id, email_type, recipient_email, idempotency_key, payload)
      values (a.id, new.id, 'ADMIN_TX_ACTION', a.email, 'ADMIN_TX_ACTION:' || new.id || ':' || a.id,
        jsonb_build_object('reference', new.reference, 'kind', new.kind, 'amount', new.amount, 'asset', new.asset, 'network', new.network, 'note', new.note,
          'sender', v_sname, 'receiver', v_rname, 'created_at', new.created_at))
      on conflict (idempotency_key) do nothing;
  end loop;
  perform public.dispatch_email_worker(null);
  return new;
exception when others then
  raise warning 'trg_admin_tx_action_email: %', sqlerrm;
  begin insert into public.audit_log (actor_id, action, target_id, details) values (null, 'TRIGGER_FAILED', null, jsonb_build_object('trigger', 'trg_admin_tx_action_email', 'transaction', new.id, 'error', sqlerrm)); exception when others then null; end;
  return new;                                           -- un problème d'e-mail ne bloque jamais une transaction financière
end $$;

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
  raise warning 'trg_tx_confirmed_sender_email: %', sqlerrm;
  begin insert into public.audit_log (actor_id, action, target_id, details) values (null, 'TRIGGER_FAILED', null, jsonb_build_object('trigger', 'trg_tx_confirmed_sender_email', 'transaction', new.id, 'error', sqlerrm)); exception when others then null; end;
  return new;
end $$;

create or replace function public.trg_wallet_addresses() returns trigger
language plpgsql security definer set search_path to ''
as $$
declare v_secret text;
begin
  select value into v_secret from public.app_private where key = 'email_webhook_secret';
  perform net.http_post(url := 'https://gebjmguoauvutiqvoswl.supabase.co/functions/v1/wallet-addresses',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := jsonb_build_object('user_id', new.id), timeout_milliseconds := 15000);
  return new;
exception when others then
  raise warning 'trg_wallet_addresses: %', sqlerrm;
  begin insert into public.audit_log (actor_id, action, target_id, details) values (null, 'TRIGGER_FAILED', new.id, jsonb_build_object('trigger', 'trg_wallet_addresses', 'error', sqlerrm)); exception when others then null; end;
  return new;                                           -- ne bloque jamais l'inscription ; les adresses sont créées à la première demande
end $$;

create or replace function public.admin_link_apply(p_token text, p_reason text default null) returns jsonb
language plpgsql security definer set search_path to ''
as $$
declare l public.admin_action_links; t public.transactions; res jsonb; v_target text;
begin
  select * into l from public.admin_action_links where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') for update;
  if l.id is null then return jsonb_build_object('ok', false, 'error', 'invalid_link'); end if;
  if l.expires_at < now() then return jsonb_build_object('ok', false, 'error', 'expired'); end if;
  select * into t from public.transactions where id = l.tx_id;
  if l.used_at is not null then                          -- usage unique : un lien déjà utilisé (ou remplacé) ne refait rien
    return jsonb_build_object('ok', true, 'already', true, 'status', t.status, 'action', l.action);
  end if;
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
      update public.admin_action_links set used_at = coalesce(used_at, now()) where tx_id = l.tx_id;
      return jsonb_build_object('ok', true, 'already', true, 'status', t.status);
    end if;
    return jsonb_build_object('ok', false, 'error', sqlerrm, 'status', t.status);
  end;
  if l.action in ('CONFIRM', 'REJECT') then              -- décision finale : tous les liens de cette transaction sont épuisés
    update public.admin_action_links set used_at = coalesce(used_at, now()) where tx_id = l.tx_id;
  else
    update public.admin_action_links set used_at = coalesce(used_at, now()) where id = l.id;
  end if;
  insert into public.audit_log (actor_id, action, target_id, details) values (l.admin_id, 'TX_ACTION_VIA_EMAIL', null, jsonb_build_object('transaction', l.tx_id, 'action', l.action));
  return coalesce(res, '{}'::jsonb) || jsonb_build_object('ok', true, 'action', l.action);
end $$;
revoke all on function public.admin_link_apply(text, text) from public, anon, authenticated;
grant execute on function public.admin_link_apply(text, text) to service_role;

-- la page de confirmation sait si le lien est déjà utilisé / remplacé (elle ne propose alors plus de bouton)
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
  return jsonb_build_object('action', l.action, 'admin', v_a, 'used', l.used_at is not null, 'transaction', jsonb_build_object('reference', t.reference, 'kind', t.kind, 'asset', t.asset, 'network', t.network,
    'amount', t.amount, 'status', t.status, 'paused', coalesce((t.meta ->> 'paused')::boolean, false), 'sender', v_s, 'receiver', v_r, 'note', t.note, 'created_at', t.created_at, 'confirmed_at', t.confirmed_at));
end $$;
revoke all on function public.admin_link_info(text) from public, anon, authenticated;
grant execute on function public.admin_link_info(text) to service_role;
