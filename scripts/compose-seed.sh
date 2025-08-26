#!/bin/sh
# Run Prisma migrations and seed inside the api container
set -e

API_CONTAINER=$(docker-compose -f ../docker-compose.prod.yml ps -q api)
if [ -z "$API_CONTAINER" ]; then
  echo "API container not running. Starting services..."
  docker-compose -f ../docker-compose.prod.yml up -d api
  API_CONTAINER=$(docker-compose -f ../docker-compose.prod.yml ps -q api)
fi

echo "Running migrations..."
docker exec -it $API_CONTAINER sh -c "npx prisma migrate deploy"
echo "Running seed..."
docker exec -it $API_CONTAINER sh -c "node prisma/seed.js || node prisma/seed.ts"
