-- Retour arrière de 20261125_close_legacy_instant_trades.sql : rend aux utilisateurs connectés le droit d'appeler les anciennes
-- fonctions d'achat / vente / échange instantanés (état d'avant). Ne supprime rien.
grant execute on function public.crypto_buy(text, numeric, text, uuid) to authenticated;
grant execute on function public.crypto_sell(text, numeric, text, uuid) to authenticated;
grant execute on function public.crypto_swap(text, text, numeric, text, uuid) to authenticated;
