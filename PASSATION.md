# OM Wallet — passation (état au 24/11/2026, web 14.5.1 · Android 14.5.2)

Document pour la session suivante. À lire en entier avec la skill du projet `.claude/skills/om-wallet/SKILL.md` (règles du
propriétaire, carte du projet, procédures) **avant** de toucher quoi que ce soit.

> **Le travail est sur la branche `claude/blissful-goldberg-426zi7`** (aucune pull request, rien n'est fusionné dans la branche
> par défaut). Partir de cette branche : `git fetch origin claude/blissful-goldberg-426zi7 && git checkout -B <branche de la session> FETCH_HEAD`.

---

## 1. Où on en est

| Élément | État |
|---|---|
| Dernier commit | voir `git log -1` sur la branche |
| Site en production | https://yor-wallet.vercel.app — version 14.5.1 (voir `changelog.md` ; contrôle : `curl -s https://yor-wallet.vercel.app/sw.js \| grep fp-shell` → `fp-shell-v14.5.1`) |
| Version | web 14.5.1 (`js/data/reference-data.js`, `sw.js`) · Android 14.5.2 (`android/app/build.gradle.kts` 140502, `android/README.md`) — la 14.5.2 ne touche que l'application Android (QR de dépôt visible, création de compte dans l'application), voir `changelog.md` |
| Base Supabase `gebjmguoauvutiqvoswl` | `20261124_crypto_swap.sql` **appliquée** (par le propriétaire, éditeur SQL) ; `20261125_close_legacy_instant_trades.sql` **appliquée** le 23/11 et `20261126_close_legacy_crypto_to_bank.sql` **appliquée** le 24/11 (anciennes fonctions à prix figés fermées aux utilisateurs, rien supprimé, retours arrière fournis — voir `changelog.md` 14.5.1) |
| Fonctions Edge | `crypto-swap` v1 (verify_jwt **true**) · `send-email` v59 (verify_jwt **false**, appelée par la base avec `x-webhook-secret`) · `wallet-addresses`, `admin-action` inchangées |
| Tests web | 9 suites vertes le 24/11 : omw, omx, trade, smoke (138 écrans), shell, bugfix, ios-motion, admin-console, admin-payouts ; mesure `tests/ux/perf-spot.mjs` |
| Tests Android | 48 tests Robolectric, 0 échec (24/11) ; APK debug 14.5.1, APK release (R8) et AAB release construits — release **non signés** (clé du propriétaire nécessaire) |
| Figma | fichier `sboQhYUgrVX2ocLBjlmNDu`, groupe `3:438` (cadres Marchés `3:2`, Spot `3:155`, Swap `3:357`), verre bleu + nouveau menu |

### Ce que fait la 14.5.0 (tout est en service)
- **Apparence « Verre »** web + Android : fond bleu lumineux, cartes en verre transparent, texte clair. **Plus aucun panneau blanc**
  (demande du propriétaire : « glass transparente, pas blanc qui fait mal aux yeux »). Réglage clair / sombre = bleu jour / nuit.
