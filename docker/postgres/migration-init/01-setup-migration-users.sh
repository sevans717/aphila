#!/bin/bash
set -e

# Database Migration Init Script
# Sets up users and permissions for zero-downtime migrations

echo "Setting up migration users and permissions..."

# Create application user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create application user for migrations
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sav3_app') THEN
            CREATE ROLE sav3_app WITH LOGIN PASSWORD '${POSTGRES_APP_PASSWORD:-app_password}';
        END IF;
    END
    \$\$;

    -- Grant necessary permissions for application
    GRANT CONNECT ON DATABASE sav3 TO sav3_app;
    GRANT USAGE ON SCHEMA public TO sav3_app;
    GRANT CREATE ON SCHEMA public TO sav3_app;

    -- Grant permissions on all current tables
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sav3_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sav3_app;

    -- Grant permissions on future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sav3_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO sav3_app;

    -- Create migration user for schema changes
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'migration_user') THEN
            CREATE ROLE migration_user WITH LOGIN PASSWORD '${POSTGRES_MIGRATION_PASSWORD:-migration_password}';
        END IF;
    END
    \$\$;

    -- Grant migration permissions
    GRANT CONNECT ON DATABASE sav3 TO migration_user;
    GRANT ALL PRIVILEGES ON SCHEMA public TO migration_user;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO migration_user;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO migration_user;
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO migration_user;

    -- Allow migration user to create and drop objects
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON TABLES TO migration_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON SEQUENCES TO migration_user;

    -- Create monitoring user for health checks
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'migration_monitor') THEN
            CREATE ROLE migration_monitor WITH LOGIN PASSWORD '${POSTGRES_MONITOR_PASSWORD:-monitor_password}';
        END IF;
    END
    \$\$;

    -- Grant read-only monitoring permissions
    GRANT CONNECT ON DATABASE sav3 TO migration_monitor;
    GRANT USAGE ON SCHEMA public TO migration_monitor;
    GRANT USAGE ON SCHEMA information_schema TO migration_monitor;
    GRANT USAGE ON SCHEMA pg_catalog TO migration_monitor;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO migration_monitor;
    GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO migration_monitor;
    GRANT SELECT ON ALL TABLES IN SCHEMA pg_catalog TO migration_monitor;

    -- Create migration tracking table
    CREATE TABLE IF NOT EXISTS _migration_tracking (
        id SERIAL PRIMARY KEY,
        migration_id VARCHAR(255) UNIQUE NOT NULL,
        migration_name VARCHAR(255) NOT NULL,
        environment VARCHAR(50) NOT NULL, -- 'blue' or 'green'
        status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'completed', 'failed', 'rolled_back'
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        rollback_at TIMESTAMP WITH TIME ZONE,
        checksum VARCHAR(255),
        execution_time_ms INTEGER,
        error_message TEXT,
        rollback_script TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for migration tracking
    CREATE INDEX IF NOT EXISTS idx_migration_tracking_migration_id ON _migration_tracking(migration_id);
    CREATE INDEX IF NOT EXISTS idx_migration_tracking_environment ON _migration_tracking(environment);
    CREATE INDEX IF NOT EXISTS idx_migration_tracking_status ON _migration_tracking(status);
    CREATE INDEX IF NOT EXISTS idx_migration_tracking_started_at ON _migration_tracking(started_at);

    -- Grant permissions on migration tracking table
    GRANT ALL PRIVILEGES ON TABLE _migration_tracking TO migration_user;
    GRANT SELECT ON TABLE _migration_tracking TO migration_monitor;
    GRANT USAGE, SELECT ON SEQUENCE _migration_tracking_id_seq TO migration_user;

    -- Create schema comparison functions
    CREATE OR REPLACE FUNCTION compare_table_schemas(
        schema1_name TEXT DEFAULT 'public',
        schema2_name TEXT DEFAULT 'public',
        table_name TEXT DEFAULT NULL
    ) RETURNS TABLE (
        table_name_diff TEXT,
        column_name TEXT,
        difference_type TEXT,
        schema1_definition TEXT,
        schema2_definition TEXT
    ) AS \$\$
    BEGIN
        -- Implementation would compare table schemas between environments
        -- This is a placeholder for the actual schema comparison logic
        RETURN QUERY
        SELECT
            'placeholder'::TEXT as table_name_diff,
            'placeholder'::TEXT as column_name,
            'placeholder'::TEXT as difference_type,
            'placeholder'::TEXT as schema1_definition,
            'placeholder'::TEXT as schema2_definition
        WHERE FALSE; -- Return empty for now
    END;
    \$\$ LANGUAGE plpgsql;

    -- Create migration validation function
    CREATE OR REPLACE FUNCTION validate_migration_safety(migration_sql TEXT)
    RETURNS TABLE (
        is_safe BOOLEAN,
        risk_level TEXT,
        warnings TEXT[]
    ) AS \$\$
    DECLARE
        unsafe_patterns TEXT[] := ARRAY[
            'DROP TABLE',
            'DROP COLUMN',
            'ALTER TABLE .* DROP',
            'TRUNCATE',
            'DELETE FROM .* WHERE',
            'UPDATE .* SET .* WHERE'
        ];
        pattern TEXT;
        warning_list TEXT[] := '{}';
        has_unsafe BOOLEAN := FALSE;
    BEGIN
        -- Check for unsafe patterns
        FOREACH pattern IN ARRAY unsafe_patterns
        LOOP
            IF migration_sql ~* pattern THEN
                has_unsafe := TRUE;
                warning_list := array_append(warning_list, 'Contains potentially unsafe operation: ' || pattern);
            END IF;
        END LOOP;

        -- Determine risk level
        RETURN QUERY SELECT
            NOT has_unsafe as is_safe,
            CASE
                WHEN has_unsafe THEN 'HIGH'
                WHEN migration_sql ~* '(CREATE INDEX|ADD COLUMN)' THEN 'MEDIUM'
                ELSE 'LOW'
            END as risk_level,
            warning_list as warnings;
    END;
    \$\$ LANGUAGE plpgsql;

    GRANT EXECUTE ON FUNCTION compare_table_schemas TO migration_user;
    GRANT EXECUTE ON FUNCTION compare_table_schemas TO migration_monitor;
    GRANT EXECUTE ON FUNCTION validate_migration_safety TO migration_user;
    GRANT EXECUTE ON FUNCTION validate_migration_safety TO migration_monitor;

EOSQL

echo "Migration users and permissions set up successfully"
