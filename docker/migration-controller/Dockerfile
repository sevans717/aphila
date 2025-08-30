# Migration Controller Dockerfile
# Orchestrates zero-downtime migrations with blue-green strategy

FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    postgresql-client \
    docker-cli \
    jq

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 migration && \
    adduser -D -u 1001 -G migration migration

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY scripts/ ./scripts/
COPY docker/migration-controller/src/ ./src/

# Create necessary directories
RUN mkdir -p logs tmp && \
    chown -R migration:migration /app

# Switch to non-root user
USER migration

# Expose migration controller port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Entrypoint
COPY docker/migration-controller/entrypoint.sh /usr/local/bin/entrypoint.sh
USER root
RUN chmod +x /usr/local/bin/entrypoint.sh
USER migration

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "src/migration-controller.js"]
