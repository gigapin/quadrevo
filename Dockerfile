# syntax=docker/dockerfile:1

# Version aligned with .nvmrc and package.json#engines: update them together.
ARG NODE_VERSION=26.13.1

# ---------------------------------------------------------------------------
# base: shared runtime for development and production
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-trixie-slim AS base

# openssl/ca-certificates: required by the Prisma CLI and TLS calls to providers.
# tini: PID 1 that forwards SIGTERM/SIGINT to Node and reaps zombie processes.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates tini \
 && rm -rf /var/lib/apt/lists/*

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

WORKDIR /app
ENTRYPOINT ["/usr/bin/tini", "--"]

# ---------------------------------------------------------------------------
# dev: source files mounted from the host, node_modules in a dedicated volume
# ---------------------------------------------------------------------------
FROM base AS dev
ENV NODE_ENV=development

# The node_modules volume inherits ownership and permissions from this directory.
RUN mkdir -p /app/node_modules && chown -R node:node /app

USER node
EXPOSE 3000 9229
# Avoid `npm run`: npm does not reliably forward SIGTERM to the child process.
CMD ["node_modules/.bin/tsx", "watch", "src/server.ts"]

# ---------------------------------------------------------------------------
# deps: reproducible installation from the lockfile
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------------------------------------------------------------------------
# build: TypeScript compilation; add `prisma generate` when Prisma is integrated
# ---------------------------------------------------------------------------
FROM deps AS build
COPY . .
RUN npm run build \
 && npm prune --omit=dev

# ---------------------------------------------------------------------------
# prod: only dist/ and runtime dependencies, unprivileged user
# ---------------------------------------------------------------------------
FROM base AS prod
ENV NODE_ENV=production

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
