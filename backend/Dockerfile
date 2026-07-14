# --- Stage 1: build TypeScript and generate Prisma client ---
FROM node:22-slim AS build

# Prisma engines require OpenSSL at generate time
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Stage 2: runtime with production dependencies only ---
FROM node:22-slim

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
# schema.prisma sets engineType = "binary" — make the CLI download that
# flavor at build time, so nothing needs writing to node_modules at runtime
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary

COPY package*.json ./
RUN npm ci --omit=dev

# prisma/ is needed at runtime for `migrate deploy`; the client must be
# re-generated here because `npm ci --omit=dev` wipes the generated files.
# `prisma version` pre-downloads the schema engine while we are still root —
# at runtime the container runs as `node` and cannot write to node_modules.
COPY prisma ./prisma
RUN npx prisma generate && npx prisma version

COPY --from=build /app/dist ./dist

USER node
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "fetch('http://localhost:3002/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Apply pending migrations, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
