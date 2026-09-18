# ----------------------------------------------------
# Stage 1: Builder with native compilation tools
# ----------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install native build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Install dependencies leveraging layer caching
COPY package*.json ./
RUN npm i -g npm@latest && npm ci

# Copy project files
COPY . .

# Build production Nuxt / Nitro application
ENV NODE_ENV=production
RUN npx nuxt build

# ----------------------------------------------------
# Stage 2: Production Runner (Lean Alpine Image)
# ----------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Add curl for Coolify/Docker healthchecks and libstdc++ for better-sqlite3 native bindings
RUN apk add --no-cache curl libstdc++

# Create persistent database folder and set permissions
RUN mkdir -p /app/data && chmod 777 /app/data

# Copy production output from builder
COPY --from=builder /app/.output /app/.output

# Copy and set entrypoint script for dynamic permission fixes
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Production environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_PATH=/app/data/bambulab.db

# Expose Nuxt default port
EXPOSE 3000

# Healthcheck for Coolify monitoring
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start container via entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
