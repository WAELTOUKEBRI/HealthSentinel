# --- STAGE 1: The Builder ---
FROM python:3.12-slim AS builder

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 1. Install System dependencies + Node.js 22
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

# 3. Prisma Generation (FIXED VERSIONING)
COPY prisma ./prisma/
COPY package*.json ./
# Removed the non-existent @prisma/config package
RUN npm install @prisma/client@6.4.1 prisma@6.4.1 dotenv@16.4.5 tsx@4.19.1 && \
    DATABASE_URL="postgresql://placeholder:5432/db" npx prisma generate

# --- STAGE 2: The Secure Runner ---
FROM python:3.12-slim AS runner

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Ensure the path includes our custom local bin and prisma binaries
ENV PATH="/home/nurse-wael/.local/bin:/app/node_modules/.bin:$PATH"

# Only install CURL for Healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 4. Secure Non-root user setup
RUN groupadd -r clinical-staff && useradd -r -g clinical-staff -m nurse-wael \
    && chown -R nurse-wael:clinical-staff /app

# 5. Copy artifacts from builder
COPY --from=builder /root/.local /home/nurse-wael/.local
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# 6. Copy application code with ownership
COPY --chown=nurse-wael:clinical-staff . .

USER nurse-wael

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
