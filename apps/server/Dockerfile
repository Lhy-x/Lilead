FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY prisma ./prisma
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/

RUN npm install

COPY . .

RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build -w apps/server

EXPOSE 4000
CMD ["node", "apps/server/dist/index.js"]
