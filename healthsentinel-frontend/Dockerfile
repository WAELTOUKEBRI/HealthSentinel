# 1. Build Stage
FROM node:20-alpine AS builder
# Satisfy Hadolint by combining and clearing cache
RUN apk add --no-cache libc6-compat
WORKDIR /app

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

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# --- SENIOR SECURITY: Setup User FIRST ---
# We combine everything into ONE layer to make Hadolint happy and reduce image size
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apk update && apk upgrade --no-cache && \
    apk add --no-cache libc6-compat

# --- COPY ARTIFACTS ---
# Now that 'nextjs' user exists, we can chown to them
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
