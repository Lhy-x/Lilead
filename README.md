# Lilead

Plateforme SaaS de gestion de formulaires de préqualification de leads avec vérification email, IA de tri et dashboard analytique.

## Fonctionnalités principales

- Création de formulaires dynamiques (jusqu'à 30 questions, 5 types de champs, mode test).
- Vérification email obligatoire (code unique via Resend) avant soumission.
- IA hybride : règles pondérées + intégration Gemini (fallback sur les règles locales).
- Dashboard administrateur : gestion des formulaires, analyse en temps réel, relances email.
- Page publique responsive avec page de succès personnalisable (texte + vidéo Loom/VidAI).
- Anti-spam : rate limiting, honeypot, tracking visites.
- Docker + scripts d'initialisation pour un déploiement rapide.

## Démarrage rapide

```bash
npm install
cp .env.example .env
# Renseignez RESEND_API_KEY, RESEND_FROM et vos identifiants base/IA
./scripts/init-db.sh
npm run dev
```

### Variables d'environnement clés

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL (utilisée par Prisma). |
| `RESEND_API_KEY` / `RESEND_FROM` | Clés Resend nécessaires pour envoyer les emails de vérification et relances. |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Paramètres d'accès à Gemini (facultatifs mais recommandés). |
| `NEXT_PUBLIC_API_URL` | URL de l'API consommée par le frontend. |
| `NEXT_PUBLIC_PUBLIC_URL` | URL publique utilisée dans les emails et liens partagés. |

Consultez la documentation détaillée dans `docs/` :
- [ARCHITECTURE](docs/ARCHITECTURE.md)
- [INSTALLATION](docs/INSTALLATION.md)
- [USAGE](docs/USAGE.md)
- [IA](docs/AI.md)

## Démo

- Dashboard : `http://localhost:3000/dashboard`
- Formulaire public : `http://localhost:3000/f/demo`
- Identifiants seed : `admin@example.com` / `ChangeMe123!`

## Licence

Projet conçu pour démontrer la mise en place d'un SaaS complet. Adaptez-le à vos besoins métiers.
