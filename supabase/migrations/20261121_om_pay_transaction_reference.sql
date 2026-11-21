-- OM PAY : nouveau format de référence pour les FUTURES transactions : « OMT » + 8 chiffres (ex. OMT89274631).
--   • unique : nouvelle séquence om_reference_seq ; la permutation (n × 48271 + 17317) mod 10^8 est une bijection (48271 est premier avec 10^8) : aucune collision
--     possible avant 10^8 références, et la contrainte UNIQUE de transactions.reference reste le dernier garde-fou ;
--   • traçable : chaque référence correspond à un numéro de séquence ; la transaction est retrouvée par sa référence exacte ;
--   • les références HISTORIQUES (BMCT26…) ne sont jamais modifiées ; l'ancienne séquence bmct_reference_seq est conservée ;
--   • le préfixe ne ressemble plus à celui d'une banque.
-- Retour arrière : 20261121_om_pay_transaction_reference_rollback.sql
create sequence if not exists public.om_reference_seq start 1 minvalue 1 maxvalue 99999999 no cycle;

create or replace function public.new_tx_reference() returns text
  language sql set search_path to ''
as $$
  select 'OMT' || lpad(((nextval('public.om_reference_seq') * 48271 + 17317) % 100000000)::text, 8, '0')
$$;
