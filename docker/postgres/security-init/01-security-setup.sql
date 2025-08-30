#!/bin/bash

# Security initialization script for PostgreSQL
# Creates security-focused users, roles, and configurations

\echo 'Initializing PostgreSQL security configuration...'

-- Create application-specific database user with limited privileges
DO
$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sav3_app') THEN
        CREATE USER sav3_app WITH PASSWORD 'app_password_placeholder';
        \echo 'Created application user: sav3_app';
    END IF;
END
$$;

-- Create read-only user for monitoring and analytics
DO
$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sav3_readonly') THEN
        CREATE USER sav3_readonly WITH PASSWORD 'readonly_password_placeholder';
        \echo 'Created read-only user: sav3_readonly';
    END IF;
END
$$;

-- Create backup user with minimal required privileges
DO
$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sav3_backup') THEN
        CREATE USER sav3_backup WITH PASSWORD 'backup_password_placeholder';
        \echo 'Created backup user: sav3_backup';
    END IF;
END
$$;

-- Create replication user (if not exists from replication setup)
DO
$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'replicator') THEN
        CREATE USER replicator WITH REPLICATION LOGIN PASSWORD 'replication_password_placeholder';
        \echo 'Created replication user: replicator';
    END IF;
END
$$;

-- Grant appropriate privileges to application user
GRANT CONNECT ON DATABASE "sav3" TO sav3_app;
GRANT USAGE ON SCHEMA public TO sav3_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sav3_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sav3_app;

-- Ensure future tables/sequences are accessible to app user
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sav3_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO sav3_app;

-- Grant read-only access to readonly user
GRANT CONNECT ON DATABASE "sav3" TO sav3_readonly;
GRANT USAGE ON SCHEMA public TO sav3_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sav3_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO sav3_readonly;

-- Grant backup privileges
GRANT CONNECT ON DATABASE "sav3" TO sav3_backup;
GRANT USAGE ON SCHEMA public TO sav3_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sav3_backup;
GRANT SELECT ON pg_stat_database TO sav3_backup;

-- Revoke unnecessary privileges from PUBLIC
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE "sav3" FROM PUBLIC;

-- Create security-focused extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Enable row-level security on sensitive tables (example)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY users_policy ON users FOR ALL TO sav3_app USING (true);

-- Audit logging setup
CREATE TABLE IF NOT EXISTS security_audit_log (
    id SERIAL PRIMARY KEY,
    event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_name TEXT,
    database_name TEXT,
    command_tag TEXT,
    object_name TEXT,
    client_addr INET,
    application_name TEXT,
    event_data TEXT
);

-- Grant audit log access to monitoring
GRANT SELECT ON security_audit_log TO sav3_readonly;

\echo 'Security initialization complete!'
