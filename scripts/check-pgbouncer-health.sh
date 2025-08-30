#!/bin/bash
# PgBouncer health check and monitoring script

set -e

PGBOUNCER_HOST=${PGBOUNCER_HOST:-localhost}
PGBOUNCER_PORT=${PGBOUNCER_PORT:-6432}
PGBOUNCER_USER=${PGBOUNCER_USER:-postgres}
HEALTH_ENDPOINT=${HEALTH_ENDPOINT:-http://localhost:8081}

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

log_warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $1"
}

# Check PgBouncer connectivity
log_info "Checking PgBouncer connectivity..."
if pg_isready -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" >/dev/null 2>&1; then
    log_info "PgBouncer: ACCESSIBLE"
else
    log_error "PgBouncer: NOT ACCESSIBLE"
    exit 1
fi

# Get PgBouncer statistics
log_info "Retrieving PgBouncer statistics..."

echo "=== POOLS ==="
psql -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" -d pgbouncer -c "SHOW POOLS;" || log_error "Failed to show pools"

echo -e "\n=== CLIENTS ==="
psql -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" -d pgbouncer -c "SHOW CLIENTS;" | head -20 || log_error "Failed to show clients"

echo -e "\n=== SERVERS ==="
psql -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" -d pgbouncer -c "SHOW SERVERS;" || log_error "Failed to show servers"

echo -e "\n=== DATABASES ==="
psql -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" -d pgbouncer -c "SHOW DATABASES;" || log_error "Failed to show databases"

echo -e "\n=== STATS ==="
psql -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" -d pgbouncer -c "SHOW STATS;" || log_error "Failed to show stats"

echo -e "\n=== CONFIG ==="
psql -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" -d pgbouncer -c "SHOW CONFIG;" || log_error "Failed to show config"

# Check monitoring endpoint
if command -v curl >/dev/null; then
    log_info "Checking monitoring endpoint..."
    if curl -s -f "$HEALTH_ENDPOINT" >/dev/null 2>&1; then
        log_info "Monitoring endpoint: ACCESSIBLE"
        echo -e "\n=== MONITORING ENDPOINT ==="
        curl -s "$HEALTH_ENDPOINT" | jq . 2>/dev/null || curl -s "$HEALTH_ENDPOINT"
    else
        log_warn "Monitoring endpoint: NOT ACCESSIBLE"
    fi
fi

log_info "PgBouncer health check completed"
