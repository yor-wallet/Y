# OM Wallet — application Android native

Kotlin 2.1 · Jetpack Compose (Material 3, identité « OM Glass ») · min SDK 26, cible SDK 35 · version 14.4.0 (code 140400).
Même serveur que l'application web (Supabase `gebjmguoauvutiqvoswl`) : le serveur reste la seule autorité pour les soldes, les statuts
et les rôles. L'application n'invente aucune donnée : sans réponse, elle affiche « — » et l'état de la connexion.

## Architecture

```
UI Compose ──► ViewModel (UiState en StateFlow) ──► Repositories ──► SupabaseApi / MarketApi (OkHttp)
                                                         │                 Room (miroir hors ligne) · DataStore (préférences)
                                                         └──────────────── Keystore (session chiffrée AES-GCM)
```

| Module | Rôle |
|---|---|
| `core-design` | Jetons OM Glass (couleurs, rayons 14/20/28/34 dp, espacements base 4 dp), typographie Sora (latin) et Tajawal (arabe) embarquées, ressorts, retours haptiques natifs, cartes verre, boutons, feuilles, clavier PIN, étapes de statut, graphiques, icônes originales, logos web3icons (MIT). |
| `core-ui` | Textes **en / fr / ar** (une seule table, mêmes clés), libellés de statut honnêtes, ligne et fiche de transaction, saisie du code PIN (vérifié par le serveur), onglets. |
| `core-network` | `SupabaseApi` (GoTrue, PostgREST, RPC, rafraîchissement du jeton, codes d'erreur du serveur, échec réseau = « incertain ») et `MarketApi` (Binance : REST + WebSocket mini-ticker). |
| `core-data` | Modèles, règles (adresses par réseau = mêmes formats que le serveur, montants, décimales), dépôts Auth / Wallet / Market / Money / Admin, Room, DataStore, moteur de cache + WorkManager. |
| `core-security` | `KeystoreSecretStore` : session chiffrée par une clé AES-256-GCM de l'Android Keystore. Jamais de mot de passe ni de phrase de récupération. |
| `feature-*` | Accueil, Actifs + détail, Marchés, Activité, Dépôt, Retrait (banque OMR / crypto), Envoi interne par e-mail, Admin Control. |
| `app` | Activité unique (SplashScreen API, edge-to-edge, retour prédictif, langues par application), navigation, connexion, compte. |

## Règles appliquées

- **Pas de transfert ni de CFA dans l'interface.** Les anciennes opérations en XOF restent intactes sur le serveur et apparaissent seulement
  dans « Historique CFA (archivé) », en lecture seule, jamais converties ni comptées dans un solde crypto.
- **Dépôt :** l'adresse vient uniquement du serveur (`get_receive_address`) : l'adresse personnelle du compte pour ce réseau, créée par le
  serveur (une par réseau, chacune avec sa propre clé) à l'inscription ou à la première demande (`address_pending` → fonction
  `wallet-addresses` → relecture). Le QR (ZXing) n'est affiché que pour une adresse dont le format est validé ; sans adresse, l'écran le dit.
  Les dépôts ne sont pas détectés automatiquement : l'administrateur les crédite après vérification sur le réseau.
- **Envoi interne par e-mail :** `find_user_by_email` renvoie seulement un nom masqué ; `transfer_crypto` enregistre l'envoi avec code PIN
  (`verify_pin` → jeton à usage unique) et clé d'idempotence réutilisée en cas d'échec réseau. Seul l'administrateur crédite.
- **Ce que voit l'utilisateur :** uniquement « En cours » (trois points animés, actualisation toutes les 5 s tant qu'une opération est en
  cours), puis « Transfert confirmé » ou « Refusé ». Aucune mention de l'administrateur ni d'une attente de confirmation.
