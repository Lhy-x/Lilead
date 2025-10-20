# Utilisation du Dashboard

## Connexion

1. Rendez-vous sur `http://localhost:3000/login`.
2. Identifiez-vous avec l'utilisateur seedé (`admin@example.com` / `ChangeMe123!`) ou créez un nouveau compte.

## Création d'un formulaire

1. Depuis le menu, ouvrez **Dashboard → Formulaires**.
2. Cliquez sur **Nouveau formulaire**, renseignez le nom et la description.
3. Enregistrez : le formulaire est créé en mode brouillon.

## Configuration

- **Questions** : ajoutez jusqu'à 30 questions en choisissant le type (email, téléphone, réponse courte/longue, chatbox) et en définissant si la réponse est obligatoire.
- **Page de succès** : personnalisez le titre, le message et ajoutez un lien vidéo Loom/VidAI.
- **Mode test** : activez l'option pour autoriser des soumissions sans impact.
- **Publication** : cliquez sur *Publier le formulaire* pour le rendre accessible via l'URL publique (`/f/[slug]`).

## Vérification email & anti-spam

- Chaque soumission doit vérifier son email via un code envoyé par SendGrid.
- Un champ honeypot invisible et un rate-limiting côté API bloquent les bots.
- Les soumissions sans email vérifié ou expiré sont refusées.

## IA & qualification

1. Ajoutez des règles IA dans l'onglet **Règles IA** : champ ciblé, opérateur (contains, equals, etc.), valeur attendue et poids.
2. Le score résultant permet de classer automatiquement les leads en `QUALIFIED` ou `DISQUALIFIED`.
3. Configurez `AI_API_KEY` + `AI_API_URL` pour déléguer la décision à un endpoint IA externe (sinon fallback sur les règles locales).

## Statistiques

- Vue globale sur la page **Dashboard** : nombre de formulaires, visites, soumissions, taux de vérification et de conversion.
- Vue détaillée par formulaire : métriques agrégées et graphique des soumissions quotidiennes (30 jours glissants).
- Page **Analytics** : tableau comparatif avec taux de conversion par formulaire.

## Relances email

- Sur la page d'un formulaire, utilisez **Email leads qualifiés** pour envoyer un message groupé (via SendGrid) à l'adresse du propriétaire avec le lien direct du dashboard.

## Formulaire public

- Accès via `http://localhost:3000/f/<slug>`.
- Étapes pour le lead :
  1. saisir son email (anti-spam + enregistrement visite),
  2. confirmer le code reçu,
  3. remplir les questions,
  4. soumettre (avec mode test optionnel).
- La page de succès affiche le texte personnalisé et, si configuré, une vidéo intégrée.
