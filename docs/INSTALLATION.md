# Installation & Lancement

## Prérequis

- Node.js 18+ (recommandé 20)
- PostgreSQL 14+
- Compte SendGrid (ou adapter `utils/email.ts`)
- (Optionnel) Endpoint IA externe compatible JSON

## Étapes rapides (développement)

1. **Cloner le dépôt**

```bash
git clone <repo> && cd Lilead
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer les variables d'environnement**

```bash
cp .env.example .env
# Éditer .env pour définir DATABASE_URL, SENDGRID_API_KEY, etc.
```

4. **Initialiser la base de données**

```bash
npm run prisma -- migrate dev --name init
npm run prisma -- generate
npm run ts-node -- prisma/seed.ts
# ou ./scripts/init-db.sh pour automatiser
```

5. **Lancer les services**

```bash
npm run dev
# ouvre le backend sur :4000 et le frontend sur :3000
```

## Lancement via Docker

```bash
cp .env.example .env
# Vérifier NEXT_PUBLIC_API_URL et DATABASE_URL

docker-compose up --build
```

Services exposés :
- `http://localhost:3000` : interface web
- `http://localhost:4000` : API REST
- `localhost:5432` : base PostgreSQL

## Scripts utiles

| Commande | Description |
| --- | --- |
| `npm run dev` | Démarre API + frontend en mode développement |
| `npm run build` | Compile le frontend et le backend |
| `npm run lint` | Lint des deux applications |
| `npm run format` | Formatage Prettier |
| `npm run start -w apps/server` | Lance l'API en production |
| `npm run start -w apps/web` | Lance Next.js en mode production |

## Tests manuels

- Utiliser l'utilisateur seedé : `admin@example.com` / `ChangeMe123!`
- Accéder au formulaire public de démo : `http://localhost:3000/f/demo`
