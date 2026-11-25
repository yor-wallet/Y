-- Rollback of 20261127_credit_topup.sql (OM Wallet 14.10.0)
-- Restores the seven replaced functions from public.function_backups (tag '20261127_credit_topup'), withdraws the credit-transfer request and
-- confirmation functions, and switches the service off. Run it when no CREDIT_TOPUP transaction is PENDING: a pending request's hold would then
-- need the administrator's Refuse (admin_tx_reject releases it only in the new version — so refuse every pending one FIRST, then run this).
-- Data safety: NOTHING is deleted. Every CREDIT_TOPUP transaction, ledger line and notification stays as it is (history is never removed), the
-- widened transactions_kind_check stays (narrowing it would reject those rows), the settings rows stay (credit_topup_enabled is set to false).
do $$
declare b record;
begin
  for b in
    select distinct on (name) name, definition from public.function_backups
    where tag = '20261127_credit_topup' and name in ('admin_tx_confirm', 'admin_tx_reject', 'admin_tx_list', 'trg_tx_confirmed_sender_email', 'trg_admin_tx_action_email', 'get_app_config', 'admin_set_setting')
    order by name, saved_at asc
  loop
    execute b.definition;
  end loop;
end $$;
revoke all on function public.credit_topup_request(text, text, numeric, text, uuid) from authenticated;
revoke all on function public.admin_topup_confirm(uuid, text) from authenticated;
insert into public.app_settings (key, value) values ('credit_topup_enabled', 'false'::jsonb)
  on conflict (key) do update set value = 'false'::jsonb, updated_at = now();
