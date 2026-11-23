-- DY : interrupteur administrateur « transferts suspendus » (13.2.0)
-- Ajout seulement : 2 tables, 4 fonctions, et une garde de 1 ligne dans les 4 fonctions publiques de transfert.
-- Aucune donnée existante n'est lue ni modifiée. Retour arrière : 20261121_dy_transfer_switch_rollback.sql
--
-- Comportement (décidé par le SERVEUR, jamais par le navigateur) :
--   DY actif  -> fiat_send_external / intl_send / transfer_fiat / bank_send répondent {ok:false, error:'TRANSFER_UNAVAILABLE'} AVANT de consommer le code PIN,
--                AVANT toute écriture de transaction et AVANT tout débit. La tentative est comptée dans dy_blocked_attempts. Un rejeu d'une clé d'idempotence
--                déjà exécutée renvoie toujours son résultat d'origine (un transfert déjà fait reste un transfert fait).
--   DY coupé  -> la procédure normale, avec toutes les vérifications habituelles (PIN, solde, plafonds).
--   Activer / couper : admin_dy_set(), réservé aux administrateurs actifs (is_admin()), écrit une ligne dans audit_log (DY_ON / DY_OFF).

create table if not exists public.dy_settings (
  id         boolean primary key default true check (id),
  enabled    boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
insert into public.dy_settings (id) values (true) on conflict (id) do nothing;
alter table public.dy_settings enable row level security;
revoke all on public.dy_settings from anon, authenticated;

create table if not exists public.dy_blocked_attempts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id),
  channel    text not null,
  amount     numeric,
  created_at timestamptz not null default now()
);
alter table public.dy_blocked_attempts enable row level security;
revoke all on public.dy_blocked_attempts from anon, authenticated;
create index if not exists dy_blocked_attempts_created_idx on public.dy_blocked_attempts (created_at desc);

create or replace function public._dy_enabled() returns boolean
  language sql stable security definer set search_path to ''
as $$ select coalesce((select enabled from public.dy_settings where id), false) $$;

create or replace function public._dy_block(p_channel text, p_amount numeric) returns jsonb
  language plpgsql security definer set search_path to ''
as $$
declare v_u uuid := (select auth.uid());
begin
  if v_u is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  insert into public.dy_blocked_attempts (user_id, channel, amount) values (v_u, left(coalesce(p_channel, ''), 40), p_amount);
  return jsonb_build_object('ok', false, 'error', 'TRANSFER_UNAVAILABLE', 'blocked_by', 'DY');
end $$;

-- lecture publique (connecté) : seulement « actif ou non » et la date, rien d'autre
create or replace function public.dy_status() returns jsonb
  language sql stable security definer set search_path to ''
as $$
  select jsonb_build_object('enabled', public._dy_enabled(), 'updatedAt', (select updated_at from public.dy_settings where id))
  where (select auth.uid()) is not null
$$;

-- vue administrateur : état, responsable, historique des changements, tentatives bloquées
create or replace function public.admin_dy_overview() returns jsonb
  language plpgsql stable security definer set search_path to ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'enabled',   public._dy_enabled(),
    'updatedAt', (select s.updated_at from public.dy_settings s where s.id),
    'updatedBy', (select nullif(btrim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), '') from public.dy_settings s join public.profiles p on p.id = s.updated_by where s.id),
    'blocked24h',   (select count(*) from public.dy_blocked_attempts where created_at > now() - interval '24 hours'),
    'blockedTotal', (select count(*) from public.dy_blocked_attempts),
    'history', coalesce((select jsonb_agg(jsonb_build_object('at', h.created_at, 'enabled', h.action = 'DY_ON',
                  'by', nullif(btrim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), '')) order by h.created_at desc)
                from (select * from public.audit_log where action in ('DY_ON','DY_OFF') order by created_at desc limit 20) h
                left join public.profiles p on p.id = h.actor_id), '[]'::jsonb));
end $$;

create or replace function public.admin_dy_set(p_enabled boolean) returns jsonb
  language plpgsql security definer set search_path to ''
as $$
declare v_admin uuid := (select auth.uid()); v_old boolean;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_enabled is null then raise exception 'invalid_value' using errcode = '22023'; end if;
  select enabled into v_old from public.dy_settings where id for update;
  if v_old is distinct from p_enabled then
    update public.dy_settings set enabled = p_enabled, updated_at = now(), updated_by = v_admin where id;
    insert into public.audit_log (actor_id, action, details)
      values (v_admin, case when p_enabled then 'DY_ON' else 'DY_OFF' end, jsonb_build_object('enabled', p_enabled, 'previous', v_old));
  end if;
  return public.admin_dy_overview();
end $$;

revoke all on function public._dy_enabled(), public._dy_block(text, numeric), public.dy_status(), public.admin_dy_overview(), public.admin_dy_set(boolean) from public, anon;
grant execute on function public.dy_status(), public.admin_dy_overview(), public.admin_dy_set(boolean) to authenticated;

-- la garde : une ligne dans chaque fonction publique de transfert, APRÈS le rejeu d'idempotence, AVANT la consommation du code PIN
create or replace function public.fiat_send_external(p_amount numeric, p_dest_currency text, p_provider text, p_beneficiary jsonb, p_idempotency_key text, p_pin_grant uuid default null)
  returns jsonb language plpgsql security definer set search_path to ''
as $$
declare c jsonb;
begin
  c := public._idem_replay(p_idempotency_key); if c is not null then return c; end if;
  if public._dy_enabled() then return public._dy_block('fiat_send_external', p_amount); end if;
  perform public._consume_grant(p_pin_grant);
  return public._fiat_send_external_impl(p_amount, p_dest_currency, p_provider, p_beneficiary, p_idempotency_key);
end $$;

create or replace function public.intl_send(p_country text, p_method text, p_provider text, p_amount numeric, p_beneficiary jsonb, p_idempotency_key text, p_pin_grant uuid default null)
  returns jsonb language plpgsql security definer set search_path to ''
as $$
declare c jsonb;
begin
  c := public._idem_replay(p_idempotency_key); if c is not null then return c; end if;
  if public._dy_enabled() then return public._dy_block('intl_send', p_amount); end if;
  perform public._consume_grant(p_pin_grant);
  return public._intl_send_impl(p_country, p_method, p_provider, p_amount, p_beneficiary, p_idempotency_key);
end $$;

create or replace function public.transfer_fiat(p_to_yor_id text, p_amount numeric, p_currency text default 'OMR', p_note text default null, p_idempotency_key text default null, p_pin_grant uuid default null)
  returns jsonb language plpgsql security definer set search_path to ''
as $$
declare c jsonb;
begin
  c := public._idem_replay(p_idempotency_key); if c is not null then return c; end if;
  if public._dy_enabled() then return public._dy_block('transfer_fiat', p_amount); end if;
  perform public._consume_grant(p_pin_grant);
  return public._transfer_fiat_impl(p_to_yor_id, p_amount, p_currency, p_note, p_idempotency_key);
end $$;

create or replace function public.bank_send(p_flow text, p_country text, p_bank_name text, p_account text, p_routing text, p_amount numeric, p_idempotency_key text, p_pin_grant uuid default null)
  returns jsonb language plpgsql security definer set search_path to ''
as $$
declare c jsonb;
begin
  c := public._idem_replay(p_idempotency_key); if c is not null then return c; end if;
  if public._dy_enabled() then return public._dy_block('bank_send', p_amount); end if;
  perform public._consume_grant(p_pin_grant);
  return public._bank_send_impl(p_flow, p_country, p_bank_name, p_account, p_routing, p_amount, p_idempotency_key);
end $$;