- **Menu principal** : Accueil · Marchés · Spot · Swap · Actifs. Activité et Compte dans l'en-tête de l'accueil.
- **Spot** : flux public Binance en direct (carnet, transactions, bougies), ordre au marché seulement (pas d'ordre limite : aucun bouton factice).
- **Swap réel** : prix fixé par le serveur (fonction `crypto-swap`, 30 s, usage unique, minimum 1 USD, 20 demandes/min)
  → vérification + compte à rebours → code PIN → `swap_execute` (montant mis de côté, opération EN COURS)
  → **seul l'administrateur confirme** (`admin_tx_confirm`, branche CRYPTO_SWAP : crédit, 2 lignes de grand livre, notification)
  → **un seul e-mail** « Échange confirmé » (`SWAP_CONFIRMED`, ar/en/fr) envoyé seulement si CONFIRMED + crédit visible au grand livre.
  Refus = montant rendu. Essai complet sur le serveur fait le 23/11 dans une transaction annulée : tout conforme (détail dans `changelog.md`).

---

## 2. Ce qui reste à faire

Fait le 24/11 (14.5.1) : faille des anciens échanges instantanés fermée côté serveur, anciens liens → vrai Swap, marché en direct
allégé (web : −93 % de script, −97 % de mises en page ; Android : flux arrêté hors écran, affichage regroupé toutes les 200 ms),
builds Android 14.5.1. Il reste seulement ce qui dépend du propriétaire :

### P1 — Signer la version Android de publication
`cd android && gradle testDebugUnitTest :app:assembleDebug :app:bundleRelease :app:assembleRelease` (JDK 17+, SDK 35,
`ANDROID_HOME=/opt/android-sdk`). Signature : variables `OM_KEYSTORE`, `OM_KEYSTORE_PASSWORD`, `OM_KEY_ALIAS`, `OM_KEY_PASSWORD`
(clé à fournir par le propriétaire, jamais dans le dépôt) ; sans elles l'AAB et l'APK release sortent **non signés** — le dire.
Regarder les rendus `android/app/build/screenshots/` (Spot, Swap, accueil) avant de livrer.
Table figée `market_prices` : au 24/11, seules les anciennes fonctions fermées la lisent (aucun écran web ou Android, aucune
fonction Edge du dépôt). Ne pas la présenter comme un cours en direct si elle revient un jour dans un écran.

### P2 — Premier échange réel (avec le propriétaire)
Aucun e-mail `SWAP_CONFIRMED` n'a encore été envoyé pour de vrai (aucun échange depuis la mise en service). Quand le propriétaire
fait un petit échange (≥ 1 USD) puis le confirme dans la console admin, contrôler :
```sql
select t.reference, t.status, t.confirmed_at, t.meta->'swap' swap,
  (select json_agg(json_build_object('asset', l.asset, 'delta', l.delta)) from public.ledger_entries l where l.transaction_id = t.id) ledger,
  (select json_agg(json_build_object('type', e.email_type, 'status', e.status)) from public.email_logs e where e.transaction_id = t.id) emails
from public.transactions t where t.kind = 'CRYPTO_SWAP' order by t.created_at desc limit 3;
```
Attendu : CONFIRMED, deux lignes de grand livre (− actif payé, + actif reçu), e-mails = un seul `SWAP_CONFIRMED` SENT
(+ les `ADMIN_TX_ACTION` des administrateurs à la création).

### P3 — Points connus, non bloquants (à signaler, pas à « corriger » sans demande)
- Brevo : l'adresse `EMAIL_FROM` n'est pas un expéditeur vérifié du compte ; `send-email` bascule seul sur l'expéditeur vérifié
  (contrôle `check` du 23/11 : clé valide, 1 expéditeur actif). Le propriétaire peut vérifier l'adresse dans Brevo.
- Conseiller sécurité Supabase : protection des mots de passe divulgués désactivée (réglage Auth du tableau de bord) ;
  3 fonctions avec `search_path` modifiable ; avertissements « security definer exécutable » attendus pour les RPC qui vérifient l'appelant.
- Lacunes listées au §6 de la skill (pas de détection automatique des dépôts, pas de FCM admin, WalletConnect non branché, etc.).
- Phase 5 (reçus partageables / PDF) : **volontairement non faite** — seulement si le propriétaire la demande.

---

## 3. Règles à ne jamais oublier (extrait — la liste complète est dans la skill)
- Aucune suppression de données ; aucun montant historique modifié ; anciennes données CFA intactes, jamais converties.
- Avant toute migration : vérifier les dépendances, écrire `…_rollback.sql`, sauvegarder les fonctions remplacées (`function_backups`).
- Jamais de fausse adresse, de faux « en direct », de fausse confirmation, de bouton inactif, d'écran décoratif présenté comme réel.
- Seul l'administrateur confirme ; un seul bouton, un seul crédit, un seul e-mail, aucun e-mail avant le crédit, aucun doublon.
- Les utilisateurs ordinaires ne voient que « En cours », puis « Confirmé » ou « Refusé ». Jamais le mot administrateur.
- E-mails dans la langue de la personne (ar / en / fr). Réduction des animations respectée (web et Android).
- Le logo de l'application sur chaque écran. Logos crypto officiels uniquement (web3icons « background », XRP du kit XRPL).
- Style « OM Ink » papier / bleu nuit **refusé** ; panneaux blancs **refusés** depuis la 14.5.0.
- Ne pas demander de confirmation pour ce qui est déjà décidé ; ne pas modifier les instructions du propriétaire ; ne pas prétendre
  avoir fait ce qui n'est pas vérifié.
- Commits : en français, terminés par les deux lignes d'attribution de la session. Pas de pull request sans demande.
  Secrets (clé Brevo, clé maître des portefeuilles, secret du webhook) : jamais affichés, jamais écrits.

---

## 4. Fiche technique

**Identifiants.** Supabase `gebjmguoauvutiqvoswl` · Vercel projet `prj_uRkEgOnfKYdXmpJ2D2161mbaJHpA`, équipe
`team_b1invDzTYyVjIAUAWoEFnPIv` · GitHub `yor-wallet/Y`.

**Déployer le web.** `mcp__Vercel__create_deployment` avec `requestBody` `{ name: "y", project: "prj_uRkEgOnfKYdXmpJ2D2161mbaJHpA",
target: "production", gitSource: { type: "github", org: "yor-wallet", repo: "Y", ref: "<branche>", sha: "<commit>" } }` et `teamId`,
puis `get_deployment` jusqu'à READY, puis `curl -s https://yor-wallet.vercel.app/sw.js | grep fp-shell`.

**Migrations.** `apply_migration` est resté bloqué 6 fois le 23/11 (la confirmation demandée n'arrivait pas au propriétaire) : ne jamais
la contourner. Solution qui a marché : donner le fichier SQL au propriétaire, qui le colle dans l'éditeur SQL de Supabase ; un simple
`revoke` est passé par `execute_sql`. Toujours tester ensuite dans un bloc `do $$ … raise exception … $$` (tout est annulé).

**Fonctions Edge.** `deploy_edge_function` avec le fichier entier en ligne. `send-email` : `verify_jwt` **false** (ne pas changer).
La v59 déployée est identique à `supabase/functions/send-email/index.ts` (seule différence : la dernière ligne `});` est écrite
`}` puis `);`). Aperçu sans envoi, depuis la base (le secret reste côté serveur) :
```sql
select net.http_post(url := 'https://gebjmguoauvutiqvoswl.supabase.co/functions/v1/send-email',
  headers := jsonb_build_object('content-type','application/json','x-webhook-secret', public.get_webhook_secret()),
  body := jsonb_build_object('dry_run', true, 'log_id', '<id email_logs>'));   -- puis lire net._http_response
```
**Ne jamais faire d'aperçu d'un `ADMIN_TX_ACTION`** : il crée de nouveaux liens administrateur et remplace les précédents.
`{ "check": true }` donne l'état des fournisseurs d'e-mail sans secret.

**Échange (fichiers).** Serveur : `supabase/migrations/20261124_crypto_swap.sql` (+ `_rollback.sql`), `supabase/functions/crypto-swap/index.ts`,
`supabase/functions/send-email/index.ts` (`SWAP_CONFIRMED`). Web : `js/screens/omx-trade.js` (Spot, Swap, vérification, suivi),
`css/trade.css`, `css/verre.css`, `js/screens/admin-dy.js` (détail de l'échange dans la console). Android :
`android/feature-markets/.../TradeScreens.kt`, `core-network/MarketApi.kt`, `core-network/SupabaseApi.kt`, `core-data/Repositories.kt`.
Tests : `tests/ux/trade.test.mjs` (banc `tests/ux/harness.mjs` : prix Binance fixes, flux WS simulé `ws:'live'`, `swapOff`, `quoteTtl` ;
faux Supabase `tests/ux/mock-supabase.js`), Android `ScreensTest.kt` + `FakeBackend.kt`.

**Commandes.**
```bash
node tools/build.mjs
for t in shell smoke bugfix omx omw trade admin-console ios-motion admin-payouts; do node tests/ux/$t.test.mjs; done
cd android && gradle testDebugUnitTest :app:assembleDebug     # 48 tests attendus
```
Le bouton `.btn` ignore un second appui pendant 450 ms (anti double appui) : en test, attendre ~1,3 s entre deux appuis sur le même bouton.

---

## 5. Message à coller pour démarrer la session suivante

> Projet OM Wallet (dépôt yor-wallet/Y). Le travail est sur la branche `claude/blissful-goldberg-426zi7` : pars de cette branche.
> Lis d'abord `PASSATION.md` et la skill `.claude/skills/om-wallet/SKILL.md`, puis fais les tâches P1 et P2 de `PASSATION.md` dans l'ordre,
> en respectant toutes les règles du propriétaire. Ne redemande pas ce qui est déjà décidé. À la fin, dis précisément ce qui est
> vérifié et ce qui ne l'est pas.
