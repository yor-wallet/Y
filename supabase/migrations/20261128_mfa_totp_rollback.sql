-- Retour arrière de 20261128_mfa_totp.sql : retire les règles « mfa_required » (règles d'accès, aucune donnée) et remet les fonctions d'avant.
drop policy if exists mfa_required on public.accounts;
drop policy if exists mfa_required on public.audit_log;
drop policy if exists mfa_required on public.chat_messages;
drop policy if exists mfa_required on public.chat_threads;
drop policy if exists mfa_required on public.credit_installments;
drop policy if exists mfa_required on public.credit_requests;
drop policy if exists mfa_required on public.crypto_wallets;
drop policy if exists mfa_required on public.email_logs;
drop policy if exists mfa_required on public.investments;
drop policy if exists mfa_required on public.kyc_submissions;
drop policy if exists mfa_required on public.ledger_entries;
drop policy if exists mfa_required on public.notifications;
drop policy if exists mfa_required on public.profiles;
drop policy if exists mfa_required on public.swap_quotes;
drop policy if exists mfa_required on public.transactions;
drop policy if exists mfa_required on public.tx_events;
drop policy if exists mfa_required on public.user_docs;
drop policy if exists mfa_required on public.user_items;
drop policy if exists mfa_required on public.vaults;
drop policy if exists mfa_required on public.wallet_addresses;
drop policy if exists mfa_required on public.withdrawal_requests;
drop policy if exists mfa_required on public.yor_mail;

create or replace function public.is_admin()
 returns boolean language sql stable security definer set search_path to ''
as $function$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin' and p.status = 'ACTIVE'
  );
$function$;

create or replace function public._bn_is_admin()
 returns boolean language sql stable security definer set search_path to 'public'
as $function$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'ACTIVE');
$function$;

create or replace function public.verify_pin(p_pin text)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare u uuid := (select auth.uid()); r jsonb; g uuid;
begin
  if u is null then raise exception 'unauthenticated' using errcode = '28000'; end if;
  r := public._check_pin(u, p_pin);
  if (r->>'ok')::boolean then
    delete from public.pin_grants where user_id = u and expires_at < now();
    insert into public.pin_grants (user_id, expires_at) values (u, now() + interval '2 minutes') returning token into g;
    return r || jsonb_build_object('grant', g);
  end if;
  return r;
end $function$;

create or replace function public._consume_grant(p_grant uuid)
 returns void language plpgsql security definer set search_path to ''
as $function$
declare n int;
begin
  delete from public.pin_grants where token = p_grant and user_id = (select auth.uid()) and expires_at > now();
  get diagnostics n = row_count;
  if n = 0 then raise exception 'pin_required' using errcode = '42501'; end if;
end $function$;

-- (la fonction public.mfa_ok() peut rester : plus rien ne l'appelle)
