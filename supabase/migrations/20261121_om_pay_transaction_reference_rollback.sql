-- Retour arrière : les nouvelles transactions reprennent l'ancien format BMCT. Les références déjà créées (OMT…) ne sont pas modifiées.
create or replace function public.new_tx_reference() returns text
  language sql set search_path to ''
as $$
  select 'BMCT' || to_char(now() at time zone 'utc', 'YY') || lpad(nextval('public.bmct_reference_seq')::text, 10, '0');
$$;