- **Admin Control :** rôle lu sur le serveur (`is_admin()`), un seul bouton Confirmer par transaction (`admin_tx_confirm`, idempotent :
  un second appel répond « already »), un bouton Mettre en pause (`admin_tx_pause` : reste en attente, montant réservé) et Refuser ; la
  ligne traitée reste en place. L'administrateur reçoit aussi un e-mail avec les mêmes trois boutons (liens personnels, 72 h). Retraits crypto : autoriser → saisir le hash → enregistré.
  Retraits bancaires : approuver → marquer payé.
- **Libellés vus par l'utilisateur :** « Soumis → En cours → Confirmé » (envoi interne), « Soumis → En cours → Terminé » (retrait) + lien
  vers l'explorateur public quand un hash est enregistré. L'application n'écrit **pas** « Confirmé blockchain » : le serveur enregistre le
  hash saisi (format vérifié) mais ne vérifie pas encore les confirmations du réseau. Les libellés « Autorisé admin », « Envoyé · hash
  enregistré » restent réservés à l'écran Admin Control.
- **Marchés :** cours réels Binance (USDT ≈ USD ; USDT calculé via USDC/USDT), état visible (direct / actualisé toutes les 20 s / hors
  ligne avec l'heure). Chaque ligne ne se recompose que si son propre cours change ; signe toujours affiché (+ / −).
- **Cache :** seul le contenu recréable est purgé (fichiers http / graphiques / images par durée de vie, cours de plus de 7 jours).
  Jamais les données financières, jamais le serveur.
- **Arabe :** mise en page de droite à gauche ; montants, signes et prix restent de gauche à droite (isolats Unicode), icônes
  directionnelles en miroir.

## Construire

Prérequis : JDK 17+ et Android SDK 35 (`local.properties` : `sdk.dir=…`).

```
./gradlew testDebugUnitTest        # 38 tests (règles, contrat serveur, écrans sur Android 12 et 13 via Robolectric)
./gradlew :app:assembleDebug       # APK de debug / QA (signé avec la clé de debug)
./gradlew :app:bundleRelease       # AAB release (R8 + réduction des ressources)
```

Signature release : définir `OM_KEYSTORE`, `OM_KEYSTORE_PASSWORD`, `OM_KEY_ALIAS`, `OM_KEY_PASSWORD` avant `bundleRelease`.
Sans ces variables, l'AAB est produit **non signé** (à signer avant tout envoi sur Play Console). Aucune clé n'est dans le dépôt.

Les tests d'écran enregistrent leurs rendus dans `app/build/screenshots/api31-fr`, `api33-fr`, `api31-ar`, `api33-ar`.

## Ce qui est vérifié — et ce qui ne l'est pas

Vérifié ici : compilation de tous les modules, APK debug, APK et AAB release avec R8, 38 tests verts. Les tests d'écran tournent sur
les frameworks Android 12 (API 31) et 13 (API 33) **dans la JVM (Robolectric)** avec un faux serveur local — ce n'est ni un émulateur
ni un téléphone.

Pas encore fait :
- essais sur appareil physique ou émulateur (aucun disponible dans cet environnement), donc ni mesure de fluidité réelle (JankStats est
  intégré mais n'a tourné sur aucun appareil), ni Macrobenchmark, ni profil de démarrage généré : `baseline-prof.txt` est écrit à la main ;
- signature de l'AAB release (clé à fournir) ;
- notification poussée (FCM) à l'administrateur : non réalisée (il faut un projet Firebase) ; l'administrateur est prévenu par e-mail et par la
  notification dans l'application (actualisation périodique de l'écran Admin Control) ;
- Trust Wallet / WalletConnect v2 : non connecté (écran d'information sans bouton) ; il faut un identifiant de projet WalletConnect et
  un parcours de signature vérifié ;
- vérification on-chain des retraits (TRON « solidified », événements TRC20) : à faire côté serveur ;
- création / changement du code PIN et KYC : restent sur le site web ;
- moteur d'archives distant (métadonnées cloud) : non réalisé.
