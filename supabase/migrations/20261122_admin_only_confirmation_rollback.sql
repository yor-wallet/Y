-- Retour arrière de 20261122_admin_only_confirmation.sql : ré-exécute la définition sauvegardée et réactive la tâche planifiée.
do $$
declare r record;
begin
  for r in select definition from public.function_backups where tag = '20261122_admin_only_confirmation' order by id loop
    execute r.definition;
  end loop;
end $$;
select cron.alter_job(jobid, active := true) from cron.job where command like '%demo_advance_jobs%';
