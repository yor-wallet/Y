---
name: om-brand
description: Identité visuelle d'OM Wallet — logo jaune et noir fourni par le propriétaire, palette Noir & Jaune, typographie Sora / Tajawal, règles d'usage du logo page par page (connexion, en-têtes, écran de démarrage, e-mails, images de partage, icône Android adaptative), régénération de tous les fichiers du logo (`brand/make_assets.py`), planche Figma de l'identité, images publicitaires. À utiliser dès qu'une tâche touche le logo, l'icône, le favicon, les couleurs, la charte, une image (promo, partage, OG, store), une maquette Figma / Canva / Moda, ou la cohérence visuelle d'une page — même si la demande ne cite pas « marque » ou « identité ». Interdit d'inventer ou de redessiner un logo.
---

# OM Wallet — identité visuelle

Le propriétaire a fourni **son** logo le 25/11/2026 (`brand/originals/logo-om-noir-jaune.png`) : carré arrondi noir, liseré jaune, monogramme jaune « OM » en forme de portefeuille. Il remplace entièrement l'ancien logo de verre bleu (originaux archivés dans `brand/archive-bleu/`, à ne plus utiliser).

## 1. Règles non négociables

- **Ne jamais redessiner, recolorer, déformer ni « améliorer » le logo.** Les fichiers dérivés sont produits par découpe, mise à l'échelle et assemblage avec un mot-symbole typographique (Sora Bold, la police de l'application). Si une version manque (monochrome, étroite, etc.), elle se tire du maître avec `brand/make_assets.py`, pas à la main.
- **Plus aucun bleu de marque** : ni dans les icônes, ni dans les fonds d'écran de démarrage, ni dans le manifeste, ni dans les e-mails, ni dans les images de partage. Fonds de marque = noir chaud `#0B0A07` (sombre) ou crème `#FFFBF0` (clair).
- **Le carré arrondi du logo est déjà dans l'image** (coins transparents). Ne pas le recouper avec un `clip(RoundedCornerShape…)`, un `border-radius` ou un `ContentScale.Crop` : le liseré jaune serait mangé.
- **Pas de texte ni de bouton imprimé dans une image** présenté comme réel (voir `om-wallet` §1). Les textes sont de vrais éléments traduits fr / en / ar.
- Pas de logo, mascotte, tracé ou écran copié d'une autre marque. S'inspirer (Liv X, Binance) = rythme, hiérarchie, densité, jamais les éléments eux-mêmes.
- **Regarder en ligne avant de changer une direction visuelle** (consigne du propriétaire) ; citer ce qui a été vu.

## 2. Palette (Noir & Jaune 14.8.0)

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

Un seul jaune : bouton principal, segment actif, onglet actif, bouton Swap central, icônes d'action. Jamais de texte clair sur jaune. Contraste du texte courant ≥ 4,5 : 1 (à vérifier, pas à supposer).

Typographie : **Sora** (latin) et **Tajawal** (arabe), auto-hébergées. Soldes : chiffres en Sora ExtraBold, décimales en Regular et gris secondaire.

## 3. Où va quoi (chaque page a sa forme)

