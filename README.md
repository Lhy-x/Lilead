# Lilead

Plateforme SaaS de gestion de formulaires de préqualification de leads avec vérification email, IA de tri et dashboard analytique.

## Fonctionnalités principales

- Création de formulaires dynamiques (jusqu'à 30 questions, 5 types de champs, mode test).

- Dashboard administrateur : gestion des formulaires, analyse en temps réel, relances email.
- Page publique responsive avec page de succès personnalisable (texte + vidéo Loom/VidAI).
- Anti-spam : rate limiting, honeypot, tracking visites.
- Docker + scripts d'initialisation pour un déploiement rapide.

## Démarrage rapide

```bash
npm install
cp .env.example .env

./scripts/init-db.sh
npm run dev
```


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
