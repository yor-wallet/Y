-- Rollback of 20261124_crypto_swap.sql (OM Wallet 14.5.0)
-- Restores the four replaced functions from public.function_backups (tag '20261124_crypto_swap') and withdraws swap_execute.
-- Data safety: NOTHING is deleted. public.swap_quotes and every CRYPTO_SWAP transaction / ledger line stay as they are
-- (history is never removed). Run this only when no CRYPTO_SWAP transaction is PENDING: a pending swap's hold would then need
-- the administrator's Refuse (admin_tx_reject still releases it, unchanged).
do $$
declare b record;
begin
  for b in
    select distinct on (name) name, definition from public.function_backups
    where tag = '20261124_crypto_swap' and name in ('admin_tx_confirm', 'admin_tx_list', 'trg_tx_confirmed_sender_email', 'trg_admin_tx_action_email')
    order by name, saved_at asc
  loop
    execute b.definition;
  end loop;
end $$;
revoke all on function public.swap_execute(uuid, text, uuid) from authenticated;
