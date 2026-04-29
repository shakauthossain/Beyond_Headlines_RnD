FROM node:20-alpine AS base

# Install system dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app
COPY package*.json ./

# ── Stage 2: Development ─────────────────────────────────────────────────────
FROM base AS development
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm install
COPY . .
RUN npx prisma generate
EXPOSE 8000
CMD ["npm", "run", "dev"]

# ── Stage 3: Builder ─────────────────────────────────────────────────────────
FROM base AS builder
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Stage 4: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
CMD ["node", "dist/server.js"]