| Contexte | Forme du logo | Fichier / remarque |
|---|---|---|
| Connexion, inscription, présentation | Icône seule, grande (≥ 96 px), centrée sur le noir, mot-symbole « OM Wallet » dessous ; lueur jaune ≤ 35 % d'opacité autorisée ; pas de carte derrière l'icône | `assets/brand/app-icon-glass-hd.png` (nom conservé, pages liées), Android `app_icon_glass.png` |
| En-têtes d'accueil et d'écrans | Petit monogramme 28–38 px, sans mot-symbole | `assets/brand/logo-mark-128.png`, Android `om_glass_icon.png` |
| À propos, paramètres, impression | Lockup horizontal (icône + mot) | `assets/brand/om-logo-horizontal*.png`, Android `om_logo_lockup.png` |
| Écran de démarrage | Icône à 30 % du petit côté, centrée, fond noir (sombre) ou crème (clair) | `assets/splash/ios-*.jpg`, Android `ic_splash.png` + `themes.xml` |
| Icône d'application | Carré noir + icône ; adaptative Android : calque 0,62 dans la zone sûre de 66 dp, fond noir | `assets/icons/`, `public/branding/`, `ic_launcher_*` |
| Icône thématique Android 13 | Silhouette du monogramme | `ic_launcher_monochrome.png` |
| Notification (barre d'état) | Silhouette blanche du monogramme | `public/branding/om-wallet-notification.png` |
| E-mails | Lockup vertical sur bandeau noir ou crème, PNG @2x, `alt="OM Wallet"` ; aucun texte dans l'image | `supabase/functions/send-email/index.ts` (encore bleu : à reprendre, déploiement à valider) |
| Partage / aperçu de lien (OG), fiche de store | Icône + mot-symbole + une courte ligne, fond noir | `assets/share/og-{en,fr,ar}.png`, `brand/play-store-icon-512.png` |
| Mode clair | L'icône garde sa tuile noire ; le mot-symbole passe en encre foncée `#14110A` | lockups `*_light` produits par le générateur |

Images publicitaires et d'ouverture : duotones noir / jaune (`assets/promo/*-nj.jpg`, Android `promo_*_nj.jpg`). Pas de visage identifiable sans droit, pas de fausse capture d'écran, pas de chiffres de rendement.

## 4. Régénérer les fichiers du logo

```bash
python3 -I brand/make_assets.py     # depuis la racine ; dépend de Pillow + numpy ; idempotent
```

Tout dérive de `brand/originals/logo-om-noir-jaune.png`. Le script **écrase** les icônes web (`assets/icons/**`, `public/branding/**`, `assets/brand/**`, `favicon.ico`), les images de démarrage iOS (`assets/splash/ios-*.jpg`), les calques Android (`drawable-nodpi`, `core-design`) et `ic_launcher_background.xml`, et **supprime** les restes bleus : `brand/om-logo-navy.png`, `assets/brand/om-pay-logo*.png`, `core-design/…/om_wallet_glass.webp`. Les SVG « enveloppes » embarquent le PNG : ne pas les retoucher à la main.

Après régénération : `node tools/build.mjs`, tests web (`tests/ux`), `gradle testDebugUnitTest` (captures dans `android/app/build/screenshots/`), puis regarder les captures — coins du logo propres, liseré intact, aucun bleu restant.

Reliquats de bleu à chercher hors des couches CSS anciennes (`verre.css`, `clair.css`, `omw.css` gardent leurs vieux jetons bleus mais sont recouverts par `noirjaune.css` : seul le rendu fait foi) :

```bash
grep -rilE '1A84F5|0D66E8|55B9FF|86D6FF|BFE3FF|F4FAFF|F7FBFF|F3F8FE' manifest.webmanifest index.src.html js/ android/app/src/main/res android/core-design/src/main supabase/functions tools/
```

Connus au 25/11 : `manifest.webmanifest` (`background_color` et `theme_color` `#F4FAFF`), `android/app/src/main/res/values/themes.xml` (`om_surface` `#FFF7FBFF` : fond de fenêtre et d'écran de démarrage blancs), e-mails de `send-email`, `tools/brand/build-brand.mjs` (ancien générateur bleu).

## 5. Figma / Canva / Moda

- **Figma** (connecté) : fichier `6mcJFm9JBWqzQsJDWVePPD`, page « Identité 14.8 », cadre `3:2` « OM Wallet — Identité Noir & Jaune » : sections 01 Icône, 02 Logotypes, 03 Symbole seul, 04 Couleurs, 05 Typographie, 06 Composants (`6:2`), 07 Accueil (`6:66`). Tout est en calques modifiables (auto-layout), les images sont des remplissages (`imageHash`).
  - Procédure : `create_session` → charger la skill `figma-use` (obligatoire) → `use_figma` avec `skillNames: "resource:figma-use,resource:figma-generate-design"`. Polices : « Sora » styles `Regular`, `SemiBold`, `Bold`, `ExtraBold` (sans espace). Images : `upload_assets` puis `imageHash` ; ne jamais envoyer une capture d'écran complète comme maquette.
  - `generate_image` / `generate_vector_illustration` consomment des crédits Figma AI : le dire au propriétaire avant.
- **Canva** et **Moda** : pas installés. Le propriétaire doit les connecter dans les connecteurs de claude.ai ; ensuite seulement les utiliser (Moda : visuels de réseaux sociaux, publicités, animations). Ne pas prétendre les avoir utilisés avant.

## 6. Contrôle avant de rendre un travail visuel

1. Capture sur le vrai fond (sombre et clair) ; logo net, non rogné, non étiré.
2. Aucun reliquat bleu ; aucun texte de la couleur du fond ; QR toujours foncé sur blanc.
3. Arabe : texte RTL, miroir des icônes directionnelles, Tajawal chargée.
4. Dire ce qui est vérifié et ce qui ne l'est pas (voir `om-wallet` §6).
