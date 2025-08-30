#!/bin/bash
set -e

# Create application user for PgBouncer
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create application user
    CREATE USER ${SAV3_USER:-sav3_user} WITH PASSWORD '${SAV3_PASSWORD:-sav3_password}';

    -- Grant necessary permissions to application user
    GRANT CONNECT ON DATABASE $POSTGRES_DB TO ${SAV3_USER:-sav3_user};
    GRANT USAGE ON SCHEMA public TO ${SAV3_USER:-sav3_user};
    GRANT CREATE ON SCHEMA public TO ${SAV3_USER:-sav3_user};
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${SAV3_USER:-sav3_user};
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${SAV3_USER:-sav3_user};

    -- Grant default privileges for future objects
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${SAV3_USER:-sav3_user};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${SAV3_USER:-sav3_user};

    -- Create monitoring extensions
    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

    -- Enable PostGIS extension
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS postgis_topology;
EOSQL

echo "Database users, permissions, and PostGIS configured successfully"
