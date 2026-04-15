# 1. Build Stage
FROM node:20-alpine AS builder
USER root
RUN apk update && apk upgrade --no-cache && apk add --no-cache libc6-compat
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Copy only files needed for install first
COPY package.json package-lock.json ./

# CRITICAL FIX: Run clean install here
RUN npm ci --frozen-lockfile

# Copy the rest of the source code
COPY . .

# CRITICAL FIX: Only remove build artifacts, NOT node_modules
RUN rm -rf .next out build 

# Build the app using the node_modules we just installed
RUN npm run build

# 2. Run Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apk update && apk upgrade --no-cache && \
    apk add --no-cache libc6-compat

# --- COPY ARTIFACTS ---
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# We delete these inside standalone because standalone has its own node_modules
RUN rm -rf ./.next/standalone/node_modules

COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
