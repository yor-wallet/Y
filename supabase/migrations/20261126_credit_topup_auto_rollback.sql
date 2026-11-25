-- Retour arrière de 20261126_credit_topup_auto.sql : restaure l'ancienne _credit_topup_request_impl (sauvegarde, tag '20261126_credit_topup_auto'),
-- rend credit_topup_request aux utilisateurs et retire les droits des nouvelles fonctions. NE SUPPRIME RIEN : les opérations
-- CREDIT_TOPUP déjà créées (y compris AUTO) et leurs lignes de grand livre restent. À n'exécuter que sans opération AUTO « en cours »
-- (leur montant réservé serait sinon à rendre avec admin_topup_resolve(... 'failed') avant).
do $$
declare b record;
begin
  for b in
    select distinct on (name) name, definition from public.function_backups
    where tag = '20261126_credit_topup_auto' and name = '_credit_topup_request_impl'
    order by name, saved_at asc
  loop
    execute b.definition;
  end loop;
end $$;
grant execute on function public.credit_topup_request(text, text, numeric, text, uuid) to authenticated;
revoke all on function public.topup_auto_create(uuid, text, text, numeric, text, uuid) from service_role;
revoke all on function public.topup_provider_claim(uuid) from service_role;
revoke all on function public.topup_auto_mark_unknown(uuid, text) from service_role;
revoke all on function public.topup_record_sms(uuid, text, text, text, jsonb) from service_role;
revoke all on function public.admin_topup_resolve(uuid, text, text, text) from authenticated, service_role;
