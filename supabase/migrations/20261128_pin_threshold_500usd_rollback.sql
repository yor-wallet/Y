-- Retour arrière de 20261128_pin_threshold_500usd.sql : remet les 5 fonctions exactement comme avant (code exigé pour tout montant).
do $$
declare r record;
begin
  for r in select distinct on (name) name, definition from public.function_backups where tag = '16.4.0-before' order by name, saved_at desc loop
    execute r.definition;
  end loop;
end $$;
-- (public._usd_of et public._pin_gate peuvent rester : plus rien ne les appelle)
