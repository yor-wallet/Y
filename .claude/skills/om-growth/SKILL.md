---
name: om-growth
description: Croissance et rétention d'OM Wallet — faire revenir les utilisateurs par la valeur (e-mails et notifications, publicités, offres, contenu pour les réseaux sociaux, parrainage, mesure d'audience, « connaître les utilisateurs », « les rendre accros / dépendants »). À utiliser dès qu'une demande parle d'engagement, de rétention, de relance, de campagne, de promotion, d'analytique, d'écoute des réseaux sociaux ou de personnalisation du marketing — même si le mot « growth » n'apparaît pas. Fixe ce qui est permis (consentement, plafonds, mesure agrégée, brouillons validés par le propriétaire) et ce qui est refusé (profilage de personnes sur les réseaux sociaux, mécaniques d'addiction, fausse urgence, envoi sans consentement, incitation à trader).
---

# OM Wallet — croissance et rétention

Le propriétaire veut que les utilisateurs aiment l'application et reviennent. On l'obtient en rendant l'application **utile, fiable et agréable**, pas en fabriquant une dépendance. OM Wallet manie de l'argent : pousser quelqu'un à revenir compulsivement, à trader plus ou à prendre plus de risque fait un dommage réel, expose le propriétaire (réglementation, réputation, plaintes) et ruine la confiance dont vit un portefeuille.

Cette skill dit quoi proposer, quoi refuser, et comment répondre quand la demande franchit la ligne. Les brouillons sont la règle ; **rien n'est envoyé ni publié sans validation du propriétaire** tant qu'il n'a pas, lui-même, autorisé une catégorie précise (voir `om-autopilot`).

## 1. Ce qui est refusé (et pourquoi), même sur demande répétée

| Demande | Pourquoi on ne le fait pas | Ce qu'on propose à la place |
|---|---|---|
| Apprendre « sur chaque utilisateur » à partir de ses réseaux sociaux (retrouver son profil, lire ses publications, ses abonnements, déduire ses goûts, son humeur, sa situation financière) | Profilage de personnes sans leur accord : atteinte à la vie privée, contraire aux conditions des plateformes, RGPD / lois locales de protection des données (UE, Oman, Émirats…), et inutile pour bien servir un portefeuille | Écoute **publique et agrégée** (thèmes, questions fréquentes, mots-clés, tendances) ; sondage dans l'application ; préférences que la personne choisit elle-même |
| « Rendre accro » : récompenses variables, séries quotidiennes, loteries, compte à rebours factices, notifications à fort impact émotionnel | Mécaniques d'addiction : sur un produit financier elles poussent à des pertes. Pratiques trompeuses (dark patterns) de plus en plus sanctionnées | Retours fondés sur l'utilité (voir §2) ; résumés opt-in ; alertes que la personne a **elle-même** réglées |
| Pousser à trader / déposer / emprunter / utiliser un levier ; « ne ratez pas… », « dernière chance », fausse rareté | Incitation à des décisions financières sous pression ; fausse urgence | Information neutre, avertissement de risque, rappel de sécurité |
| Envoyer des e-mails, SMS, push marketing à des gens qui n'ont pas dit oui | Interdit dans la plupart des pays (ePrivacy / RGPD, CAN-SPAM, règles locales) ; détruit la réputation d'expéditeur et bloque aussi les e-mails de transaction | Consentement séparé et explicite (§3) |
| Promettre ou suggérer des rendements, afficher de faux témoignages, des chiffres inventés, de fausses captures | Publicité mensongère ; risque légal élevé pour le crypto | Faits vérifiables seulement, conditions écrites, avertissement de risque |
| Cibler des mineurs ou des personnes en difficulté financière | Préjudice et responsabilité | Pas de ciblage par vulnérabilité ; âge minimum respecté |
| Croiser, acheter ou revendre des données personnelles ; confier des soldes ou des transactions à un outil publicitaire tiers | Fuite de données sensibles | Mesure agrégée, hébergée chez nous (Supabase) |

Si le propriétaire redemande l'une de ces choses : répondre **une fois**, clairement et sans sermon, en nommant ce qu'on fait à la place ; ne pas contourner par une autre voie (script, service tiers, « juste un test »).

## 2. Leviers permis — la valeur d'abord

- **Utilité** : alertes de prix **réglées par la personne**, suivi clair du solde (variation 24 h, part de chaque actif), reçus de transaction lisibles, export de l'historique, widgets, vitesse, hors-ligne propre.
- **Confiance** : statuts de transaction honnêtes, rappels de sécurité (activer la double vérification, ne jamais partager la phrase de récupération), notifications de connexion inhabituelle.
- **Onboarding** : premier dépôt guidé, explications courtes fr / en / ar, états vides utiles, aide intégrée.
- **Éducation** : contenus courts (frais, réseaux, adresses, sécurité, volatilité) — pédagogiques, jamais incitatifs.
- **Résumé hebdomadaire opt-in** : « Votre semaine » (variation, activité) — pas de relance « vous nous manquez » culpabilisante.
- **Parrainage** transparent : conditions écrites, avantage visible avant l'envoi, pas de gain conditionné à des dépôts risqués.
- **Programmes d'offres** : réduction de frais, avantage clair, durée et conditions affichées, sans compte à rebours factice.
- **Soin visuel** : l'identité Noir & Jaune (`om-brand`), animations sobres (respect de « réduire les animations »).

