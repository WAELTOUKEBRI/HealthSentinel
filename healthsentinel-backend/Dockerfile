# --- STAGE 1: The Builder ---
FROM python:3.12-slim-bookworm AS builder

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 1. Install System dependencies + Node.js 22 (Needed only for Prisma generation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip==24.0 \
    && pip install --user --no-cache-dir -r requirements.txt

# 3. Prisma Generation
COPY prisma ./prisma/
COPY package*.json ./
RUN npm install @prisma/client@6.4.1 prisma@6.4.1 dotenv@16.4.5 tsx@4.19.1 && \
    DATABASE_URL="postgresql://placeholder:5432/db" npx prisma generate

# --- STAGE 2: The Secure Runner ---
# Using bookworm-slim for the best balance of stability and small footprint
FROM python:3.12-slim-bookworm AS runner

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Optimized PATH for your custom user
ENV PATH="/home/nurse-wael/.local/bin:/app/node_modules/.bin:$PATH"

WORKDIR /app

# 4. Install ONLY essential runtime libs (libpq for Postgres)
# We remove the package manager cache immediately to reduce Trivy noise
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 5. Secure Non-root user setup
RUN groupadd -r clinical-staff && useradd -r -g clinical-staff -m nurse-wael \
    && chown -R nurse-wael:clinical-staff /app

# 6. Copy artifacts from builder with correct permissions
# We copy ONLY what is needed to run, leaving the compilers behind
COPY --from=builder --chown=nurse-wael:clinical-staff /root/.local /home/nurse-wael/.local
COPY --from=builder --chown=nurse-wael:clinical-staff /app/node_modules ./node_modules
COPY --from=builder --chown=nurse-wael:clinical-staff /app/prisma ./prisma

# 7. Copy application code
COPY --chown=nurse-wael:clinical-staff . .

USER nurse-wael

EXPOSE 8000

# 8. Senior Healthcheck: Using Python instead of Curl
# This removes the 'curl' library vulnerabilities from your Trivy report!
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
