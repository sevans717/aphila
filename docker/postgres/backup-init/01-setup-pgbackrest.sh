#!/bin/bash
set -e

# Create pgbackrest user for backup operations
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create backup user with replication privileges
    CREATE USER pgbackrest WITH REPLICATION;
    ALTER USER pgbackrest SET search_path = '';

    -- Grant necessary permissions
    GRANT CONNECT ON DATABASE $POSTGRES_DB TO pgbackrest;
    GRANT USAGE ON SCHEMA public TO pgbackrest;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO pgbackrest;
    GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO pgbackrest;

    -- Enable pg_stat_statements if not already enabled
    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
EOSQL

# Update pg_hba.conf for pgbackrest access
echo "# pgBackRest access" >> "$PGDATA/pg_hba.conf"
echo "host all pgbackrest 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"
echo "host replication pgbackrest 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"

# Set pgbackrest user password
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    ALTER USER pgbackrest PASSWORD '$POSTGRES_PASSWORD';
EOSQL

echo "pgBackRest user and permissions configured successfully"
