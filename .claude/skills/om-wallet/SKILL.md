---
name: om-wallet
description: Règles du propriétaire, carte du projet et procédures d'OM Wallet (application web PWA + application Android native + Supabase + Vercel + e-mails Brevo). À utiliser dès qu'une tâche touche OM Wallet / Yor Wallet — portefeuille crypto, dépôt, retrait, envoi interne, confirmation par l'administrateur, adresses de dépôt, QR, e-mails de transaction, migrations Supabase, fonctions Edge, déploiement Vercel, build Android, logo, page de connexion ou design « OM Glass » — même si la demande ne cite pas le nom du projet. Rappelle ce qui est interdit (suppression de données, fausses adresses, fausses confirmations, boutons factices) avant de modifier quoi que ce soit.
---

# OM Wallet — règles, carte du projet, procédures

Le propriétaire a donné des consignes strictes et les a répétées plusieurs fois. Elles passent avant toute idée d'amélioration : une fonction « utile » ajoutée sans demande ou une instruction « adaptée » est une faute, pas une initiative. En cas de doute, appliquer la consigne à la lettre ; ne pas poser de question sur une décision déjà prise.

## 1. Règles non négociables

**Interface d'échange (Spot / Swap / Marchés)** : principes tirés de Revolut et Binance, sans copier leurs écrans — voir `references/design-research.md`.

**Données (voir `references/rules.md` pour les citations exactes)**
- Aucune suppression de données en base. Jamais d'historique supprimé ni de montant historique modifié. Les anciennes données CFA/XOF restent intactes, ne sont jamais converties en crypto, et n'apparaissent qu'en lecture seule (« Historique CFA (archivé) »).
- Avant toute migration : vérifier les dépendances, préparer un fichier `*_rollback.sql` et sauvegarder les fonctions remplacées (table `function_backups`). Pas de `drop … if exists` sur des objets portant des données.

