# OM Wallet — passation (état au 25/11/2026, version web 15.3.0 · Android 15.3.0)

Document pour la session suivante. À lire en entier avec la skill du projet `.claude/skills/om-wallet/SKILL.md` (règles du
propriétaire, carte du projet, procédures) **avant** de toucher quoi que ce soit.

> **Le travail le plus récent est sur la branche `claude/intelligent-keller-lrjxah`** (15.1.0 : mouvement et retour en temps réel du web + **fusion** de la branche `claude/blissful-goldberg-426zi7` — transfert de crédit 15.0.x et site vitrine ; 14.9.0 : identité originale « Arche », le logo du propriétaire ne sert que d'icône ; 14.8.0 : design « Noir & Jaune » comme Liv X et Binance), partie de `claude/blissful-goldberg-426zi7` (14.5.3). `main` contient une 14.6.0 « verre liquide » **abandonnée** (jamais
> reprise ici : la branche l'a fusionnée sans ses changements). Partir de cette branche :
> `git fetch origin claude/intelligent-keller-lrjxah && git checkout -B <branche de la session> FETCH_HEAD`.

---

## 1. Où on en est

| Élément | État |
|---|---|
| Dernier commit | voir `git log -1` sur la branche |
| Site en production | https://yor-wallet.vercel.app — version 17.2.0 (contrôle : `curl -s https://yor-wallet.vercel.app/sw.js \| grep fp-shell` → `fp-shell-v17.2.0`) |
| Version | web 17.2.0 (`js/data/reference-data.js`, `sw.js`, `changelog.md`) · Android 15.3.0 inchangé (`android/app/build.gradle.kts` 150300, `android/README.md`) |
| Base Supabase `gebjmguoauvutiqvoswl` | `20261124_crypto_swap.sql` **appliquée** (par le propriétaire, éditeur SQL) ; `20261125_close_legacy_instant_trades.sql` **appliquée** le 23/11 et `20261126_close_legacy_crypto_to_bank.sql` **appliquée** le 24/11 (anciennes fonctions à prix figés fermées aux utilisateurs, rien supprimé, retours arrière fournis — voir `changelog.md` 14.5.1) |
| Fonctions Edge | `crypto-swap` v1 (verify_jwt **true**) · `send-email` v59 (verify_jwt **false**, appelée par la base avec `x-webhook-secret`) · `wallet-addresses`, `admin-action` inchangées |
| Tests web | **23 suites vertes le 26/11** (toutes celles de `tests/ux/*.test.mjs`, dont la nouvelle `motion-system` — 15 vérifications image par image —, smoke 132 contrôles d'écran, words 180) ; mesures `tests/ux/motion-audit.mjs`, `tests/ux/motion-film.mjs`, `tests/ux/perf-spot.mjs` |
| Tests Android | 53 tests Robolectric, 0 échec (24/11, 14.7.0) ; APK de publication 14.7.0 signé avec une **clé temporaire de session** (hors dépôt, perdue avec la session : la prochaine version devra être signée avec la clé du propriétaire, ce qui obligera à désinstaller puis réinstaller) |
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

## 1 octies. 16.0.0 (26/11) — système de mouvement (web) : où il vit, les règles à garder

- **Audit et mesures** : `docs/mouvement/AUDIT.md` (avant / après). Re-mesurer : `node tests/ux/motion-audit.mjs <dossier> 4` (processeur ralenti 4×) ; voir une transition image par image : `node tests/ux/motion-film.mjs <dossier>` (planches S0.png…).
- **Jetons** : ressorts calculés dans `js/ui/ios-motion.js` (`IOS.SPR` : smooth, push, snappy, gentle, press → variables CSS `--m-<nom>` et `--m-<nom>-d`) ; durées et courbes dans `css/motion-system.css` §1 (`--m-out`, `--m-in`, `--m-std`, `--m-d-xs/s/m/l`). Les anciennes familles (`--t-*`, `--om-*`, `--w-*`, `--px-*`, `--mo-*`) y renvoient : ne pas en créer de nouvelle. `css/motion-system.css` est **la dernière feuille** : la garder en dernier.
- **Une navigation = un mouvement** : `IOS.kindOf(info)` nomme la manière d'arriver (`push`, `pop`, `present`, `dismiss`, `fade`, ou `null` = même écran redessiné). L'entrée des blocs (`js/ui/omw.js`) et la pastille (`js/ui/motion.js`) la lisent. Un nouvel onglet de la barre du bas doit être ajouté à `TABS` (`js/ui/ios-motion.js`), sinon il glisse comme une page.
- **Jamais d'`!important` sur `opacity` ou `transform` d'un élément animé** : une déclaration importante l'emporte sur toute animation (c'est ce qui empêchait l'ancien onglet de s'effacer, `css/ui.css` jusqu'en 16.0.0).
- **Feuilles et fenêtres** : `R.overlay.open` lit l'état fermé avant d'ajouter `.is-open` (`js/core/router.js`) — sans cette lecture, la feuille apparaît sans glisser. Ne pas la retirer.
- **Boucles infinies** : seulement `transform` / `opacity` (pseudo-élément), et mises en pause sur les écrans cachés (`css/motion-system.css` §7) ; « réduire les animations » : fondus seulement (bloc en fin de fichier).
- **Tests** : `tests/ux/motion-system.test.mjs`, `motion.test.mjs`, `ios-motion.test.mjs`.
- **Android** : non touché en 16.0.0 ; l'inventaire et la proposition `MotionTokens.kt` sont dans l'audit.

## 1 septies. Outils externes et sauvegarde (25/11) — où sont les choses hors du dépôt
- **Deuxième site, en ligne** : https://om-wallet.weinc.app/ (Copy Any Design / WeInc, offre gratuite : badge WeInc, non indexé par
  les moteurs) — page tirée de la vitrine par `tools/site-autonome.py` (+ `tools/site-autonome-minify.py`), textes et captures réels,
  formulaire de contact relié à l'e-mail du compte WeInc du propriétaire (non testé). Modifiable sans code dans l'éditeur WeInc du
  propriétaire. Le site principal reste yor-wallet.vercel.app ; après une refonte de la vitrine, régénérer la page et la redonner à WeInc.
- **Canva** (compte du propriétaire) : « Publication Instagram OM Wallet » et « Story Instagram Swap OM Wallet », en français,
  avec les **vraies** captures et le vrai logotype. L'IA de Canva redessine les captures qu'on lui donne (icônes perdues, « ≈ »
  devenu « ≠ » ou « = ») : toujours comparer à l'application et remplacer par l'image réelle avant de publier.
- **B12** : rien n'existe tant que le propriétaire n'a pas créé son compte B12 (le lien mène au formulaire d'inscription prérempli).
- **CodeWords** (`design_intelligence`) : a proposé bleu / orange sur fond clair — contraire à la charte, non appliqué.
- **Clé de signature Android** (`omwallet-release.jks`, alias `omwallet`, certificat SHA-256 `3bf39…4fbe6`) : remise au
  propriétaire le 25/11 dans un fichier séparé de la sauvegarde ; **jamais dans le dépôt**. Toute nouvelle version Android doit
  être signée avec elle (variables `OM_KEYSTORE`…, § 2 P1), sinon elle ne s'installe pas par-dessus l'application déjà installée.

## 1 sexies. 15.3.0 (25/11) — design « Réglages de l'iPhone » : où il vit, les règles
- **Web** : `css/ios.css` est la **dernière** feuille (sélecteurs `html:root` ×4) : jetons, typographie, listes groupées, interrupteurs, contrôle segmenté, boutons, barres, grands titres. `js/ui/ios.js` : classe `f-sf` / `f-inter` (approche de la police vraiment dessinée) et barre compacte des écrans à grand titre (`.w-title`, `.hub-head`). Les grands titres des autres écrans de la famille Réglages viennent de `LARGE` dans `js/ui/ios-motion.js`.
- **Android** : `core-design/Ios.kt` (IosGroup, IosRow, IosSwitch, IosTile, IosSectionHeader, IosFooter, IosLargeTitle, IosGap) ; typographie dans `Theme.kt` (`interTracking()`, échelle iOS, `tnum`) ; polices Inter + IBM Plex Sans Arabic dans `core-design/res/font`.
- **Règles** : un réglage = une ligne de 52 px avec tuile colorée (jamais bleue) ; le texte des lignes est en 17 px **normal** (pas de gras) ; jamais d'approche (letter-spacing) en arabe ; les montants en chiffres tabulaires ; un bouton principal = capsule jaune pleine de 50 px ; tout mouvement passe par les ressorts `--ios-*` (web) / `spring()` (Android) et s'arrête sous « réduire les animations ».
- **Mots coupés** : ne jamais remettre `overflow-wrap:anywhere` sur un sélecteur large (`*`, `span`, `button`…) — il coupe « Prix » en « Pri / x » dès qu'une ligne flexible manque de place ; le réserver aux adresses, e-mails et références. Quand un libellé et un montant ne tiennent pas côte à côte, le montant passe à la ligne (voir `.adm-stat` dans `css/ios.css` § 11). Après toute retouche de mise en page : `node tests/ux/words.test.mjs`.

## 1 quinquies. 15.2.0 (25/11) — vitrine, petits téléphones, statuts, arabe : méthode et règles à garder
- **La vitrine `/welcome` est en Noir & Jaune** (`welcome/site.css`, mêmes classes qu'avant). Ses captures viennent de l'application réelle : `NODE_PATH=$(npm root -g) node tools/site-shots.mjs` (à relancer quand un écran change). Elle montre des données d'exemple — le dire. Ne jamais la repasser en bleu : `tests/ux/site.test.mjs` détecte les couleurs bleues.
- **Mesurer avant de corriger** : Lighthouse mobile (`npm i lighthouse` hors dépôt, `CHROME_PATH=/opt/pw-browsers/chromium-*/chrome-linux64/chrome`, `--chrome-flags="--headless=new --no-sandbox --proxy-server=http://127.0.0.1:36363"` pour atteindre le site en ligne) ; `axe-core` (installé hors dépôt) pour l'accessibilité ; un test de débordement à 320 / 360 px ; rendus Android `SmallPhoneTest` ; `gradle lintDebug` **sans `--offline`** (le modèle de test androidTest veut des dépendances non en cache). Les pages `offline.html`, `404.html`, `admin-action.html` suivent aussi l'identité.
- **Règles ajoutées** : (1) le statut d'une opération (« En cours », « Échouée », « Terminée ») a **sa propre ligne** dans une liste — jamais collé à un texte sur une ligne tronquée ; (2) un clavier numérique **n'est jamais inversé** en arabe (1 2 3 de gauche à droite) ; (3) un message qui contient un nombre s'accorde avec lui (`tp()` sur le web, `plurals` sur Android — l'arabe a six formes) ; (4) les balises de partage (`og:image`, `canonical`) pointent le **domaine en ligne** (`yor-wallet.vercel.app`), jamais un ancien domaine.
- **Reste** : déverrouillage biométrique Android (empreinte / visage via `BiometricPrompt`, code chiffré par une clé du Keystore liée à la biométrie — comme la version web « Face ID » ; le serveur garde seul la décision par `verify_pin`) — à faire avec essai sur appareil ; Android : écran de transfert de crédit si le propriétaire le demande ; essai sur un vrai téléphone.

## 1 quater. 15.1.0 (25/11) — transfert de crédit Oman + mouvement web : à lire avant de toucher la base ou le jeu d'animations

**Deux sessions ont travaillé en parallèle ce jour-là** (branches `claude/blissful-goldberg-426zi7` = transfert de crédit / site vitrine, et `claude/intelligent-keller-lrjxah` = mouvement). Avant toute modification de la base ou des fonctions Edge : `git fetch`, comparer `supabase/migrations/` avec `mcp list_migrations`, `list_edge_functions` avec `supabase/functions/` — une migration que l'on n'a pas écrite peut déjà être en service.

**Transfert de crédit Oman (Omantel · Ooredoo · Vodafone) — circuit en service = celui de l'autre session (15.0.x)** :
- **Réservé à l'administrateur** (écran `js/screens/omx-topup.js`, RPC `admin_topup_send`) : il choisit l'opérateur, saisit numéro (968XXXXXXXX) et montant (TID de l'opérateur facultatif, sinon `8` + numéro de l'administrateur + 9 chiffres) ; **Envoyer = confirmé tout de suite**, sans second administrateur, et le SMS part par la fonction Edge `credit-topup` (Infobip, nom d'expéditeur par défaut `TBAUTH`). Utilisateurs ordinaires : service invisible et fermé côté serveur (`credit_topup_request` : EXECUTE retiré à `authenticated`, **ne pas le rouvrir**).
- Message exact du propriétaire (arabe) : « تمت عملية تحويل مبلغ 1.000 ريال بنجاح إلى الرقم 96892888435. (TID: …). » — français / anglais dans `supabase/functions/send-email/topup.ts`.
- Un SMS « réussi » doit correspondre à une vraie remise : `transactions.meta.topup.sms` garde l'état (SENT / PARTIAL / FAILED + raison) ; ne jamais afficher « envoyé » si Infobip a refusé. Le nom d'expéditeur doit être enregistré chez Infobip pour l'Oman (réponse du fournisseur à surveiller). Les opérations `meta.test = true` sont des essais de l'autre session, pas de vraies opérations.
- Base : `20261127_credit_topup.sql` (type `CREDIT_TOPUP`, réglages `credit_topup_*`, e-mail de confirmation `send-email` v60) **appliquée** ; `20261126_credit_topup_auto.sql` et `_admin.sql` de l'autre session **appliquées**. `20261127_credit_topup_instant.sql` (confirmation instantanée pour tous les utilisateurs) a été appliquée puis **annulée le jour même** (un seul circuit) : **ne pas la réappliquer**.
- **Restes à supprimer — demandent l'accord explicite du propriétaire (la migration est bloquée tant qu'il n'a pas confirmé un DROP)** : fonctions `_topup_sms_claim`, `_topup_sms_done`, `_dispatch_topup_notice`, `admin_topup_list`, `admin_topup_mark_delivered`, `admin_topup_refund` (EXECUTE déjà retiré aux utilisateurs), fonction Edge `topup-notice` (inactive), ligne de réglage `credit_topup_mode`. Rien de réel n'y est lié.
- **Pas d'écran Android** pour le transfert de crédit : à faire seulement si le propriétaire le demande (circuit administrateur sur le web aujourd'hui).

**Mouvement 15.1.0 (web + Android)** : voir `changelog.md` ; web : `js/ui/motion.js` + `css/motion.css`, test `tests/ux/motion.test.mjs` ; Android : `core-design/LiveMotion.kt` (LiveTick / LiveText, rememberCountedValue, SlidingSegments, shimmer, SuccessMark, StepBadge, OmPullRefresh), `AreaChart` interactif (Components.kt), `BrandHero` à deux calques, test `app/src/test/.../MotionTest.kt` (8 tests, horloge de test arrêtée : une écriture d'état depuis le test passe par `runOnIdle` + `Snapshot.sendApplyNotifications()`). Règle : tout mouvement respecte « Réduire les animations » (`prefers-reduced-motion` / réglage de l'application ; Android : `LocalOmMotion.reduced`) et `html.w-lite` (web). **Une coche de réussite ne se dessine que sur une vraie confirmation** (jamais sur « en cours »). Cartes virtuelles retirées du web (aucune donnée supprimée ; l'Android n'en avait pas d'écran). Reste : essai sur un vrai téléphone (ressorts, vibrations, indicateur de rafraîchissement).

## 1 ter. Identité 14.9.0 (25/11) — à lire avant toute retouche de logo ou d'image
Consigne du propriétaire : « le logo est uniquement pour l'icône, le reste, crée un inédit ». **Deux couches** (détail et emplacements : skill `om-brand`) :
- **Icône** = son logo (`brand/originals/logo-om-noir-jaune.png`) : lanceur Android, favicon, PWA, apple-touch, boutique. `python3 -I brand/make_assets.py`.
- **Tout le reste** = « Arche » (arche + pièce, un seul jaune), créée pour ce projet : marque, logotype, héros de connexion / présentation, démarrage, partage. Source : `brand/om_art.py` ; `python3 -I brand/make_brand.py` (Chromium via `brand/render.cjs`).
- Ne jamais afficher le logo du propriétaire ailleurs que comme icône ; ne jamais le redessiner. Plus aucun bleu de marque.
- **14.9.1 (finition)** : méthode « mesurer avant de corriger » — `node tests/ux/palette.test.mjs` (contrastes des jetons) et `NODE_PATH=$(npm root -g) node tests/ux/audit.mjs` (contraste réel, zones tactiles, texte coupé, 23 écrans × clair / sombre × en / ar). Les blocs « 14.9.1 » en fin de `css/noirjaune.css` recouvrent les restes des anciennes couches (marine, bleu ciel, violet) ; en cas de nouveau reliquat, le corriger là plutôt que dans les anciennes couches.
- **Reste à faire** : e-mails de transaction (`supabase/functions/send-email`) encore à l'ancien habillage — à reprendre avec la marque Arche **après accord du propriétaire** (le déploiement de la fonction touche de vrais clients) ; essai sur un vrai téléphone ; Canva et Moda (le propriétaire doit les connecter dans claude.ai) ; l'ancienne tuile « OM PAY » (`assets/ui/om-glyph.png`, `om-pay-word.png`, code inactif de `premium.js`) peut être retirée.
- Autres demandes du 25/11 : **système autonome / rétention** — traité par les skills `om-growth` et `om-autopilot` (pas de profilage de personnes ni de mécaniques d'addiction ; brouillons validés par le propriétaire ; revue hebdomadaire planifiée seulement sur sa demande). Taille de l'APK : la version de publication compactée (~4,4 Mo) vient du même code que le fichier de développement de ~15 Mo ; le propriétaire peut préférer une version non compactée (~14 Mo, `-PomShrink=false`).

## 1 bis. Design 14.8.0 (24/11) — à lire avant toute retouche d'écran
Consigne du propriétaire : **jaune et noir comme Liv X (Emirates NBD) et Binance**, « pas bizarre », précis ; **regarder en ligne avant d'écrire** (fait : voir `changelog.md` 14.8.0 et la skill, section Design). Fait : palette + composants web et Android, menu à bouton Swap jaune, accueil, portefeuille, conversion, connexion, présentation d'ouverture (photos converties en duotone noir / jaune). **Reste** : recomposer comme Liv X / Binance les écrans intérieurs (dépôt, retrait, envoi, activité, détail d'actif Android) ; mode clair crème sur Android ; vérifier en arabe et sur un vrai téléphone.

### Demandes du propriétaire pas encore faites (décidées, à faire par étapes — ne pas les présenter comme faites)
1. **« L'app garde les clés »** (réponse du 24/11) : un portefeuille personnel sur le téléphone (phrase de 12 mots chiffrée dans le Keystore, adresses par réseau, envoi signé sur le téléphone), **à côté** du compte actuel (le compte OM Wallet reste à confirmation par l'administrateur, comme Binance garde son compte et son portefeuille Web3). Étapes proposées : (a) création / sauvegarde / adresses, vérifiées sur des vecteurs de test publics ; (b) lecture des soldes par des nœuds publics ; (c) envoi sur UN réseau, d'abord sur réseau de test ; (d) les autres réseaux. **Ne jamais livrer l'envoi réel sans essai sur réseau de test** : une erreur ici fait perdre de l'argent sans retour possible. Les soldes déjà sur le serveur ne bougent pas.
2. **Plus d'images, de vidéos, d'animations, de modes, de fonctionnalités** « plus précis et plus qualitatifs » : proposés — vidéos de présentation enregistrées depuis l'application elle-même (ar / fr / en), animations de chiffres et de courbes, mode clair crème sur Android.
3. **« Au moins 111 Mo »** : le propriétaire a choisi du **vrai contenu** (images, vidéos, fonctionnalités), pas du remplissage. L'APK pèse ~5 Mo parce qu'il est optimisé ; ne pas gonfler avec un fichier inutile sans qu'il le redemande après explication.

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

### P2b — Suite de la passe qualité (audit du 24/11, à continuer dans cet ordre)
Méthode : rendre TOUS les écrans (Android : `gradle testDebugUnitTest` puis `app/build/screenshots/api31-fr/*.png` ; web : script de
captures comme `tests/ux/tour.mjs`, 390×844, `fullPage`), en faire une planche, corriger du plus voyant au moins voyant, re-capturer.
Corrigé en 14.5.3 : logo « OM PAY » (web Compte/admin), carte profil (contraste), carré noir (Android Mes actifs), indicateur sur Activité.
Encore vu, non corrigé :
1. Web « Envoyer à un utilisateur OM Wallet » : titre coupé (« … OM… ») → titre plus court ou 3 lignes permises.
2. Android Retrait crypto : l'adresse longue est coupée dans le champ (une ligne) → afficher l'adresse complète sous le champ.
3. Web Historique : noms coupés (« Salim Al … ») dans les lignes ; prévoir 2 lignes pour le nom.
4. Aucun essai sur un vrai téléphone (rendus Robolectric et Chromium seulement) : à faire avec le propriétaire (Android 12-15, petit écran).
5. Vérifier en arabe (droite à gauche) les nouveaux écrans : inscription Android, Spot / Swap web.

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
cd android && gradle testDebugUnitTest :app:assembleDebug     # 53 tests attendus
```
Le bouton `.btn` ignore un second appui pendant 450 ms (anti double appui) : en test, attendre ~1,3 s entre deux appuis sur le même bouton.

---

## 5. Message à coller pour démarrer la session suivante

> Projet OM Wallet (dépôt yor-wallet/Y). Le travail est sur la branche `claude/blissful-goldberg-426zi7` : pars de cette branche.
> Lis d'abord `PASSATION.md` et la skill `.claude/skills/om-wallet/SKILL.md`, puis fais les tâches P1 et P2 de `PASSATION.md` dans l'ordre,
> en respectant toutes les règles du propriétaire. Ne redemande pas ce qui est déjà décidé. À la fin, dis précisément ce qui est
> vérifié et ce qui ne l'est pas.
