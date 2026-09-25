# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# Base — Node 22 LTS (alpine) + libs necessárias ao Prisma
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ─────────────────────────────────────────────────────────────
# deps — instala TODAS as dependências e gera o Prisma Client
# ─────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

# ─────────────────────────────────────────────────────────────
# prod-deps — apenas dependências de produção (com client gerado)
# ─────────────────────────────────────────────────────────────
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate

# ─────────────────────────────────────────────────────────────
# builder — build do Next.js
# ─────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─────────────────────────────────────────────────────────────
# runner — imagem final
# ─────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# pasta das imagens enviadas (monte um volume aqui no Dokploy)
ENV UPLOAD_DIR=/app/uploads

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/.next ./.next
COPY --from=prod-deps /app/node_modules ./node_modules

RUN mkdir -p /app/uploads \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Aplica migrations pendentes antes de subir o servidor.
# O seed NÃO roda no boot — execute uma única vez via console do Dokploy:
#   npx prisma db seed
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
