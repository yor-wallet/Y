-- OM Wallet 14.3 — adresses de dépôt RÉELLES, uniques par utilisateur et par réseau, avec QR enregistré.
-- ÉTAT : NON APPLIQUÉE sur le projet au moment de ce commit (la confirmation de l'outil de migration est restée sans réponse) ;
-- la fonction wallet-addresses n'est pas non plus déployée. get_receive_address répond donc encore « deposit_address_unavailable ».
-- Ajouts seulement : aucune ligne n'est supprimée ni modifiée (les anciennes valeurs de crypto_wallets.address restent telles quelles, jamais affichées).
--
-- Chaque adresse provient d'une clé privée générée par la fonction wallet-addresses (secp256k1 / ed25519) : les fonds envoyés à une telle adresse
-- sont récupérables par la plateforme. Les clés privées sont chiffrées (AES-256-GCM) avec une clé maître gardée dans Supabase Vault, stockées dans
-- wallet_keys (aucun accès pour les utilisateurs ni le navigateur) et écrites dans la MÊME transaction que l'adresse (jamais d'adresse sans clé).
-- Retour arrière : 20261123_wallet_addresses_rollback.sql (ne supprime pas les clés : à faire à la main, après avoir déplacé d'éventuels fonds).

create table if not exists public.wallet_addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id),
  network    text not null,
  address    text not null,
  qr_svg     text not null,                       -- le QR code enregistré (contenu = l'adresse), propre à cette adresse
  created_at timestamptz not null default now(),
  unique (user_id, network),
  unique (address)
);
alter table public.wallet_addresses enable row level security;
revoke all on public.wallet_addresses from anon, authenticated;
grant select on public.wallet_addresses to authenticated;
drop policy if exists wallet_addresses_own on public.wallet_addresses;
create policy wallet_addresses_own on public.wallet_addresses for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.wallet_keys (
  user_id    uuid not null,
  network    text not null,
  ciphertext text not null,                       -- base64(iv || AES-256-GCM(clé privée))
  format     text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, network),
  foreign key (user_id, network) references public.wallet_addresses (user_id, network)
);
alter table public.wallet_keys enable row level security;
revoke all on public.wallet_keys from anon, authenticated;     -- aucune politique : seul le rôle service y accède

-- clé maître (créée une fois, jamais rendue au navigateur)
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'wallet_master_key') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'wallet_master_key', 'AES-256-GCM key protecting public.wallet_keys');
  end if;
end $$;

create or replace function public.get_wallet_master_key() returns text
language sql stable security definer set search_path to ''
as $$ select ds.decrypted_secret from vault.decrypted_secrets ds where ds.name = 'wallet_master_key' order by ds.updated_at desc limit 1 $$;
revoke all on function public.get_wallet_master_key() from public, anon, authenticated;
grant execute on function public.get_wallet_master_key() to service_role;

-- adresse + clé chiffrée enregistrées ensemble, ou rien
create or replace function public.store_wallet_address(p_user uuid, p_network text, p_address text, p_qr text, p_cipher text, p_format text) returns jsonb
language plpgsql security definer set search_path to ''
as $$
declare r public.wallet_addresses;
begin
  if p_network not in ('bitcoin','litecoin','ethereum','bsc','polygon','tron','solana','xrp') then raise exception 'unsupported_network' using errcode = '22023'; end if;
  if not public._crypto_address_ok(p_network, p_address) then raise exception 'invalid_address' using errcode = '22023'; end if;
  if coalesce(p_cipher, '') = '' or coalesce(p_qr, '') = '' then raise exception 'incomplete' using errcode = '22023'; end if;
  perform 1 from public.profiles where id = p_user for update;
  select * into r from public.wallet_addresses where user_id = p_user and network = p_network;
  if r.id is not null then return jsonb_build_object('address', r.address, 'qr_svg', r.qr_svg, 'created', false); end if;
  insert into public.wallet_addresses (user_id, network, address, qr_svg) values (p_user, p_network, p_address, p_qr) returning * into r;
  insert into public.wallet_keys (user_id, network, ciphertext, format) values (p_user, p_network, p_cipher, coalesce(p_format, 'unknown'));
  insert into public.audit_log (actor_id, action, target_id, details) values (null, 'WALLET_ADDRESS_CREATED', p_user, jsonb_build_object('network', p_network, 'address', p_address));
  return jsonb_build_object('address', r.address, 'qr_svg', r.qr_svg, 'created', true);
end $$;
revoke all on function public.store_wallet_address(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.store_wallet_address(uuid, text, text, text, text, text) to service_role;

-- mes adresses (avec le QR enregistré) : uniquement les miennes
create or replace function public.my_deposit_addresses() returns table(network text, address text, qr_svg text)
language sql stable security definer set search_path to ''
as $$ select w.network, w.address, w.qr_svg from public.wallet_addresses w where w.user_id = (select auth.uid()) order by w.network $$;
revoke all on function public.my_deposit_addresses() from public, anon;
grant execute on function public.my_deposit_addresses() to authenticated;

-- l'adresse de dépôt pour un actif sur un réseau : celle enregistrée pour ce compte, jamais une valeur inventée
create or replace function public.get_receive_address(p_asset text, p_network text) returns text
language plpgsql stable security definer set search_path to ''
as $$
declare v_u uuid := (select auth.uid()); v text;
begin
  if v_u is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  if not exists (select 1 from public.asset_networks where asset = upper(p_asset) and network = lower(p_network)) then raise exception 'unsupported_asset_network' using errcode = '22023'; end if;
  select address into v from public.wallet_addresses where user_id = v_u and network = lower(p_network);
  if v is null then raise exception 'address_pending' using errcode = '22023'; end if;     -- le client demande alors la création (fonction wallet-addresses) puis réessaie
  return v;
end $$;

-- reconnaissance par le système : à qui appartient cette adresse ? (administrateur seulement)
create or replace function public.admin_address_owner(p_address text) returns jsonb
language plpgsql stable security definer set search_path to ''
as $$
declare r record;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select w.network, w.address, p.id, p.yor_id, nullif(btrim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), '') as full_name, p.email into r
    from public.wallet_addresses w join public.profiles p on p.id = w.user_id where lower(w.address) = lower(btrim(p_address)) limit 1;
  if r.id is null then return jsonb_build_object('found', false); end if;
  return jsonb_build_object('found', true, 'network', r.network, 'address', r.address, 'user_id', r.id, 'yor_id', r.yor_id, 'name', r.full_name, 'email', r.email);
end $$;
revoke all on function public.admin_address_owner(text) from public, anon;
grant execute on function public.admin_address_owner(text) to authenticated;

-- à chaque nouveau profil : demande immédiate de création des adresses (asynchrone ; si cela échoue, la création est refaite à la première demande)
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
  return new;      -- ne bloque jamais l'inscription
end $$;
drop trigger if exists profiles_wallet_addresses on public.profiles;
create trigger profiles_wallet_addresses after insert on public.profiles for each row execute function public.trg_wallet_addresses();
revoke all on function public.trg_wallet_addresses() from public, anon, authenticated;
