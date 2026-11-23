-- Retour arrière de 20261123_wallet_addresses.sql.
-- ATTENTION : wallet_addresses / wallet_keys contiennent les clés des adresses déjà distribuées. Elles ne sont PAS supprimées ici :
-- si de vrais fonds ont été reçus sur ces adresses, ils doivent d'abord être récupérés. On remet seulement les fonctions dans leur état précédent.
drop trigger if exists profiles_wallet_addresses on public.profiles;
drop function if exists public.trg_wallet_addresses();
drop function if exists public.admin_address_owner(text);
drop function if exists public.my_deposit_addresses();
create or replace function public.get_receive_address(p_asset text, p_network text) returns text
  language plpgsql security definer set search_path to ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  raise exception 'deposit_address_unavailable' using errcode = '22023';
end $$;
