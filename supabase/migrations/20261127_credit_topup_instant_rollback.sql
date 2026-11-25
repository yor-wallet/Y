-- Rollback of 20261127_credit_topup_instant.sql (OM Wallet 14.10.0)
-- Restores the three replaced functions from public.function_backups (tag '20261127_credit_topup_instant'), withdraws the delivery / refund functions
-- from signed-in people and puts the service back to the administrator-confirmed mode.
-- Data safety: NOTHING is deleted. Every CREDIT_TOPUP transaction, ledger line and notification stays as it is; the helper functions stay (unreachable
-- by users). An instantly confirmed transfer stays CONFIRMED (its rials already left the account); refund it first with admin_topup_refund if needed.
do $$
declare b record;
begin
  for b in
    select distinct on (name) name, definition from public.function_backups
    where tag = '20261127_credit_topup_instant' and name in ('_credit_topup_request_impl', 'get_app_config', 'admin_set_setting')
    order by name, saved_at asc
  loop
    execute b.definition;
  end loop;
end $$;
revoke all on function public.admin_topup_list(text, integer) from authenticated;
revoke all on function public.admin_topup_mark_delivered(uuid) from authenticated;
revoke all on function public.admin_topup_refund(uuid, text) from authenticated;
insert into public.app_settings (key, value) values ('credit_topup_mode', '"admin"'::jsonb)
  on conflict (key) do update set value = '"admin"'::jsonb, updated_at = now();
