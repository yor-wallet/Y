-- Retour arrière de 20261122_admin_tx_confirmation.sql
-- 1. AVANT : confirmer ou refuser dans Admin Control toutes les transactions « en attente de l'administrateur »
--    (select count(*) from public.transactions where meta->>'confirm' = 'ADMIN' and status = 'PENDING' doit valoir 0),
--    sinon leurs montants resteraient réservés chez l'expéditeur.
-- 2. Ré-exécute mot pour mot les définitions sauvegardées avant la migration (public.function_backups).
-- 3. Retire les trois fonctions ajoutées. Aucune donnée supprimée : les colonnes confirmed_at / confirmed_by et les sauvegardes restent.
do $$
declare r record; n int;
begin
  select count(*) into n from public.transactions where meta ->> 'confirm' = 'ADMIN' and status = 'PENDING';
  if n > 0 then raise exception 'rollback_blocked: % transaction(s) still awaiting admin confirmation', n; end if;
  for r in select definition from public.function_backups where tag = '20261122_admin_tx_confirmation' order by id loop
    execute r.definition;
  end loop;
end $$;
drop function if exists public.admin_tx_confirm(uuid);
drop function if exists public.admin_tx_reject(uuid, text);
drop function if exists public.admin_tx_list(text, integer);
