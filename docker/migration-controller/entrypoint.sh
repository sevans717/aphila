#!/bin/bash
set -e

# Migration Controller Entrypoint
# Prepares environment and starts the migration controller

echo "Starting Migration Controller..."

# Wait for databases to be ready
wait_for_db() {
    local db_url=$1
    local db_name=$2

    echo "Waiting for $db_name database to be ready..."

    until pg_isready -d "$db_url" &>/dev/null; do
        echo "$db_name database is not ready, waiting..."
        sleep 2
    done

    echo "$db_name database is ready"
}

# Wait for both blue and green databases
wait_for_db "$BLUE_DATABASE_URL" "Blue"
wait_for_db "$GREEN_DATABASE_URL" "Green"

# Initialize Prisma if needed
if [ -f "/app/prisma/schema.prisma" ]; then
    echo "Generating Prisma client..."
    npx prisma generate
fi

# Create log directory
mkdir -p /app/logs

# Set proper permissions
chown -R migration:migration /app/logs /app/tmp

echo "Migration controller initialization complete"

# Execute the main command
exec "$@"
