-- Retour arrière de 20261126_close_legacy_crypto_to_bank.sql : rend aux utilisateurs connectés le droit d'appeler l'ancienne
-- conversion crypto → virement bancaire (état d'avant). Ne supprime rien.
grant execute on function public.crypto_to_bank(text, text, numeric, text, text, text, text, uuid) to authenticated;
