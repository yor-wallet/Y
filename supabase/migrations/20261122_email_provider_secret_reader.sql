-- OM Wallet 14.1.2 — the send-email function reads its provider keys from Supabase Vault (encrypted at rest) when they are not set as
-- Edge Function secrets. The key itself is stored with vault.create_secret(<key>, 'brevo_api_key', ...) — never in this repository.
-- Only the service role (the Edge Function) may call this; users, the browser and anonymous callers cannot. Only these names can be read.
create or replace function public.get_email_provider_secret(p_name text) returns text
language sql stable security definer set search_path to ''
as $$
  select ds.decrypted_secret from vault.decrypted_secrets ds
  where ds.name = p_name and p_name in ('brevo_api_key', 'smtp_pass', 'resend_api_key')
  order by ds.updated_at desc limit 1
$$;
revoke all on function public.get_email_provider_secret(text) from public, anon, authenticated;
grant execute on function public.get_email_provider_secret(text) to service_role;
-- Rollback: drop function public.get_email_provider_secret(text);  (and, if wanted, delete the vault secret named 'brevo_api_key')
