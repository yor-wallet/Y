# Recherche d'interface — Revolut et Binance (23/11/2026)

Demande du propriétaire : « vas voir en ligne comment est l'apparence de Revolut et Binance pour bien faire ».
Règle qui reste prioritaire : **ne pas copier les logos, textes ou écrans de Revolut** (ni de Binance). On reprend des principes, pas des écrans.
OM Wallet garde son identité : verre, bleu ciel, blanc, logo sur chaque écran, police Sora / Tajawal.

## Sources lues
- Binance UI Refined (juin 2025) : binance.com/en/blog/markets/introducing-binance-ui-refined-… et …/binance-ui-refined-explore-the-new-flexible-layout-system-…
- Revolut 10 (presse, oct. 2023 / 2025) : presse-citron.net (« Revolut fait peau neuve »), xatakamovil.com (Revolut 10.0), financemagnates.com (Revolut 10)
- Conception d'interface d'échange : dev.to/vinu_digital (confiance, vitesse, gestion du risque)
- Non lisibles (403/404) : revolut.com/blog/post/revolut-10, revolut.com/news/…, finextra.com, thekingfisher.io

## Ce qu'on en retient (principes)
**Revolut 10**
- L'argent d'abord : le solde est mis en avant sur l'écran d'accueil ; tous les comptes visibles, changement d'un seul geste.
- Barre d'onglets courte et stable (5 destinations) ; le reste derrière une entrée claire.
- Widgets / actions les plus utilisées sur l'accueil ; personnalisation (fond, thème par compte).
- Tâches clés (envoyer, payer, épargner) en un geste ; testées pour réduire le nombre de touches.

**Binance UI Refined**
- Accueil en grille : bloc fixe (solde + performance sur 1/7/30 jours) et blocs que l'on peut réordonner.
- Typographie et icônes « plus propres », espacements revus, thème sombre dédié.
- Données en temps réel ; avertissement de risque visible (« les prix peuvent être volatils »).
- Achat, vente et conversion regroupés dans un même parcours.

**Écrans d'échange (dev.to)**
- Un seul bouton principal par écran ; le graphique, le carnet et le bouton ne se font pas concurrence.
- Vert / rouge réservés à hausse-baisse et achat-vente, toujours avec signe ou flèche (daltonisme).
- Temps réel discret : bref éclair sur le prix qui change, nouvelles lignes du carnet qui glissent ; aucune mise en page qui saute.
- Bouton qui passe tout de suite en « Traitement… » (pas de double appui).
- Chaque mouvement d'argent a un statut clair ; divulgation progressive (simple d'abord, détails à la demande).
- Montants jusqu'à 8 décimales, formats régionaux ; graphiques de gauche à droite même en arabe.

## Règles appliquées à OM Wallet (Spot, Swap, Marchés)
1. Logo OM Wallet sur chaque écran (règle du propriétaire), puis le titre.
2. Cinq onglets inchangés (Accueil, Crypto, Marchés, Activité, Compte) ; Marchés devient l'espace d'échange avec un sélecteur Marchés / Spot / Swap.
3. Solde disponible affiché là où on l'utilise (« Disponible : … » sous le champ montant).
4. Un bouton principal par écran : « Acheter BTC » / « Vendre BTC » en Spot, « Échanger » en Swap.
5. Prix Binance en direct (WebSocket) : éclair vert/rouge sur le dernier prix, carnet qui glisse, point « En direct » + heure ; si la connexion tombe : « Hors ligne — dernier cours à hh:mm » (jamais un chiffre présenté comme en direct s'il ne l'est pas).
6. Avant validation : frais (0), source du prix, prix fixé à la demande, validité 30 s avec compte à rebours.
7. Après validation : l'utilisateur voit seulement « En cours » jusqu'à la confirmation de l'administrateur (règle du propriétaire).
8. Ordres limites : non proposés tant qu'ils ne sont pas réellement exécutés côté serveur (pas de bouton factice) ; le Spot propose l'ordre au marché.
9. Vert/rouge avec signe +/− ou flèche ; contraste vérifié ; animations coupées si « réduire les animations ».
10. Carnet d'ordres repliable sur petit écran ; graphique et carnet en onglets plutôt qu'empilés quand la place manque.
