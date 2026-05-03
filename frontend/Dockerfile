# ── Étape 1 : installer les dépendances ──────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# ── Étape 2 : build Next.js ───────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Variables disponibles au BUILD (NEXT_PUBLIC_* sont intégrées dans le bundle)
ARG NEXT_PUBLIC_GATEWAY_BASE_URL=http://localhost:5006
ARG NEXT_PUBLIC_PROFILE_ASSET_BASE_URL=http://localhost:5006
ARG GATEWAY_API_TARGET=http://gateway:8080
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""

ENV NEXT_PUBLIC_GATEWAY_BASE_URL=$NEXT_PUBLIC_GATEWAY_BASE_URL
ENV NEXT_PUBLIC_PROFILE_ASSET_BASE_URL=$NEXT_PUBLIC_PROFILE_ASSET_BASE_URL
ENV GATEWAY_API_TARGET=$GATEWAY_API_TARGET
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ── Étape 3 : runner production ──────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copier uniquement les fichiers nécessaires à l'exécution
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

# GATEWAY_API_TARGET doit aussi être défini au runtime (rewrites Next.js)
ENV GATEWAY_API_TARGET=http://gateway:8080

CMD ["npm", "run", "start"]
