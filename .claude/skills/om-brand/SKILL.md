---
name: om-brand
description: Identité visuelle d'OM Wallet en deux couches — l'icône de l'application (logo fourni par le propriétaire, utilisé uniquement pour l'icône du lanceur Android, le favicon, la PWA, apple-touch et la boutique) et l'identité originale « Arche » pour tout le reste (marque dans l'application, logotype, illustration de connexion et de présentation, écrans de démarrage, images de partage). Palette Noir & Jaune, polices Sora et Tajawal, générateurs brand/make_assets.py et brand/make_brand.py, planche Figma. À utiliser dès qu'une tâche touche le logo, l'icône, le favicon, les couleurs, la charte, une image (promo, partage, OG, démarrage, boutique), une maquette Figma, Canva ou Moda, ou la cohérence visuelle d'une page — même si la demande ne cite pas « marque » ou « identité ». Interdit de redessiner le logo du propriétaire ou de l'utiliser ailleurs que sur l'icône.
---

# OM Wallet — identité visuelle

Règle du propriétaire (25/11/2026) : « le logo est uniquement pour l'icône, le reste, crée un inédit ». Donc deux couches, qui ne se mélangent pas :

| Couche | Quoi | D'où ça vient |
|---|---|---|
| **Icône** (logo du propriétaire) | Icône du lanceur Android (couche adaptative, icône thématique), favicon, icônes PWA (192 / 512 / maskable / 1024), apple-touch, icône de boutique | `brand/originals/logo-om-noir-jaune.png` → `python3 -I brand/make_assets.py` |
| **« Arche »** (création originale) | Marque dans l'application, logotype « OM Wallet », illustration de connexion / inscription / 3e écran de présentation, images de démarrage iOS, images de partage fr / en / ar, drawables Android | `brand/om_art.py` (géométrie en code) → `python3 -I brand/make_brand.py` |

L'ancien logo de verre bleu est retiré partout (originaux archivés dans `brand/archive-bleu/`, à ne plus utiliser).

## 1. Règles non négociables

