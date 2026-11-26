-- OM Wallet 16.3.0 — vérification en deux étapes (TOTP, Supabase Auth MFA) appliquée CÔTÉ SERVEUR (cahier des charges du 26/11, §7).
-- Une personne qui a activé le TOTP doit avoir une session de niveau aal2 (mot de passe + code) pour :
--   * lire / écrire ses données (règle RESTRICTIVE « mfa_required » sur les 22 tables personnelles, en plus des règles existantes) ;
--   * déplacer de l'argent (verify_pin et _consume_grant, par lesquels passent les 15 fonctions d'envoi, d'échange et de retrait) ;
--   * agir comme administrateur (is_admin et _bn_is_admin, utilisés par les fonctions d'administration).
-- Une personne sans TOTP n'est pas concernée (rien ne change pour elle).
-- Aucune table, aucune donnée modifiée ou supprimée. Anciennes définitions sauvegardées (function_backups, tag 16.3.0-before).
-- Retour arrière : 20261128_mfa_totp_rollback.sql

insert into public.function_backups (tag, name, definition)
select '16.3.0-before', 'public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('is_admin', '_bn_is_admin', 'verify_pin', '_consume_grant');

-- vrai si la session a franchi le deuxième facteur, ou si la personne n'a aucun facteur TOTP vérifié
create or replace function public.mfa_ok()
 returns boolean
 language sql
 stable security definer
 set search_path to ''
as $function$
  select coalesce((select auth.jwt()->>'aal'), 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = (select auth.uid()) and f.status = 'verified');
$function$;
revoke all on function public.mfa_ok() from public, anon;
grant execute on function public.mfa_ok() to authenticated;

create or replace function public.is_admin()
 returns boolean
 language sql
 stable security definer
 set search_path to ''
as $function$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin' and p.status = 'ACTIVE'
  ) and public.mfa_ok();
$function$;

create or replace function public._bn_is_admin()
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'ACTIVE') and public.mfa_ok();
$function$;

create or replace function public.verify_pin(p_pin text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare u uuid := (select auth.uid()); r jsonb; g uuid;
begin
  if u is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  if not public.mfa_ok() then raise exception 'mfa_required' using errcode = '42501'; end if;
  r := public._check_pin(u, p_pin);
  if (r->>'ok')::boolean then
    delete from public.pin_grants where user_id = u and expires_at < now();
    insert into public.pin_grants (user_id, expires_at) values (u, now() + interval '2 minutes') returning token into g;
    return r || jsonb_build_object('grant', g);
  end if;
  return r;
end $function$;

create or replace function public._consume_grant(p_grant uuid)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare n int;
begin
  if not public.mfa_ok() then raise exception 'mfa_required' using errcode = '42501'; end if;
  delete from public.pin_grants where token = p_grant and user_id = (select auth.uid()) and expires_at > now();
  get diagnostics n = row_count;
  if n = 0 then raise exception 'pin_required' using errcode = '42501'; end if;
end $function$;

create policy mfa_required on public.accounts as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.audit_log as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.chat_messages as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.chat_threads as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.credit_installments as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.credit_requests as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.crypto_wallets as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.email_logs as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.investments as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.kyc_submissions as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.ledger_entries as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.notifications as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.profiles as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.swap_quotes as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.transactions as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.tx_events as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.user_docs as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.user_items as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.vaults as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.wallet_addresses as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.withdrawal_requests as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy mfa_required on public.yor_mail as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
