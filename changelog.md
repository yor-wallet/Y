# OM Wallet 14.5.0 — verre transparent, menu Spot / Swap, logos officiels

Demandes du propriétaire : « une interface glass transparente, pas blanc qui fait mal aux yeux », un menu principal avec Marchés, Spot et Swap, « le logo de l'application à chaque fois », des animations en temps réel, des icônes à l'apparence officielle (recherche en ligne faite avant). Règles inchangées : prix jamais inventé, confirmation par l'administrateur seul, un seul e-mail après le crédit, aucune donnée supprimée.

- **Logos officiels (web + Android + Figma)** : comparés aux kits de marque téléchargés (Tether #009393, Circle USDC #0B53BF, BNB Chain #F0B90B, Bitcoin #F7931A, Litecoin #345D9D ; XRP repris du kit XRPL 2026, noir #141414). Pastilles rondes officielles (web3icons 4.0.61, MIT). Android : vecteurs reconvertis, tracés en coordonnées absolues (ETH / USDT / BNB étaient mal dessinés). Icône « Retrait » distincte de « Dépôt » ; étoile Favoris dessinée.
- **Apparence « Verre » (web + Android)** : plus de panneaux blancs. Fond bleu lumineux avec halos, cartes en verre transparent, texte clair, bouton dégradé ciel → bleu, sombre = bleu nuit. Réglage clair / sombre = bleu « jour » / « nuit ».
- **Menu principal** : Accueil · Marchés · Spot · Swap · Actifs. Activité et Compte restent à un geste (en-tête de l'accueil, barre visible sur ces pages).
- **Spot (web + Android)** : paire (BTC, ETH, BNB, SOL, XRP, LTC, USDC contre USDT), dernier prix qui clignote vert / rouge, statistiques 24 h, bougies 15m / 1H / 4H / 1D avec ligne du dernier prix, carnet d'ordres (barres de profondeur qui glissent), transactions du marché qui arrivent, état « En direct / Actualisé à … / Hors ligne — dernier cours à … ». Flux public Binance (data-stream.binance.vision). Ordre au marché Acheter / Vendre (25-50-75-100 % du solde) ; les ordres à cours limité ne sont pas proposés (aucun bouton factice).
- **Swap (web + Android)** : De / Vers, Max, inverser (rotation), estimation au cours en direct, frais 0, prix fixé à la demande, suivi « En cours puis Confirmé ».
- **Exécution réelle** : le serveur fixe le prix (fonction `crypto-swap`, Binance lu côté serveur, valable 30 s, usage unique) → vérification avec compte à rebours → code PIN → `swap_execute` met le montant payé de côté et enregistre l'opération EN COURS → seul l'administrateur confirme (crédit de la crypto achetée, deux lignes au grand livre, e-mail unique « Échange confirmé » en ar / en / fr après le crédit). Refuser rend le montant (inchangé). Console admin : détail de l'échange.
- **Serveur** : migration `20261124_crypto_swap.sql` (+ retour arrière, sauvegarde des fonctions remplacées) ; **à appliquer** — la confirmation demandée par Supabase n'a pas pu être donnée depuis cette session. Tant qu'elle ne l'est pas, l'application affiche « L'échange n'est pas encore activé sur le serveur » (aucun faux succès).
- **Tests** : web — nouveau `tests/ux/trade.test.mjs` (menu, Spot en direct, ordre au marché jusqu'à « En cours », Swap, serveur non activé, prix expiré, réduction des animations, verre, arabe) ; suites existantes mises à jour. Android — tests Spot / Swap / serveur non activé.

# OM Wallet 14.4.0 — refonte d'après les visuels du propriétaire (verre, bleu ciel, blanc)

Le style « papier / bleu nuit » préparé juste avant a été refusé et retiré. Tout suit désormais les visuels fournis (`brand/originals/ref-*.png`, `promo-*.png`). Fonctions, données, règles de confirmation et e-mails : inchangés.

- **Présentation d'ouverture (web + Android)** : trois écrans plein écran tirés des deux visuels publicitaires et de l'icône verre. Les textes imprimés dans les photos ont été effacés et remplacés par de vrais textes et de vrais boutons, traduits (ar / fr / en) ; « تخطي / Passer / Skip » ; profondeur (la photo glisse moins vite que la carte), léger zoom qui se pose, lignes qui montent ; glisser du doigt. Web : choix de la langue conservé. Android : HorizontalPager Compose, affichée une seule fois avant la première connexion.
- **Connexion (web + Android)** comme le visuel : grande icône verre, mot-symbole « OM Wallet », « أهلاً بك من جديد / Bon retour parmi nous », carte de verre, champs avec icône, « mot de passe oublié », bouton dégradé. Android : « mot de passe oublié » et « créer un compte » ouvrent le site (pas de réinitialisation dans l'application).
- **Web, nouvelles compositions** : accueil (en-tête logo, salutation, décor côtier du visuel, carte du solde avec emblème, 4 tuiles dont la première pleine, bannières qui ouvrent de vrais écrans, dernières opérations, actifs, marchés) ; « Mes actifs » comme le visuel أصولي (carte héros, une carte par actif avec « Voir les détails ») ; paramètres comme le visuel الإعدادات (chaque ligne ouvre sa page ou descend à sa section ; « Se déconnecter ») ; barre du bas comme les visuels (tuile de verre active qui glisse, icône qui rebondit).
- **Web, nouvelle apparence partout** (via `css/omw.css`) : cartes de verre, tuiles d'icônes, boutons dégradés, carrés de verre (retour, recherche), segments, interrupteurs, champs, reçus en ticket à encoches, fenêtres et menu de verre, thème sombre.
- **Interactions (web)** : lumière qui naît sous le doigt + ressort ; transition « profondeur » entre écrans (le nouvel écran sort du verre, l'ancien s'y enfonce — plus de glissement latéral) ; cartes en cascade à l'ouverture ; lignes qui apparaissent au défilement ; fenêtres qui montent avec un ressort ; messages de réussite / erreur en capsule de verre (icône dessinée, barre de temps, glisser vers le haut) ; champ qui tremble à l'erreur ; chargement à trois points ; « réduire les animations » respecté ; flou et animations d'ambiance coupés sur les téléphones peu puissants.
- **Android** : couleurs des visuels, polices Sora (latin) et Tajawal (arabe, choisie selon la langue), cartes de verre, fond à vagues, bouton dégradé avec reflet, tuile d'icône de verre, toucher « lumière + ressort », chargement à trois points, cartes qui montent, transitions « profondeur » (Compose Animation), barre du bas des visuels. Lottie et Rive non utilisés : tout est fait avec Compose Animation (rien à ajouter au poids de l'application).
- **Polices** : Sora et Tajawal auto-hébergées (web) et embarquées (Android), forcées partout ; IBM Plex Sans Arabic retirée de l'application Android.
- **Tests** : web — nouveau `tests/ux/omw.test.mjs` (chaque nouveau bouton mène au bon écran, présentation, connexion, paramètres, déconnexion, messages), tests de mouvement mis à jour pour la nouvelle transition ; toutes les suites passent. Android — 44 tests verts dont la présentation (fr, ar) ; APK debug, AAB et APK release construits.
- **Terminé ensuite (même version)** : Android — accueil recomposé comme le visuel (logo, salutation, décor côtier, carte du solde avec emblème verre flottant, 4 tuiles dont la première pleine, bannières en carrousel, activité récente et cryptos dans des cartes de verre ; l'avatar ouvre le Compte), « Mes actifs » comme le visuel أصولي (carte portefeuille verre, une carte par actif avec « Voir les détails »), Compte comme les visuels profil / paramètres (carte profil, liste de verre à tuiles et chevrons, bouton de déconnexion). Web — reçu comme le visuel (retour · logo · partager, ticket à encoches avec badge, lignes à tuiles d'icônes, montant mis en avant, tuiles Télécharger / Partager / Accueil puis PNG / copier / imprimer).
- **Images en haute résolution** : les deux photos publicitaires, le paysage d'Oman et le portefeuille en verre sont agrandis ×2 par super-résolution (EDSR) à partir des fichiers fournis (photos : 1 704 × 2 960 et 2 244 × 2 804 pixels au lieu de 852 × 1 480 et 1 122 × 1 402), enregistrés en qualité élevée ; l'icône verre passe en 768 pixels. Aucun détail n'est inventé au-delà de ce que contiennent les originaux. Tailles : APK de test 16,1 Mo, APK de publication 4,8 Mo, AAB 7,5 Mo.
- **Écrans intérieurs recomposés (dernière passe)** : toutes les pages intérieures ont maintenant l'en-tête des visuels (logo sur sa ligne, grand titre centré, carré de verre « retour », titre qui se réduit en barre compacte au défilement sur le web). Web : marchés, dépôt, retrait (banque, crypto, revue, suivi), envoi, historique, aide, notifications, appareils, sessions, versements admin. Android : marchés (une carte de verre par actif), détail d'un actif (logo à droite du titre), activité (les opérations de chaque jour dans une carte de verre ; l'indicateur d'actualisation passe sous le titre), dépôt, retrait, envoi, Admin Control (bouton actualiser en carré de verre). Le contenu de ces pages (étapes, champs, contrôles) garde son ordre : seules la présentation et l'en-tête changent. Aucun essai sur téléphone réel.

# OM Wallet 14.3.1 — nouvelle identité (logo, icône), page de connexion sobre, revue de code

- **Le logo reste un logo** : il n'apparaît plus qu'à sa place — icône de l'application, écran de démarrage, en-tête de la page de connexion (petit, à plat), reçus, page « À propos » et installation. Il a été retiré de l'en-tête de l'accueil et de la ligne de salutation. **Page de connexion refaite** (web et Android) : fond uni, un seul petit logo en haut, titre et une ligne de texte alignés au bord, champs à fine bordure, un seul bouton plein bleu nuit (couleur du texte du logo), plus de verre, de halo ni de dégradé ; thème sombre et arabe (droite à gauche) vérifiés.
- **Nouveau logo et nouvelle icône** fournis par le propriétaire (portefeuille « OM » en bleu verre) : icône adaptative Android (couche principale, icône thématique Android 13, écran de démarrage, logo de la connexion), icônes PWA / iOS / favicon, logos de l'application web (marque seule, horizontal, empilé, blanc). Fichiers sources et script de régénération dans `brand/` (`python3 brand/make_assets.py`). L'écran d'accueil illustré fourni est conservé comme référence (`brand/originals/onboarding-ar.png`) : le texte arabe est incrusté dans l'image, il n'est pas utilisable tel quel pour le français et l'anglais. Les images de lancement iOS (`assets/splash`) gardent l'ancien logo.
- **Revue de code — corrigé** : (1) les liens de l'e-mail admin sont **à usage unique** (un second appel répond « déjà utilisé », une décision finale épuise tous les liens de la transaction, un renvoi remplace le jeu précédent) ; (2) **plus aucun jeton utilisable dans la file d'e-mails** : les liens sont créés à l'envoi, seul leur haché est stocké ; (3) page de confirmation : un lien utilisé ou remplacé n'affiche plus jamais un résultat que le serveur n'a pas donné, langue invalide sans effet ; (4) déclencheurs « au mieux » : avertissement + ligne dans `audit_log` au lieu d'un silence ; (5) création des adresses : un réseau en échec ne bloque plus les autres, identifiant validé ; (6) Android : rafraîchissement de session **un à la fois**, erreur 400 d'un appel de données plus jamais présentée comme « identifiants incorrects », clé Keystore invalidée récupérée, adresse de dépôt invalide signalée au lieu d'être cachée ; (7) tests de dérivation des adresses ajoutés au dépôt (`tests/keys`, vecteurs publics Ethereum / Bitcoin / TRON / XRP + 1 600 adresses).

# OM Wallet 14.3.0 — adresses de dépôt réelles par utilisateur, e-mail admin à trois boutons, « En cours » côté utilisateur

- **Adresses de dépôt** : chaque compte (21 existants rattrapés, chaque nouvel inscrit à la création du profil) reçoit **une adresse différente par réseau** — Bitcoin, Litecoin, Ethereum, BNB Smart Chain, Polygon, TRON, Solana, XRP — et **son QR code enregistré**. Chaque adresse vient d'une vraie clé privée (secp256k1 / ed25519) : des fonds envoyés à une adresse tirée au hasard sans clé seraient perdus. La clé est chiffrée (AES-256-GCM, clé maître dans Supabase Vault), stockée dans une table inaccessible aux utilisateurs et écrite dans la même transaction que l'adresse. Contrôle en production : les 8 clés chiffrées d'un compte redonnent exactement leurs 8 adresses. Les anciennes valeurs de `crypto_wallets.address` restent en base, jamais affichées. Un dépôt n'est pas détecté automatiquement : l'administrateur le crédite après vérification sur le réseau (`admin_address_owner` retrouve le propriétaire d'une adresse).
- **E-mail à l'administrateur dès qu'un envoi est enregistré** : trois boutons (Confirmer / Refuser / Mettre en pause), en français, anglais ou arabe selon l'administrateur, en plus de la notification dans l'application. Chaque bouton est un lien personnel à jeton de 256 bits (stocké haché, 72 h) qui ouvre une page de confirmation `admin-action` ; l'action n'est exécutée que par le clic sur cette page (un lien qui agirait à l'ouverture serait déclenché par les aperçus et antivirus de messagerie). Mise en pause : la transaction reste en attente, montant réservé, confirmable ou refusable ensuite. Admin Control (web et Android) a le même bouton Pause.
- **À la confirmation** : notification dans l'application pour l'expéditeur et le destinataire, e-mail « Fonds reçus » au destinataire, e-mail détaillé « Transfert confirmé » à l'expéditeur.
- **Utilisateurs : seulement « En cours »** (animation de trois points, suivi en quasi temps réel) pour un envoi ou un retrait pas encore terminé, puis « Transfert confirmé » ou « Refusé ». Plus aucune mention de confirmation ou de vérification par l'administrateur (écrans, notifications, étapes).
- Tests : 7 suites web (dont dépôt avec QR, « En cours », pause) ; essai en base annulé (pause idempotente, un seul crédit exact, 2e confirmation « already », refus après confirmation refusé, un e-mail par destinataire).

# OM Wallet Android 14.2.0 — application native (Kotlin + Jetpack Compose), première version

- **Nouveau dossier `android/`** : application native multi-modules (`app`, `core-design`, `core-ui`, `core-network`, `core-data`, `core-security`, `feature-dashboard`, `-assets`, `-markets`, `-deposit`, `-withdraw`, `-send`, `-history`, `-admin`), branchée sur le même serveur Supabase. Détails, règles et limites : `android/README.md`.
- Identité OM Glass (jetons du cahier, IBM Plex Sans Arabic embarquée, ressorts, retours haptiques natifs CONFIRM/REJECT dès Android 11), SplashScreen API, edge-to-edge, retour prédictif, langues par application (en / fr / ar, arabe de droite à gauche avec montants de gauche à droite).
- Écrans : connexion, Accueil (USD / OMR au taux officiel, Dépôt / Retrait / Crypto / Marchés, 3 promotions internes menant à de vrais écrans), Actifs et détail (graphiques réels 1J / 1S / 1M / 1A, réseaux, frais), Marchés en direct (Binance, favoris, signe + / −), Activité (par jour, fiche avec étapes réelles, historique CFA archivé en lecture seule), Dépôt (adresse du serveur uniquement : aujourd'hui « indisponible », sans fausse adresse), Retrait banque OMR et crypto (erreurs sous les champs, récapitulatif, code PIN), **envoi interne par e-mail** (« À confirmer » jusqu'à l'administrateur), Admin Control (un seul bouton Confirmer, idempotent ; retraits crypto et bancaires ; Trust Wallet : information seulement), Compte.
- Serveur : `find_user_by_email` (nom masqué, comptes actifs, utilisateurs connectés) — migration `20261122_find_user_by_email.sql`, ajout seul.
- Vérifié : 36 tests (règles, contrat serveur avec serveur HTTP local, écrans sur Android 12 et 13 via Robolectric, en français et en arabe), APK debug, APK et AAB release R8. **Non vérifié** : aucun essai sur téléphone ni émulateur, AAB non signé, pas de Macrobenchmark ; WalletConnect non réalisé.

# OM Wallet 14.2.0 — envoi interne de crypto, confirmé par l'administrateur

- **Nouvel écran « Envoyer à un utilisateur OM Wallet »** (onglet Crypto › Envoyer, et recherche) : crypto vers un autre compte OM Wallet par son Wallet ID. Le destinataire est cherché par le serveur et son nom s'affiche avant l'envoi. Contrôles : identifiant, pas d'envoi à soi-même, solde disponible. Récapitulatif, puis code PIN vérifié par le serveur (`transfer_crypto`).
- L'envoi est **enregistré en attente** : le montant est réservé, le destinataire n'est pas crédité. L'écran de suivi montre le statut réel (Enregistré → Confirmation → Crédité, ou Refusé et montant restitué) et ne dit jamais « crédité » avant la confirmation de l'administrateur (Admin Control › Transactions à confirmer : un bouton, crédit, heure exacte, un seul e-mail « Fonds reçus » dans la langue du destinataire).
- **Actualisation immédiate** : à la confirmation, la notification temps réel recharge les soldes et l'historique (Accueil, Crypto, Activité, suivi de l'envoi) ; une vérification toutes les 15 s prend le relais.
- Activité : les envois internes y figurent (expéditeur et destinataire).
- Tests : envoi (destinataire introuvable / trouvé, solde, PIN, paramètres exacts, statut en attente, passage à « crédité ») ; balayage de 23 écrans × 3 langues × 2 thèmes.

# OM Wallet 14.1.2 (serveur) — e-mails en service

- Nouvelle clé Brevo enregistrée **chiffrée dans Supabase Vault** (nom `brevo_api_key`), lisible uniquement par la fonction d'envoi (rôle service ; ni les utilisateurs ni le navigateur). Elle n'est pas dans le dépôt. `send-email` v55 lit la clé du coffre en priorité (relue toutes les 5 minutes), puis les secrets de la fonction.
- Contrôle : clé acceptée par Brevo (compte « DOoM », offre gratuite 300 e-mails/jour) ; premier e-mail accepté par Brevo le 22/11 à 18:20 UTC ; la file d'attente part automatiquement toutes les 5 minutes.
- Expéditeur : `yordigitalefinance@gmail.com` ajouté comme expéditeur dans ce compte Brevo (lien de vérification envoyé à cette boîte). Tant qu'il n'est pas vérifié, l'envoi utilise l'expéditeur déjà vérifié du compte, puis repasse automatiquement sur l'adresse Gmail (contrôle toutes les 30 minutes).

# OM Wallet 14.1.1 (serveur) — e-mails dans la langue de chaque personne, plus aucune confirmation automatique

## E-mails (`send-email`, version 54)
- **Chaque e-mail part dans la langue choisie dans l'application** (arabe, anglais ou français ; 21 personnes : 10 en arabe, 6 en anglais, 5 en français). Sans langue enregistrée : celle du pays (pays arabophones → arabe, francophones → français, sinon anglais).
- Les e-mails de validation (identité vérifiée, paiement confirmé, retrait payé), auparavant toujours en arabe, suivent eux aussi la langue de la personne ; le nom de la banque est traduit (table `oman_banks`).
- Arabe vérifié sur rendu réel : sens de droite à gauche, valeurs en `dir="auto"` (date et statut lisibles), virgule arabe, polices arabes (Tahoma, Geeza Pro, Noto). Une adresse ou un hash passe à la ligne ; une phrase ou une date ne se coupe plus au milieu d'un mot.
- Lien du bouton : https://yor-wallet.vercel.app. Si l'adresse d'expédition n'est pas vérifiée dans le compte Brevo de la clé, l'envoi utilise l'expéditeur vérifié de ce compte (une seule fois, puis mémorisé).
- La file d'attente est envoyée automatiquement toutes les 5 minutes (tâche planifiée existante) dès qu'une clé valide est enregistrée.

## Seul l'administrateur confirme (`20261122_admin_only_confirmation.sql`, appliquée ; retour arrière fourni)
- L'envoi vers un numéro (`fiat_send_external`) n'est plus « confirmé » d'office : il est enregistré « en traitement » (paiement manuel) et seul l'administrateur le termine, avec la référence du paiement réel (Admin Control › Transferts (archives)). Vérifié dans un bloc annulé.
- La tâche planifiée `demo_advance_jobs`, qui faisait passer des transferts « bancaires » à « terminé » toute seule, est désactivée (réversible ; elle n'avait traité qu'un transfert, le 20 octobre).

# OM Wallet 14.1.0 — confirmation des transactions par l'administrateur, e-mail « Fonds reçus »

## Serveur (`supabase/migrations/20261122_admin_tx_confirmation.sql`, appliquée ; retour arrière : `…_rollback.sql`)
- **Seul l'administrateur confirme.** Un transfert interne (monnaie ou crypto) est enregistré **en attente** : le montant de l'expéditeur est mis en réserve, le destinataire n'est pas crédité, aucun e-mail n'est créé.
- **Un bouton** (`admin_tx_confirm`) : dans une seule transaction de base de données, débit réel de l'expéditeur, crédit du destinataire, écritures du grand livre, statut `CONFIRMED`, **heure exacte** (`confirmed_at`, `clock_timestamp()`), administrateur (`confirmed_by`), journal d'audit, notifications, et **un seul e-mail** `FUNDS_RECEIVED` au destinataire. Pas d'autre autorisation, pas de second administrateur.
- **Jamais en double** : verrou de ligne + statut (un second clic répond « déjà confirmée » sans rien créditer), clé d'idempotence `FUNDS_RECEIVED:<transaction>` (un second e-mail est impossible). **Jamais d'e-mail avant le crédit** : il est créé dans la même transaction, et la fonction d'envoi revérifie le statut, l'heure de confirmation et l'écriture de crédit.
- Refus (`admin_tx_reject`, motif obligatoire) : la réserve revient à l'expéditeur, aucun e-mail. Liste du centre de contrôle : `admin_tx_list` (avec l'état réel de l'e-mail).
- Les anciens e-mails automatiques « expéditeur / destinataire » ne sont plus créés (un seul e-mail par transaction).
- **Blockchain externe** : l'approbation déclenche l'exécution ; le statut final et l'e-mail `CRYPTO_WITHDRAWAL_CONFIRMED` attendent le **hash réel** du réseau.
- Testé sur de vrais comptes dans un bloc annulé (rien d'enregistré) : réserve, refus d'un utilisateur, crédit exact, un e-mail, second clic sans effet, refus et restitution, crypto.
- Sauvegarde exacte des 4 fonctions remplacées dans `public.function_backups` (le retour arrière les ré-exécute). Aucune donnée supprimée.

## E-mails (`supabase/functions/send-email`, version 53)
- **Plusieurs fournisseurs** : Brevo (`BREVO_API_KEY`), puis SMTP en TLS (`SMTP_HOST`, `SMTP_PORT` 465, `SMTP_USER`, `SMTP_PASS`, ex. Gmail avec mot de passe d'application), puis Resend (`RESEND_API_KEY`, `RESEND_FROM`). Si l'un refuse (clé, expéditeur), le suivant est essayé. Expéditeur réglable : `EMAIL_FROM`.
- Gabarit « **OM Wallet — Fonds reçus** » exact (« Vous avez reçu [MONTANT] [CRYPTO] sur votre compte OM Wallet. » · Référence · Date et heure (heure d'Oman, secondes) · « Statut : Crédité avec succès. »), en français, anglais ou arabe selon la langue du destinataire, avec version texte.
- Marque OM Wallet (bleu ciel) sur tous les e-mails (l'ancienne marque « Sanad Pay » est retirée).
- Mode de contrôle sans secret (`{"check": true}`) : clé Brevo acceptée ou non, expéditeur vérifié ou non.
- **État actuel** : la clé Brevo enregistrée est refusée (401 « Key not found ») ; aucun autre fournisseur n'est configuré. Les e-mails restent en file sans perdre leurs essais jusqu'à ce qu'une clé valide soit enregistrée.

## Admin Control
- Onglet **Transactions à confirmer** (et compteur sur le tableau de bord) : expéditeur, destinataire, montant, référence, date ; **un bouton « Confirmer la transaction »** ; heure exacte de confirmation et état de l'e-mail (envoyé / en file / pas d'adresse) ; filtres En attente / Confirmées / Refusées.
- La transaction confirmée **reste à sa place** (affichée « confirmée ») : un double-clic ne peut jamais confirmer la suivante. Les nouvelles transactions sont annoncées par un bandeau « Actualiser », jamais insérées sous le doigt.
- Notifications « Transfert en attente de confirmation » et « Transfert refusé » traduites (fr / en / ar).

# OM Wallet 14.0.0 — portefeuille crypto premium : marchés réels, retraits réels, transferts retirés

## Données conservées (aucune suppression)
- Aucune ligne de la base n'a été supprimée ni modifiée en masse. Les anciennes transactions de transfert, leurs reçus et les versements restent consultables (Activité, Admin › Transferts (archives)). Les références historiques ne changent pas.
- Le portefeuille **CFA (XOF)** est retiré de l'interface seulement : le compte et ses montants restent intacts en base, aucune conversion automatique ; l'application le garde à part (`Runtime.accountsArchived`) et ne l'affiche, ne le convertit et ne l'utilise plus.

## Serveur (`supabase/migrations/20261122_crypto_withdrawals_real.sql`, appliquée ; retour arrière : `…_rollback.sql`)
- **Plus aucune fausse adresse de dépôt** : `get_receive_address` refuse (`deposit_address_unavailable`) — les adresses créées auparavant étaient générées au hasard, sans clé privée : des fonds envoyés dessus auraient été perdus.
- **Retraits crypto réels, payés manuellement** : table `crypto_withdrawals`, `crypto_withdraw_request` (code PIN vérifié par le serveur, clé d'idempotence, format d'adresse par réseau, adresses internes refusées, tag XRP, 3 demandes ouvertes au plus, débit immédiat du solde, transaction `CRYPTO_SEND` en `PENDING`), `crypto_withdraw_cancel`, `crypto_withdraw_overview`. Admin : `admin_crypto_withdrawal_list / process / complete / reject`. **Confirmé seulement avec le vrai hash blockchain** (format du réseau, jamais réutilisé) ; refus = remboursement. Testé dans des transactions annulées (rejeu, annulation, refus, droits).
- Les retraits bancaires OMR existants (`withdraw_*`, `admin_withdrawal_*`) sont utilisés tels quels : mêmes règles (minimum, KYC, banques, IBAN, 3 demandes ouvertes).

## Interface
- **Transferts retirés** : bouton, onglet, écrans (numéro du destinataire, montant, confirmation, résultat, « Recevoir »), raccourcis de recherche, bannière, « envoyer à nouveau » des reçus. Un ancien lien vers ces écrans ramène à l'accueil (garde du routeur `RETIRED_RE`). Les fonctions serveur de transfert ne sont pas modifiées.
- **Barre flottante** : Accueil · Crypto · Marchés · Activité · Compte. Barre latérale (bureau) alignée.
- **Accueil** (`js/screens/omx.js`) : « OM Wallet », « Bienvenue, [Nom] », profil, recherche, notifications ; carte « Total des actifs » en USD avec l'équivalent OMR, variation 24 h, graphique du portefeuille (avoirs actuels × cours historiques, indiqué comme tel), œil (masqué au démarrage) ; actions Dépôt · Retrait · Échange · Marchés ; vos actifs, marchés, activité récente.
- **Données de marché réelles** (`js/crypto/omx-data.js`) : API publique Binance (REST `data-api.binance.vision`, flux WebSocket `data-stream.binance.vision`, repli toutes les 20 s), état affiché (En direct / Actualisé / Hors ligne / Indisponible + Réessayer) et heure de dernière synchro. Cours en USDT ≈ USD (indiqué). Aucun cours inventé : sans données, « — ».
- **Crypto, Marchés, Détail** : 13 actifs (BTC, ETH, USDT, USDC, BNB, SOL, TRX, XRP, LTC, DOGE, ADA, AVAX, POL) avec logos officiels (web3icons, MIT), cours, variation, mini-graphique, recherche, favoris (enregistrés dans les préférences), graphique interactif 1H/4H/1D/1W/1M/1Y, plus haut / bas / volume 24 h, réseaux avec contrats vérifiés sur la chaîne, explorateur.
- **Dépôt** : crypto → réseau → le serveur est interrogé ; sans adresse réelle, message clair « n'envoyez aucun fonds », ni adresse ni QR. Un vrai encodeur QR (qrcode-generator, MIT) n'est utilisé qu'avec une adresse renvoyée par le serveur.
- **Échange** : indiqué comme indisponible (pas de service de marché réel relié).
- **Retraits** (`js/screens/omx-withdraw.js`) : banque (OMR) et crypto ; contrôles avant envoi (montant, minimum, solde + frais, IBAN mod-97, format d'adresse, tag XRP), récapitulatif + case « j'ai vérifié », code PIN, **suivi animé selon le statut réel** (Préparation → Vérification / En attente → Traitement → Confirmation ; Échec / Annulé), rafraîchi toutes les 15 s, annulation tant que la demande est en attente, lien explorateur et hash quand ils existent, reçu PDF / partage (réseau, adresse, hash).
- **Admin Control** (`js/screens/admin-dy.js`) : tableau de bord, retraits bancaires (approuver, refuser avec motif, marquer payé avec la référence bancaire), retraits crypto (traitement, confirmation par hash, refus), utilisateurs, actifs et réseaux, paramètres (retraits activés), journal. L'interrupteur DY est retiré avec les transferts ; son historique reste lisible.
- Reçus exportés : identité OM Wallet (couleurs, nom de fichier `OM-WALLET-…`).
- Lignes d'Activité plus lisibles sur téléphone ; CSP : `connect-src` ajoute les deux hôtes Binance.

## Tests
- `tests/ux/omx.test.mjs` (accueil, total exact, marchés, favoris, graphique, dépôt sans adresse, échange, marché indisponible, retraits crypto et banque, annulation, IBAN), `tests/ux/admin-console.test.mjs` (remplace `dy.test.mjs`), balayage `smoke` sur les nouveaux écrans (22 écrans × 3 langues × 2 thèmes), `bugfix` (transferts retirés, CFA masqué). `orange-money.test.mjs` supprimé : le parcours testé n'existe plus.

# OM Wallet 13.3.1 — le solde reste masqué tant qu'on ne touche pas l'œil

## Modifié
- **Chaque session démarre avec le solde masqué (••••)** : accueil, hub Profil et paramètres, et la ligne « Principal · solde » sous le montant de l'écran d'envoi. Seul l'œil l'affiche ; les rafraîchissements ultérieurs (après un transfert, rechargement des données) gardent le choix de la personne. La préférence enregistrée n'impose plus l'état de départ.
- Aucun faux solde n'est jamais affiché : le solde est soit le vrai montant, soit masqué.
- Le reçu n'affiche déjà jamais le « solde restant » (règle 12.6.0 : pas de ligne, pas d'appel serveur, ni dans le PNG ni dans le PDF). Test ajouté : le solde est masqué au démarrage et sous le montant d'envoi.

## À savoir
- Les SMS / e-mails de confirmation envoyés à l'expéditeur par le serveur (`send-notice`) mentionnent encore le solde disponible : ils n'ont pas été modifiés.

# OM Wallet 13.3.0 — mise à jour : référence OM PAY, modules agrandis

## Ajouté
- **Nouvelle référence des transactions** (`supabase/migrations/20261121_om_pay_transaction_reference.sql`, appliquée en production ; retour arrière fourni) : « **OMT** + 8 chiffres » (ex. `OMT89274631`), pour les FUTURES transactions seulement. Séquence dédiée `om_reference_seq` ; la permutation `(n × 48271 + 17317) mod 10^8` est une bijection : aucune collision possible avant 10^8 références, la contrainte UNIQUE de `transactions.reference` reste le dernier garde-fou, et chaque référence correspond à un numéro de séquence (traçable). Testé dans une transaction annulée : 20 000 références distinctes, format correct, aucune collision avec l'existant. Les 243 références historiques `BMCT26…` ne sont pas modifiées ; l'ancien préfixe, qui imitait celui d'une banque, n'est plus utilisé. La fenêtre de versement refuse aussi une référence `OMT…` saisie comme référence Orange Money.
- **Modules agrandis** (`css/glass.css` section 19) : boutons ronds de l'en-tête, titre de bienvenue, paysage, carte de solde (hauteur, montant, tuile « OM PAY »), quatre actions, bannière, lignes d'opérations (avatar, texte, montant, pastille), barre flottante et bouton central, hub Profil et paramètres, boutons et champs de tous les écrans. Les tailles s'adaptent à la largeur (testé à 360, 390 et 430 px, sans débordement).
- **Solde jamais coupé** : si le montant est plus large que sa carte (long nombre sur un petit téléphone), la police se réduit jusqu'à ce qu'il tienne (minimum 20 px).

# Friendly Pay 13.2.0 — DY : l'interrupteur « transferts suspendus » (serveur + écran admin)

## Ajouté
- **Serveur** (`supabase/migrations/20261121_dy_transfer_switch.sql`, appliquée en production ; retour arrière : `…_rollback.sql`) : table `dy_settings` (état persistant : actif, date, administrateur), table `dy_blocked_attempts`, fonctions `dy_status` (tout utilisateur connecté : seulement « actif ou non »), `admin_dy_overview` et `admin_dy_set` (administrateurs actifs seulement, vérifié par `is_admin()` dans la base). Chaque changement est écrit dans `audit_log` (`DY_ON` / `DY_OFF`, append-only).
- **Blocage réel** : une ligne de garde dans `fiat_send_external`, `intl_send`, `transfer_fiat` et `bank_send`. DY actif → `{ok:false, error:'TRANSFER_UNAVAILABLE'}` **avant** la consommation du code PIN, **avant** toute écriture de transaction, **avant** tout débit. Un rejeu d'une clé d'idempotence déjà exécutée renvoie toujours son résultat d'origine. DY coupé → procédure normale, toutes les vérifications habituelles (PIN, solde, plafonds).
- **Application** (`js/features/dy.js`) : à la saisie du numéro, si DY est actif, le serveur cherche le nom (`beneficiary_lookup`, annuaire autorisé) ; le nom s'affiche **seulement s'il est connu** ; puis la fenêtre bilingue exacte (« التحويل غير متاح مؤقتًا / Transfer Temporarily Unavailable », bouton « موافق / OK »). Continue reste bloqué. L'écran de confirmation redemande l'état au serveur avant de demander le code PIN. Si DY est activé entre-temps, le serveur refuse : retour à l'accueil, aucun reçu, aucun « échec » inventé.
- **Écran administrateur** (`js/screens/admin-dy.js`) : Services › Administrateur › Réglages des transferts (DY) : interrupteur ON/OFF avec confirmation, état, date et administrateur du dernier changement, aperçu de la fenêtre, tentatives bloquées (24 h / total), historique des changements.
- **Fenêtre « خطأ في النظام / System Error »** : réservée à une VRAIE erreur technique du serveur (réponse inattendue), jamais déclenchée par DY.
- `css/glass.css` : premiers jetons et composants « Liquid Glass » (blanc + bleu ciel).
- Tests : `tests/ux/dy.test.mjs` (DY coupé / actif, nom connu / inconnu, aucun envoi ni PIN, activation entre la confirmation et l'envoi, écran admin en 3 langues, refus pour un utilisateur normal). Côté base, vérifié dans des transactions annulées : non-admin refusé, blocage des 4 fonctions, solde / transactions / ledger inchangés, code PIN non consommé, reprise normale quand DY est coupé.

## Identité OM Wallet · Liquid Glass (même version 13.2.0)
- **Nouveau logo et nouvelles icônes** (généré par `tools/brand/build-brand.mjs`, aucun élément de l'ancien logo) : monogramme « OM » en dégradé bleu ciel sur tuile de verre blanche translucide. Fichiers dans `public/branding/` : `om-wallet-logo.svg/.png`, `om-wallet-icon-1024/512/192.png`, `om-wallet-favicon.svg`, `apple-touch-icon.png`, `om-wallet-notification.png` (silhouette blanche) et `om-wallet-monochrome.svg/.png`. Mis à jour aussi : `assets/icons/*`, favicon, manifeste PWA (nom « OM Wallet », couleur #F4FAFF), 24 images de lancement iOS, images de partage, logo d'en-tête de l'accueil, écran de lancement et illustrations d'introduction.
- **Thème Liquid Glass** (`css/glass.css`, chargé après `ui.css`) : blanc + bleu ciel doux avec les jetons officiels (`--om-*`), verre translucide avec flou d'arrière-plan, bordures claires, reflets, ombres diffuses ; carte de solde en verre, actions en verre, listes en blocs arrondis, barre de navigation flottante avec indicateur bleu, fenêtres et feuilles en verre, champs et boutons ciel, cartes virtuelles en dégradés bleu ciel ; mode sombre assorti. Durées : interactions ≈ 110 ms, transitions ≈ 260 ms, fenêtres ≈ 300 ms ; `prefers-reduced-motion` respecté.
- **Marque** : « Friendly Pay » / « فرندي باي » deviennent « OM Wallet » partout dans l'interface ; « Friendly ID » devient « Wallet ID » (les identifiants FRD-… ne changent pas).
- **Symbole du rial omanais** : aucun symbole n'existait dans le projet ; il a été **tracé d'après vos captures** (`tools/brand/trace-omr-symbol.py` → `assets/brand/omr-symbol.svg`) et s'affiche à la place du code sur la carte de solde (le texte reste « OMR » dans le DOM, les données et les exports). Appliqué là où le code passe par `.rv-cur` (accueil) ; les autres écrans affichent encore « OMR ».
- **Montants** : trois décimales partout (déjà le cas) ; en arabe les chiffres sont désormais latins (`1,284.500`), comme sur le design ; la devise d'affichage par défaut est le rial omanais (au lieu du dollar) pour les comptes qui n'ont pas choisi une autre devise.
- **Écran de lancement** : ≈ 1 s (au lieu de 1,9 s).

- **Versements Mali** : la fenêtre « Marquer comme versé » refuse une référence qui ressemble à une référence interne (`BMCT…`, `OMW…`, `FRD-…`, `YOR-…`) — saisie par erreur, elle serait imprimée dans le SMS du destinataire comme « Réf. Orange Money » (cas du versement `…243`). Test ajouté.
- **Déploiement** : un dossier `public/` à la racine devient le dossier de sortie de Vercel (projet sans framework) : `vercel.json` fixe donc `"outputDirectory": "."`.
- Le panneau latéral (ordinateur) affiche `FRD-…` au lieu de l'identifiant interne `YOR-…`.

## Réplique de la maquette « OM PAY » (même version 13.2.0)
- **Éléments graphiques tirés de vos captures** (les images fournies sont la référence) : logo « OM PAY » en version claire et sombre (`assets/brand/om-pay-logo*.png`), paysage d'Oman avec le fort (`assets/ui/oman-hero.jpg`, sous-titre incrusté retiré), tuile « OM PAY » de la carte de solde (`om-glyph.png`, `om-pay-word.png`), illustration de la bannière (`promo-art.svg`), symbole du rial (tracé).
- **Accueil** : en-tête (profil · logo · notifications avec point bleu), salutation centrée avec le vrai prénom, paysage derrière la salutation, carte de solde en verre avec la tuile « OM PAY » (symbole du rial puis montant), quatre actions en verre (Transférer en bleu, Recevoir, Historique, Plus), bannière « Transférer de l'argent vite et en sécurité », carte unique « Dernières opérations » avec statut vert « Terminé » et pastille d'arrondi vert / rouge selon le sens, barre flottante (Accueil · Opérations · bouton central bleu · Cartes · Compte). La recherche n'est plus dans l'en-tête de l'accueil (elle reste dans l'historique).
- **Profil et paramètres** (`js/screens/account-hub.js`, écran `account`, dernier onglet de la barre) : carte du profil (vrai nom, numéro, « Compte vérifié » seulement si le serveur dit VERIFIED), carte portefeuille (vrai solde), niveau du compte, liste (sécurité, notifications avec interrupteur réel, langue, aide, à propos, contrôle administrateur pour les administrateurs) et bouton rouge « Se déconnecter ».
- **Admin Control** : mise en page de la maquette (menu, réglages au centre, état et quatre chiffres réels à droite via la nouvelle fonction `admin_console_stats`, notes en bas), libellés arabe + anglais. Le centre montre l'interrupteur DY et l'**avis réel** montré aux expéditeurs (« Transfert temporairement indisponible »).
- **Non reproduit** : (1) le reçu « Transfer Completed Successfully » affiché avec une fenêtre « System Error » par-dessus ; (2) le « message d'erreur système » configurable quand DY est actif ; (3) le « Pay by code » (aucun paiement par code n'existe dans l'application : le bouton central de la barre envoie de l'argent).

## Corrections (passe de contrôle)
- **Cartes virtuelles** : les deux faces d'une carte s'empilaient (régression du thème) → la face arrière réapparaissait sous la carte.
- **Arabe** : les notifications de transfert s'affichaient en anglais (texte stocké en base) → elles sont construites dans la langue de l'application avec les vraies valeurs (montant, devise, nom) ; un nom latin trop long n'est plus coupé à son début.
- **Symbole du rial** étendu à l'historique, à la confirmation, au reçu et aux versements administrateur.
- **Focus volé** : 150 ms après l'ouverture de l'écran « numéro du destinataire », le champ du numéro reprenait le focus même si la personne avait déjà commencé à saisir un prénom — le texte tapé partait dans le mauvais champ. C'était la cause de l'instabilité du test Orange Money (8 exécutions sur 8 réussies après correction).
- Les en-têtes de la fenêtre administrateur de versements affichaient le numéro de téléphone coupé en deux lignes.

## Non fait (volontairement)
- Pas de nouveau reçu « transfert réussi », pas de PDF ni de bouton Partager pour les transferts vers l'Oman, pas de références « OMW… » : ces transferts sont aujourd'hui confirmés immédiatement sans aucun versement réel, et un reçu « réussi » partageable pour un transfert non versé pourrait servir de fausse preuve de paiement.
- Pas de pages réécrites une à une : l'apparence est portée par le thème et les composants existants. Pas de composants `OMGlassCard`… en React (le projet n'utilise pas de framework).

## Choix assumés
- Pas de contrôle « disponibilité générale du service » distinct : DY EST ce contrôle (un seul interrupteur, un seul comportement vérifiable).
- Les transferts vers l'Oman restent enregistrés comme confirmés immédiatement, sans versement (comportement existant, non modifié) : voir la note de fin de session.

# Friendly Pay 13.1.0 — le bouton administrateur qui déclenche le SMS

## Ajouté
- **Écran « Versements et SMS »** (`js/screens/admin-payouts.js`), réservé aux administrateurs (`Runtime.ctx.role === 'admin'`) : entrée « Administrateur › Versements et SMS » dans Services. Il liste (via `admin_payout_list`) les transferts Orange Money Mali, avec le destinataire, l'expéditeur, le montant en rials et en FCFA, la référence Orange Money et **l'état du SMS** (partira / envoi en cours / envoyé / échec + raison du fournisseur).
- **Bouton « Marquer comme versé et envoyer le SMS »** : l'administrateur saisit la référence Orange Money (4 à 60 caractères, imprimée dans le SMS) et confirme → `admin_payout_confirm(tx, référence)`. Le serveur passe le transfert à « Versé », prévient l'expéditeur et appelle `payout-notice`, qui envoie le SMS au destinataire. **Le SMS ne part qu'à ce clic** (la fonction serveur l'indique elle-même : jamais depuis l'application). L'écran relit l'état toutes les 3 s tant que le SMS est « en cours d'envoi ».
- **Bouton « Renvoyer le SMS »** pour un versement déjà marqué (par exemple si le premier SMS a échoué faute de crédit) : demande une confirmation, puis `admin_payout_resend_notice(tx)`.
- Aucune modification du serveur : les trois fonctions existaient déjà et vérifient `is_admin()` ; l'écran ne calcule rien et n'écrit rien d'autre. Un utilisateur normal ne voit pas l'entrée, et l'écran le renvoie à l'accueil sans même demander la liste.
- Test : `tests/ux/admin-payouts.test.mjs` (utilisateur normal / administrateur en 3 langues ; charges utiles exactes ; refus d'une référence trop courte avant tout appel ; l'état du SMS passe de « en cours » à « envoyé » ; « Renvoyer » ne fait rien avant la confirmation). Faux client : aucun SMS réel n'a été envoyé et aucun versement réel n'a été marqué pendant le développement.

## À savoir
- « Marquer comme versé » est une action réelle et définitive (le transfert passe à COMPLETED) : ne l'utiliser qu'après avoir envoyé l'argent sur le compte Orange Money du destinataire.
- Pas de bouton « Rejeter et rembourser » dans cet écran (la fonction serveur `admin_payout_reject` existe ; à ajouter si vous voulez tout gérer ici).
- L'envoi du SMS dépend des secrets du serveur (fournisseur SMS, crédits, nom d'expéditeur) : en cas d'échec, la raison s'affiche sur la carte et « Renvoyer le SMS » permet de réessayer.

---

# Friendly Pay 13.0.0 — nouvelle identité « Ultramarine », livraison en deux fichiers

La 12.16.0 avait la même identité (turquoise) et les mêmes compositions que la 12.15 sous une peau iOS. La 13.0.0 change l'identité et les compositions ; la logique (transferts, code, Face ID, session) n'est pas touchée.

## Apparence — rien à voir avec la 12.x
- **Identité** : fond blanc, texte encre, **un seul accent bleu outremer** (`#3B49E8` clair / `#9AA4FF` sombre, contrastes 6,4 : 1 et 8,2 : 1), chiffres arrondis (`ui-rounded` / SF Rounded). Fini le turquoise, les dégradés sarcelle, la teinte menthe et le filet champagne.
- **Accueil** sans carte de solde : salutation en grand titre, solde en très gros chiffres sur le fond, un bouton **Envoyer** pleine largeur et trois boutons contour (Recevoir, Historique, Plus) ; activité récente en lignes à plat, bord à bord. Les publicités illustrées deviennent des conseils texte.
- **Barre d'onglets classique** pleine largeur (filet, libellés, icône pleine pour l'onglet actif) : plus de dock flottant ni de bouton Envoyer surélevé.
- **Listes à plat** (accueil, historique) ; groupes arrondis seulement dans Réglages / Profil / Services (qui n'est plus une grille d'icônes mais une liste à chevrons).
- **Contrôles** : boutons rectangles arrondis (14 px) pleins, filtres contour (le choisi est plein encre), champs gris discrets, progression de l'envoi en trois segments, choix de destination en contrôle segmenté, toasts encre.
- **Nouvelle marque** : un sourire et une pièce ambrée sur dégradé outremer (la même marque pour toutes les langues). Icônes d'app, 24 écrans de démarrage, images de partage, favicon, logos, hors-ligne / 404 : tout régénéré (`tools/brand/build-brand.mjs`).
- **Écran d'ouverture et présentation redessinés** (`js/ui/opening-art.js`) : marque animée (le sourire se trace, la pièce tombe) ; quatre illustrations plates (bienvenue, envoi, cartes, sécurité) avec les couleurs du thème ; titres de 34 px alignés à gauche.
- Supprimés (ancienne identité, inutilisés) : `assets/ads`, `assets/illustrations`, `assets/cards`, `assets/ui/chip.svg`, `contactless.svg`, l'ancien `css/ios.css`.

## Performance
- **Deux fichiers au lieu de 68** : `tools/build.mjs` (esbuild + lightningcss) assemble, dans le même ordre, les scripts et feuilles listés par `index.src.html` → `js/app.js` et `css/app.css`, minifiés (les noms globaux sont conservés : même comportement). `index.html` est généré. Le site reste statique, **sans étape de build au déploiement** : les bundles sont versionnés comme `js/vendor/reown-appkit.js`.
- Mesures (`tests/ux/perf.mjs`, Chromium, même parcours : ouverture jusqu'à l'écran de code, médiane de 5) :

  | | requêtes | octets bruts | octets brotli | prêt (réseau libre) | prêt (4G lente émulée*) |
  |---|---|---|---|---|---|
  | 12.15.0 (zip d'origine) | 67 | 1 059 Ko | 282 Ko | 512 ms | 6 063 ms |
  | 13.0.0 livré | 4 | 857 Ko | 180 Ko | 385 ms | 4 905 ms |

  \* le serveur de test n'envoie pas de brotli et parle HTTP/1.1 : en production (HTTP/2 + brotli) les écarts de requêtes pèsent moins et ceux d'octets (−36 %) comptent davantage.
- Polices : Manrope n'est plus préchargée ; images d'ambiance et animations d'arrière-plan retirées (`#ambient`), flou limité aux barres.
- `sw.js` : cache `fp-shell-v13.0.0`, coque = 2 fichiers + polices + icônes.

## Pour modifier le code
Éditer les fichiers sources (`js/**`, `css/**`, `index.src.html`), puis `cd tools && npm ci && node build.mjs`. Les tests (`tests/ux/*.test.mjs`) servent le site livré ; `FP_DEV=1` les fait tourner sur la page lisible (68 fichiers).

---

# Friendly Pay 12.16.0 — refonte iOS complète + Orange Money (Mali, Côte d'Ivoire)

## Ajouté
- **Orange Money Mali (+223, 8 chiffres).** Écran « Envoyer » : un sélecteur de destination (Oman / Mali) au-dessus du numéro ; Oman reste le choix par défaut et ses règles et sa fonction serveur (`fiat_send_external`) sont inchangées. Pour Orange Money, l'application utilise la fonction serveur **`intl_send`** (le circuit international existant) : prénom et nom du destinataire obligatoires (le serveur les exige), numéro `+223` + 8 chiffres, minimum 0,500 OMR, estimation en XOF **arrondie à l'inférieur** comme le serveur (`≈ XOF 15 069`, « 1 OMR = 1 492 XOF », « taux indicatif »). Le serveur débite les rials et enregistre le transfert **« en cours »** (`PROCESSING` / en attente de versement) ; pour Orange Money Mali, un administrateur verse l'argent puis confirme (`admin_payout_confirm`) : le transfert passe à `COMPLETED` et l'expéditeur est prévenu. L'application n'affiche donc jamais « transfert réussi » avant cela : l'animation dit « Transfert enregistré », le reçu « Transfert en cours ». Modules : `js/features/destinations.js`, `TransferEngine.sendIntl / checkIntl` (même règles d'idempotence et d'incertitude que `sendExternal`).
- **Orange Money Côte d'Ivoire (+225, 10 chiffres) : codé, testé, mais ÉTEINT** (`FEATURES.orangeMoneyCI = false` dans `js/data/reference-data.js`). Raison, lue dans la base : seul Orange Money Mali a un vrai circuit de versement manuel (`app_private.orange_mali_manual`) ; pour la Côte d'Ivoire `intl_send` passe par le moteur de démonstration, donc l'expéditeur serait débité sans qu'aucun versement ne soit jamais mis en file. Voir `supabase/proposals/orange_money_ci_manual.md` (modification serveur à relire, **non appliquée**).
- **Refonte visuelle iOS** (`css/ios.css`, chargée en dernier) : polices système (SF Pro sur Apple, Inter ailleurs, IBM Plex Sans Arabic en arabe), 1 px CSS = 1 pt iOS, couleurs système claires / sombres, grands titres qui se réduisent dans une barre translucide, bouton retour « ‹ Accueil », listes groupées avec icônes colorées, interrupteurs UISwitch 51×31, contrôles segmentés, boutons capsule, barre d'onglets en verre flottante (icône pleine pour l'onglet actif), feuilles à poignée (l'app recule derrière), pavé de code façon écran de verrouillage, services en icônes d'application.
- **Animations iOS** (`js/ui/ios-motion.js`) : vrais ressorts (oscillateur amorti échantillonné en `linear()`), transitions push / pop avec parallaxe 30 %, assombrissement et ombre de bord, présentation en feuille pour reçu / traitement / formulaires, fondu pour les onglets, **retour par glissement depuis le bord** (le doigt pilote les deux écrans), feuilles qu'on fait glisser vers le bas, **tirer pour actualiser** (indicateur iOS à 12 traits), retour haptique (Taptic Engine via l'interrupteur iOS 17.4+, vibration ailleurs), toucher la barre = remonter en haut, fondu clair / sombre au changement de thème. Tout est coupé sous « réduire les animations » (simple fondu de 120 ms).
- **Nouveau jeu d'icônes** (`js/ui/ios-icons.js`) dessiné dans l'esprit des SF Symbols (trait unique 1,8 px) ; les cinq icônes d'onglet ont une version pleine.
- **Nouvelle identité d'icône** (`tools/brand/build-brand.mjs`) : « F » massif et pièce ambrée sur dégradé turquoise (version arabe « ف »), icônes 16 → 512 px + maskable, 24 écrans de démarrage iOS clair / sombre, images de partage EN / FR / AR, favicon.ico, logos (SVG + PNG).
- Tests (`tests/ux/`) : banc d'essai Playwright avec faux client Supabase ; `orange-money.test.mjs` (charges utiles exactes envoyées au serveur : `intl_send` pour Orange Money, `fiat_send_external` pour l'Oman), `ios-motion.test.mjs` (images de transition, glissement de bord, feuille, tirer pour actualiser, mouvement réduit), `smoke.test.mjs` (15 écrans × 3 langues × 2 thèmes : aucune erreur, aucun débordement, aucun contrôle sans nom, sens d'écriture), `shell.test.mjs` (SHELL de `sw.js`).

## Changé (présentation seulement)
- `js/core/router.js` : ajout de `R.on(écouteur)` et `R.peekBack()` (la navigation se comporte comme avant) ; `js/ui/icons.js` : `data-i="nom"` sur chaque icône (couleurs des pastilles) ; `index.html` : échelle de l'interface (1 px = 1 pt) et couleurs de thème (`#F2F2F7` / `#000`).
- Contrastes : texte secondaire à 5,3 : 1 sur blanc (4,96 : 1 sur le gris de fond), texte « crédit » vert à 5,4 : 1.

## Limites à connaître
- Orange Money Mali : le versement est manuel (un administrateur confirme) ; il n'y a pas d'appel automatique à une API Orange Money. Le délai dépend de votre exploitation (le serveur ne donne pas d'estimation en mode manuel).
- Les numéros du Mali / de la Côte d'Ivoire sont contrôlés sur la longueur (et le zéro initial en Côte d'Ivoire) ; l'opérateur du numéro n'est pas vérifié.
- `fiat_send_external` (Oman) ne vérifie pas la cohérence pays / fournisseur / devise et ne met aucun versement en file : il ne convient qu'au parcours « numéro de mobile omanais » pour lequel il a été écrit.
- Les gestes (retour par glissement, tirer pour actualiser, feuilles) et l'haptique ont été testés dans Chromium avec des gestes tactiles simulés, **pas sur un iPhone réel** : le Taptic Engine (iOS 17.4+) et le geste de bord sont à valider sur l'appareil.

---

# Friendly Pay 12.15.0 — Face ID OU le code pour les transferts

## Changé
- **Transferts : Face ID suffit.** Avant : Face ID PUIS le code à 6 chiffres. Maintenant : Face ID confirmé → aucun code à taper ; Face ID annulé, échoué ou indisponible → le code à 6 chiffres.
- Comment, sans affaiblir le serveur : le serveur n'autorise toujours un transfert qu'après avoir vérifié le code (`verify_pin`, 5 essais puis blocage 15 min). Après un transfert confirmé avec le code et Face ID, le code est gardé sur CET appareil, chiffré (AES-GCM 256) avec une clé que l'iPhone ne libère qu'après Face ID (extension WebAuthn PRF). Ensuite, Face ID déchiffre le code et l'application le transmet elle-même à `verify_pin`. Le code n'est jamais stocké en clair.
- La copie chiffrée est effacée : à la déconnexion, après un changement de code, et dès que le serveur la refuse (une seule tentative silencieuse, jamais répétée).
- Exige iOS 18+ (PRF). Sur un appareil sans PRF, le code reste demandé à chaque transfert. Une clé Face ID créée avant 12.15.0 est remplacée une seule fois (un Face ID supplémentaire) pour activer PRF.
- Ouverture de l'application : inchangée (Face ID, sinon le code). La session reste mémorisée (`persistSession`) : on ne se reconnecte qu'après « Se déconnecter », ou une fois par adresse de site / une fois dans l'app installée (Safari et l'icône n'ont pas la même mémoire sur iPhone).
- Aucun changement côté serveur / base de données.

## Tests
- `tests/ui/faceid-pin-1215.test.mjs` (6 tests, Face ID simulé, chiffrement réel de Chromium). NON EXÉCUTÉ : vrai Face ID sur un vrai iPhone.

---

# Friendly Pay 12.14.0 — refonte premium (étape 1 : animations, écrans, installation iPhone sans App Store)

## Ajouté
- **Identité visuelle premium** (`css/premium.css`, chargée en dernier) : encre pétrole profonde + teal Friendly + filet champagne discret, carte de solde avec lignes guillochées fines et reflet lumineux unique à l'ouverture. Ombres douces, rayons cohérents, boutons tactiles ≥ 44 px.
- **Polices auto-hébergées** (`assets/fonts/`, licence SIL OFL, 304 Ko) : Manrope (interface, titres, montants en chiffres tabulaires), Inter (textes fonctionnels), IBM Plex Sans Arabic (arabe). Aucune police externe : la CSP (`font-src 'self'`) est inchangée. Repli système si une police manque.
- **Accueil refait** (`js/features/premium.js`) : avatar → profil, salutation selon l'heure, recherche, cloche avec compteur réel ; carte « Solde disponible » avec état réel du compte, œil masquer/afficher, identifiant, accès Historique ; actions Envoyer / Recevoir / Historique / Plus ; activité récente avec statut réel. Le solde s'anime (comptage + halo) **uniquement** quand la valeur lue au serveur change ; le texte final est toujours la valeur exacte.
- **Recevoir** : Friendly ID et numéro (copier / partager), argent reçu (réel). Explique honnêtement qu'un transfert vers un numéro ne crédite pas un solde Friendly Pay. Pas de bouton « Ajouter de l'argent » : la fonction n'existe pas.
- **Recherche globale** : opérations (nom, numéro, référence FRD-/YOR-, montant), bénéficiaires (ouvre l'envoi pré-rempli), écrans et réglages. Données déjà chargées uniquement.
- **Historique** : recherche, filtres période (aujourd'hui / 7 j / 30 j / ce mois) et sens (reçues / envoyées), combinés aux filtres de statut existants.
- **Profil refait** : en-tête (avatar, nom, numéro masqué `+968 •••• 1234`, e-mail masqué, Friendly ID copiable, statut de vérification RÉEL — « Vérifié » seulement si le serveur le dit), sections Informations personnelles, Vérification, Sécurité, Préférences, Assistance.
- **Modifier le profil** : prénom et nom seulement, écrits dans `profiles` (droits par colonne du serveur, RLS sur sa propre ligne). Numéro et pays en lecture seule (le numéro identifie le compte et les SMS).
- **Modifier le code personnel** : fonction serveur existante `change_pin` (l'ancien code est d'abord vérifié par `verify_pin` : même compteur d'essais et même blocage que pour un transfert).
- **Réglages par catégories** : Apparence, Notifications (in-app / alertes du téléphone / SMS clairement distingués), Sécurité et confidentialité, Préférences financières, Compte, Informations et assistance. Toutes les commandes précédentes conservées.
- **Installation sans App Store** : carte d'accueil + ligne des Réglages, seulement si l'app n'est pas déjà installée. iPhone/iPad Safari : les 3 vraies étapes (Partager → « Sur l'écran d'accueil » → ouvrir depuis l'icône) ; autre navigateur iOS : « ouvrez dans Safari » ; Android / ordinateur : invite native du navigateur. « Plus tard » = 14 jours.
- **Reçu** : titre « Confirmation de transaction », numéro de l'expéditeur formaté, actions dans l'ordre Télécharger PDF / Enregistrer l'image / Partager / Copier la référence / Imprimer, puis Nouvelle opération et Retour à l'accueil. Le doublon de nom masqué a été retiré.

## Sécurité des transferts (important)
- **État « à vérifier »** : une requête sans réponse lisible (réseau coupé, délai de 30 s, passerelle 5xx) n'est plus affichée comme « échec ». Écran « Statut à vérifier » : jamais « confirmé », **jamais renvoyée automatiquement**.
- **Vérifier le statut** : relit le résultat de LA MÊME requête (même clé d'idempotence) **sans autorisation PIN** : le serveur rejoue la clé avant de consommer une autorisation, et sans autorisation il répond `pin_required` — cette vérification ne peut donc jamais créer de transfert. Enregistré → vrai reçu (référence du serveur) ; non enregistré → « Réessayer » proposé seulement à ce moment.
- **Refus certain** (erreur SQL : opération annulée) : écran « Transfert non abouti » avec la raison, Réessayer / Modifier le montant / Accueil (avant : retour silencieux à l'accueil).
- **Hors ligne** : le transfert n'est pas tenté et la personne en est informée.
- Animation d'envoi en **4 étapes visibles** : Vérifié → Envoyé → Réponse du serveur (« En attente de la réponse du serveur… » après 1,6 s) → Confirmé / non abouti / à vérifier.

## Corrigé
- **Tous les écrans étaient décalés de ~18 px vers la gauche** après quelques secondes sur l'accueil (déjà en 12.13.0) : le carrousel utilisait `scrollIntoView`, qui faisait défiler `#screens` (et parfois la page verticalement). Seule la piste défile maintenant ; `#screens` ne peut plus défiler de côté.
- Barre du haut transparente qui chevauchait le contenu au défilement (Réglages) : fond lisible dès que l'écran défile.
- Transition d'écran avec `filter: blur(6px)` plein écran (coûteuse sur iPhone) remplacée par opacité + translation.
- Carte de solde : l'ancienne règle `friendly.css` (grille à 2 colonnes, `!important`) est remplacée.
- Liste des opérations : un numéro stocké comme nom s'affiche formaté (`+968 9123 4567`).

## PWA
- Version `12.14.0`, cache `fp-shell-v12.14.0` ; `premium.css`, `premium.js` et les 7 polices sont précachés. Couleurs de thème mises à jour (manifeste, `theme-color`). Raccourci « Receive money ». Le service worker ne met toujours **aucune** donnée Supabase en cache.

## Tests
- Nouveau `tests/ui/premium-1214.test.mjs` (15 tests). Mis à jour : version 12.14.0 (3 fichiers) ; `transfer-simple` : après un refus, l'écran « Transfer not completed » au lieu du retour à l'accueil.

## NON EXÉCUTÉ / à faire (étape 2, demain)
- Aucun test sur un vrai iPhone / Safari (Chromium seulement), aucune alerte push réelle, aucun SMS réel, pas de déploiement Netlify.
- Étude publique des notifications des banques d'Oman et nouveaux modèles de notifications (en attente, échec, remboursement, dépôt, sécurité) : non commencés.
- Le serveur n'a PAS été modifié (aucune migration, aucune fonction redéployée) ; seules des lectures du schéma ont été faites.

---

# Friendly Pay 12.13.0 — alertes sur le téléphone (notifications iPhone / Android, même application fermée)

## Ajouté
- **Notifications push (Web Push standard, RFC 8030 / 8291 / 8292).** Dès qu'un transfert est envoyé, qu'un montant est reçu ou qu'un dépôt est crédité, la base appelle la fonction `push-send`, qui chiffre le message et le remet au service de livraison d'Apple (APNs) — ou de Google / Firefox / Edge — qui l'affiche sur l'écran verrouillé **même si l'application est fermée**. Seul l'argent est notifié (jamais la crypto, masquée).
- **Réglages → « Alertes sur ce téléphone »** (`js/features/push.js`, FR / EN / AR) : bouton **Activer** (la demande d'autorisation part d'un toucher, exigence d'Apple), **Envoyer un test**, **Désactiver**. États : *à activer*, *activées*, *refusées dans les réglages du téléphone*, *à installer d'abord sur l'écran d'accueil* (iPhone), *non pris en charge*.
- **Service worker** (`sw.js`) : affiche chaque alerte reçue (obligatoire sur iPhone), toucher l'alerte ouvre l'écran voulu (Notifications), pastille sur l'icône = nombre d'alertes d'argent non lues (effacée quand tout est lu), renouvellement automatique si Apple change l'adresse de livraison.
- **Respect des réglages** : le bouton « Notifications » de l'application coupe aussi les alertes ; la langue des alertes suit la langue de l'application ; sur l'écran verrouillé le numéro est masqué (indicatif + 4 derniers chiffres) et l'expéditeur d'un dépôt n'est jamais affiché ; aucune alerte ne contient de marque tierce.
- Déconnexion : l'appareil est retiré des alertes de la personne qui part ; un appareil = un compte.
- Version `12.13.0`, cache `fp-shell-v12.13.0`.

## Serveur (déjà en production)
- Tables privées `push_subscriptions`, `push_vapid`, `push_sent` (RLS sans politique, aucun droit pour l'application) ; déclencheur `notifications_push` ; fonction `push-send` v2 (`verify_jwt`) relue après publication, identique au dépôt. La clé privée VAPID est créée **sur le serveur** et n'en sort jamais ; seule la clé publique est dans l'application. Les adresses de livraison ne sont acceptées que vers Apple / Google / Firefox / Edge. Une erreur de notification ne fait **jamais** échouer un transfert.

## Limites (à lire)
- **iPhone : une application web ne s'exécute pas elle-même en arrière-plan.** Ce sont les serveurs d'Apple qui livrent l'alerte à l'appareil, application fermée. Cela ne marche que si : iOS 16.4 ou plus, l'application est **ajoutée à l'écran d'accueil** (Safari → Partager → Sur l'écran d'accueil) et ouverte depuis son icône, et la personne a **touché « Activer »** puis accepté. Dans un onglet Safari ordinaire, ce n'est pas possible.
- Si l'iPhone est éteint, Apple garde l'alerte jusqu'à 24 h.

## NON EXÉCUTÉ
- **Aucune alerte n'a été livrée sur un vrai iPhone ni via les serveurs d'Apple (APNs)** : le chiffrement est vérifié octet par octet contre l'exemple officiel de la RFC 8291 et par un aller-retour complet, la signature VAPID est vérifiée, le service worker et l'écran sont testés dans Chromium avec de faux services de push, la fonction en ligne répond correctement (clé, refus sans jeton, notification inconnue) — mais l'acceptation par Apple d'un vrai abonnement reste à constater sur le téléphone (Réglages → Activer → Envoyer un test).
- Pas de test sur un vrai Android ni Firefox.
- Pas de déploiement Netlify (zip à déposer).

---

# Friendly Pay 12.12.0 — uniquement des transferts d'argent : numéro seul, aucun frais, nouvelle animation, messages corrigés

## Changé
- **Toute la section crypto est masquée** (accueil, barre du bas, Services, menu latéral et tiroir, historique, Réglages, raccourcis de l'icône, carte de présentation). Un seul interrupteur : `FEATURES.crypto = false` dans `js/data/reference-data.js` (gelé). Le code crypto n'est **pas supprimé** : il reste derrière ce drapeau. Les liens directs et les appels internes vers `crypto*`, `chain` et `banks*` renvoient à l'accueil (`router.js`, expression `CRYPTO_SCREEN_RE`) ; les opérations crypto déjà faites ne sont plus listées (`visibleTransactions`). La connexion de portefeuille (WalletConnect) n'est plus lancée au démarrage.
- **Page de transfert : uniquement le numéro de mobile.** Plus de liste de pays, de services, de prénom/nom ni de Friendly ID. Règles d'Oman : indicatif **+968** fixe (affiché, jamais tapé), **8 chiffres commençant par 7 ou 9** ; on accepte les formes collées `+968 9123 4567`, `00968…`, `968…`, chiffres arabes ; refus de son propre numéro ; un numéro enregistré dans les contacts est reconnu (nom affiché). Étapes : Numéro → Montant → Confirmation.
- **Montant en rials (3 décimales / baisa)**, minimum et maximum par transfert lus dans la configuration, solde insuffisant refusé ; confirmation par code personnel (glisser, ou bouton pour le clavier / lecteur d'écran).
- **AUCUN FRAIS.** Le serveur débite exactement le montant envoyé : migration `20261017_no_transfer_fee.sql` (`_fiat_send_external_impl`, frais = 0, TVA = 0, total = montant), **appliquée en production et vérifiée**. L'application n'affiche plus ni frais, ni TVA, ni total (montant, confirmation, reçu, export). Les **anciennes** transactions gardent leurs frais réels : leur reçu montre toujours « Total débité ».
- **Nouvelle animation d'envoi** (`js/ui/send-anim.js`, `css/motion.css`) : deux téléphones et une pièce qui voyage de l'expéditeur au destinataire. Elle suit l'état **réel** : *sécurisé* (cadenas) → *envoi* (la pièce traverse tant que le serveur n'a pas répondu, 2,4 s au minimum pour que les trois états se lisent) → *confirmé* (la coche se dessine seulement après la réponse du serveur) ou *non abouti* (la pièce s'arrête, croix, jamais « confirmé »). Sens inversé en arabe, « réduire les animations » respecté (chaque état sans mouvement), plein écran (barre du bas masquée), 320 px sans débordement.
- **Reçu** : le numéro du bénéficiaire s'écrit « +968 9123 4567 » sur sa propre ligne ; la ligne « Total débité » n'apparaît que si la transaction a réellement des frais. Notification dans l'application : « Money sent ».
- **Présentation et publicités** : textes sans crypto ni Friendly ID ; le carrousel de l'accueil passe de 5 à 4 cartes.
- Réglages : la description de la confirmation par SMS / e-mail ne parle plus de frais.
- Version `12.12.0`, cache `fp-shell-v12.12.0`.

## Messages (fonction `send-notice` v26, déployée)
- **Expéditeur** : « Your transfer of OMR 20.000 to Aisha Said (+968 9123 4567) was successful. » puis Available Balance, Reference (`FRD-TX-…`), Date & Time. Le bénéficiaire n'est plus écrit deux fois ; les lignes « Fees » / « Total debited » n'apparaissent que si la transaction a vraiment des frais (jamais calculés dans le message).
- **Destinataire** : « A transfer of OMR 20.000 from +968 … has been confirmed. » puis To, Reference (`TX-…`, sans marque ni « YOR »), Date & Time. Jamais « received » pour un envoi externe ; aucun nom de banque.
- **Heure locale** (Oman = UTC+4, sans heure d'été ; Émirats +4 ; Arabie, Koweït, Qatar, Bahreïn +3), sans secondes ; un pays inconnu garde l'UTC et l'écrit. Numéros « +968 9123 4567 ». Montants « OMR 20.000 ».
- **Nom de l'expéditeur du SMS : « FriendlyPay »** (11 lettres). Les anciens noms d'essai (`ServiceSMS`, `YORWALLET`, `YOR`, `NEX`) sont ignorés s'ils sont encore dans le secret `SMS_SENDER`.

## Tests
- `tests/ui/transfer-simple.test.mjs` réécrit (numéro seul, validations, montant, confirmation, requête serveur, animation, arabe, 320 px, reçus) ; `tests/ui/transfer-only.test.mjs` (aucune trace de crypto nulle part) ; les tests du code crypto conservé réactivent le drapeau **dans le navigateur de test seulement** (`openApp(..., { crypto: true })`) ; promos, reçus, raccourcis mis à jour. Tests des messages : `tests/edge`, `tests/edge-sim` (+ heure locale, formats, sans frais, sans marque).

## NON EXÉCUTÉ
- Pas de test sur un vrai iPhone / Safari ni sur un vrai téléphone Android (Chromium seulement) ; pas de déploiement Netlify (zip à déposer).
- Aucun SMS réel n'a été envoyé pour vérifier le texte ni le nom « FriendlyPay » sur un téléphone ; **l'enregistrement du nom d'expéditeur « FriendlyPay » auprès d'Infobip / des opérateurs d'Oman n'est pas vérifié** : s'il n'est pas autorisé, l'opérateur peut remplacer le nom ou bloquer le SMS.
- Le secret `SMS_SENDER` n'a pas été lu ni modifié (ignoré seulement s'il contient un ancien nom connu).
- Les fonctions bancaires et crypto de la base (`_bank_send_impl`, `_crypto_*`) ne sont pas modifiées ; un ancien client 12.11.1 affiche encore une estimation de frais (1,050 OMR) tant que ce zip n'est pas déployé, alors que le serveur ne débite déjà plus que le montant.

---

# Friendly Pay 12.11.1 — correctif : l'application ne démarrait plus à la 2e ouverture

## Corrigé
- **« Connexion impossible » / l'application ne s'ouvre pas (régression de 12.11.0).** Le service worker de 12.11.0 interceptait le chargement du client Supabase (script du CDN jsdelivr) pour le garder hors ligne ; la politique de sécurité (CSP) interdisait ce rechargement fait par le service worker. Dès que le service worker contrôlait la page (2e ouverture et suivantes), le script ne se chargeait plus, l'application ne pouvait pas démarrer et affichait l'écran « Connexion impossible ». Le serveur Supabase et les comptes n'étaient pas en cause (vérifié : projet actif, aucune erreur dans les journaux).
- `sw.js` : il ne touche **plus jamais** aux ressources d'autres sites (client Supabase, WalletConnect, chaîne), comme avant 12.11.0. Cache `fp-shell-v12.11.1`.
- **Réparation automatique** (`healServiceWorker()` dans `js/boot.js`) : si le client Supabase ne se charge pas alors qu'un service worker contrôle la page, il est désinscrit, son cache supprimé et la page rechargée **une seule fois** (par session). Les téléphones restés sur le service worker de 12.11.0 se réparent donc à la première ouverture après la mise en ligne.

## Ajouté
- `tests/ui/service-worker-real.test.mjs` : les autres tests d'interface bloquent les service workers, ce qui avait caché ce défaut. Ce test charge l'application avec le **vrai service worker** et la **vraie CSP** (faux CDN local) : ouvertures 1, 2 et 3, réparation d'un service worker défaillant, hors ligne (page jamais blanche), aucune adresse externe dans `sw.js`. Vérifié : il échoue sur 12.11.0 et passe sur 12.11.1.

## Changé
- Version `12.11.1`. Hors ligne : le client Supabase n'est plus gardé par le service worker (le navigateur peut le garder dans son propre cache) ; sans lui, l'écran localisé « Connexion impossible » avec « Réessayer » s'affiche au lieu d'une page blanche.

## NON EXÉCUTÉ
- Pas de test sur un vrai iPhone / Safari (Chromium seulement), pas de déploiement Netlify.

---

# Friendly Pay 12.11.0 — ouverture refaite, arabe soigné, robustesse, fichiers complets

## Ajouté
- **Écran d'ouverture animé** (`js/ui/opening-art.js`, `css/opening.css`) : le logo se dessine, le mot-symbole apparaît (**« Friendly PAY »** ou **« فرندي باي »** en arabe, jamais en lettres espacées), halo qui respire ; reste au minimum 1,9 s (0,6 s en « mouvement réduit »). Clair et sombre.
- **Présentation en 4 pages** au tout premier lancement (`js/features/onboarding.js`) : 4 illustrations animées (envoyer, Friendly ID, cartes, sécurité), glissement tactile, flèches du clavier (sens inversé en arabe), points cliquables, choix **EN / FR / AR** en haut. « Passer » et « J'ai déjà un compte » → connexion ; dernière page « Créer mon compte » → inscription. Vue une seule fois (`yor_onboarded`). Fonctionne de 320 px à l'écran paysage ; focus piégé et annonces pour lecteur d'écran.
- **PNG arabes** (`assets/brand/png/`, `assets/share/og-{en,fr,ar}.png`, `assets/icons/ar/`) : mot-symbole « فرندي باي » (sombre / blanc), logo, images de partage 1200×630 en 3 langues. Reçu exporté en PNG : « فرندي باي » en arabe.
- **Écrans de démarrage iPhone** : 12 tailles × clair / sombre (`assets/splash/ios-*.jpg`, 1,2 Mo en tout) ; `index.html` les déclare avec `prefers-color-scheme`.
- **Fichiers manquants** : `offline.html`, `404.html`, `robots.txt`, `favicon.ico`, `favicon-16/32/48.png`, `icon-maskable-512.png` (Android), description, aperçu de partage Open Graph / Twitter.
- **Robustesse** (`js/features/resilience.js`, `css/resilience.css`) : un écran dont l'affichage échoue montre « Cet écran n'a pas pu s'ouvrir » avec **Réessayer** / **Retour à l'accueil** (au lieu d'un écran figé) ; bannière **hors-ligne** / **de nouveau en ligne** ; erreurs JavaScript journalisées, une seule notification toutes les 10 s, jamais de détail technique à l'écran ; démarrage impossible (identification injoignable) = écran traduit avec **Réessayer**.
- **Raccourcis de l'icône** (Envoyer, Cartes, Crypto) : ils ouvrent maintenant le bon écran **après** le code (liste blanche dans `js/boot.js`, `R.resolve()` dans le routeur) ; un lien inconnu ou réservé est ignoré.
- Aide dans la connexion de portefeuille (Réglages) : explique d'ouvrir le site depuis le navigateur du portefeuille (TronLink) sur Nile.
- Tests : `tests/ui/friendly-1211.test.mjs` (ouverture, robustesse, thème, arabe, cohérence des fichiers, raccourcis) ; le banc `ui-harness.mjs` accepte `hash`, `reducedMotion`, `colorScheme`, `storage`, `viewport`.

## Corrigé
- **Arabe** : aucun espacement entre les lettres (règle globale `html[dir="rtl"]`, les montants et numéros gardent le leur) ; la ligne du haut du **reçu exporté en PNG** espaçait les lettres arabes (illisible) : corrigé.
- **Thème** : « clair » tant que rien n'est choisi, sur tous les chemins (démarrage, déconnexion, réglages) ; « Système » suit le téléphone en direct ; `color-scheme` suit le thème de l'app (barres de défilement, listes natives).
- **Cache hors-ligne** (`sw.js`, réécrit) : réseau d'abord avec repli après 4,5 s ; seules les réponses 200 du même site sont gardées ; installation fichier par fichier (un fichier manquant n'empêche plus l'installation) ; réponses redirigées nettoyées ; ~~le client Supabase (CDN) est gardé après le premier chargement~~ (retiré en 12.11.1 : cela empêchait l'application de démarrer) ; jamais de cache pour Supabase / API / chaîne. Cache `fp-shell-v12.11.0`.
- Session présente mais profil illisible (réseau coupé) : proposition de **réessayer** au lieu d'afficher la connexion ; après 2 échecs, retour à la connexion.
- « Suivant » de la présentation n'était pas enchaînable (garde anti-double-appui de 450 ms) : exemptée (`data-fast`).
- Carte de solde : dégradé légèrement assombri pour un contraste **AA** du texte blanc.
- **Libellés coupés** : « العملات الرقمية » était tronqué dans la barre du bas (désormais « كريبتو ») ; les tuiles de la page Services passent à la ligne au lieu d'être coupées par « … » sur petits écrans ; titre de barre du haut réduit sous 340 px.
- Cible tactile des listes déroulantes ; `_headers` / `vercel.json` : cache correct pour `sw.js`, `manifest`, `offline.html`.
- 18 attentes périmées de la suite d'interface mises à jour (nom Friendly Pay, palette teal, références `FRD-`, cartes sans mention « aperçu », Face ID, fichiers `FRIENDLY-PAY-…`, version).

## Changé
- Version `12.11.0` (`CONFIG.APP.version`) ; `index.html` : nouveaux CSS / scripts, en-tête complété.

## Inchangé volontairement
- Schéma Supabase, Edge Functions, logique de transfert, Face ID, pavé tactile, jeton `YOR-USDT`, `js/vendor/reown-appkit.js`.
- Garde anti-double-appui de 450 ms des autres boutons (elle protège les paiements).

## Testé / non testé
- **Testé** (Chromium sans tête, application réelle, Supabase simulé) : voir `tests/ui/` ; captures de l'ouverture en EN / FR / AR, clair / sombre, petits écrans et paysage.
- **NON EXÉCUTÉ** : déploiement Netlify ; vrai iPhone (toucher, écrans de démarrage, Face ID) ; vrai TronLink / Trust Wallet (la connexion sur iPhone/Safari n'a pas pu être reproduite ici ; la cause racine n'est pas confirmée). `js/vendor/reown-appkit.js` n'a pas pu être reconstruit (npm bloqué) ; le client Supabase n'est pas embarqué (CDN bloqué ici). PNG arabes générés avec DejaVu Sans (police de repli) : à remplacer si vous fournissez une police calligraphique.
- À faire côté propriétaire : ajouter `https://yor-wallet.netlify.app` à la liste des domaines autorisés du projet Reown (dashboard) ; le réseau reste **Nile (test)** uniquement.

---

# Friendly Pay 12.10.0 — publicités illustrées sur l'accueil

## Ajouté
- **Carrousel de 5 publicités illustrées** sous les actions rapides de l'accueil (`js/features/promos.js`, `css/promos.css`, `assets/ads/ad-{send,id,card,secure,lang}.svg`).
  - Style **3D doux** : dégradés, reflets, ombres de contact ; **4 personnages originaux** dessinés pour Friendly Pay (aucun personnage, logo ou visuel existant).
  - Cartes : *Envoyez à vos proches* (→ envoi), *Votre Friendly ID* (→ profil), *Vos cartes Friendly* (→ cartes), *Votre compte protégé* (→ réglages), *Friendly parle votre langue* (→ réglages). EN / FR / AR, droite-gauche compris.
  - Chaque carte porte l'étiquette **« Publicité » / « Ad » / « إعلان »**. Les textes décrivent uniquement ce que l'application fait aujourd'hui : **aucun frais, délai, taux ni promesse** ; l'identifiant montré dans l'image est masqué (`FRD-••••••`) ; aucun logo de réseau de carte, de banque ou d'autre marque.
  - Défilement tactile natif (scroll-snap), points cliquables (zone de toucher élargie), **défilement automatique** toutes les 6,5 s seulement si l'écran n'est pas touché, visible, et si « réduire les animations » n'est pas demandé.
  - **« Masquer »** cache le carrousel jusqu'à la fin de la session (`sessionStorage` seulement ; rien de durable).
- Test d'interface `tests/ui/promos.test.mjs` (9 contrôles : cartes et langues, marques tierces, défilement, points, bouton, masquage, défilement automatique, mouvement réduit, 320 / 390 px).

## Changé
- `sw.js` : cache `yor-shell-v12.10.0` ; ajoute `css/promos.css`, `js/features/promos.js` et les 5 images dans le cache hors-ligne.
- `index.html` : feuille de style et script du carrousel ; `js/boot.js` : démarrage ; `js/features/v12.js` : insertion sous les actions rapides ; version `12.10.0`.

## Inchangé volontairement
- Schéma Supabase, `_headers`, `js/vendor/reown-appkit.js`, `walletconnect/`, logique de transfert, Face ID, pavé tactile, jeton `YOR-USDT`.
- Les Edge Functions (e-mails / SMS « Friendly Pay », `send-email` v11, `send-notice` v25, `chain-notice` v4) sont déployées **séparément** côté Supabase (voir `docs/NOTICES.md` 12.9.1) ; ce zip ne les contient pas.

## Testé / non testé
- **Testé** : captures des 5 cartes (EN / FR / AR, clair / sombre, 320 / 360 / 390 / 700 px), points synchronisés avec le défilement, absence de chevauchement texte / image, tests unitaires et simulation du dépôt (85 / 85).
- **Non testé** : vrai iPhone (toucher, inertie du défilement, rendu des SVG sous Safari), déploiement Netlify. Les 18 attentes périmées de la suite d'interface du dépôt (versions, noms, palette) échouent comme en 12.9.0.

---

# Friendly Pay 12.9.0 — menu, icônes, Face ID, pavé tactile, solde compact

## Changé
- **Connect Wallet déplacé dans Réglages** : section « Portefeuille » (état, adresse, connecter / gérer / déconnecter). Elle n'est plus sur la carte de solde de l'accueil.
- **Carte de solde compacte** : plus basse, plus fine, montant plus petit ; **œil transparent** (verre) pour masquer / afficher le solde.
- **Menu principal refait** : barre du bas « dock » flottante en verre (Accueil, Cartes, Envoyer au centre, Crypto, Apps) avec indicateur qui glisse ; actions rapides de l'accueil redessinées ; **toutes les icônes redessinées** (trait uniforme, coins arrondis).
- **Nom Friendly partout à l'écran**, y compris au premier lancement (pages d'accueil EN / FR / AR). L'identifiant affiché est `FRD-XXXXXX` (affichage seulement : la base garde `YOR-XXXXXX`) ; la saisie accepte `FRD-`, `FRIENDLY-` et `YOR-`.
- **Reçus** (écran, PNG, PDF) : « Friendly Pay », fichiers `FRIENDLY-PAY-…`.
- **Cartes** : l'avis « pas encore connecté à un émetteur / aperçu » n'est plus affiché.
- **Nouveau pavé tactile** (`js/ui/keypad.js`) : touches en verre rondes, la lumière suit le doigt, onde au toucher, le chiffre tapé s'envole dans son point de la ligne de code, les points s'illuminent quand le code est complet ; touche « mélanger » (chiffres au hasard, mémorisé sur l'appareil, désactivé par défaut). Mouvement réduit respecté.
- **Nouvelles animations** : entrée en cascade du dock et des actions rapides, aurore de l'écran de verrouillage, flottement du solde, transitions du verrouillage.

## Ajouté
- **Face ID obligatoire** (`js/features/faceid.js`) pour la **confirmation de connexion** (déverrouillage / reconnexion) et la **confirmation de transfert**. WebAuthn, authentificateur de la plate-forme, vérification utilisateur exigée ; l'assertion est contrôlée sur l'appareil (défi, origine, rpIdHash, drapeaux UP+UV, signature ECDSA / RSA). Premier passage : création de la clé Face ID après le code. Annuler un transfert ne débite rien.
- Réglages : la ligne « Biométrie » devient « Face ID » (état, ré-enrôlement).

## Limites connues
- Face ID est un contrôle **sur l'appareil** ; le **code PIN reste le facteur vérifié par le serveur** (RPC `verify_pin`).
- Appareil sans biométrie (ou navigateur sans WebAuthn plate-forme) : Face ID est ignoré, le code seul s'applique ; après 3 échecs d'enrôlement, passage au code seul. Le libellé « Face ID » s'affiche sur tout appareil Apple (un iPhone Touch ID seul n'est pas distinguable).
- Edge Functions (e-mails / SMS) **non modifiées** : elles écrivent encore « NEX WALLET » / « YOR ID » et des références `YOR-…`. Jeton sur chaîne `YOR Experimental USDT` / `YOR-USDT` inchangé (métadonnées du contrat).
- Les cartes restent un affichage : aucune carte n'est réellement émise.

## Inchangé volontairement
- `js/vendor/reown-appkit.js` (2 425 620 octets, SHA-256 `a13ad9b8…f396`), `walletconnect/`, `_headers`, schéma Supabase, Edge Functions.

## Testé / non testé
- **Testé** : syntaxe JS, empreinte SDK, captures (accueil EN/FR/AR clair/sombre, réglages, pavé, verrouillage, cartes, Face ID), 20 contrôles Face ID avec authentificateur virtuel (Chromium), impression du reçu, bureau, balayage des textes (aucun « YOR / NEX » visible hors `YOR-USDT`).
- **Non testé** : vrai iPhone (Face ID réel, animations, dock, installation PWA), déploiement Netlify, domaine dans la liste d'autorisation Reown, suite de tests d'interface du dépôt (19 attentes périmées : version, noms, palette, avis « émetteur », biométrie).

---

# Friendly Pay 12.8.0 — nouvelle identité (vert turquoise et blanc)

Changement d'identité visuelle de l'application, à l'intérieur et à l'extérieur. Aucune fonction, aucune donnée, aucun flux n'est modifié.

## Changé
- **Nom** : l'application s'appelle **Friendly Pay** (titre, manifeste, icône, écran d'accueil, en-tête, reçu, e-mails de l'application, métadonnées WalletConnect, textes EN / FR / AR).
- **Couleurs** : vert turquoise et blanc, définis une seule fois (jetons `--accent`, `--btn-grad`, `--brand-grad`, `--on-accent`, par thème). Clair : accent #0B7F75 (texte blanc, contraste 4,9:1) ; sombre : accent #2DD4BF (texte #031B19, contraste 9,6:1). Plus aucune teinte orange ni marron dans les feuilles de style.
- **Thème par défaut : clair** (le thème sombre reste disponible dans les réglages). Barre d'état iOS et `theme-color` assortis.
- **Logo** : monogramme « F. » blanc sur dégradé turquoise (`assets/brand/*`, `assets/icons/*`), icônes PNG régénérées (192, 512, maskable, Apple touch).
- **Écran de démarrage clair**, carte de solde de l'accueil en dégradé turquoise, boutons principaux, cartes virtuelles, illustrations, bouton « Connect Wallet » (blanc sur la carte turquoise).
- **Reçu** : identité propre à Friendly Pay (en-tête, titre, pied de page, couleurs). Toujours sans solde restant.

## Inchangé volontairement
- `js/vendor/reown-appkit.js` (octet pour octet : 2 425 620 octets, SHA-256 `a13ad9b8…f396`), `walletconnect/`, `_headers`, configuration Supabase, Edge Functions (expéditeur e-mail et SMS non modifiés ici), identifiants internes (`NexWC`, `brand:'NEX'` stocké dans les cartes), mention « Yor Digital Finance » du pied de reçu.
- Aucune marque ni imitation bancaire : le reçu et les notifications n'utilisent pas le format ni le nom d'une banque.

## Testé / non testé
- **Testé** : syntaxe JS, empreinte du SDK, captures clair / sombre (accueil, cartes, historique, reçu, démarrage), contrastes calculés, suite de tests d'interface (voir le rapport).
- **Non testé** : appareil réel, installation PWA (icône à l'écran d'accueil), connexion d'un vrai portefeuille, envoi réel d'e-mail / SMS, domaine de production dans la liste d'autorisation Reown.

---

# NEX WALLET 12.7.0 — bouton « Connect Wallet » (Reown AppKit / WalletConnect), TRON Nile

Ajout d'une connexion de portefeuille par **Reown AppKit (WalletConnect)**, Project ID `af2149939e459cc712a573792d710fb0`. L'application, son interface, sa marque et ses fonctions sont conservées : rien n'a été reconstruit.

## Ajouté
- **Carte « Wallet » dans le bloc de solde de l'accueil** : pastille d'état (non connecté / connexion / connecté), adresse raccourcie (toucher = copier), bouton **Connect Wallet**, puis **Manage** et **Disconnect** une fois connecté. EN / FR / AR, thème clair / sombre, RTL.
- **Réseau unique : TRON Nile (testnet)**, `tron:0xcd8690dc`, le seul réseau de l'application. Si le portefeuille est sur un autre réseau, un avertissement s'affiche.
- **Erreurs gérées et affichées** : chargement du SDK (réseau, CSP), initialisation, refus ou échec de connexion, ouverture du modal, déconnexion. Chaque erreur est lisible, la carte reste utilisable et on peut réessayer.
- **Chargement à la demande** : le SDK (2,4 Mo) n'est téléchargé qu'au premier clic, ou au démarrage seulement si une session WalletConnect existe déjà sur l'appareil (reconnexion automatique). Il n'est pas dans le cache hors ligne.
- `walletconnect/` : sources et script pour reconstruire `js/vendor/reown-appkit.js` (voir `walletconnect/README.md`).

## Sécurité
- **Connexion seulement** : aucune signature, aucune transaction, aucun message à signer n'est demandé par ce code. Toute action future qui déplace des fonds devra afficher sa propre confirmation explicite.
- **Aucune clé privée ni phrase de récupération** n'est demandée, lue ni stockée par l'application ; elles restent dans le portefeuille de l'utilisateur.
- Options Reown désactivées : compte e-mail, réseaux sociaux, achat, échange, envoi, réception, historique, statistiques.
- **CSP** (`_headers` et `vercel.json`) : ajout des seuls domaines Reown / WalletConnect nécessaires (connect-src, font-src, img-src, frame-src). Aucune autre ouverture.
- **À faire côté Reown (obligatoire)** : ajouter le ou les domaines de l'application dans la liste **Domain** de https://dashboard.reown.com (le Project ID est public par conception, la liste de domaines est la protection).

## Testé / non testé
- **Testé** : interface (35 contrôles automatiques : états, erreurs, déconnexion, copie, FR/AR/RTL, thème clair/sombre, absence de régression sur la grille de l'accueil) contre un simulateur du même contrat ; **vrai SDK** dans un navigateur : chargement, initialisation, ouverture du modal Reown, clic sur WalletConnect, affichage du QR avec ouverture du relais `wss://relay.walletconnect.org`, fermeture, déconnexion à vide, **zéro violation de CSP, zéro erreur de page**.
- **Non testé** : connexion d'un vrai portefeuille (TronLink ou mobile WalletConnect), état « connecté » avec le vrai SDK, déconnexion d'une vraie session, appareil mobile réel, domaine de production avec la liste d'autorisation Reown. À vérifier à la mise en ligne.
- Un défaut a été trouvé et corrigé pendant les tests : le réseau `tronNile` de `@reown/appkit/networks` est une variante EVM ; il faut `tronNileTestnet` (sinon « Adapter not found » au clic sur WalletConnect).

## Dépendances ajoutées (dans le bundle, pas dans l'app)
`@reown/appkit` 1.8.24, `@reown/appkit-adapter-tron` 1.8.24, `@tronweb3/tronwallet-adapter-tronlink` 1.3.0 (build : `esbuild` 0.28.2). `npm audit` signale 6 alertes dans les dépendances indirectes de l'adaptateur TronLink (voir `walletconnect/README.md`).

## Fichiers modifiés
`js/features/wallet-connect.js` (nouveau), `css/wallet-connect.css` (nouveau), `js/vendor/reown-appkit.js` (nouveau, à placer : voir README), `walletconnect/` (nouveau), `js/features/v12.js` (emplacement de la carte dans `renderHomeV12`), `index.html`, `js/boot.js` (`NexWC.init()`), `sw.js` (cache v12.7.0, deux fichiers ajoutés), `js/data/reference-data.js` (12.7.0), `_headers`, `vercel.json`, `.vercelignore`.

---

# NEX WALLET 12.6.1 — nom corrigé dans les e-mails, le reçu n'affiche plus le solde restant

## Modifié
- **Nom dans les e-mails** : l'expéditeur et tous les textes sont « NEX WALLET » (bienvenue, sécurité, transaction, transfert crypto Nile). En‑tête de l'e-mail : NEX / WALLET. Fonctions serveur déployées : `send-email` v10, `chain-notice` v3, `send-notice` v22.
- **Le reçu n'affiche JAMAIS le solde restant** : ni sur l'écran du reçu, ni dans l'export PNG / PDF, ni dans l'e-mail de transaction (les lignes « solde avant » et « nouveau solde » sont supprimées : avant + après permettrait de déduire le solde). Le montant, les frais, le montant débité / reçu, la date, la référence et le statut restent.
- Version 12.6.1 : le cache de l'application change (`yor-shell-v12.6.1`) pour que l'ancien reçu ne reste pas en mémoire.

## Non modifié (à confirmer)
- Les **SMS** gardent la ligne « Available Balance » (modèle 12.5.0) ; l'identifiant d'expéditeur SMS `YORWALLET` reste celui enregistré chez le fournisseur ; les e-mails d'authentification de Supabase (confirmation, mot de passe oublié) se changent dans le tableau de bord Supabase ; les références `YOR-TX-…` restent des identifiants de données.

---

# NEX WALLET 12.6.0 — nom NEX WALLET, thème orange / noir / blanc, solde en dollars, téléphone obligatoire, carte et reçu nouvelle génération

Identité : **NEX WALLET** (ex‑YOR WALLET) dans l'application. Palette **orange / noir / blanc propre à NEX** : aucune marque, logo, nom, icône ou écran tiers n'est copié (Orange Money / Max it, Bank Muscat : **non reproduits**). **Aucun logo Visa / Mastercard** n'est ajouté : une carte « Visa » non émise par Visa serait une fausse carte (demande **refusée**, la carte reste un *aperçu*).

## Ajouté
- **Solde affiché en dollars (USD) par défaut** (accueil, tuiles, liste des comptes). Le **montant d'origine** (ex. OMR 10,511.262) et le **taux écrit** (1 OMR = 2.6008 USD, taux indicatif) restent affichés sous le solde ; aucune conversion si le taux manque ou pour la crypto ; respecte « masquer le solde ». Réglage : Paramètres → Devise principale.
- **Téléphone obligatoire à l'inscription** : indicatif pays + numéro (Oman par défaut), format « +indicatif… » (8 à 15 chiffres), erreur claire en EN/FR/AR, aucun compte créé sans numéro. **Contrôle aussi côté serveur** : le déclencheur `handle_new_user` refuse toute inscription sans téléphone valide (migration `20261013_signup_phone_required.sql`, **appliquée** et vérifiée par un essai annulé).
- **Carte virtuelle nouvelle génération** (dessinée en CSS) : grain / métal brossé, bord biseauté, texte gravé, numéro en 4 groupes masqués, nom du titulaire, bande holographique et reflet qui suivent le doigt **et l'inclinaison du téléphone**, ombre qui se déplace, balayage de lumière à l'entrée. **Toujours un aperçu** : pas de logo de réseau, pas de puce, pas de CVV, pas de numéro complet.
- **Reçu animé** : le ticket s'« imprime », les lignes arrivent en cascade, anneau + éclats **uniquement si l'état est réellement réussi** (en cours = pulsation, échoué = une secousse). Aucune animation en « mouvement réduit » ni à l'impression.
- Carte de solde noire à lueur orange ; boutons orange avec texte foncé lisible (contraste ≥ 4,5:1).

## Modifié
- **Nom** : NEX WALLET partout dans l'app (titre, manifest, écran de connexion, logo, reçu PNG/PDF, notifications, verrouillage, cartes). Nouveau logo **N‑E‑X** + icônes PNG régénérées (192, 512, maskable, Apple). Le thème de carte « Violet » s'appelle **Orange** (identifiant conservé pour les données existantes).
- Réglages : interrupteurs et choix (thème, devise, langue) — état visible, défilement conservé, erreur annoncée (voir tests `settings-controls`).

## Conservé volontairement (identifiants de données, pas le nom de l'app)
« YOR ID », références `YOR-TX-…`, jeton « YOR Experimental USDT / YOR‑USDT », nom de la société « Yor Digital Finance ». **E‑mails et SMS** (fonctions serveur `send-email`, `send-notice`, `chain-notice`) disent encore « YOR WALLET » : non modifiés (l'expéditeur SMS est enregistré chez le fournisseur).

## Fichiers modifiés
`css/yor-ds.css` (sections 1b, 14–17), `css/base.css`, `css/v12.css`, `css/buttons.css`, `css/motion.css`, `index.html`, `manifest.webmanifest`, `sw.js` (cache v12.6.0), `js/data/reference-data.js` (12.6.0), `js/core/helpers.js` (`displayCurrency`, `balanceView`, `balanceText`, `signupPhone`), `js/features/{v12,auth,app-lock,onboarding}.js`, `js/screens/{auth,home,drawer,profile-settings,transfer-flow,crypto-trade,chain-wallet}.js`, `js/ui/{icons,receipt-export}.js`, `js/wire.js`, `js/i18n/translations.js`, `assets/brand/*`, `assets/icons/*`, `assets/cards/*`. Serveur : migration `20261013_signup_phone_required.sql`.
**Dépendances ajoutées : aucune.**

---

# YOR WALLET 12.5.0 — SMS structurés (AR/EN), suivi de livraison, reçu complété

Identité : **YOR WALLET** uniquement. Aucun nom, logo, couleur ou écran de banque tierce n'a été copié (demande de reproduction visuelle d'une banque : **refusée**, voir plus bas). Contient aussi la carte « Obsidian » (12.4.1).

## Ajouté
- **SMS de transfert structurés, en anglais ou en arabe** (modèle par défaut, secret `SMS_TEMPLATE=structured`) : « Dear Customer, … Your transfer of {montant} {devise} to {bénéficiaire} was successful. Reference / Date & Time / Recipient / Available Balance » et son équivalent arabe (« عزيزي العميل، … تم تحويل مبلغ … بنجاح. رقم المرجع / التاريخ والوقت / المستفيد / الرصيد المتاح »). Modèles par service (Oman, Wave / Orange Money / MTN… en FCFA, banque, interne, bénéficiaire externe). Langue de l'expéditeur : arabe seulement si la langue de l'application est l'arabe, sinon anglais. Anglais en GSM-7 (≤ 2 segments), arabe en Unicode.
- **Solde disponible dans le SMS** : uniquement la valeur écrite par le registre (`ledger_entries.balance_after`), uniquement sur une opération confirmée, jamais négative, jamais dans une autre devise. Le bénéficiaire **externe** ne reçoit **jamais** de solde ; le bénéficiaire **interne** reçoit **son propre** solde.
- **Suivi de livraison des SMS** : colonnes `delivery_status` (PENDING / DELIVERED / UNDELIVERABLE / UNKNOWN / UNSUPPORTED), `delivery_checked_at`, `delivered_at`, `delivery_error`. Le balayage de chaque minute lit le rapport du fournisseur (Infobip, Twilio ; Brevo = « UNSUPPORTED », non suivi). Sans rapport au bout de 24 h : « UNKNOWN ». Une erreur de lecture ne fait **jamais** passer un SMS en « remis » ni en « non remis ».
- **Reçu** : ligne « Solde disponible » lue dans le registre (`get_tx_balance_after`, seulement pour une opération non crypto confirmée, même devise, absente si la personne a masqué ses soldes), reprise dans le PNG / PDF ; bouton **« Faire un autre transfert »** (virement → début du parcours, envoi crypto → envoi crypto, jamais sur un reçu entrant) en plus de « Retour à l'accueil » ; état de livraison du SMS (remis / non remis / en attente du rapport / inconnu) avec relecture toutes les 30 s pendant 5 min au plus.
- Contrôles du reçu : Partager, PDF, PNG (image), Imprimer, copier la référence (icône à côté de la référence), Retour à l'accueil, Faire un autre transfert.

## Corrigé
- **Remboursé / annulé** : `REFUNDED` et `REVERSED` étaient affichés « en cours » ; ils sont maintenant « non abouti » (écran, liste, PNG, PDF).
- Un solde négatif ou non numérique du registre pouvait s'écrire dans un SMS (`-3.000 OMR`) : refusé.

## Fichiers modifiés
Application (`yor-wallet`) : `js/core/helpers.js`, `js/screens/receipt.js`, `js/ui/receipt-export.js`, `js/wire.js`, `css/yor-ds.css`, `sw.js` (cache v12.5.0), `js/data/reference-data.js` (12.5.0) ; Obsidian (12.4.1) : `js/features/v12.js`, `css/yor-ds.css`.
Serveur (`yor-core`) : `supabase/functions/send-notice/index.ts` + `lib.ts` (**v21 déployée**), migrations `supabase/migrations/20261012c_sms_delivery_balance.sql` et `20261012d_notice_status_delivery_reason.sql` (**appliquées**, la seconde ajoute au reçu la cause « plus de crédit SMS »), tests `tests/edge/sms-notification-lib.test.mjs`, `tests/edge-sim/sms-delivery.test.mjs`, `tests/edge-sim/sms-templates-config.test.mjs`, `tests/edge-sim/send-notice.test.mjs`, `tests/edge-sim/stubs/supabase-js.mjs`, `tests/ui/redesign.test.mjs`, `tests/ui/app-boot.test.mjs`.
**Dépendances ajoutées : aucune.**

## Configuration des SMS (secrets Supabase → Edge Functions → Secrets)
| Secret | Rôle |
|---|---|
| `SMS_PROVIDER` | `infobip` · `twilio` · `brevo` (défaut `brevo`) |
| `INFOBIP_API_KEY`, `INFOBIP_BASE_URL` | Infobip (clé, URL de base du compte) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | Twilio |
| `BREVO_API_KEY` | Brevo |
| `SMS_SENDER` | nom d'expéditeur (ex. `ServiceSMS`) |
| `SMS_TEMPLATE` | `structured` (défaut) · `compact` = **retour arrière immédiat** aux anciens SMS d'une ligne, sans redéploiement |
Aucun identifiant dans l'application ni dans le dépôt. Retour arrière du code : redéployer `send-notice` v20 (copie gardée) ou régler `SMS_TEMPLATE=compact`.

## Tests réellement exécutés
- `npm test` : **269 + 73 = 342 réussis, 0 échec** (dont 15 de suivi de livraison, 18 de gabarits, 3 de configuration, 6 de solde / devise). Des mutations volontaires (suppression du contrôle de devise, du correctif `REFUNDED`) font échouer les nouveaux tests, puis le code est restauré.
- `npm run test:ui` (vrai `index.html`, vraie CSP, Chromium sans tête) : **89 réussis, 0 échec** (dont 4 nouveaux pour le reçu : solde, « Faire un autre transfert », état de livraison, remboursé).
- Fonction déployée testée contre le vrai PostgREST par un balayage (aucun SMS réel envoyé par ce test).

## NON EXÉCUTÉ / limites honnêtes
- **Aucun SMS n'a été remis à un téléphone** : le 12 octobre 2026 (15:43 et 15:51 UTC), Infobip a **refusé** les SMS du transfert YOR-TX-20261012-9E1F0E et un SMS de test avec `REJECTED_NOT_ENOUGH_CREDITS` : **le compte Infobip n'a plus de crédit**. À recharger (ou changer de fournisseur par `SMS_PROVIDER`). Rien n'est renvoyé automatiquement après recharge : il faut remettre les lignes en file.
- Suivi de livraison **vérifié en réel pour un seul cas** : le journal Infobip (`/sms/1/logs`) a bien renvoyé `REJECTED_NOT_ENOUGH_CREDITS` → `UNDELIVERABLE` pour les 2 SMS refusés du 12 octobre 2026. Le cas **« remis au téléphone » (DELIVERED) n'a jamais été observé** (aucun SMS n'a pu partir) ; Twilio n'a jamais été appelé ; Brevo n'a pas de suivi.
- Les SMS « échec » et « en cours » existent dans le constructeur mais ne sont **pas** envoyés (tous les transferts de l'application sont confirmés).
- **Les frais ne figurent pas dans le SMS** (choix du modèle) : ils sont sur le reçu.
- Pas testé sur un vrai iPhone / Android ; pas d'impression papier ; pas de déploiement Netlify depuis cet environnement ; pas de vérification de type Deno.
- **Refusé** : reproduction visuelle d'une banque tierce (couleurs, typographie, icônes, écrans), nom ou marque d'une banque dans les SMS, logo Visa / Mastercard sur les cartes. Les animations (mouvement d'écran, reçu, fenêtres, boutons) existent déjà depuis 12.4.0 et respectent `prefers-reduced-motion`.
- Les anciennes lignes `recipient_notices` (avant la migration) ont `delivery_status` NULL et ne sont pas suivies.

# YOR WALLET 12.4.0 — refonte design premium (système de design, accueil, cartes, historique, reçus)

Identité : **YOR WALLET** uniquement. Aucun logo, nom, écran ou marque tiers n'a été copié ; aucune marque de réseau de cartes n'est dessinée (un test automatique vérifie l'absence de ces marques dans tout le code).

## Ajouté
- **Système de design central : `css/yor-ds.css`** (chargé en dernier, après `chain.css`) : palette sobre (noir profond / violet YOR / états succès-attente-échec), échelle typographique, espacements, rayons, ombres, boutons, champs, cartes, fenêtres, menus, états chargement / vide / succès / erreur. Thèmes **sombre et clair** partagent les mêmes composants (jetons CSS : `--fs-*` tailles, `--el-*` ombres, `--st-ok/wait/bad` statuts, `--t-ds-*` et `--ease-ds` mouvements). Zones sûres iPhone/Android (`env(safe-area-inset-*)`), tablette et ordinateur (colonnes plafonnées).
- **Accueil** : en-tête (logo, avatar, bienvenue discrète, notifications avec pastille, réglages), **solde réel** avec masquer/afficher (animation discrète, `prefers-reduced-motion` respecté), 5 actions rapides qui existent toutes, activité récente avec **statut réel** et ouverture du détail. Aucun pourcentage inventé (les cours crypto sont une table statique indicative : ils ne sont plus présentés comme une variation).
- **Cartes virtuelles** : noir élégant, dégradé discret, finition métallique simulée ; numéro **masqué** (affiché seulement après PIN) ; entrée animée, effet au toucher, ouverture fluide vers les détails. **Aucune fausse carte utilisable** : pas de CVV, pas de date d'expiration inventée, pas de puce/NFC dessinés. La mention « Aperçu · non émise » reste tant que la carte n'a pas été réellement émise (`issued === true`) ; un réseau (logo) ne s'affiche que si la carte a un **vrai réseau ET un vrai émetteur**. Détails de carte : uniquement des actions qui existent dans l'application (bloquer/débloquer, afficher l'ID de carte après PIN, plafond mensuel, préférences en ligne/sans contact/distributeur, design, nom, clôture avec confirmation) ; ce sont des réglages enregistrés dans l'application, pas des commandes envoyées à un émetteur.
- **Historique** : regroupé par jour, filtres Tout / Monnaie / Crypto / En attente / Échoué, état vide, squelettes de chargement ; le clic sur une ligne ouvre la bonne transaction même après filtrage.
- **Reçus** : l'écran, l'image PNG, le PDF et l'impression suivent le **statut réel** (réussi / en cours / échoué). Montant en premier, copier la référence, partager, PDF, impression propre (barres et boutons masqués). Un reçu en cours ou échoué n'est **jamais** présenté comme réussi (ni à l'écran, ni dans le fichier exporté) ; un échec n'affiche aucune ligne de débit. Aucune référence inventée : « — » si absente.
- Singulier « 1 service » (anglais/français/arabe) dans la liste des pays.

## Corrigé (défauts trouvés à l'audit)
- Un reçu dont le **snapshot disait « réussi »** alors que la transaction était en cours/échouée s'affichait comme réussi : le statut réel de la transaction gagne maintenant partout.
- Le PNG/PDF partagé affichait un en-tête de succès et « Yinance Digital Services » : désormais état réel et « YOR WALLET · Yor Digital Finance ».
- Cartes : marque de réseau, « Active », CVV et option « Physique » alors qu'aucune carte n'est émise ; supprimés (voir ci-dessus).
- Statuts bruts/tronqués dans les listes ; pourcentages crypto statiques présentés comme des variations ; règles CSS héritées qui coloraient toute une ligne de transaction en vert/orange/rouge ; code mort des anciens écrans de cartes ; bouton « Plus » de l'accueil sans action ; deux reçus créés pour un seul appui ; `Runtime.settings` nul faisait planter l'écran Réglages avant hydratation (garde ajoutée).

## Fichiers modifiés
`css/yor-ds.css` (nouveau), `css/v12.css`, `css/buttons.css`, `css/home.css`, `index.html`, `sw.js` (cache v12.4.0), `js/core/helpers.js`, `js/data/reference-data.js` (12.4.0), `js/features/v12.js`, `js/i18n/translations.js`, `js/screens/history-cards.js`, `js/screens/home.js`, `js/screens/profile-settings.js`, `js/screens/receipt.js`, `js/screens/transfer-flow.js`, `js/ui/receipt-export.js`, `js/wire.js` ; supprimé : `assets/ui/network-mark.svg`. Côté `yor-core` : `tests/ui/redesign.test.mjs` (nouveau), `tests/ui/ui-harness.mjs`, `tests/ui/app-boot.test.mjs`.
**Dépendances ajoutées : aucune.** Aucune migration Supabase, aucune fonction serveur modifiée, règles métier des transferts inchangées.

## Tests réellement exécutés
- `npm test` (modèle, TRON, edge, web + simulation) : **251 + 49 réussis, 0 échec**.
- `npm run test:ui` (vrai `index.html`, vraie CSP, Chromium sans tête) : **84 réussis, 0 échec** (dont 28 de la refonte : statut réel, reçus PNG/PDF, accueil, cartes, historique, mise en page, mouvement réduit, impression, absence de marque tierce).
- Captures d'écran relues à la main : accueil, cartes, détails de carte, historique, reçus (réussi / en cours / échoué), affiches PNG, services, pays, service, identifiant, montant — en sombre/clair, anglais/arabe, téléphone et ordinateur.

## NON EXÉCUTÉ / limites honnêtes
- **Pas testé sur un vrai iPhone ni un vrai Android** (seulement un Chromium avec vues 390×844 et 1440×900) ; **pas d'impression sur papier** (seulement le rendu `@media print`) ; **pas de déploiement Netlify réel** depuis cet environnement.
- **Aucune carte n'est réellement émise** : les cartes restent un aperçu ; un logo de réseau (Visa, etc.) ne sera affiché que le jour où une carte aura un vrai réseau et un vrai émetteur dans les données — il n'est pas dessiné ici.
- Le PDF est une **image** (non sélectionnable).
- Les cours crypto sont une table indicative statique, pas du direct.
- Navigation conservée (Accueil / Cartes / Envoyer / Crypto / Services) : l'architecture existante a été jugée acceptable. Les anciennes feuilles CSS restent ; `yor-ds.css` les surcharge en dernier.
- Chiffres arabes-indiens en arabe (moteur de devises existant).

# YOR WALLET 12.3.7 — envoi crypto vers n'importe quelle adresse ; SMS arabe au destinataire

## Modifié
- **Envoi crypto (écran « Envoyer ») : toute adresse acceptée par le serveur peut recevoir.** Avant, l'écran refusait (bouton « Suivant » grisé, « Adresse invalide ») toute adresse dont le format n'était pas exactement celui du réseau choisi. Maintenant seules les limites du serveur bloquent (15 à 128 caractères parmi lettres, chiffres et `: _ . -`) ; un format inhabituel pour le réseau choisi affiche un **avertissement** (« Cette adresse ne ressemble pas à une adresse TRON standard… Elle ressemble à une adresse Ethereum. ») et l'envoi reste possible.
- **Le texte collé est nettoyé** avant contrôle : espaces et retours à la ligne, caractères invisibles ou de sens d'écriture, guillemets et parenthèses autour, préfixes `ethereum:` `bitcoin:` `tron:`…, paramètres `?amount=…`.
- **L'écran de confirmation affiche l'adresse COMPLÈTE** (et plus seulement « début…fin »), à vérifier avant de glisser pour confirmer.
- **Messages de refus précis du serveur** (adresse invalide, envoi à soi-même, adresse d'un portefeuille YOR sur un autre réseau, crypto indisponible sur ce réseau, montant invalide) au lieu de « Une erreur est survenue ».
- **Écran YOR-USDT (TronLink)** : le collage est nettoyé de la même façon, un lien d'explorateur Nile/Tronscan est reconnu (l'adresse en est extraite), la forme hexadécimale TRON `41…` est convertie en `T…`, et une adresse de type Ethereum `0x…` reçoit un message clair (« YOR-USDT n'existe que sur TRON ») au lieu de « adresse invalide ».
- **SMS au destinataire en arabe** (modèle fourni par le propriétaire) pour les bénéficiaires d'un pays arabophone : `عزيزي العميل،` / confirmation du montant / `رقم المرجع` / `التاريخ والوقت` / `من الحساب` / `إلى الحساب`, avec l'avertissement « حوالة دولية » **seulement** si le pays de l'expéditeur et celui du bénéficiaire sont connus et différents. La ligne `إلى الحساب` n'est jamais vide : remplie avec le compte du bénéficiaire, sinon omise. Serveur : `send-notice` v20.

## Non fait, volontairement
- **Aucune adresse n'est convertie d'un réseau à l'autre** : une adresse `0x…` n'est jamais transformée en adresse TRON (YOR-USDT n'existe que sur TRON ; envoyer à une adresse d'un autre réseau peut perdre les fonds). Pour les autres cryptos de l'écran « Envoyer », l'avertissement signale le réseau probable mais la décision reste à la personne.
- **Pas de nom ni de numéro de référence de banque tierce** dans le SMS arabe (le modèle citait `BMCT…`) : l'application garde l'identité YOR WALLET.
- « تم تأكيد تحويل » (et non « تم استلام … بنجاح ») pour les transferts externes : l'application ne peut pas vérifier la réception ; « تم استلام » n'est utilisé que pour les transferts internes YOR.

# YOR WALLET 12.3.6 — e-mail « c'est parti » pour les envois YOR-USDT (sans attendre la chaîne)

## Ajouté
- **Envoi YOR-USDT (testnet Nile) : un e-mail part tout de suite** à l'adresse de votre compte dès que TronLink a signé et que le réseau a accepté la transaction (« Transfert envoyé »). L'e-mail dit clairement qu'elle n'est **pas encore confirmée**. Il part même si le nœud TRON ne répond pas ou ne connaît pas encore la transaction ; les adresses de destination (n'importe quelle adresse TRON valide) et le montant viennent de l'envoi que vous venez de signer.
- **Deuxième e-mail « Transfert confirmé » seulement quand la chaîne le prouve** (nœud solidity, bloc, reçu SUCCESS, événement Transfer). Le serveur re-vérifie lui-même : sans preuve, aucun e-mail « confirmé » ne part. Un seul e-mail par événement et par transaction.
- Côté serveur : nouvelle fonction `chain-notice` (v2) et table privée `chain_notices` (aucun accès public). Aucun changement sur les SMS ni sur les transferts en monnaie.

## Non fait, volontairement
- Un e-mail « confirmé » **sans preuve de la chaîne** (ce serait annoncer un succès non vérifié) ; une transaction échouée ou non confirmée n'est jamais affichée comme réussie.
- Le blocage strict des SMS incomplets demandé puis **annulé par le propriétaire** (12 octobre 2026) : `send-notice` reste en v19, rien n'a été modifié.

# YOR WALLET 12.3.5 — détails du reçu en style relevé bancaire

## Modifié
- **Reçu** : date, heure, statut, référence et ID de transaction passent de petites cartes à icônes à des **lignes de relevé** (libellé d'un côté, valeur de l'autre, séparateurs fins). L'ID reste copiable d'un appui. Rien d'autre ne change : montants, frais, TVA, total, numéro de l'expéditeur (« De »), messages.

## Non fait, volontairement
- L'application **ne prend ni le nom, ni le logo, ni les couleurs, ni l'apparence d'une banque tierce** (Bank Muscat ou autre) : elle garde l'identité YOR WALLET.

# YOR WALLET 12.3.4 — le destinataire voit le numéro de l'expéditeur ; ligne « De » sur le reçu

## Ajouté
- **Le SMS du destinataire (externe et interne) affiche le numéro de téléphone de l'expéditeur** (ex. `Transfer Confirmed: OMR 150.000 from +96877986533. Ref TX-… .`) au lieu de son nom. Le numéro est celui réglé dans Réglages › « Numéro pour les confirmations SMS » ; à défaut, le téléphone du profil ; sans numéro exploitable, le nom reste affiché (rien n'est inventé). Le même numéro figure dans la ligne « expéditeur » de l'e-mail du destinataire. Côté serveur (fonction `send-notice` v19) : l'application n'a rien à envoyer de plus.
- **Reçu de l'application et reçu exporté (PNG / PDF) : ligne « De / From / من » avec le numéro de l'expéditeur** (transferts en monnaie uniquement, pas en crypto ; absente quand aucun numéro n'est enregistré).

## Non fait
- La mise en page du reçu **exactement comme un reçu Bank Muscat** : aucun modèle de reçu Bank Muscat n'a été fourni, rien n'a été copié. Ni nom ni logo de banque tierce sur le reçu.
- Le nom d'expéditeur affiché par le téléphone du destinataire reste « ServiceSMS » (un nom ou un numéro propre demande un enregistrement auprès des opérateurs).

# YOR WALLET 12.3.3 — SMS automatiques et immédiats (expéditeur + destinataire), en anglais, style notification bancaire

## Ajouté
- **Envoi automatique et immédiat des deux SMS dès qu'un transfert est enregistré** (transfert externe ET transfert interne) : un SMS à l'**expéditeur** et un SMS au **destinataire**. Aucun bouton, aucune validation, aucune confirmation, aucun délai volontaire.
  - **La base de données lance elle-même l'envoi** au moment où le transfert est validé (même transaction ; la requête part au commit). Cela marche même si l'application est fermée ou hors ligne juste après l'envoi.
  - L'application garde un **second chemin de secours** : elle demande l'envoi **tout de suite après la réponse du serveur** (avant le rechargement des soldes), et refait un essai 3 s plus tard si le premier n'a pas atteint le serveur. Un doublon est sans effet (chaque message n'est réclamé qu'une fois).
  - Un **balayage chaque minute** relance les envois en attente ou échoués des 2 dernières heures (erreur du fournisseur, clé corrigée après coup…).
- **Transfert interne (compte à compte)** : l'expéditeur reçoit aussi sa confirmation (avant, seul le destinataire était prévenu).

## Modifié — contenu des SMS (tous en anglais, style Bank Muscat)
- **Oman** : montants en **OMR**. Expéditeur : `Debit Alert: OMR 151.050 debited from your account (transfer OMR 150.000 + fees OMR 1.050) for a transfer to +96875235685. Ref YOR-TX-20261010-4E753B. 10 Oct 2026 16:02 UTC. Status: Confirmed.` Destinataire : `Transfer Confirmed: OMR 150.000 from Damys T. Ref TX-20261010-4E753B. 10 Oct 2026 16:02 UTC.`
- **Orange Money et Wave** : montants en **FCFA** (code XOF), service nommé. Expéditeur : `… for a transfer of approx. FCFA 233,100 via Wave to +2250544469457 …` Destinataire : `Wave Transfer Confirmed: approx. FCFA 233,100 (OMR 150.000) from Damys T. Ref TX-… .`
- Chaque SMS contient le **montant, la devise, la référence, la date ET l'heure** (UTC) et le statut **« Confirmed »**. Jamais « Test », jamais « en cours / processing / pending ».
- Le SMS au destinataire reste **neutre** (ni frais, ni nom de marque, ni « YOR » dans la référence) et ne dit **jamais « received »** pour un transfert externe (l'application ne peut pas vérifier la réception) ; « You received » n'est écrit que pour un transfert **interne** réellement arrivé.
- Les **e-mails** à l'expéditeur gardent leur avertissement « le versement n'est pas suivi » (la règle « pas de En cours » ne concerne que les SMS).

## Serveur (déployé, voir yor-core 0.8.5)
- Fonction `send-notice` v16 ; migration `notice_auto_dispatch` (table privée `notice_dispatch_cfg`, `_dispatch_notices`, tâche `notice-sweep`, `enqueue_recipient_notices` complétée).
- La fonction nettoie la clé Infobip collée depuis un téléphone (espaces, retours à la ligne, marques de direction invisibles) et refuse clairement un secret qui n'est pas une clé, **sans brûler de tentative**.
- Cache du service worker : yor-shell-v12.3.3.

## Non exécuté
- **Aucun SMS n'est encore parti par la fonction avec la clé Infobip** : le secret `INFOBIP_API_KEY` enregistré dans Supabase n'est pas une clé valide (la fonction le signale : « INFOBIP_API_KEY is not a valid key »). Le chemin automatique base → fonction a, lui, été vérifié (la fonction est bien appelée et réclame les messages). Dès que le secret contient la clé seule, les messages en attente partent au balayage suivant.
- La remise sur le téléphone n'est pas suivie : « Transmis au fournisseur » veut dire accepté par le fournisseur.
- Aucun versement réel sur Orange Money / Wave / banque d'Oman : le SMS dit « Confirmed » parce que le transfert est enregistré et le compte débité.

# YOR WALLET 12.3.2 — confirmation du débit envoyée à l'expéditeur (SMS + e-mail), selon le service

## Ajouté
- **L'expéditeur reçoit une confirmation de chaque transfert externe** (SMS + e-mail), avec le détail : montant débité, envoi + frais, montant estimé à verser, service, référence, date, statut « en cours de traitement ».
  - **Orange Money (Mali, Côte d'Ivoire, Burkina)** : montant en **XOF** et débit en **OMR** ; en **français** à l'origine, **en arabe pour un compte d'Oman** depuis la mise à jour serveur du 10 octobre (voir plus bas).
  - **Services d'Oman** : en **arabe**, reçu adapté à Oman, **tout en OMR** (ni taux ni conversion).
  - **Crypto** (achat, vente, échange, envoi) : **aucun message**.
  - Les frais viennent de la transaction (`total − montant`), jamais inventés ; sans total connu, aucun frais n'est affiché.
- **Réglages → « Numéro pour les confirmations SMS »** (EN / FR / AR) : le numéro qui reçoit le SMS de confirmation. Format international (+968…), validé avant enregistrement ; vide = supprimé. Sans numéro, **aucun SMS de confirmation n'est envoyé** (l'e-mail part vers l'adresse du compte) et le reçu le dit.
- **Reçu** : un groupe « Confirmation qui vous est envoyée » (SMS / e-mail) au-dessus des messages au bénéficiaire. Pour Orange Money, une ligne `≈ … XOF` sous le montant ; pour Oman, aucune ligne de taux ni de XOF.

## Mise à jour serveur du 10 octobre 2026 (aucun changement de l'application)
- **La confirmation envoyée à l'expéditeur est toujours en arabe quand son compte est dans un pays arabophone** (Oman…), y compris pour Orange Money (montant en XOF + débit en OMR). Ailleurs : langue du service, puis langue de la personne. Fonction `send-notice` v7.
- **Le numéro complet du destinataire figure dans la confirmation de l'expéditeur** (fonction `send-notice` v8, 10 octobre 2026) : `+22370123456` au lieu de `***3456` pour un service par téléphone (Orange Money, Wave, services d'Oman). IBAN et comptes bancaires restent masqués. En arabe, le numéro est isolé en gauche-à-droite pour que le « + » ne passe pas de l'autre côté. Le message au bénéficiaire n'a pas changé (il reçoit déjà le message de la transaction, sans frais).
- **Le SMS au bénéficiaire ne contient plus « YOR »** (fonction `send-notice` v9, 10 octobre 2026) : la référence `YOR-TX-20261010-F627B7` devient `TX-20261010-F627B7` (FR / EN / AR, transferts externes et internes). La confirmation à l'expéditeur et l'e-mail gardent la référence complète.
- **Le message au bénéficiaire d'un transfert externe dit « confirmé »** (fonction `send-notice` v10, 10 octobre 2026) : « Transfert confirmé : 110,000 OMR de Prénom I. Réf. … » (SMS) et « Le transfert est confirmé : le montant a été débité du compte de l'expéditeur » (e-mail, statut « Confirmé »), puisque l'argent est sorti du compte de l'expéditeur. Il ne dit pas « vous avez reçu l'argent » (l'application ne peut pas vérifier la réception). La confirmation envoyée à l'expéditeur garde « en cours de traitement ».
- **Les SMS partent par Infobip même sans le secret `SMS_PROVIDER`** (fonction `send-notice` v11, 10 octobre 2026) : les deux premiers transferts de test étaient partis par Brevo (expéditeur non enregistré à Oman) et n'étaient pas arrivés. Sans secret, Infobip est choisi dès que `INFOBIP_API_KEY` existe ; un choix explicite par `SMS_PROVIDER` l'emporte toujours.

## Modifié
- **Le message au bénéficiaire reste neutre** : montant, expéditeur « Prénom I. », référence, date, statut. Ni frais, ni nom de marque dans le texte.
- Langue : la confirmation à l'expéditeur suit le **pays du compte** s'il est arabophone (arabe), sinon le **service** (pays du bénéficiaire), à défaut la langue de la personne.
- Serveur : nouvelle audience `SENDER` dans la file `recipient_notices` (migration `sender_confirmation_notices`), fonction `send-notice` v6. Limite : 10 SMS de confirmation par 24 h vers un même numéro.
- Cache du service worker : yor-shell-v12.3.2.

## Non exécuté
- **Aucun message réel n'est encore parti par la fonction avec la clé Infobip** : aucun transfert externe n'a été fait depuis l'application après la mise en place. La présence des trois secrets (`INFOBIP_API_KEY`, `INFOBIP_BASE_URL`, `SMS_PROVIDER`) n'est pas vérifiable : un premier vrai transfert la prouvera.
- La remise sur le téléphone n'est pas suivie : « Transmis au fournisseur » veut dire accepté par le fournisseur.
- Aucun versement réel sur Orange Money / service d'Oman : le message au bénéficiaire dit « confirmé » (le débit est fait), jamais « reçu » ; la confirmation à l'expéditeur dit « en cours de traitement ».
- Un SMS arabe détaillé fait 3 à 4 segments (3 à 4 SMS facturés par le fournisseur).

---

# YOR WALLET 12.3.1 — le reçu ne laisse plus croire qu'un SMS est arrivé

## Modifié
- **Reçu : « Envoyé » devient « Transmis au fournisseur »**, avec la mention « La remise sur le téléphone n'est pas suivie ». Un essai réel avec Infobip a montré qu'un fournisseur peut répondre
  « accepté » puis rejeter le message quelques millisecondes plus tard (route non disponible) : afficher « Envoyé » aurait été faux. EN / FR / AR.
- **SMS : plus de double point** (« …de Adam K.. Réf. » devenait « …de Adam K. Réf. »), dans les trois langues.
- La fonction d'envoi accepte maintenant trois fournisseurs SMS (secret `SMS_PROVIDER` : `brevo` par défaut, `infobip`, `twilio`) ; aucun changement d'interface.
- Cache du service worker : yor-shell-v12.3.1.

## Non exécuté
- Aucun SMS n'est arrivé sur un téléphone. Essai réel Infobip vers +968 77986533 (2 messages) : accepté par l'API (`PENDING_ACCEPTED`) puis **rejeté** (`REJECTED_ROUTE_NOT_AVAILABLE`, `EC_ACCOUNT_NOT_PROVISIONED_FOR_CHANNEL`) : le compte Infobip n'est pas activé pour le canal SMS. Même résultat avec deux expéditeurs différents.
- Les adaptateurs Infobip et Twilio de la fonction `send-notice` n'ont jamais été appelés avec une vraie clé (seul le format de la réponse « accepté » a été confirmé par l'essai).

---

# YOR WALLET 12.3.0 — envoi par numéro seul, message au destinataire (SMS / e-mail)

## Modifié
- **Envoi par téléphone / mobile money (Orange Money, Mali, Côte d'Ivoire, Burkina, Oman, Dubaï…) : numéro + montant, rien d'autre.** Plus de prénom, de nom ni de nationalité à saisir.
  Un compte bancaire (IBAN, routage + compte) garde le prénom et le nom du titulaire, parce qu'une banque l'exige ; la nationalité n'est plus demandée nulle part.
- Côté serveur (`_fiat_send_external_impl`) : nom et nationalité facultatifs pour un numéro de téléphone, obligatoires seulement pour un compte bancaire. Inchangés : PIN à usage unique,
  contrôle du solde, 3000 par envoi, 5000 par jour, clé d'idempotence, frais et TVA, taux « configuré, pas un taux bancaire ».
- Le reçu n'affiche plus le numéro deux fois quand il n'y a pas de nom.

## Ajouté
- **Message au destinataire du transfert** (SMS sur le numéro ; le même message par e-mail quand ce numéro est celui d'un compte actif qui a une adresse e-mail).
  La base remplit une file (`recipient_notices`) dès que le transfert est confirmé ; **l'application demande l'envoi juste après le transfert** (et à l'ouverture du reçu si un message attend encore),
  avec le jeton de la personne connectée, à la fonction `send-notice` (déployée, `verify_jwt` actif, seul l'expéditeur de la transaction est accepté). Aucun secret partagé, pas de tâche planifiée :
  si l'appel est perdu, le message attend la prochaine ouverture du reçu et expire après 24 h.
- Le texte donne les détails (montant envoyé, montant estimé à recevoir, expéditeur sous la forme « Prénom I. », référence, date UTC). **Ni YOR ID, ni nom de la marque dans le texte.**
  Pour un envoi externe, il dit **« en cours de traitement »** et jamais « reçu » : aucun circuit de paiement réel n'existe encore vers Orange Money. « Reçu » n'est utilisé que pour un
  transfert entre deux comptes de l'application.
- L'expéditeur technique reste `YORWALLET` (SMS) / `YOR WALLET` (e-mail) pour que le message soit identifiable et accepté ; modifiable par les secrets `SMS_SENDER` / `NOTICE_FROM_NAME`.
- Anti-abus : 5 SMS par 24 h pour un même numéro, 20 par 24 h pour un même expéditeur, pays SMS autorisés OM / AE / ML / CI / BF, nom de l'expéditeur nettoyé (lettres seulement, pas de lien).
- Le reçu montre l'état réel du message (envoyé / en attente / non envoyé, avec la raison), lu côté serveur. Rien n'est affiché s'il n'y a aucun message.
- Langues EN / FR / AR. Cache du service worker : yor-shell-v12.3.0. Détail et limites : `yor-core/docs/NOTICES.md`.

## Non exécuté
- **Aucun SMS ni e-mail de destinataire n'a été réellement envoyé ni reçu.** Le compte Brevo est au plan gratuit sans crédit SMS visible ; le nom d'expéditeur SMS peut devoir être enregistré par pays (Émirats, Oman…). Tant que le crédit manque, le reçu affiche « En attente d'envoi · pas encore de crédit SMS ».
- Aucun profil n'a de numéro de téléphone : l'e-mail « du même message » n'atteint personne pour l'instant ; seul le SMS est mis en file.
- La fonction n'a pas été exercée de bout en bout avec un vrai jeton et un vrai envoi (testés : logique pure, interface réelle avec faux client, règle de file sur la vraie base avec données fictives annulées, refus des appels non autorisés).
- Aucun versement réel sur Orange Money : le transfert externe débite l'expéditeur et s'enregistre, rien n'est payé au destinataire.

---

# YOR WALLET 12.2.1 — YOR-USDT réservé aux administrateurs, signature plus tolérante

## Modifié
- **L'écran YOR-USDT n'est visible que pour les comptes administrateurs** (profil `role = 'admin'`) : tuile et groupe « Blockchain » absents de Services pour les autres,
  accès direct (`#/chain`, `R.go('chain')`) renvoyé à l'accueil, `renderChain()` vide sans le rôle. C'est un masquage d'interface : la sécurité des fonds ne repose pas dessus
  (chaque transfert est signé dans le TronLink de la personne, le rôle ne se modifie pas côté client — colonne non modifiable par l'utilisateur dans Supabase).
- **Temps pour signer : 5 minutes au lieu de 60 s.** L'expiration de la transaction est allongée localement puis la transaction modifiée repasse les 17 contrôles
  (ré-encodage exact, txID = sha256 des octets signés). Si TronLink renvoie une autre transaction, rien n'est diffusé et le nouvel essai utilise la transaction standard du nœud (60 s).
- Suivi de confirmation interrogé toutes les 2 s (au lieu de 3 s). « Confirmé » reste soumis à la preuve (nœud solidity + reçu SUCCESS + événement Transfer).
- Textes de l'attente de signature EN/FR/AR. Cache du service worker : yor-shell-v12.2.1.

## Non exécuté
- Aucune signature ni diffusion réelle, aucun test avec le vrai TronLink : le comportement de TronLink face à une transaction à validité allongée est à constater sur téléphone.

---

# YOR WALLET 12.2.0 — écran YOR-USDT (réseau de test Nile, TronLink)

## Ajouté
- Services → **Blockchain (réseau de test) → YOR-USDT** : connexion TronLink, solde lu sur la blockchain (étiquette TEST BALANCE), solde TRX, envoi de YOR-USDT
  avec simulation, écran de revue (énergie, frais estimés, plafond), signature dans TronLink, suivi réel jusqu'à « Confirmé » (jamais avant preuve), activité.
- Langues EN / FR / AR (RTL), thèmes sombre et clair, écrans de 320 px à 560 px.
- `js/features/yor-chain.js` (généré depuis yor-core, ne pas modifier à la main), `js/screens/chain-wallet.js`, `css/chain.css`.
- Aucune clé privée dans l'application : la signature est faite par TronLink.

## Modifié
- CSP (`_headers`, `vercel.json`) : `connect-src` + `https://nile.trongrid.io https://api.nileex.io`. Le mainnet TRON reste bloqué.
- `js/wire.js` : ouverture de l'écran depuis la tuile ; `js/core/router.js` : parent « services » ; `js/screens/crypto-market.js` : nouveau groupe dans Services.
- Cache du service worker : yor-shell-v12.2.0.

## Non exécuté
- Aucune signature ni diffusion réelle, aucun test avec le vrai TronLink (voir yor-core/docs/WALLET_SCREEN.md).

---

# YOR WALLET 12.1.0 — charte YOR et animations de carte

## Modifié
- Palette alignée sur la charte : violet #6C4CF1 (clair) / #8B6CFF (sombre), deep #3B1F8C, glow #A78BFA, or #F5B700, menthe #2DD4BF, fonds #F8F7FC (clair) et #0B0A12 (sombre), couleurs sémantiques de la charte.
- Dégradé signature #4C1D95 → #6C4CF1 → #A78BFA sur les boutons, le logo, les icônes de l'application et la carte « violet ». Plus de cyan dans les cartes violet et midnight.
- Écran de succès : cercle menthe et coche qui se tracent, puis apparition du titre et du montant.
- Cartes : entrée en cascade, lueur violette au retournement, effet de gel (voile givré, flocon, étincelles, frisson) uniquement quand on bloque la carte.
- Toutes les animations sont coupées avec « réduire les animations » (prefers-reduced-motion).
- PNG de marque non utilisés par l'application retirés (logo, cartes, image de partage).
- Cache du service worker : yor-shell-v12.1.0.

---

# YOR WALLET 12.0.2 — icônes et déploiement

## Modifié
- Icônes de l'application régénérées à partir du logo : l'icône « maskable » (Android) a maintenant ses lettres dans la zone de sécurité, l'icône iOS est pleine page, dégradé sans bandes.
- `assets/icons/icon.svg` = logo de marque (ancien fichier alourdi par des métadonnées).
- Cache du service worker : yor-shell-v12.0.2.

---

# YOR WALLET 12.0.1 — refonte visuelle, cartes YOR

Base : 11.3.0 (structure modulaire conservée, aucune logique d'argent modifiée côté serveur).

## Ajouté
- Nouveau design (css/v12.css) : fond noir pur, dégradé de marque YOR, thème clair, barre de navigation plate à 5 entrées (Accueil, Cartes, Envoyer, Crypto, Services).
- Accueil : solde en grand avec la devise réduite, actions Envoyer / Recevoir / Échanger / Plus, bande de cartes, comptes, transactions groupées par jour.
- Cartes virtuelles YOR (4 designs : midnight, violet, aurora, graphite) : carte 3D qui se retourne, effet d'inclinaison, Bloquer/Débloquer, Détails (code PIN requis, masqués automatiquement après 30 s), Plafonds mensuels, Réglages (paiements en ligne, sans contact, retraits, nom, design, résiliation), création de carte.
- Aucune marque de réseau tiers sur les cartes : numéro commençant par 9701, marque « YOR ».
- Saisie du code PIN : clavier numérique à 6 points (achats, transferts, détails de carte).
- Connexion / inscription : logo, accroche, choix de langue EN / FR / AR directement sur l'écran.
- Logo, jeu d'icônes (52), illustrations et cartes en SVG dans assets/.

## Modifié
- Le mot « simulation » n'apparaît plus : badge de taux retiré, libellé d'offre d'exemple remplacé.
- L'application s'ouvre dans la langue de l'appareil sans écran de choix préalable.
- Le harnais de tests (js/dev/) n'est plus chargé en production.
- Cache du service worker : yor-shell-v12.0.1.

## Testé
- Chargement complet dans Chromium avec un client Supabase simulé : accueil, cartes, réglages de carte, création de carte, navigation du bas, retournement avec PIN, blocage, EN/FR/AR (RTL), thème clair, 390 px et 1440 px, aucune erreur JavaScript.
- Non testé avec le vrai serveur : inscription, e-mail de confirmation, mouvements d'argent.

---

# YOR WALLET 11.3.0 — projet découpé en fichiers

Base : 11.2.1. Refonte de structure uniquement : `index.html` (492 Ko) est découpé en 6 fichiers CSS et 37 fichiers JS (voir ARCHITECTURE.md). Aucune logique, aucun style, aucun texte modifié. Seul le numéro de version affiché change (11.3.0).
- Service worker : cache `yor-shell-v11.3.0`, tous les fichiers du découpage sont dans le shell hors ligne.
- vercel.json : `css/` et `js/` sont revalidés à chaque chargement (pas de vieux fichiers après une mise à jour).
- Non testé dans un navigateur (aucun moteur JavaScript dans mon environnement) : à vérifier avant publication.
- `lodaModa` : toujours non traité (fonction non définie).

---

# YOR WALLET 11.2.0 — envoi crypto, réception, statut « en attente »

Base : 11.1.0. Aucune RPC, table ou policy modifiée (la base gérait déjà tout).

## Ajouté
- Envoi crypto branché sur `crypto_send_external` (PIN obligatoire, clé d'idempotence unique par écran de confirmation, verrou anti-double).
  - Adresse appartenant à un wallet YOR : transfert interne instantané, frais 0, le destinataire est crédité et notifié (statut CONFIRMED).
  - Adresse inconnue : montant + frais réseau débités, transaction PENDING « En attente de validation blockchain ».
- Retrait crypto vers banque débloqué : l'écran de confirmation appelle la RPC serveur `crypto_to_bank` (PIN obligatoire, clé d'idempotence unique par écran, verrou anti-double). Le serveur débite le wallet (frais 1,5 %), crée une transaction PENDING et la notification ; le reçu est affiché avec le statut « En attente ». L'ancienne écriture locale du ledger (interdite) est supprimée.
- Reçu et historique : titre, sous-titre et statut « En attente » (EN/FR/AR) pour une transaction PENDING.
- Réception crypto : l'adresse affichée vient maintenant de `get_receive_address` (vraie adresse du wallet) et plus d'un générateur local.
- Icônes PWA générées : assets/icons/ (icon.svg, 192, 512, maskable, apple-touch-icon).

- Langue : l'app s'ouvre dans la langue de l'appareil (arabe, français, sinon anglais). À la toute première ouverture, un écran propose English / Français / العربية avant la connexion. Le choix est mémorisé sur l'appareil ; la langue enregistrée d'un utilisateur connecté reste prioritaire ; après déconnexion, retour à la langue de l'appareil. Un nouvel utilisateur est enregistré avec cette langue, que les e-mails utilisent déjà.

- Verrouillage : le code à 6 chiffres est demandé à chaque ouverture de l'application (démarrage, rechargement, retour après plus de 5 secondes), avant tout accès au tableau de bord. Pendant le verrouillage l'app est masquée et inactive. Après la première connexion, la création du code est obligatoire. Vérification côté serveur (verify_pin), le code n'est jamais stocké.
- Présentation : 4 pages (Suivant / glisser) affichées une seule fois à la première ouverture, avec « Passer » pour aller directement à la connexion / création de compte.

- Nouveau design de l'accueil (style Binance, couleurs YOR inchangées) : en-tête avatar / recherche / notifications, solde estimé avec œil, boutons Envoyer-Acheter-Recevoir, grille de 8 services, marchés avec variation 24h, activité récente, barre du bas plate. Menu latéral (avatar) avec profil, notifications, historique, cartes, banques, marchés, réseaux, paramètres et déconnexion (compatible RTL). Plein écran natif iPhone/Android (meta PWA).

- Reçu : nouveau visuel exportable (ticket sombre avec dégradé violet, montant en grand, détails, statut) généré dans l'app. Boutons Partager (fichier image via la feuille de partage du téléphone, repli téléchargement), PNG et PDF. Compatible arabe (RTL). Montant en grand sur l'écran du reçu.

- Marchés : nouvelle page (plus fortes variations, recherche, onglets Top / Prix / 24h, lignes avec mini-graphique et pastille de variation). Nouvelle page Services regroupant Argent, Crypto, Compte et aide. Barre du bas : Accueil, Marchés, Crypto, Services, Profil.

- Design : carte bancaire (dégradé violet profond, reflet, puce), paramètres (groupes arrondis, icônes, pastilles de langue/thème), listes de sélection (pays, services, banques, réseaux), boutons et champs (16 px pour éviter le zoom iOS). Aucun changement de logique.

## Admin
- Le compte admin YOR-754SNC se connecte avec dy.toure@icloud.com (mot de passe inchangé). Ancien compte vide homonyme renommé retired-cpke7f@invalid.yor.

## Non fait
- Non testé dans un navigateur ni contre Supabase (y compris le retrait crypto vers banque) : tester sur un compte de test (envoi vers une adresse YOR, puis vers une adresse inconnue).

# YOR WALLET 11.1.0 — lot 1 (frontend, sans backend)

Base : index 5.html v11.0.0. Aucun solde, aucune table, aucune policy, aucune RPC modifiés. 30 lignes modifiées, 0 supprimée sans remplacement.

## Modifié
- Zoom réactivé (retrait de `user-scalable=no`) ; police 16 px forcée sur les champs iOS pour éviter le zoom au focus.
- XAF ajouté (Franc CFA BCEAO pour XOF, Franc CFA BEAC pour XAF) ; puces de devise Settings : + XAF.
- Formateur de montants par langue : EN `OMR 132,977.000`, FR `132 977,000 OMR`, AR chiffres arabes. OMR reste à 3 décimales.
- Badge SIMULATION sur le total crypto et le montant converti (tables FX/prix codées en dur, `FX_META.status`).
- Langue par défaut : English (au lieu de français) partout où elle était forcée.
- Desktop Mode réel : réglage dans Settings, mémorisé (`yor_layout_mode`), viewport 1024 px avant le premier rendu, donc sidebar et grille multi-colonnes existantes ; bouton « Mobile Mode » dans la sidebar.
- Sidebar : entrée Notifications ; navigation générique (plus de liste if/else).
- Auto-test `runIsolationTests` : refuse de s'exécuter sans `{confirm:true}` car il écrit sur le compte connecté.
- PWA : manifest, service worker (coquille seulement, jamais Supabase), icônes, apple-touch-icon.

## Non fait / à vérifier
- Rien n'a été exécuté dans un navigateur (aucun moteur JS ici). Contrôle fait : parenthèses/accolades équilibrées, ancres vérifiées une à une.
- Taux et prix restent statiques : SIMULATION tant qu'aucune source n'est branchée.
- Dashboard, menu 5 groupes, centre de notifications, P2P/YOR ID, reçus PDF, carte 3D : lots suivants.