- **Ne jamais redessiner, recolorer, déformer ni « améliorer » le logo du propriétaire**, et **ne jamais l'afficher ailleurs que comme icône** (pas dans les en-têtes, pas sur la page de connexion, pas dans les e-mails, pas dans les images de partage). Les fichiers d'icône se tirent du maître avec `make_assets.py`, jamais à la main.
- **« Arche » reste inédite** : une arche (la porte vers l'argent) et une pièce posée dedans. Ne la remplacer ni par le logo du propriétaire, ni par un symbole d'une autre marque ; pas de croissant, d'étoile ni de symbole national ou religieux. Toute évolution passe par `brand/om_art.py` (source de vérité), puis régénération.
- **Plus aucun bleu de marque** : ni dans les icônes, ni dans les fonds de démarrage, ni dans le manifeste, ni dans les e-mails, ni dans les images de partage. Fonds = noir chaud `#0B0A07` (sombre) ou crème `#FFFBF0` (clair).
- **L'icône porte son propre arrondi** (coins transparents côté web) : ne pas la recouper (`border-radius`, `clip(RoundedCornerShape…)`, `ContentScale.Crop`). Inversement, la marque Arche est un glyphe libre : pas de tuile, pas d'arrondi autour.
- Pas de texte ni de bouton imprimé dans une image présenté comme réel (voir `om-wallet` §1). Les images de partage portent seulement le nom et une courte ligne de slogan, en fr / en / ar.
- **Regarder en ligne avant de changer une direction visuelle** (consigne du propriétaire) et citer ce qui a été vu. S'inspirer (Liv X, Binance) = rythme, hiérarchie, densité, jamais les éléments eux-mêmes.

## 2. Palette (Noir & Jaune)

Source de vérité : les jetons `--lt-*` en tête de `css/noirjaune.css` (web) et `OmColors` dans `android/core-design/…/Theme.kt` (mêmes noms). Ne pas recopier d'autres valeurs.

| Rôle | Sombre (défaut) | Clair (crème) |
|---|---|---|
| Fond | `#0B0A07` | `#FFFBF0` |
| Carte | `#1B1A16` | `#FFFFFF` |
| Piste / segment, carte 2 | `#25231E` | `#F8F0D6` |
| Liseré | `#2F2D26` | `#EEE3C0` |
| Jaune (un seul) | `#FFC800`, dégradé `#FFD84A → #F5B800` | idem |
| Fond doux jaune | `#2B2410` | `#FFEFB8` |
| Texte sur jaune | `#14110A` | `#14110A` |
| Texte | `#F5F3EE` | `#14110A` |
| Texte secondaire / tertiaire | `#A7A397` / `#77746B` | `#5C5748` / `#8C8672` |
| Lien / accent texte | `#FFC800` | `#8A6500` (le jaune pur est illisible sur crème) |
| Gain / perte | `#0ECB81` / `#F6465D` | `#0A9F63` / `#D9344A` |
| Pastilles gain / perte | `#0E2E23` / `#35151B` | `#DDF5EA` / `#FCE3E7` |

Les dégradés de la marque Arche (arche `#FFE98A → #FFC800 → #E39B00`, pièce `#FFF3B8 → #FFD23A → #E39B00`) sont dans `om_art.py` (`YEL_HI`, `YEL`, `YEL_LO`). Un seul jaune : bouton principal, segment actif, onglet actif, bouton Swap, icônes d'action. Jamais de texte clair sur jaune. Contraste du texte courant ≥ 4,5 : 1 (à vérifier, pas à supposer).

Typographie : **Sora** (latin, chiffres) et **Tajawal** (arabe), auto-hébergées (`assets/fonts/`). Mot-symbole : « OM » Sora ExtraBold + « Wallet » Sora SemiBold. Soldes : chiffres en ExtraBold, décimales en Regular et gris secondaire.

## 3. Où va quoi

| Contexte | Ce qu'on met | Fichier / code |
|---|---|---|
| Icône du lanceur, favicon, PWA, boutique | Logo du propriétaire | `assets/icons/`, `public/branding/`, `favicon.ico`, Android `ic_launcher_*`, `brand/play-store-icon-512.png`, `brand/om-icon.png` |
| Connexion, inscription | Héros Arche (arches + pièce) puis mot-symbole « OM Wallet » | web `.w-auth-icon` (`css/omw.css`, variante crème dans `css/noirjaune.css`) ; Android `BrandHero` (`app/…/BrandHero.kt`) |
| 3e écran de présentation | Héros Arche, toujours sur noir | web `.wp-third .wp-icon` ; Android `OnboardingScreen` |
| En-têtes d'écrans | Marque Arche seule, 34–38 px, noire sur crème / jaune sur noir | web `.lt-mark`, `.logo-mark` (`logoMark()` dans `js/ui/icons.js`) ; Android `LogoMark` (`om_mark.png`) |
| Compte, À propos, cartes virtuelles | Logotype horizontal ou mot-symbole blanc | `assets/brand/om-logo-horizontal*.png`, `om-wordmark-white.png` ; Android `om_logo_lockup.png`, `om_logo_horizontal_white.png` |
| Écran de démarrage | Marque Arche à 30 % du petit côté sur noir (sombre) ou crème (clair), légère lueur jaune | `assets/splash/ios-*.jpg` ; Android `ic_splash.png` (dans le cercle central des 2/3) + `themes.xml` |
| Partage / aperçu de lien | Marque + mot-symbole + slogan, héros d'un côté (miroir en arabe) | `assets/share/og-{en,fr,ar}.png` |
| E-mails | Encore l'ancien habillage : à reprendre avec la marque Arche, déploiement de `send-email` à valider avec le propriétaire (les e-mails partent à de vrais clients) | `supabase/functions/send-email/index.ts` |

Images publicitaires et d'ouverture : duotones noir / jaune (`assets/promo/*-nj.jpg`, Android `promo_*_nj.jpg`). Pas de visage identifiable sans droit, pas de fausse capture d'écran, pas de chiffres de rendement.

## 4. Régénérer

```bash
python3 -I brand/make_assets.py              # icône seulement (logo du propriétaire) ; Pillow + numpy
python3 -I brand/make_brand.py               # tout le reste (Arche) ; Pillow + node + playwright (NODE_PATH réglé par le script)
python3 -I brand/make_brand.py --out /tmp/x  # même arborescence ailleurs : essai à blanc, le dépôt n'est pas touché
```

`make_brand.py` appelle `brand/render.cjs` (Chromium installé avec Playwright) pour dessiner dégradés, flou et polices ; il lit les tailles des images de démarrage dans `assets/splash/ios-LxH-*.jpg` existantes. Il écrase les fichiers qu'il produit et ne supprime rien. Après régénération : `node tools/build.mjs`, tests web (`tests/ux`), `gradle testDebugUnitTest` (captures dans `android/app/build/screenshots/`), puis **regarder** les captures : héros net, marque non rognée, aucun bleu, texte arabe lisible.

Reliquats de bleu à chercher hors des anciennes couches CSS (`verre.css`, `clair.css`, `omw.css` gardent leurs vieux jetons mais sont recouvertes par `noirjaune.css` : seul le rendu fait foi) :

```bash
grep -rilE '1A84F5|0D66E8|55B9FF|86D6FF|BFE3FF|F4FAFF|F7FBFF|F3F8FE' manifest.webmanifest index.src.html js/ android/app/src/main/res android/core-design/src/main supabase/functions
```

Connu au 25/11 : les e-mails de `send-email` (voir §3).

## 5. Figma / Canva / Moda

- **Figma** (connecté) : fichier `6mcJFm9JBWqzQsJDWVePPD`, page « Identité 14.8 », cadre `3:2` « OM Wallet — Identité Noir & Jaune » : 01 Icône (logo du propriétaire), 02 Marque « Arche » (`10:2`), 03 Logotypes (`10:75`), 04 Illustration héros (`9:122`), 05 Couleurs, 06 Typographie, 07 Composants (`6:2`), 08 Accueil (`6:66`). Calques modifiables (auto-layout) ; marques en vecteurs ; héros en image.
  - Procédure : `create_session` → skill `figma-use` (obligatoire) → `use_figma` avec `skillNames: "resource:figma-use,resource:figma-generate-design"`. Polices : « Sora » styles `Regular`, `SemiBold`, `Bold`, `ExtraBold` (sans espace). Images : `upload_assets` puis `imageHash`.
  - **Dessins SVG avec traits** (la marque) : les mettre à l'échelle avec `node.rescale(taille / 512)`, **pas** `resize()` (qui garde l'épaisseur des traits et déforme le dessin). `counterAxisAlignItems` n'accepte que `MIN`, `MAX`, `CENTER`, `BASELINE`.
  - `generate_image` et `generate_vector_illustration` consomment des crédits Figma AI : le dire au propriétaire avant.
- **Canva** et **Moda** : pas connectés. Le propriétaire doit les ajouter dans les connecteurs de claude.ai ; ensuite seulement les utiliser (Moda : visuels de réseaux sociaux, publicités, animations ; Canva : affiches, stories). Ne pas prétendre les avoir utilisés avant.

## 6. Contrôle avant de rendre un travail visuel

1. Capture sur le vrai fond (sombre et clair) ; marque nette, non rognée, non étirée.
2. Aucun reliquat bleu ; aucun texte de la couleur du fond ; QR toujours foncé sur blanc.
3. Arabe : texte RTL, miroir des icônes directionnelles, Tajawal chargée.
4. Dire ce qui est vérifié et ce qui ne l'est pas (voir `om-wallet` §6).
