# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

# minimal OS deps (keep it small)
RUN apk add --no-cache libc6-compat

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# install deps (production only)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 🔥 important cleanup step (reduces CVE graph noise)
RUN npm prune --omit=dev

COPY . .

RUN rm -rf .next out build
RUN npm run build


# ---------- RUNTIME STAGE ----------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# create non-root user
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# runtime minimal dependency
RUN apk add --no-cache libc6-compat

# only what is needed for Next.js standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# remove Next cache (scanner noise reduction)
RUN rm -rf .next/cache

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
