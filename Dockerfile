# syntax=docker/dockerfile:1

# ---------- Estagio 1: build (compila TypeScript) ----------
FROM node:20.20.2-alpine3.23 AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Estagio 2: runtime (so dependencias de producao + dist) ----------
FROM node:20.20.2-alpine3.23 AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Versao injetada pelo pipeline (tag git); "dev" em builds locais
ARG APP_VERSION=dev
ARG VCS_REF=unknown
ENV APP_VERSION=${APP_VERSION}
LABEL org.opencontainers.image.version=${APP_VERSION} \
      org.opencontainers.image.revision=${VCS_REF} \
      org.opencontainers.image.source="https://github.com/GuilhermeVieira05/tp-gerencia-config"

# Nao roda como root
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["node", "dist/server.js"]