**Honnêteté (le produit manie de l'argent : un faux état coûte cher)**
- Jamais de fausse adresse de dépôt, jamais de donnée factice présentée comme « en direct », jamais de confirmation financière fabriquée. Une transaction n'est « confirmée » que si le serveur l'a confirmée.
- Pas d'écran décoratif présenté comme fonction réelle, pas de bouton inactif qui donne l'impression de fonctionner. Si une fonction n'existe pas, l'écran le dit.
- Pas de logo générique inventé, pas de logo/texte/écran copié d'une autre marque.
- Rapports finaux : dire ce qui est vérifié, ce qui ne l'est pas, et les lacunes (voir §6).

**Transactions**
- Seul l'administrateur confirme. Un seul bouton Confirmer par transaction, un seul e-mail, un seul crédit, aucun e-mail avant le crédit, aucun doublon de crédit ou de notification. Aucun autre administrateur, aucune autorisation supplémentaire.
- L'administrateur reçoit une notification dans l'application et un e-mail avec Confirmer / Refuser / Mettre en pause (liens à usage unique, 72 h).
- Les utilisateurs ordinaires ne voient que « En cours » (animé, temps réel), puis « Transfert confirmé » ou « Refusé ». Jamais « en attente de la confirmation de l'admin », jamais le mot administrateur.
- Pour la blockchain : l'accord de l'admin déclenche l'exécution ; l'état « reçu » et l'e-mail « Fonds reçus » attendent la confirmation effective du réseau.
- Chaque utilisateur a ses propres adresses de dépôt, différentes par réseau et générées par le serveur (vraie clé chiffrée, stockée avec l'adresse), et un QR code unique, sauvegardé.
- E-mails dans la langue de la personne (ar / en / fr). Détail du transfert dans « Transfert confirmé » (expéditeur), « Fonds reçus » (destinataire).

**Design (consigne du 23/11, précisée en 14.5.0)**
- Suivre les visuels du propriétaire dans `brand/originals/` (`ref-login`, `ref-home`, `ref-settings`, `ref-assets`, `ref-profile`, `ref-receipt`, `ref-admin`, `promo-1-ar`, `promo-2-ar`, `app-icon-glass`) : bleu ciel, surfaces transparentes, effet verre. Connexion = `ref-login` (grande icône verre, mot-symbole, carte de verre, bouton dégradé).
- **14.5.0 : « glass transparente, pas blanc qui fait mal aux yeux »** — fond bleu lumineux, cartes en verre transparent, texte clair, aucun panneau blanc (web `css/verre.css`, Android jetons `OmColors`). Menu principal : Accueil · Marchés · Spot · Swap · Actifs ; le logo de l'application sur chaque écran.
- Le style « papier / bleu nuit » (OM Ink) a été **refusé** : ne pas y revenir.
- Avec le verre, la couleur de texte du thème est **blanche** (`OmColors.Ink`, `--w-ink`) : ne jamais l'utiliser pour dessiner sur une surface blanche. Un QR code est **toujours foncé sur blanc** (Android `QR_DARK`, web SVG noir sur blanc) — en 14.5.0 le QR de dépôt Android était blanc sur blanc (corrigé en 14.5.2, test qui décode l'image affichée). Les captures de test Android doivent montrer l'écran sur son vrai fond (`inApp { }` dans ScreensTest).
- Une refonte change la composition des écrans et les interactions, pas seulement les couleurs ; chaque bouton redessiné reste relié à sa fonction existante (vérifier avec `tests/ux/omw.test.mjs`).
- Images publicitaires : jamais de bouton ou de texte imprimé dans une image présenté comme réel ; les textes sont effacés et remplacés par de vrais éléments traduits.
- Polices : Sora (latin) + Tajawal (arabe), auto-hébergées. Animations : respecter « réduire les animations » ; pas d'animation lourde permanente.
- Interdiction de modifier les instructions du propriétaire ou d'ajouter des fonctions cassées.

## 2. Carte du projet

| Zone | Où |
|---|---|
| Web (PWA statique) | racine du dépôt : `index.src.html` → `node tools/build.mjs` produit `js/app.js` + `css/app.css` (un seul bundle) ; sources dans `js/` et `css/` (`architecture.md` explique l'ordre) ; service worker `sw.js` |
| Version | `js/data/reference-data.js` (`version:'x.y.z'`), `sw.js` (`fp-shell-vx.y.z`), `android/app/build.gradle.kts`, `android/README.md`, `changelog.md` |
| Écrans clés web | `js/screens/omx.js` (accueil crypto, dépôt, QR), `omx-send.js`, `omx-withdraw.js`, `info.js`, `admin-dy.js`, `js/features/v12.js` (en-têtes de connexion), `admin-action.html` (page des liens e-mail) |
| Android | `android/` (Kotlin 2.1, Compose, modules `core-*`, `feature-*`, `app`) ; textes en/fr/ar |
| Serveur | Supabase projet `gebjmguoauvutiqvoswl` : migrations `supabase/migrations/`, fonctions Edge `send-email` (verify_jwt false), `wallet-addresses`, `admin-action`, `crypto-swap` (prix d'échange fixé côté serveur) |
| Spot / Swap (14.5) | web `js/screens/omx-trade.js`, `css/trade.css` ; Android `feature-markets/TradeScreens.kt` ; serveur `20261124_crypto_swap.sql` (`swap_execute`, `admin_tx_confirm` branche CRYPTO_SWAP, e-mail `SWAP_CONFIRMED`). Anciennes fonctions à prix figés (`crypto_buy/sell/swap`, `crypto_to_bank`) fermées aux utilisateurs en 14.5.1 : ne pas les rouvrir |
| Passation | `PASSATION.md` à la racine : état, reste à faire, fiche technique |
| Déploiement | Vercel projet `prj_uRkEgOnfKYdXmpJ2D2161mbaJHpA` (équipe `team_b1invDzTYyVjIAUAWoEFnPIv`), site `https://yor-wallet.vercel.app` ; GitHub `yor-wallet/Y` |
| Identité | `brand/` : originaux et visuels de référence (`brand/originals/`), `python3 brand/make_assets.py` régénère icônes web, favicon, logos, calques Android |
| Design | `css/omw.css` (couche finale), `js/ui/omw.js` (interactions), `js/features/onboarding.js` (présentation), Android `core-design` (Theme, Components) et `app/OnboardingScreen.kt` |
| Tests | `tests/ux/*.test.mjs` (Playwright + faux Supabase), `tests/keys` (vecteurs de dérivation d'adresses), Android `testDebugUnitTest` |

Secrets : la clé Brevo est dans le Vault Supabase (`brevo_api_key`), la clé maître des portefeuilles dans `wallet_master_key`. Ne jamais les afficher, les écrire dans un fichier, un commit ou un message.

## 3. Commandes

```bash
# Web
node tools/build.mjs                         # régénère js/app.js et css/app.css (obligatoire après tout changement de js/ ou css/)
for t in shell smoke bugfix omx omw trade admin-console ios-motion admin-payouts; do node tests/ux/$t.test.mjs; done   # tout doit passer
node tests/ux/perf-spot.mjs 3                # coût du marché en direct (14.5.1 : ~100 ms de script / 6 s sur un marché très actif)
cd tests/keys && npm install && npm test     # dérivation des adresses (Node 22)

# Android (JDK 17+, SDK 35, ANDROID_HOME=/opt/android-sdk, Gradle dans /opt/gradle)
cd android && gradle testDebugUnitTest :app:assembleDebug :app:bundleRelease :app:assembleRelease   # 53 tests attendus
```

Les rendus d'écran Android (Robolectric, pas un émulateur) sont dans `android/app/build/screenshots/`. Les regarder après toute modification d'interface.

## 4. Procédures

**Livrer une version** : changer la version aux 5 endroits (§2), ajouter l'entrée en tête de `changelog.md`, `node tools/build.mjs`, lancer les tests, committer, pousser sur la branche de développement indiquée par la session (jamais d'autre branche sans accord, pas de pull request sauf demande), puis déployer en production avec `mcp__Vercel__create_deployment` (`gitSource` github `yor-wallet`/`Y`, `ref`, `sha` du commit, `target: production`) et vérifier en direct (`curl https://yor-wallet.vercel.app/sw.js | grep fp-shell`).

**Migration Supabase** : lire les tables/fonctions touchées, écrire `…_rollback.sql`, appliquer par `apply_migration` (sans `drop` de données), puis tester dans une transaction annulée (`begin … rollback`) avec des identifiants de test ; jamais sur des données réelles. Contrôler `get_advisors` ensuite. Si `apply_migration` reste bloquée (la confirmation n'arrive pas au propriétaire), ne jamais la contourner : donner le fichier SQL au propriétaire pour l'éditeur SQL de Supabase.

**Marché en direct** : appliquer chaque message aussitôt aux données, mais ne repeindre / recomposer l'écran qu'au plus toutes les 200 ms ; arrêter le flux quand l'écran n'est pas visible (web `visibilitychange`, Android cycle de vie STARTED) ; aucune lecture de mise en page par image.

**Fonction Edge** : déployer par `deploy_edge_function` (fichiers en ligne), relire la version déployée, vérifier les journaux.

**Commits** : message en français, terminé par les deux lignes d'attribution données par la session (`Co-Authored-By` et `Claude-Session`). Aucun identifiant de modèle ailleurs dans le dépôt.

## 5. Avant de répondre « c'est fait »

Relire les règles du §1 contre ce qui a été changé : un utilisateur ordinaire peut-il voir autre chose que « En cours » ? Un bouton fait-il vraiment quelque chose ? Une donnée affichée vient-elle bien du serveur ? Un texte existe-t-il en ar/en/fr ? Si une vérification n'a pas pu être faite (appareil réel, réseau blockchain, signature release), le dire.

## 6. Lacunes connues (à ne pas masquer)

Refonte 14.4.0 : en-tête de référence partout (web `refTop()` dans helpers.js, Android `RefHeader` dans core-design/Reference.kt) ; l'intérieur des formulaires garde son ordre. Pas de détection automatique des dépôts (l'administrateur crédite après vérification sur le réseau) ; retrait crypto « confirmé par le réseau » repose sur le hash saisi par l'admin, sans vérification on-chain ; pas de notification push (FCM) pour l'administrateur ; Trust Wallet / WalletConnect non branché ; aucun test sur appareil ou émulateur ; AAB release non signé ; images de lancement iOS (`assets/splash`) avec l'ancien logo ; écran d'accueil illustré fourni (texte arabe incrusté) conservé comme référence, non utilisé dans l'application ; Phase 5 (reçus partageables, PDF) volontairement non faite.
