# Architecture du projet Lilead

## Aperçu

Lilead est une plateforme SaaS de gestion de formulaires de préqualification de leads qui repose sur une architecture modulaire :

- **Frontend** : Next.js 14 (app router) et TailwindCSS, situé dans `apps/web`. L'application inclut le dashboard administrateur, l'éditeur de formulaires, l'analyse en temps réel et la page publique des formulaires (`/f/[slug]`).
- **Backend** : API REST Express + Prisma dans `apps/server`. Elle expose des routes sécurisées (JWT) pour gérer l'authentification, les formulaires, les questions, les règles IA, les statistiques et la soumission publique.
- **Base de données** : PostgreSQL orchestré via Prisma (`prisma/schema.prisma`). Les entités principales sont `User`, `Form`, `Question`, `Submission`, `Answer`, `EmailVerification`, `Visit`, `LeadRule` et `EmailLog`.
- **Emailing** : Intégration SendGrid via `@sendgrid/mail` pour les mails de vérification et les relances.
- **IA de tri** : Module hybride (`apps/server/src/utils/ai.ts`) qui combine des règles pondérées côté utilisateur (`LeadRule`) et, optionnellement, un endpoint IA externe.

## Flux principaux

1. **Authentification** : inscription, connexion, récupération du profil via JWT (routes `/auth`).
2. **Gestion des formulaires** : CRUD complet (routes `/forms`) incluant la limite de 30 questions, le mode test, la configuration des pages de succès, la publication et les règles IA.
3. **Soumission publique** :
   - Visite enregistrée (`/public/forms/:slug/visit`).
   - Demande de vérification email avec code unique.
   - Confirmation du code et création de la soumission avec IA.
   - Page de succès personnalisable (texte + vidéo Loom/VidAI).
4. **Statistiques temps réel** : agrégations sur les visites, soumissions, taux de vérification et qualification (`/stats`).
5. **Relances** : email de groupe aux leads qualifiés (`/forms/:id/notify-qualified`).

## Organisation des dossiers

```
apps/
  server/
    src/
      config/        # env + Prisma client
      middleware/    # auth, rate-limiting, erreurs
      routes/        # modules d'API (auth, forms, public, stats)
      utils/         # IA, emails, mots de passe, JWT
  web/
    app/             # routes Next.js (dashboard, auth, formulaires publics)
    components/      # Navbar, Providers, RequireAuth
    hooks/           # Auth context
    lib/             # Client Axios
    types/           # Types partagés pour le frontend
prisma/
  schema.prisma     # Modèle de données
  seed.ts           # Jeu de données de démo
scripts/
  init-db.sh        # Initialisation BDD & seed
```

## Sécurité et anti-spam

- Vérification systématique de l'email avant soumission.
- Honeypot + rate limiting (`express-rate-limit`) pour freiner le spam.
- Hashage `bcrypt` pour les mots de passe, JWT signé.
- Headers sécurisés via Helmet et CORS strict.

## Déploiement

- Docker multi-services via `docker-compose.yml`.
- `apps/server/Dockerfile` et `apps/web/Dockerfile` prêts pour un déploiement sur Render, Railway, Fly.io, Vercel (frontend) ou tout orchestrateur compatible.
- Prisma gère les migrations (`npx prisma migrate deploy`) et la génération du client.
