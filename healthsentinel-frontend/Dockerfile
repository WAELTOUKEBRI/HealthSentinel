# 1. Build Stage (Same as yours)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2. Run Stage (Corrected Paths)
FROM node:20-alpine AS runner
WORKDIR /app
# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# This server.js is automatically created by the standalone build
CMD ["node", "server.js"]
