#!/bin/bash
# Collect PgBouncer metrics periodically

set -e

PGBOUNCER_HOST=${PGBOUNCER_HOST:-pgbouncer}
PGBOUNCER_PORT=${PGBOUNCER_PORT:-6432}
PGBOUNCER_USER=${PGBOUNCER_USER:-postgres}
PGBOUNCER_PASSWORD=${PGBOUNCER_PASSWORD:-postgres}
MONITOR_INTERVAL=${MONITOR_INTERVAL:-30}
METRICS_FILE="/tmp/pgbouncer-metrics.log"

collect_metrics() {
    local timestamp=$(date -Iseconds)

    # Collect pool statistics
    local pools_output=$(psql -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" -d pgbouncer -c "SHOW POOLS;" -t 2>/dev/null || echo "")

    # Collect stats
    local stats_output=$(psql -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" -d pgbouncer -c "SHOW STATS;" -t 2>/dev/null || echo "")

    # Log metrics
    echo "[$timestamp] POOLS:" >> "$METRICS_FILE"
    echo "$pools_output" >> "$METRICS_FILE"
    echo "[$timestamp] STATS:" >> "$METRICS_FILE"
    echo "$stats_output" >> "$METRICS_FILE"
    echo "---" >> "$METRICS_FILE"

    # Rotate log if it gets too large
    if [ -f "$METRICS_FILE" ] && [ $(wc -l < "$METRICS_FILE") -gt 1000 ]; then
        tail -500 "$METRICS_FILE" > "$METRICS_FILE.tmp"
        mv "$METRICS_FILE.tmp" "$METRICS_FILE"
    fi
}

echo "Starting PgBouncer metrics collection (interval: ${MONITOR_INTERVAL}s)"

while true; do
    collect_metrics
    sleep "$MONITOR_INTERVAL"
done
