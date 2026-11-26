# OM Wallet — audit du mouvement (phase 1, 26/11/2026)

Application web (PWA) étudiée **avant toute modification**. Inventaire de l'application Android à la fin.

## Méthode

- **Lecture** des modules de mouvement : `js/ui/ios-motion.js` (ressorts, transitions d'écran, geste retour, feuilles, tirer pour actualiser, haptique), `js/ui/motion.js` (chiffres en direct, segment), `js/ui/omw.js` (appui, cascade, messages), `css/motion.css`, `css/ios.css` et les 23 feuilles chargées.
- **Inventaire statique** des 23 feuilles, dans leur ordre de chargement (script `css_inventory.py`).
- **Mesure réelle** dans Chromium avec Playwright, sur l'application servie par le banc d'essai (français, thème sombre, 390 × 844, tactile, flux de cours simulé). Processeur **ralenti 4 fois**, comme un téléphone de milieu de gamme. Pour chaque interaction :
  - les animations réellement lancées (type, élément, durée, courbe, propriétés) ;
  - l'intervalle entre images, mesuré avec `requestAnimationFrame` ;
  - le travail de style et de mise en page (CDP `Performance`) ;
  - une capture image par image de ce que dessine le compositeur.
- Mesures d'appoint :
  - position du panneau image par image à la fermeture d'une feuille ;
  - coût au repos de chaque écran ;
  - échelle d'appui sur onze familles de contrôles ;
  - chorégraphie d'apparition ;
  - mode « réduire les animations ».

## Ce qui existe déjà et qui est bon

- **Ressorts physiques réels** (oscillateur amorti, échantillonné en courbe CSS `linear()`) : `--ios-smooth`, `--ios-snappy` et `--ios-bouncy`.
- **Gestes** :
  - balayage du bord gauche pour revenir, piloté au doigt ;
  - glisser vers le bas pour fermer une feuille ;
  - tirer pour actualiser, avec l'arche qui se remplit.
- **Grand titre** qui se replie dans une barre compacte ; **haptique** iOS 17.4+ (astuce du `switch`) et vibration sur Android.
- Les **chiffres en direct** roulent vers leur nouvelle valeur ; la **pastille du contrôle segmenté** glisse d'une option à l'autre.
- **« Réduire les animations » parfaitement respecté** : 0 animation en cours sur tous les écrans, un écran poussé devient un fondu de 120 ms.
- Mode **`w-lite`** pour les téléphones faibles (moins de 4 cœurs ou moins de 2 Go).

## Constats, par priorité

### P0 — ce qui casse la continuité ou coûte en permanence

1. **Les feuilles et les modales se ferment sans animation.**
   - Mesure image par image : le panneau d'une feuille passe de 663 px à 844 px (hors écran) **en 3 ms**, et une modale passe d'une opacité de 1 à 0 **en une image**.
   - Cause : l'ouverture est une animation CSS (`wSheetIn` / `wModalIn`, `omw.css`). À la fermeture, l'animation est retirée et Chrome n'enchaîne aucune transition ; seul le voile s'efface.
   - Le **glisser pour fermer** remet en plus le panneau à 0 avant de fermer (saut visible).
2. **Au repos, le fil principal recalcule les styles 60 fois par seconde sur tous les écrans** (de 3 à 19 ms de travail par seconde).
   - Les points « en direct » pulsent en animant `box-shadow` (`omxPulse`, `trPulse`) : ce n'est pas composité, donc style et repeinte à chaque image.
   - **6 animations infinies continuent sur les écrans cachés** (« inf 6, infVis 0 » sur Réglages, Profil, Dépôt…).
   - Conséquence : batterie et fluidité, même quand rien ne bouge.
3. **La première image d'un changement d'écran prend de 166 à 366 ms** (processeur ×4). Elle cumule :
   - le rendu du nouvel écran ;
   - une cascade d'apparition qui **force 14 calculs de mise en page** (`void offsetWidth` dans une boucle, `omw.js`) ;
   - **15 animations lancées en même temps**.

   Pour l'onglet Accueil → Marchés : 68 recalculs de style (388 ms) et 20 mises en page (108 ms) pendant la transition.
4. **Deux mouvements différents pour « revenir ».**
   - Le geste du bord fait glisser les écrans **horizontalement**.
   - L'animation du bouton retour est un **zoom en profondeur (0,92) avec flou de 8 px**.
   - À la fin du geste, la courbe est fixe (cubique) et ne reprend pas la vitesse du doigt.
5. **Deux systèmes animent le même écran au retour** : l'ancienne animation CSS `from-back` (320 ms) et l'animation JS de `ios-motion.js` (420 ms), en même temps.

### P1 — incohérences visibles

6. **Sept familles de réglages de mouvement**, une par refonte :
   - `--t-*` (base), `--om-*` (verre), `--w-*` (omw), `--px-*` (premium), `--ds-*` (yor-ds), `--mo-*` (motion), `--ios-*`.
   - Feuilles : **68 durées distinctes** (de 80 ms à 46 s) et **52 courbes**.
   - À l'écran : **23 couples durée / courbe différents** sur les éléments visibles, dont des courbes à fort dépassement : `cubic-bezier(.3,1.6,.5,1)` ×56, `(.34,1.5,.64,1)` ×23, `(.2,.9,.25,1.15)` ×112.
7. **L'appui n'a pas de langage commun** (appui maintenu 180 ms, onze familles) :

   | Contrôle | Échelle | Courbe |
   |---|---|---|
   | Touche du pavé | 0,893 | 250 ms, rebond `(.34,1.5,.64,1)` |
   | Bouton retour | 0,90 | 80 ms `ease` |
   | Onglet / bouton central | 0,939 | 250 ms `ease` |
   | Segment | 0,94 | 250 ms `ease` |
   | Ligne de marché | 0,959 | 250 ms |
   | Action de l'accueil | 0,960 | 340 ms, rebond |
   | Bouton principal | 0,97 + luminosité 0,88 | 80 ms |
   | **Carte « Plus fortes variations »** | **aucune réaction** | — |
   | **Bouton « inverser » du Swap** | **aucune réaction** | — |
   | **Ligne de réglage** | **aucune réaction** | — |

8. **Apparition d'un écran trop longue et incohérente.**
   - 15 animations : les sections arrivent en cascade (pas de 55 ms, 620 ms chacune), mais les lignes de liste arrivent **toutes en même temps, avec rebond**.
   - L'écran met environ **840 ms** à se stabiliser : trop long pour une navigation répétée entre onglets.
9. **Transitions de page « profondeur »** : zoom à 0,92 et flou de 8 px sur des écrans entiers. C'est coûteux sur téléphone, et ce sont exactement le « zoom bon marché » et le « flou excessif » à éviter.
10. **Effets datés** :
    - cloche qui sonne en rotation de ±16° ;
    - badge qui gonfle de 0,3 à 1,35 ;
    - bouton central qui **pivote de 180°** à l'appui ;
    - messages (toasts) avec rebond ;
    - chiffres qui « brillent » en `text-shadow`.
11. **La lumière du toucher (`w-light`) modifie l'élément touché** : `overflow:hidden` reste posé définitivement. Ombres, badges et anneaux de focus peuvent être coupés après le premier toucher.

### P2 — performance et entretien

12. **Ce qui repeint à chaque image** :
    - les chargements animés en `background-position` (graphique, squelettes) ;
    - la pastille du segment, animée en `width` (calcul de mise en page) ;
    - à l'ouverture d'une feuille, les **4 rayons d'angle de `#app`**, ce qui repeint toute l'application.
13. Il y a **14 `transition: all`**, **13 transitions sur des propriétés de mise en page** et **27 `@keyframes`** sur des propriétés coûteuses (`filter`, `clip-path`, `box-shadow`, `top`, `letter-spacing`).
14. **`motion.css` est chargé deux fois.**
    - Feuille finale : 411 Ko, 1 409 `!important`, 47 `:has()`, 441 `html:root:root:root`.
    - Chaque recalcul de style coûte environ 5 ms : le mouvement doit donc éviter de toucher au style à chaque image (compositeur seulement : `transform` / `opacity`).
15. **Barre du bas sans indicateur** : seule la couleur change (250 ms `ease`, non composité).

### Composants statiques qui devraient réagir

- Indicateur de navigation.
- Carte du solde : pas de lumière, pas de profondeur au défilement.
- Cartes de marché, bouton « inverser », lignes de réglage.
- Chiffre du solde : il compte, mais ne roule pas chiffre par chiffre.
- Chargements : remplacement brutal du squelette par le contenu.

## Application Android (inventaire)

- 30 `tween` (une vingtaine de durées, de 140 à 5 000 ms), 5 `spring`, 11 animations infinies, 10 `Animatable`, 26 `graphicsLayer`.
- On y retrouve la même dispersion que sur le web.
- Recommandation : un fichier unique de jetons (`MotionTokens.kt`) avec les mêmes ressorts et durées que le web.

## Cible : un seul système (phase 2)

- **Jetons uniques**, définis une fois :
  - **4 ressorts** sans rebond fort : *doux* pour les pages et les feuilles, *vif* pour les contrôles, *souple* (dépassement inférieur à 2 %) pour les interrupteurs et les confirmations, *appui* très court pour l'enfoncement ;
  - 4 durées : 120, 200, 320 et 480 ms ;
  - 2 courbes de secours.
  - Toutes les anciennes familles deviennent des **alias** de ces jetons.
- **Compositeur seulement** (`transform` / `opacity`) pour tout ce qui bouge en continu ; plus de flou animé sur les écrans.
- **Continuité** :
  - pousser et revenir sont le même mouvement horizontal (avec parallaxe et voile) que le geste ;
  - la fin d'un geste reprend la vitesse du doigt ;
  - feuilles et modales sortent comme elles sont entrées.
- **Un seul langage d'appui** : enfoncement rapide, retour sur ressort, échelle selon la taille (bouton 0,97, carte 0,985, icône ronde 0,92, ligne : surbrillance iOS sans échelle).
- **Apparition** : une seule animation par bloc (compositeur), au plus 8 blocs, pas de 28 ms, 420 ms, sans calcul de mise en page forcé.
- **Navigation** : pastille « liquide » qui glisse et s'étire entre les onglets.
- **Chiffres** : le solde roule chiffre par chiffre (sur ressort), les autres valeurs glissent.
- **Lumière et profondeur** :
  - un reflet unique qui traverse la carte du solde à l'arrivée ;
  - une parallaxe douce de l'en-tête au défilement ;
  - une lumière au point de contact.
- **Chargements** : squelettes au reflet composité, et contenu qui prend leur place en fondu.
- **Repos** : zéro recalcul de style par seconde quand rien ne bouge ; animations des écrans cachés en pause.

---

## Après — phases 2 à 7 (16.0.0, 26/11/2026)

Mêmes conditions que la mesure d'avant : application réelle par le banc de test, français, sombre, 390 × 844, tactile, flux en direct simulé, processeur ralenti 4×. Outils dans le dépôt : `tests/ux/motion-audit.mjs` (ces chiffres), `tests/ux/motion-film.mjs` (images figées à 0, 60, 140, 240, 360, 520 ms), `tests/ux/motion-system.test.mjs` (15 vérifications image par image).

### Au repos

| | Avant (15.3.0) | Après (16.0.0) |
|---|---|---|
| Animations infinies en cours, par écran | 1 à 6 (celles des écrans cachés continuaient) | 0 ou 1 (le seul point « en direct » visible) |
| Éléments visibles dont la courbe dépasse sa cible | 192 (3 courbes, qui dépassaient de 4 à 11 %) | 0 (le ressort « léger » dépasse de 1,5 % au plus) |
| Couples durée + courbe distincts | 23 | 20 (le reste : fondus de couleur des anciennes feuilles, rien ne bouge) |
| Flous d'arrière-plan visibles | 0 | 0 |

### Interactions (processeur ralenti 4× ; 16,7 ms = une image à 60 Hz)

| Interaction | Image la plus longue | Calcul du style | Mises en page | Script |
|---|---|---|---|---|
| Onglet, 1re visite : Accueil → Marchés | 367 → 367 / 517 ms ¹ | 388 → 309 / 440 ms ¹ | 20 → 8 / 7 | 100 → 55 / 71 ms |
| Onglet : Marchés → Portefeuille | 167 → 150 ms | 264 → 166 ms | 18 → 3 | 88 → 61 ms |
| Onglet : Portefeuille → Accueil | 183 → 100 ms | 287 → 149 ms | 12 → 5 | 79 → 48 ms |
| Pousser : Marchés → actif | 183 → 67 ms | 352 → 154 ms | 15 → 7 | 120 → 47 ms |
| Revenir : actif → Marchés | 183 → 83 ms | 264 → 133 ms | 19 → 8 | 109 → 50 ms |
| Contrôle segmenté | 33 → 17 ms | 109 → 36 ms | 18 → 17 | 63 → 21 ms |
| Feuille : ouverture | 33 → 17 ms | 79 → 39 ms | 1 → 2 | 62 → 27 ms |
| Feuille : fermeture | aucune animation → glisse, 17 ms | 59 → 29 ms | 1 → 2 | 55 → 30 ms |
| Fenêtre : ouverture | 50 → 17 ms | 69 → 28 ms | 1 → 2 | 56 → 21 ms |
| Fenêtre : fermeture | 17 → 17 ms | 34 → 14 ms | 1 → 2 | 35 → 13 ms |
| Solde qui change | 17 → 17 ms | 54 → 28 ms | 0 → 0 | 58 → 28 ms |
| Interrupteur | 33 → 17 ms | 76 → 22 ms | 4 → 1 | 72 → 27 ms |
| Appui sur le bouton principal | 17 → 17 / 83 ms ¹ | 118 → 78 / 85 ms | 3 → 4 | 65 → 41 ms |

¹ Deux mesures après, qui varient entre elles. La première visite d'un onglet est dominée par la construction de l'écran (code de l'écran, styles d'une centaine d'éléments), pas par le mouvement : **pas de gain à revendiquer sur cette ligne**. L'appui sur « Aperçu » avec un montant vide affiche un message d'erreur, dont le dessin varie.

### Vérifié image par image

- Pousser / revenir : glissement horizontal pur ; l'écran du dessous recule de 30 % sous le voile ; ni flou, ni zoom.
- Onglets : l'ancien a disparu à ≈ 0,1 s, le nouveau monte de 0,09 à 0,3 s ; aucune image où les deux dépassent 35 %.
- Feuille : 844 → 635 px, 89 % du chemin à 0,3 s, sans rebond, l'écran dessous recule ; fermeture en glissant.
- Fenêtre : opacité 0 → 1 en ≈ 0,17 s, taille 96 % → 100 %.
- Pastille : s'étire jusqu'à ×1,6 – ×2,2 selon la distance, se pose à ×1 ; pendant un « pousser », elle apparaît sur place.
- Solde : seuls les chiffres qui changent roulent, de droite à gauche.
- Ordinateur (1 280 px) : la feuille est une fenêtre centrée aux coins arrondis, rien ne recule derrière.
- « Réduire les animations » : fondus seulement, rien ne se déplace.

### Bugs trouvés pendant le contrôle, corrigés

1. Après le déverrouillage, aucun onglet n'était surligné : la barre était reconstruite juste après que le routeur avait marqué l'onglet.
2. L'ancien onglet ne s'effaçait jamais (`opacity:1!important` dans `css/ui.css` : une déclaration importante l'emporte sur toute animation) — on voyait deux pages en même temps.
3. Swap et Spot glissaient comme des pages : ils manquaient à la liste des onglets.
4. Chaque redessin d'écran (dépôt confirmé, interrupteur, choix d'une crypto, devis expiré) rejouait toute l'entrée.
5. Les lignes apparues au défilement gardaient un délai de transition : leur surlignage à l'appui arrivait en retard.
6. Après la première touche, les boutons gardaient `overflow:hidden` (ombres, pastilles et contour de focus coupés).
7. Onglet appuyé : l'icône rétrécissait une seconde fois dans l'onglet (0,94 × 0,86).
8. Sur ordinateur, toute l'application, barre latérale comprise, rétrécissait derrière une feuille.
9. Pendant la mise au point (jamais publié) : une fois l'ancienne entrée retirée, la feuille apparaissait sans glisser, le navigateur n'ayant pas d'état de départ — `R.overlay.open` lit maintenant l'état fermé ; et l'écran d'un actif, qui se redessine 9 ms après son arrivée, effaçait la cause « pousser » lue par la pastille.

### Écarts assumés

- **Reflet sur la carte du solde : pas fait.** Le haut de l'accueil n'est pas une carte (fond sur toute la largeur, sans bord) : une bande de lumière qui le traverse se lirait comme un effet générique. La lumière vient du doigt (point de contact), de la pastille en verre et de la profondeur au défilement.
- **Première visite d'un onglet** : une image longue reste au ralenti 4× — c'est la construction de l'écran ; à traiter côté écrans si besoin (listes dessinées en deux temps).
- **Fondus de couleur des anciennes feuilles** (200 ms et 250 ms `ease`) : laissés, ils ne déplacent rien.
- **Contrôle segmenté** : sa pastille anime encore sa largeur (fil principal, petite surface).
- **Aucun essai sur de vrais téléphones.**
- **Android** : non touché (voir l'inventaire plus haut et la proposition `MotionTokens.kt`).
