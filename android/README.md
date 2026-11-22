# OM Wallet — application Android native

Kotlin 2.1 · Jetpack Compose (Material 3, identité « OM Glass ») · min SDK 26, cible SDK 35 · version 14.2.0 (code 140200).
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
| `core-design` | Jetons OM Glass (couleurs, rayons 14/20/28/34 dp, espacements base 4 dp), typographie IBM Plex Sans Arabic embarquée, ressorts, retours haptiques natifs, cartes verre, boutons, feuilles, clavier PIN, étapes de statut, graphiques, icônes originales, logos web3icons (MIT). |
| `core-ui` | Textes **en / fr / ar** (une seule table, mêmes clés), libellés de statut honnêtes, ligne et fiche de transaction, saisie du code PIN (vérifié par le serveur), onglets. |
| `core-network` | `SupabaseApi` (GoTrue, PostgREST, RPC, rafraîchissement du jeton, codes d'erreur du serveur, échec réseau = « incertain ») et `MarketApi` (Binance : REST + WebSocket mini-ticker). |
| `core-data` | Modèles, règles (adresses par réseau = mêmes formats que le serveur, montants, décimales), dépôts Auth / Wallet / Market / Money / Admin, Room, DataStore, moteur de cache + WorkManager. |
| `core-security` | `KeystoreSecretStore` : session chiffrée par une clé AES-256-GCM de l'Android Keystore. Jamais de mot de passe ni de phrase de récupération. |
| `feature-*` | Accueil, Actifs + détail, Marchés, Activité, Dépôt, Retrait (banque OMR / crypto), Envoi interne par e-mail, Admin Control. |
| `app` | Activité unique (SplashScreen API, edge-to-edge, retour prédictif, langues par application), navigation, connexion, compte. |

## Règles appliquées

- **Pas de transfert ni de CFA dans l'interface.** Les anciennes opérations en XOF restent intactes sur le serveur et apparaissent seulement
  dans « Historique CFA (archivé) », en lecture seule, jamais converties ni comptées dans un solde crypto.
- **Dépôt :** l'adresse vient uniquement du serveur (`get_receive_address`). Aujourd'hui le serveur répond `deposit_address_unavailable`
  (aucune adresse de conservation) : l'écran le dit, sans adresse ni QR. Le QR (ZXing) ne s'affiche que pour une adresse réelle validée.
- **Envoi interne par e-mail :** `find_user_by_email` renvoie seulement un nom masqué ; `transfer_crypto` enregistre l'envoi « À confirmer »
  avec code PIN (`verify_pin` → jeton à usage unique) et clé d'idempotence réutilisée en cas d'échec réseau. Seul l'administrateur crédite.
- **Admin Control :** rôle lu sur le serveur (`is_admin()`), un seul bouton Confirmer par transaction (`admin_tx_confirm`, idempotent :
  un second appel répond « already »), la ligne traitée reste en place. Retraits crypto : autoriser → saisir le hash → enregistré.
  Retraits bancaires : approuver → marquer payé.
- **Libellés :** interne « À confirmer → Confirmé par admin → Crédité » ; blockchain « Demande reçue → Autorisé admin → Envoyé · hash
  enregistré » + lien vers l'explorateur public. L'application n'écrit **pas** « Confirmé blockchain » : le serveur enregistre le hash saisi
  (format vérifié) mais ne vérifie pas encore les confirmations du réseau.
- **Marchés :** cours réels Binance (USDT ≈ USD ; USDT calculé via USDC/USDT), état visible (direct / actualisé toutes les 20 s / hors
  ligne avec l'heure). Chaque ligne ne se recompose que si son propre cours change ; signe toujours affiché (+ / −).
- **Cache :** seul le contenu recréable est purgé (fichiers http / graphiques / images par durée de vie, cours de plus de 7 jours).
  Jamais les données financières, jamais le serveur.
- **Arabe :** mise en page de droite à gauche ; montants, signes et prix restent de gauche à droite (isolats Unicode), icônes
  directionnelles en miroir.

## Construire

Prérequis : JDK 17+ et Android SDK 35 (`local.properties` : `sdk.dir=…`).

```
./gradlew testDebugUnitTest        # 36 tests (règles, contrat serveur, écrans sur Android 12 et 13 via Robolectric)
./gradlew :app:assembleDebug       # APK de debug / QA (signé avec la clé de debug)
./gradlew :app:bundleRelease       # AAB release (R8 + réduction des ressources)
```

Signature release : définir `OM_KEYSTORE`, `OM_KEYSTORE_PASSWORD`, `OM_KEY_ALIAS`, `OM_KEY_PASSWORD` avant `bundleRelease`.
Sans ces variables, l'AAB est produit **non signé** (à signer avant tout envoi sur Play Console). Aucune clé n'est dans le dépôt.

Les tests d'écran enregistrent leurs rendus dans `app/build/screenshots/api31-fr`, `api33-fr`, `api31-ar`, `api33-ar`.

## Ce qui est vérifié — et ce qui ne l'est pas

Vérifié ici : compilation de tous les modules, APK debug, APK et AAB release avec R8, 36 tests verts. Les tests d'écran tournent sur
les frameworks Android 12 (API 31) et 13 (API 33) **dans la JVM (Robolectric)** avec un faux serveur local — ce n'est ni un émulateur
ni un téléphone.

Pas encore fait :
- essais sur appareil physique ou émulateur (aucun disponible dans cet environnement), donc ni mesure de fluidité réelle (JankStats est
  intégré mais n'a tourné sur aucun appareil), ni Macrobenchmark, ni profil de démarrage généré : `baseline-prof.txt` est écrit à la main ;
- signature de l'AAB release (clé à fournir) ;
- Trust Wallet / WalletConnect v2 : non connecté (écran d'information sans bouton) ; il faut un identifiant de projet WalletConnect et
  un parcours de signature vérifié ;
- vérification on-chain des retraits (TRON « solidified », événements TRC20) : à faire côté serveur ;
- création / changement du code PIN et KYC : restent sur le site web ;
- moteur d'archives distant (métadonnées cloud) : non réalisé.
