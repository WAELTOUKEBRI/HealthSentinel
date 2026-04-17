# ---------- BUILDER ----------
FROM python:3.12-slim-bookworm AS builder
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ENV PATH="/root/.local/bin:${PATH}"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# minimal build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends libatomic1 \
    curl ca-certificates gnupg \
    && rm -rf /var/lib/apt/lists/*

# Node.js ONLY for Prisma generation
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Python deps (isolated install)
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Prisma generation (build-time only)
COPY prisma ./prisma/
COPY package*.json ./

RUN npm install prisma@6.4.1 @prisma/client@6.4.1 dotenv tsx \
    && DATABASE_URL="postgresql://placeholder" npx prisma generate


# ---------- RUNTIME ----------
FROM python:3.12-slim-bookworm AS runner

ENV PYTHONUNBUFFERED=1
ENV PATH="/home/app/.local/bin:$PATH"

WORKDIR /app

# runtime deps ONLY (tightened)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 ca-certificates \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*

# non-root user
RUN groupadd -r app && useradd -r -g app -m app

# Python runtime dependencies
COPY --from=builder --chown=app:app /root/.local /home/app/.local

# Prisma runtime ONLY (no CLI)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# application
COPY --chown=app:app prisma ./prisma
COPY --chown=app:app . .

USER app

EXPOSE 8000

# lightweight internal healthcheck (no curl dependency)
HEALTHCHECK CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
