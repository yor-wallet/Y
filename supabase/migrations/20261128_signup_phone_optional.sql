-- OM Wallet 16.2.0 — inscription : le numéro de téléphone n'est plus obligatoire (cahier des charges du 26/11, §6).
-- Seule la fonction déclencheur public.handle_new_user change. Aucune table, aucune donnée modifiée.
--  * téléphone vide accepté ; s'il est donné, il doit rester au format international (+ et 8 à 15 chiffres), sinon refus comme avant ;
--  * prénom / nom : first_name / last_name (inscription par e-mail), sinon given_name / family_name, sinon full_name / name
--    (fournisseurs Google ou Apple, s'ils sont activés un jour) — rien n'est inventé : vide si absent ;
--  * tout le reste (compte OMR, portefeuilles, préférences) est identique.
-- Sauvegarde de l'ancienne définition : public.function_backups (tag '16.2.0-before'). Retour arrière : 20261128_signup_phone_optional_rollback.sql

insert into public.function_backups (tag, name, definition)
values ('16.2.0-before', 'public.handle_new_user()', pg_get_functiondef('public.handle_new_user()'::regprocedure));

create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_yor text; v_try int := 0; v_lang text := lower(left(coalesce(meta->>'language',''), 2));
  v_phone text := btrim(coalesce(meta->>'phone',''));
  v_full text := btrim(coalesce(nullif(meta->>'full_name',''), meta->>'name', ''));
  v_first text := btrim(coalesce(nullif(meta->>'first_name',''), nullif(meta->>'given_name',''), ''));
  v_last text := btrim(coalesce(nullif(meta->>'last_name',''), nullif(meta->>'family_name',''), ''));
  v_prefs jsonb := '{"theme":"dark","primaryCurrency":"USD","notifications":true,"vibration":true,"hideBalances":false}'::jsonb;
begin
  if v_phone <> '' and v_phone !~ '^\+[0-9]{8,15}$' then
    raise exception 'invalid phone number' using errcode = 'P0001', hint = 'PHONE_INVALID';
  end if;
  if v_first = '' and v_last = '' and v_full <> '' then
    v_first := split_part(v_full, ' ', 1);
    v_last := btrim(substr(v_full, length(v_first) + 1));
  end if;
  loop
    v_yor := public.gen_yor_id();
    begin
      insert into public.profiles (id, user_id, yor_id, email, first_name, last_name, phone, country)
      values (new.id, 'usr_' || upper(substr(replace(new.id::text, '-', ''), 1, 8)), v_yor, new.email,
        left(v_first, 80), left(v_last, 80),
        left(v_phone, 32), coalesce(nullif(left(meta->>'country', 2), ''), 'OM'));
      exit;
    exception when unique_violation then
      v_try := v_try + 1; if v_try > 5 then raise; end if;
    end;
  end loop;

  insert into public.accounts (user_id, type, name, currency, country) values
    (new.id, 'MAIN', 'Main OMR', 'OMR', 'OM');
  insert into public.crypto_wallets (user_id, asset, network) values
    (new.id, 'BTC', 'bitcoin'), (new.id, 'ETH', 'ethereum'), (new.id, 'USDT', 'tron'), (new.id, 'USDC', 'ethereum'),
    (new.id, 'BNB', 'bsc'), (new.id, 'SOL', 'solana'), (new.id, 'XRP', 'xrp'), (new.id, 'LTC', 'litecoin');

  if v_lang in ('fr','en','ar') then v_prefs := v_prefs || jsonb_build_object('language', v_lang); end if;
  insert into public.user_docs (user_id, doc_name, data) values
    (new.id, 'preferences', v_prefs),
    (new.id, 'security', '{"failedAttempts":0,"lockUntil":0}'::jsonb);
  return new;
end $function$;
