-- OM Wallet 16.4.0 — code à 6 chiffres seulement AU-DESSUS de 500 USD (cahier des charges du 26/11, §9 ; choix du propriétaire :
-- le code personnel existant, vérifié par le serveur, avec un seuil).
--  * jusqu'à 500 USD inclus : pas de code demandé par cette règle ; au-dessus (strictement) : code obligatoire, vérifié par le serveur
--    (verify_pin : compteur d'essais, blocage 15 min ; jeton à usage unique valable 2 min, consommé par l'opération).
--  * La valeur en USD est calculée PAR LE SERVEUR à partir du montant réellement débité, jamais d'une valeur envoyée par l'application :
--      - OMR (bank_send, fiat_send_external, intl_send) et devise de transfer_fiat : table public.fx_rates (taux déjà utilisés) ;
--      - échange (swap_execute) : usd_value du devis, fixé par le serveur (cours Binance) ;
--      - valeur inconnue (devise absente de fx_rates…) : code exigé.
--  * Envois et retraits crypto (transfer_crypto, crypto_send_external, crypto_withdraw_request) : le serveur n'a aucun cours en direct
--    fiable pour ces actifs ; aucun taux n'est inventé : le code reste exigé à chaque fois (inchangé).
--  * La vérification en deux étapes (aal2) reste exigée dans tous les cas (mfa_ok).
--  * Seule la ligne « perform public._consume_grant(p_pin_grant); » des 5 fonctions est remplacée ; anciennes définitions dans
--    function_backups (tag 16.4.0-before). Retour arrière : 20261128_pin_threshold_500usd_rollback.sql

insert into public.function_backups (tag, name, definition)
select '16.4.0-before', 'public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('bank_send', 'fiat_send_external', 'intl_send', 'transfer_fiat', 'swap_execute');

-- montant d'une devise -> USD, par les taux de fx_rates (per_omr = unités de la devise pour 1 OMR) ; null si inconnu
create or replace function public._usd_of(p_amount numeric, p_cur text)
 returns numeric language sql stable security definer set search_path to ''
as $function$
  select case when p_amount is null then null
    else p_amount / nullif((select r.per_omr from public.fx_rates r where r.currency = upper(btrim(coalesce(p_cur, '')))), 0)
         * (select r.per_omr from public.fx_rates r where r.currency = 'USD') end;
$function$;
revoke all on function public._usd_of(numeric, text) from public, anon, authenticated;

-- le code : exigé si la valeur dépasse 500 USD ou n'est pas connue ; un jeton fourni sous le seuil est simplement consommé
create or replace function public._pin_gate(p_usd numeric, p_grant uuid)
 returns void language plpgsql security definer set search_path to ''
as $function$
begin
  if not public.mfa_ok() then raise exception 'mfa_required' using errcode = '42501'; end if;
  if p_usd is null or p_usd > 500 then
    perform public._consume_grant(p_grant);
  elsif p_grant is not null then
    delete from public.pin_grants where token = p_grant and user_id = (select auth.uid());
  end if;
end $function$;
revoke all on function public._pin_gate(numeric, uuid) from public, anon, authenticated;

do $$
declare
  r record; d text;
  old text := 'perform public._consume_grant(p_pin_grant);';
begin
  for r in select * from (values
    ('public.bank_send(text,text,text,text,text,numeric,text,uuid)', 'perform public._pin_gate(public._usd_of(round(p_amount, 3), ''OMR''), p_pin_grant);'),
    ('public.fiat_send_external(numeric,text,text,jsonb,text,uuid)', 'perform public._pin_gate(public._usd_of(round(p_amount, 3), ''OMR''), p_pin_grant);'),
    ('public.intl_send(text,text,text,numeric,jsonb,text,uuid)', 'perform public._pin_gate(public._usd_of(round(p_amount, 3), ''OMR''), p_pin_grant);'),
    ('public.transfer_fiat(text,numeric,text,text,text,uuid)', 'perform public._pin_gate(public._usd_of(p_amount, p_currency), p_pin_grant);'),
    ('public.swap_execute(uuid,text,uuid)', 'perform public._pin_gate((select q.usd_value from public.swap_quotes q where q.id = p_quote and q.user_id = (select auth.uid())), p_pin_grant);')
  ) v(sig, repl) loop
    d := pg_get_functiondef(r.sig::regprocedure);
    if position(old in d) = 0 then raise exception 'pin line not found in %', r.sig; end if;
    execute replace(d, old, r.repl);
  end loop;
end $$;
