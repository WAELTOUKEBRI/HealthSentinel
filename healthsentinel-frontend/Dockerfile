# 1. Build Stage
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- CRITICAL: Add these HERE so 'npm run build' can see them ---
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2. Run Stage
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# --- SENIOR SECURITY: Non-Root User ---
RUN addgroup --system --gid 1001 nodejs && \
RUN adduser --system --uid 1001 nextjs

# Only copy what is strictly necessary
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# --- SENIOR SECURITY: Clean up Alpine ---
# This updates the underlying Alpine packages to fix those 2-10 "ghost" vulnerabilities
RUN apk update && apk upgrade && \
    rm -rf /var/cache/apk/*

USER nextjs

EXPOSE 3000

# The server.js is created by the standalone build
CMD ["node", "server.js"]
