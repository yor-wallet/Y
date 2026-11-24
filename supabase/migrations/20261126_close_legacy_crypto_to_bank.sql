-- OM Wallet 14.5.1 — ferme l'ancienne conversion crypto → virement bancaire (octobre 2026)
--
-- Pourquoi : public.crypto_to_bank débite la crypto tout de suite et évalue le virement au cours de public.market_prices, figé au
-- 4 octobre 2026 (BTC 84 500 $ dans la table contre ~61 000 $ réels le 24/11/2026). Même défaut que les anciens achat / vente /
-- échange fermés par 20261125_close_legacy_instant_trades.sql : « aucune fausse donnée présentée comme en direct ».
-- Jamais utilisée : 0 opération CRYPTO_TO_BANK en base au 24/11/2026. Les retraits réels passent par les écrans Retrait
-- (banque OMR et crypto), confirmés par l'administrateur.
--
-- Ce que fait ce fichier : retire le droit d'exécution aux utilisateurs connectés (rôle authenticated). RIEN n'est supprimé.
-- Le rôle service_role garde son droit (les fonctions Edge ne sont pas concernées).
-- Dépendances vérifiées le 24/11/2026 : aucune fonction SQL ne l'appelle ; Android ne l'appelle pas ; seul l'ancien écran web
-- crypto-to-bank (js/features/crypto-buy.js) l'appelle, et il est masqué (FEATURES.crypto: false → retour à l'accueil).
--
-- Droits avant : {postgres=X, authenticated=X, service_role=X}.
-- APPLIQUÉE le 24/11/2026 (execute_sql) ; vérifié après : authenticated n'a plus EXECUTE.
-- Retour arrière : 20261126_close_legacy_crypto_to_bank_rollback.sql

revoke execute on function public.crypto_to_bank(text, text, numeric, text, text, text, text, uuid) from authenticated;
