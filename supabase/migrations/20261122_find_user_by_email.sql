-- OM Wallet 14.2 — envoi interne par adresse e-mail (application Android).
-- Ajout seulement : aucune table, aucune donnée n'est modifiée ni supprimée. Déjà appliquée sur le projet le 2026-11-22.
-- La fonction renvoie au plus UN compte ACTIF correspondant exactement à l'e-mail, avec un nom masqué (prénom + initiale) :
-- l'expéditeur ne voit jamais la liste des e-mails ni le nom complet. Réservée aux utilisateurs connectés.
-- Retour arrière : drop function public.find_user_by_email(text);
create or replace function public.find_user_by_email(p_email text) returns table(yor_id text, display_name text, self boolean)
language sql stable security definer set search_path to '' as $$
  select p.yor_id,
         coalesce(nullif(btrim(p.first_name), ''), 'OM Wallet') || coalesce(' ' || nullif(left(btrim(p.last_name), 1), '') || '.', ''),
         p.id = (select auth.uid())
  from public.profiles p
  where (select auth.uid()) is not null and lower(btrim(p.email)) = lower(btrim(coalesce(p_email, '')))
    and length(btrim(coalesce(p_email, ''))) between 5 and 254 and p.status = 'ACTIVE'
  limit 1 $$;
revoke all on function public.find_user_by_email(text) from public, anon;
grant execute on function public.find_user_by_email(text) to authenticated;
