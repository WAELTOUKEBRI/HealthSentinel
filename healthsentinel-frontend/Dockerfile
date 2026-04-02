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
ENV NODE_ENV=production

# Next.js standalone creates a subfolder structure. 
# We need to pull the contents out correctly:
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# This server.js is automatically created by the standalone build
CMD ["node", "server.js"]
