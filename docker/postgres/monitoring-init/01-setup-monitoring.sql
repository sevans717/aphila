-- Monitoring initialization script
-- Creates monitoring user and extensions

\echo 'Setting up monitoring extensions and users...'

-- Create monitoring extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create monitoring user for postgres_exporter
DO
$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'monitoring') THEN
        CREATE USER monitoring WITH PASSWORD 'monitoring_pass';
    END IF;
END
$$;

-- Grant necessary permissions for monitoring
GRANT CONNECT ON DATABASE "sav3" TO monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO monitoring;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO monitoring;

-- Grant access to system views
GRANT SELECT ON pg_stat_database TO monitoring;
GRANT SELECT ON pg_stat_user_tables TO monitoring;
GRANT SELECT ON pg_stat_user_indexes TO monitoring;
GRANT SELECT ON pg_stat_activity TO monitoring;
GRANT SELECT ON pg_stat_statements TO monitoring;
GRANT SELECT ON pg_stat_replication TO monitoring;
GRANT SELECT ON pg_locks TO monitoring;
GRANT SELECT ON pg_settings TO monitoring;

-- Ensure future tables are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO monitoring;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO monitoring;

\echo 'Monitoring setup complete!'
