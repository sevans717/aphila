# Media Proxy Service
FROM node:18-alpine

WORKDIR /app

# Install dependencies for image processing
RUN apk add --no-cache \
    imagemagick \
    imagemagick-dev \
    ffmpeg \
    vips-dev \
    cairo-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Copy application code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S media-proxy -u 1001 -G nodejs

# Set ownership
RUN chown -R media-proxy:nodejs /app
USER media-proxy

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["node", "dist/index.js"]
