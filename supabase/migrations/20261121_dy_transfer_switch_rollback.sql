-- Retour arrière de DY : remet les 4 fonctions de transfert EXACTEMENT comme avant (sans la garde).
-- Les tables dy_settings / dy_blocked_attempts et les lignes d'audit_log (append-only) sont conservées : aucune donnée n'est supprimée.
create or replace function public.fiat_send_external(p_amount numeric, p_dest_currency text, p_provider text, p_beneficiary jsonb, p_idempotency_key text, p_pin_grant uuid default null)
  returns jsonb language plpgsql security definer set search_path to ''
as $$
declare c jsonb;
begin
  c := public._idem_replay(p_idempotency_key); if c is not null then return c; end if;
  perform public._consume_grant(p_pin_grant);
  return public._fiat_send_external_impl(p_amount, p_dest_currency, p_provider, p_beneficiary, p_idempotency_key);
end $$;
create or replace function public.intl_send(p_country text, p_method text, p_provider text, p_amount numeric, p_beneficiary jsonb, p_idempotency_key text, p_pin_grant uuid default null)
  returns jsonb language plpgsql security definer set search_path to ''
as $$
declare c jsonb;
begin
  c := public._idem_replay(p_idempotency_key); if c is not null then return c; end if;
  perform public._consume_grant(p_pin_grant);
  return public._intl_send_impl(p_country, p_method, p_provider, p_amount, p_beneficiary, p_idempotency_key);
end $$;
create or replace function public.transfer_fiat(p_to_yor_id text, p_amount numeric, p_currency text default 'OMR', p_note text default null, p_idempotency_key text default null, p_pin_grant uuid default null)
  returns jsonb language plpgsql security definer set search_path to ''
as $$
declare c jsonb;
begin
  c := public._idem_replay(p_idempotency_key); if c is not null then return c; end if;
  perform public._consume_grant(p_pin_grant);
  return public._transfer_fiat_impl(p_to_yor_id, p_amount, p_currency, p_note, p_idempotency_key);
end $$;
create or replace function public.bank_send(p_flow text, p_country text, p_bank_name text, p_account text, p_routing text, p_amount numeric, p_idempotency_key text, p_pin_grant uuid default null)
  returns jsonb language plpgsql security definer set search_path to ''
as $$
declare c jsonb;
begin
  c := public._idem_replay(p_idempotency_key); if c is not null then return c; end if;
  perform public._consume_grant(p_pin_grant);
  return public._bank_send_impl(p_flow, p_country, p_bank_name, p_account, p_routing, p_amount, p_idempotency_key);
end $$;
