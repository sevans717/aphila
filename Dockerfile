FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies and build
FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS deps-with-dev
WORKDIR /app
COPY package*.json ./
COPY package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY package-lock.json ./
RUN npm ci
COPY prisma ./prisma
# Generate Prisma client early so build-time code can import it
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
# Do not copy local .env into the image; rely on runtime environment variables
RUN npx tsc

# Production runtime image
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy only production deps and the built files
COPY --from=deps-with-dev /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000
ENTRYPOINT []
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

# Production image alias
FROM runtime AS production
