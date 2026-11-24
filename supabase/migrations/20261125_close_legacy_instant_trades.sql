-- OM Wallet 14.5.1 — ferme les anciens achat / vente / échange instantanés (octobre 2026)
--
-- Pourquoi : public.crypto_buy, public.crypto_sell et public.crypto_swap créditent tout de suite, SANS l'administrateur, au cours
-- de public.market_prices figé au 4 octobre 2026 (BTC 84 500 $ dans la table contre ~61 000 $ réels le 23/11/2026, soit +38 %).
-- Contraire aux règles du propriétaire : « seul l'administrateur confirme », « aucune fausse donnée présentée comme en direct ».
--
-- Ce que fait ce fichier : retire le droit d'exécution aux utilisateurs connectés (rôle authenticated). RIEN n'est supprimé :
-- les fonctions restent en place, ainsi que les 7 opérations historiques (4 achats, 2 ventes, 1 échange) et la table market_prices.
--
-- Dépendances vérifiées le 23/11/2026 :
--   - aucune fonction SQL du schéma public ne les appelle ;
--   - aucune fonction Edge (ai-assist et bm-agents relues ; send-email, crypto-swap, wallet-addresses, admin-action non concernées) ;
--   - l'application Android ne les appelle pas ;
--   - seuls les anciens écrans web crypto-buy / crypto-sell / crypto-swap (js/features/crypto-buy.js, js/wire.js) les appellent ;
--     ils étaient déjà masqués (FEATURES.crypto: false) et, depuis 14.5.1, un ancien lien vers eux ouvre le nouvel écran Swap.
-- L'échange réel passe par la fonction Edge crypto-swap + swap_execute + admin_tx_confirm (20261124_crypto_swap.sql).
--
-- Droits avant : {postgres=X, authenticated=X, service_role=X} sur les trois fonctions (anon et PUBLIC : aucun).
-- APPLIQUÉE le 23/11/2026 (execute_sql) ; vérifié après : authenticated n'a plus EXECUTE, swap_execute (nouvel échange) inchangé.
-- Retour arrière : 20261125_close_legacy_instant_trades_rollback.sql

revoke execute on function public.crypto_buy(text, numeric, text, uuid) from authenticated;
revoke execute on function public.crypto_sell(text, numeric, text, uuid) from authenticated;
revoke execute on function public.crypto_swap(text, text, numeric, text, uuid) from authenticated;
