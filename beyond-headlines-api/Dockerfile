FROM mcr.microsoft.com/playwright:v1.50.0-jammy AS base
WORKDIR /app
COPY package*.json ./

# ── Stage 2: Development (hot reload via ts-node-dev) ────────────────────────
FROM base AS development
# Using npm install because we want to allow dev dependencies
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 8000
CMD ["npm", "run", "dev"]

# ── Stage 3: Builder (compile TypeScript) ────────────────────────────────────
FROM base AS builder
RUN npm install
COPY . .
RUN npm run build

# ── Stage 4: Production (lean image with only dist/) ─────────────────────────
FROM mcr.microsoft.com/playwright:v1.50.0-jammy AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
CMD ["node", "dist/server.js"]
