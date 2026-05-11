# =============================================================================
# Wiki Codex - Multi-stage Dockerfile
# Z.ai Reproducibility Standard v1.0 L3
# =============================================================================
# Runtime:     node:20-alpine + Bun
# Build:       Next.js 16 standalone output
# Database:    PostgreSQL via Prisma (runtime DATABASE_URL required)
# =============================================================================

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install Bun (runtime + package manager)
RUN npm install -g bun

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json bun.lock ./

# Install dependencies (skip postinstall to avoid .env copy / db push)
RUN bun install --frozen-lockfile --ignore-scripts

# Generate Prisma client (no db push needed at build time)
RUN bunx prisma generate

# Copy full source
COPY . .

# Build Next.js (standalone output)
# Override postinstall to prevent db operations during build
RUN DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder" \
    NEXT_TELEMETRY_DISABLED=1 \
    bun run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install Bun for runtime
RUN npm install -g bun

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy standalone Next.js output from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets and public directory
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema and migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy generated Prisma client
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Switch to non-root user
USER nextjs

# Environment defaults (override at runtime via docker-compose / -e flags)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Expose the default port
EXPOSE 3000

# Runtime entrypoint: apply pending migrations then start the server
# prisma migrate deploy is safe for production — it only applies pending migrations
CMD ["sh", "-c", "bunx prisma migrate deploy && bun .next/standalone/server.js"]
