-- Admin Control : les quatre chiffres de la colonne de droite (comptes réels, administrateurs seulement).
create or replace function public.admin_console_stats() returns jsonb
  language plpgsql stable security definer set search_path to ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'transfers_total', (select count(*) from public.transactions where kind in ('FIAT_TRANSFER', 'FIAT_EXTERNAL')),
    'transactions_today', (select count(*) from public.transactions where created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'),
    'balance_omr', (select coalesce(sum(balance), 0) from public.accounts where currency = 'OMR'));
end $$;
revoke all on function public.admin_console_stats() from public, anon;
grant execute on function public.admin_console_stats() to authenticated;
