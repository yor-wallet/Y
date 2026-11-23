-- ============================================================
-- OM Wallet 14.1.1 — « Seul l'administrateur peut confirmer les transactions » : les deux derniers chemins automatiques sont fermés.
-- 1. _fiat_send_external_impl créait l'envoi vers un numéro directement « CONFIRMED » (aucun paiement réel derrière) :
--    il est désormais enregistré PROCESSING avec payout = MANUAL. Il apparaît dans Admin Control › Transferts (archives) › versements,
--    et seul admin_payout_confirm (avec la référence du paiement réel) le termine ; un refus le rembourse. Débit inchangé.
-- 2. La tâche planifiée demo_advance_jobs (simulateur qui faisait passer des transferts « bancaires » à COMPLETED tout seul)
--    est désactivée (cron.alter_job, réversible). Elle n'a jamais traité qu'un transfert (2026-10-20). Rien n'est supprimé.
-- Sauvegarde exacte de la fonction remplacée : public.function_backups (tag 20261122_admin_only_confirmation).
-- ============================================================
do $$
declare d text; d2 text;
begin
  d := pg_get_functiondef('public._fiat_send_external_impl(numeric,text,text,jsonb,text)'::regprocedure);
  if not exists (select 1 from public.function_backups where tag = '20261122_admin_only_confirmation') then
    insert into public.function_backups (tag, name, definition) values ('20261122_admin_only_confirmation', '_fiat_send_external_impl(numeric,text,text,jsonb,text)', d);
  end if;
  d2 := d;
  d2 := replace(d2, 'v_amt, v_fee, v_total, ''CONFIRMED'',', 'v_amt, v_fee, v_total, ''PROCESSING'',');
  d2 := replace(d2, 'jsonb_build_object(''vat'', v_vat, ''provider''', 'jsonb_build_object(''payout'', ''MANUAL'', ''vat'', v_vat, ''provider''');
  d2 := replace(d2, '(v_u, ''TRANSFER_SENT'', ''Transfer sent'', v_amt::text || '' OMR to '' || v_name, v_tx,',
                    '(v_u, ''TRANSFER_PENDING'', ''Transfer pending'', v_amt::text || '' OMR to '' || v_name || '' · awaiting confirmation'', v_tx,');
  d2 := replace(d2, '''reference'', v_ref, ''status'', ''CONFIRMED'',', '''reference'', v_ref, ''status'', ''PROCESSING'', ''payout'', ''MANUAL'',');
  -- every one of the four edits must have applied, otherwise nothing changes
  if d2 = d or position('''PROCESSING'',' in d2) = 0 or position('''payout'', ''MANUAL'', ''vat''' in d2) = 0
     or position('TRANSFER_PENDING' in d2) = 0 or position('''status'', ''PROCESSING'', ''payout''' in d2) = 0 then
    raise exception 'patch_not_applied';
  end if;
  execute d2;
end $$;

select cron.alter_job(jobid, active := false) from cron.job where command like '%demo_advance_jobs%' and active;
