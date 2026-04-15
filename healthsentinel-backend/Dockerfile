# ---------- BUILDER ----------
FROM python:3.12-slim-bookworm AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# minimal system dependencies (build-time only)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates gnupg \
    && rm -rf /var/lib/apt/lists/*

# Node.js ONLY for Prisma generation
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Python dependencies (user install for isolation)
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Prisma setup (build-time only)
COPY prisma ./prisma/
COPY package*.json ./

RUN npm install prisma@6.4.1 @prisma/client@6.4.1 dotenv tsx \
    && DATABASE_URL="postgresql://placeholder" npx prisma generate


# ---------- RUNTIME ----------
FROM python:3.12-slim-bookworm AS runner

ENV PYTHONUNBUFFERED=1
ENV PATH="/home/app/.local/bin:$PATH"

WORKDIR /app

# runtime-only dependencies (minimal attack surface)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# non-root user
RUN groupadd -r app && useradd -r -g app -m app

# Python dependencies from builder
COPY --from=builder --chown=app:app /root/.local /home/app/.local

# Prisma runtime artifacts ONLY (no CLI, no tooling)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# application + schema
COPY --chown=app:app prisma ./prisma
COPY --chown=app:app . .

USER app

EXPOSE 8000

# lightweight healthcheck (no external binaries)
HEALTHCHECK CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
