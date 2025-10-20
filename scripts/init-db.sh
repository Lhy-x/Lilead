#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  echo "Veuillez copier .env.example vers .env et définir vos variables d'environnement." >&2
  exit 1
fi

npm install
npx prisma migrate deploy
npx prisma db seed --schema=prisma/schema.prisma || npx ts-node prisma/seed.ts
