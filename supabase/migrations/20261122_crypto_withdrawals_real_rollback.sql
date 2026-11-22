-- Retour arrière de 20261122_crypto_withdrawals_real.sql
-- ATTENTION : rétablir l'ancienne get_receive_address() renverrait de nouveau des adresses générées au hasard (aucune clé privée) : ne le faire que si
-- de vraies adresses ont été mises en place à la place de _gen_address().
create or replace function public.get_receive_address(p_asset text, p_network text)
  returns text language plpgsql security definer set search_path to ''
as $$
declare u uuid := (select auth.uid()); v_asset text := upper(btrim(coalesce(p_asset,''))); v_net text := lower(btrim(coalesce(p_network,''))); a text;
begin
  if u is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  if not exists (select 1 from public.asset_networks where asset = v_asset and network = v_net) then
    raise exception 'unsupported_asset_network' using errcode = '22023'; end if;
  insert into public.crypto_wallets (user_id, asset, network) values (u, v_asset, v_net) on conflict (user_id, asset, network) do nothing;
  select address into a from public.crypto_wallets where user_id = u and asset = v_asset and network = v_net;
  return a;
end $$;
-- Les fonctions crypto_withdraw_* / admin_crypto_withdrawal_* peuvent être retirées de l'API sans toucher aux données :
revoke execute on function public.crypto_withdraw_request(text, text, text, text, numeric, text, uuid), public.crypto_withdraw_cancel(uuid), public.crypto_withdraw_overview(),
  public.admin_crypto_withdrawal_list(text, integer), public.admin_crypto_withdrawal_process(uuid), public.admin_crypto_withdrawal_complete(uuid, text), public.admin_crypto_withdrawal_reject(uuid, text) from authenticated;
-- La table crypto_withdrawals est CONSERVÉE (historique des demandes).
