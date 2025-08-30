#!/bin/bash
# Database Optimization and Monitoring Script

set -e
trap 'log_error "Database optimization failed on line $LINENO"' ERR

LOG_FILE="/var/log/db-optimization-$(date +%Y%m%d_%H%M%S).log"

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

log_warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $1" | tee -a "$LOG_FILE"
}

# Database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-sav3}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

log_info "Starting database optimization for $DB_NAME"

# Function to run SQL commands
run_sql() {
    local sql="$1"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql"
}

# Function to run SQL file
run_sql_file() {
    local file="$1"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
}

# Create optimization SQL file
cat > /tmp/db_optimization.sql << 'EOF'
-- Database Optimization Script
-- This script applies various optimizations for better performance

-- 1. Update table statistics
ANALYZE;

-- 2. Vacuum tables to reclaim space and update statistics
VACUUM;

-- 3. Reindex tables (rebuilds indexes for better performance)
REINDEX DATABASE sav3;

-- 4. Optimize autovacuum settings for better maintenance
ALTER SYSTEM SET autovacuum = on;
ALTER SYSTEM SET autovacuum_max_workers = 3;
ALTER SYSTEM SET autovacuum_naptime = '20s';
ALTER SYSTEM SET autovacuum_vacuum_threshold = 50;
ALTER SYSTEM SET autovacuum_analyze_threshold = 50;
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.02;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.01;

-- 5. Optimize shared buffers (set to 25% of RAM)
-- ALTER SYSTEM SET shared_buffers = '256MB';

-- 6. Optimize work memory
ALTER SYSTEM SET work_mem = '4MB';

-- 7. Optimize maintenance work memory
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- 8. Optimize checkpoint settings
ALTER SYSTEM SET checkpoint_segments = 32;
ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- 9. Enable pg_stat_statements for query monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 10. Create monitoring views
CREATE OR REPLACE VIEW db_performance_metrics AS
SELECT
    schemaname,
    tablename,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- 11. Create index usage view
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 12. Create query performance view
CREATE OR REPLACE VIEW slow_queries AS
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows,
    temp_blks_written,
    blk_read_time,
    blk_write_time
FROM pg_stat_statements
WHERE mean_time > 1000  -- queries taking more than 1 second on average
ORDER BY mean_time DESC
LIMIT 20;

-- 13. Create connection monitoring view
CREATE OR REPLACE VIEW active_connections AS
SELECT
    datname,
    usename,
    client_addr,
    client_port,
    backend_start,
    query_start,
    state_change,
    state,
    query
FROM pg_stat_activity
WHERE state IS NOT NULL;

-- 14. Create table bloat detection view
CREATE OR REPLACE VIEW table_bloat AS
SELECT
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup,
    ROUND((n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) AS dead_tuple_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_tuple_ratio DESC;

-- 15. Create database size monitoring view
CREATE OR REPLACE VIEW database_sizes AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
                   pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 16. Optimize specific table settings for geospatial data
-- Assuming Profile table has geography column
DO $$
BEGIN
    -- Check if Profile table exists and has geography column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Profile' AND column_name = 'location'
    ) THEN
        -- Optimize for geospatial queries
        ALTER TABLE "Profile" SET (autovacuum_vacuum_scale_factor = 0.01);
        ALTER TABLE "Profile" SET (autovacuum_analyze_scale_factor = 0.005);
    END IF;
END $$;

-- 17. Create maintenance function
CREATE OR REPLACE FUNCTION perform_maintenance()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
BEGIN
    -- Analyze all tables
    ANALYZE;

    -- Vacuum all tables
    VACUUM;

    -- Reindex all indexes
    REINDEX DATABASE sav3;

    result := 'Maintenance completed at ' || now()::TEXT;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 18. Grant permissions for monitoring views
GRANT SELECT ON db_performance_metrics TO PUBLIC;
GRANT SELECT ON index_usage_stats TO PUBLIC;
GRANT SELECT ON slow_queries TO PUBLIC;
GRANT SELECT ON active_connections TO PUBLIC;
GRANT SELECT ON table_bloat TO PUBLIC;
GRANT SELECT ON database_sizes TO PUBLIC;

-- 19. Create monitoring function
CREATE OR REPLACE FUNCTION get_db_health_status()
RETURNS JSON AS $$
DECLARE
    result JSON;
    active_conn INTEGER;
    slow_query_count INTEGER;
    bloat_ratio FLOAT;
BEGIN
    -- Get active connections
    SELECT COUNT(*) INTO active_conn
    FROM pg_stat_activity
    WHERE state IS NOT NULL;

    -- Get slow queries count
    SELECT COUNT(*) INTO slow_query_count
    FROM pg_stat_statements
    WHERE mean_time > 1000;

    -- Get average bloat ratio
    SELECT COALESCE(AVG(dead_tuple_ratio), 0) INTO bloat_ratio
    FROM table_bloat;

    result := json_build_object(
        'timestamp', now(),
        'active_connections', active_conn,
        'slow_queries_count', slow_query_count,
        'avg_bloat_ratio', ROUND(bloat_ratio, 2),
        'status', CASE
            WHEN active_conn > 100 THEN 'high_load'
            WHEN slow_query_count > 10 THEN 'performance_issues'
            WHEN bloat_ratio > 20 THEN 'needs_vacuum'
            ELSE 'healthy'
        END
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 20. Reload configuration
SELECT pg_reload_conf();

EOF

log_info "Applying database optimizations..."
run_sql_file /tmp/db_optimization.sql

log_info "Database optimization completed successfully"

# Generate optimization report
log_info "Generating optimization report..."
run_sql "SELECT * FROM get_db_health_status();" > /tmp/db_health_report.json

log_info "Optimization report saved to /tmp/db_health_report.json"

# Clean up
rm /tmp/db_optimization.sql

log_info "Database optimization process completed"