## 3. E-mails, notifications, publicités : règles de mise en œuvre

**Transactionnels** (dépôt, retrait, envoi, connexion, sécurité) : déjà gérés par `send-email` ; **ne pas les mêler au marketing**, ne pas y ajouter d'offres, ne pas les compter dans les plafonds.

**Marketing / lifecycle** (à construire seulement si le propriétaire valide) :
- Consentement **séparé** de l'inscription, case non cochée par défaut, horodaté et tracé (champ du profil à créer : `marketing_opt_in`, date, source) ; centre de préférences ; désinscription en **un clic** dans chaque message ; retrait immédiat.
- Plafond : **1 message marketing par semaine** et par personne par défaut ; heures calmes 21 h – 8 h (heure locale) ; jamais deux messages identiques ; arrêt automatique d'une campagne si les désinscriptions ou signalements dépassent un seuil fixé à l'avance (ex. 0,5 %).
- Langue de la personne (ar / en / fr) ; textes arabes relus pour le RTL ; aucune donnée sensible (solde, adresse) dans l'objet ni l'aperçu.
- Expéditeur identifiable, adresse de contact réelle, mention légale du pays d'établissement.

**Publicités** : l'audience se choisit par **contexte** (langue, pays, thème) et par listes que la personne a fournies elle-même ; pas de ciblage par profil personnel. Textes validés par le propriétaire ; il reste responsable de la conformité dans chaque pays visé (la promotion de produits crypto est encadrée ou restreinte selon les pays : à faire vérifier avant diffusion).

**Réseaux sociaux** : calendrier éditorial et brouillons de publications ; l'écoute (§4) sert à choisir les sujets, pas à identifier des personnes. Aucune interaction automatisée en se faisant passer pour un humain, aucun faux compte, aucun achat d'abonnés.

## 4. Données : ce qu'on lit, ce qu'on ne lit pas

- **Autorisé** : agrégats sans identité (inscriptions par jour / langue / pays, entonnoir inscription → premier dépôt, retours à J1 / J7 / J30, erreurs, temps de chargement), tests A/B sur textes et écrans avec **garde-fous**, retours volontaires (sondage, notes, support).
- **Social** : sources publiques et officielles, requêtes par **thème** (jamais par personne), résultats agrégés ; respecter les conditions de chaque plateforme.
- **Interdit pour le marketing** : lire les soldes, les adresses, l'historique ou les messages d'une personne précise ; relier un compte social à un compte OM Wallet ; revendre ou partager des données.
- Minimisation : ne collecter que ce qui sert une décision précise, avec une durée de conservation.

## 5. Mesure : un bon retour est un retour utile

- Étoile polaire : **personnes ayant fait une action utile ce mois-ci** (dépôt, envoi, consultation voulue) — pas le temps passé, pas le nombre d'ouvertures.
- Garde-fous suivis avec chaque expérience : désinscriptions, plaintes, désinstallations, tickets de support, incidents de sécurité. Une expérience qui améliore la rétention en dégradant un garde-fou est abandonnée.
- Toute hausse de transactions provoquée par un message est suspecte : relire le message.

## 6. Processus d'une campagne

1. **Brief** : objectif, audience opt-in, bénéfice réel pour la personne, mesure, seuils d'arrêt.
2. **Brouillons** fr / en / ar dans `autopilot/drafts/AAAA-MM-JJ-<nom>/` (jamais envoyés par la skill).
3. **Relecture** : honnêteté (rien d'inventé), absence de pression, risque annoncé, conformité du pays, marque (`om-brand`).
4. **Validation du propriétaire** — écrite, dans une session où il parle lui-même.
5. **Envoi** par les canaux existants uniquement, à l'audience consentante, sous plafond.
6. **Mesure** et compte rendu ; arrêt si un seuil est franchi.

Le propriétaire a dit « je donne le contrôle total et l'autorisation pour les e-mails, les publicités, les offres et le contenu ». Cette autorisation est prise au sérieux **pour rédiger, proposer, préparer et mesurer**. Pour envoyer ou publier, la validation de l'étape 4 reste la règle, sauf catégorie explicitement ouverte par lui (par exemple : « le résumé hebdomadaire aux inscrits opt-in peut partir seul »), consignée dans `autopilot/policy.md`.
