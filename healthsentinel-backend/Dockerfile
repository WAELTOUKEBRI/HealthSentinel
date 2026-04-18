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

RUN npm install prisma@5.17.0 @prisma/client@5.17.0 \
    && PRISMA_PY_DEBUG_GENERATOR=1 DATABASE_URL="postgresql://placeholder" npx prisma generate

RUN python3 -m prisma generate --schema=./prisma/schema.prisma --schema=./prisma/schema.prisma

# ---------- RUNTIME ----------
FROM python:3.12-slim-bookworm AS runner

ENV PYTHONUNBUFFERED=1
ENV PATH="/home/app/.local/bin:$PATH"

WORKDIR /app


# runtime deps ONLY (tightened)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 ca-certificates libatomic1 \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*

# non-root user
RUN groupadd -r app && useradd -r -g app -m app

# 3. Donner les droits sur le dossier de travail
RUN chown -R app:app /app

# Python runtime dependencies
COPY --from=builder --chown=app:app /root/.local /home/app/.local
COPY --from=builder --chown=app:app /root/.cache/prisma-python /home/app/.cache/prisma-python

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
