#!/bin/bash
# Database Monitoring Script for Prometheus/Grafana

set -e

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-sav3}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Function to run SQL and get value
get_metric() {
    local sql="$1"
    local default="${2:-0}"
    local result

    result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$sql" 2>/dev/null | xargs)
    echo "${result:-$default}"
}

# Database connection metrics
echo "# HELP sav3_db_active_connections Number of active database connections"
echo "# TYPE sav3_db_active_connections gauge"
echo "sav3_db_active_connections $(get_metric "SELECT COUNT(*) FROM pg_stat_activity WHERE state IS NOT NULL;")"

echo "# HELP sav3_db_idle_connections Number of idle database connections"
echo "# TYPE sav3_db_idle_connections gauge"
echo "sav3_db_idle_connections $(get_metric "SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'idle';")"

# Database size metrics
echo "# HELP sav3_db_size_bytes Total database size in bytes"
echo "# TYPE sav3_db_size_bytes gauge"
DB_SIZE=$(get_metric "SELECT pg_database_size('$DB_NAME');" 0)
echo "sav3_db_size_bytes $DB_SIZE"

# Table metrics
echo "# HELP sav3_db_table_count Total number of tables"
echo "# TYPE sav3_db_table_count gauge"
TABLE_COUNT=$(get_metric "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 0)
echo "sav3_db_table_count $TABLE_COUNT"

# Index metrics
echo "# HELP sav3_db_index_count Total number of indexes"
echo "# TYPE sav3_db_index_count gauge"
INDEX_COUNT=$(get_metric "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 0)
echo "sav3_db_index_count $INDEX_COUNT"

# Slow query metrics
echo "# HELP sav3_db_slow_queries_count Number of slow queries (>1s average)"
echo "# TYPE sav3_db_slow_queries_count gauge"
SLOW_QUERIES=$(get_metric "SELECT COUNT(*) FROM pg_stat_statements WHERE mean_time > 1000;" 0)
echo "sav3_db_slow_queries_count $SLOW_QUERIES"

# Cache hit ratio
echo "# HELP sav3_db_cache_hit_ratio Database cache hit ratio (0-1)"
echo "# TYPE sav3_db_cache_hit_ratio gauge"
CACHE_HIT_RATIO=$(get_metric "SELECT ROUND(blks_hit::numeric / (blks_hit + blks_read), 4) FROM pg_stat_database WHERE datname = '$DB_NAME';" 0)
echo "sav3_db_cache_hit_ratio $CACHE_HIT_RATIO"

# Transaction metrics
echo "# HELP sav3_db_xact_commit Total transactions committed"
echo "# TYPE sav3_db_xact_commit counter"
XACT_COMMIT=$(get_metric "SELECT xact_commit FROM pg_stat_database WHERE datname = '$DB_NAME';" 0)
echo "sav3_db_xact_commit $XACT_COMMIT"

echo "# HELP sav3_db_xact_rollback Total transactions rolled back"
echo "# TYPE sav3_db_xact_rollback counter"
XACT_ROLLBACK=$(get_metric "SELECT xact_rollback FROM pg_stat_database WHERE datname = '$DB_NAME';" 0)
echo "sav3_db_xact_rollback $XACT_ROLLBACK"

# Lock metrics
echo "# HELP sav3_db_active_locks Number of active locks"
echo "# TYPE sav3_db_active_locks gauge"
ACTIVE_LOCKS=$(get_metric "SELECT COUNT(*) FROM pg_locks WHERE NOT granted;" 0)
echo "sav3_db_active_locks $ACTIVE_LOCKS"

# Replication metrics (if replica exists)
echo "# HELP sav3_db_replication_lag_seconds Replication lag in seconds"
echo "# TYPE sav3_db_replication_lag_seconds gauge"
REPLICATION_LAG=$(get_metric "SELECT EXTRACT(EPOCH FROM now() - pg_last_xact_replay_timestamp());" -1)
if [ "$REPLICATION_LAG" != "-1" ]; then
    echo "sav3_db_replication_lag_seconds $REPLICATION_LAG"
fi

# Geospatial query performance (if PostGIS is used)
if get_metric "SELECT COUNT(*) FROM pg_extension WHERE extname = 'postgis';" 0 > /dev/null; then
    echo "# HELP sav3_db_geospatial_queries_total Total geospatial queries executed"
    echo "# TYPE sav3_db_geospatial_queries_total counter"
    GEO_QUERIES=$(get_metric "SELECT calls FROM pg_stat_statements WHERE query LIKE '%ST_%' ORDER BY calls DESC LIMIT 1;" 0)
    echo "sav3_db_geospatial_queries_total $GEO_QUERIES"
fi

# Backup status
echo "# HELP sav3_db_last_backup_timestamp Timestamp of last successful backup"
echo "# TYPE sav3_db_last_backup_timestamp gauge"
if [ -f /var/log/backups/last-backup-timestamp ]; then
    LAST_BACKUP=$(cat /var/log/backups/last-backup-timestamp)
    echo "sav3_db_last_backup_timestamp $LAST_BACKUP"
else
    echo "sav3_db_last_backup_timestamp 0"
fi

# Database health score (composite metric)
echo "# HELP sav3_db_health_score Overall database health score (0-100)"
echo "# TYPE sav3_db_health_score gauge"
# Calculate health score based on various metrics
CONNECTION_RATIO=$(get_metric "SELECT ROUND((SELECT COUNT(*) FROM pg_stat_activity WHERE state IS NOT NULL)::numeric / current_setting('max_connections')::numeric * 100, 2);" 0)
CACHE_RATIO=$(echo "scale=2; $CACHE_HIT_RATIO * 100" | bc 2>/dev/null || echo "0")
HEALTH_SCORE=$(echo "scale=0; ($CONNECTION_RATIO + $CACHE_RATIO) / 2" | bc 2>/dev/null || echo "50")
echo "sav3_db_health_score $HEALTH_SCORE"
