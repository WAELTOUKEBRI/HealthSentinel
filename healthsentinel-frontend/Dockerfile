# 1. Build Stage
FROM node:20-alpine AS builder
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

# Copy the standalone build from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# The server.js is created by the standalone build
CMD ["node", "server.js"]
