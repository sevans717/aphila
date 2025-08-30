#!/bin/bash
# PgBouncer health monitoring HTTP server

set -e

PGBOUNCER_HOST=${PGBOUNCER_HOST:-pgbouncer}
PGBOUNCER_PORT=${PGBOUNCER_PORT:-6432}
PGBOUNCER_USER=${PGBOUNCER_USER:-postgres}
PGBOUNCER_PASSWORD=${PGBOUNCER_PASSWORD:-postgres}
PORT=${MONITOR_PORT:-8080}

get_pgbouncer_stats() {
    local stats_json='{"status":"unknown","pools":[],"clients":[],"servers":[],"databases":[]}'

    # Check if PgBouncer is accessible
    if ! pg_isready -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" >/dev/null 2>&1; then
        echo '{"status":"unhealthy","error":"PgBouncer not accessible","timestamp":"'$(date -Iseconds)'"}'
        return
    fi

    # Get pool statistics
    local pools=$(psql -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" -d pgbouncer -t -c "SHOW POOLS;" 2>/dev/null | sed '/^$/d' | wc -l || echo "0")

    # Get client connections
    local clients=$(psql -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" -d pgbouncer -t -c "SHOW CLIENTS;" 2>/dev/null | sed '/^$/d' | wc -l || echo "0")

    # Get server connections
    local servers=$(psql -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" -d pgbouncer -t -c "SHOW SERVERS;" 2>/dev/null | sed '/^$/d' | wc -l || echo "0")

    # Get database info
    local databases=$(psql -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" -d pgbouncer -t -c "SHOW DATABASES;" 2>/dev/null | sed '/^$/d' | wc -l || echo "0")

    # Get detailed pool information
    local pool_details=$(psql -h "$PGBOUNCER_HOST" -p "$PGBOUNCER_PORT" -U "$PGBOUNCER_USER" -d pgbouncer -t -c "SHOW POOLS;" 2>/dev/null | head -10 || echo "")

    # Check for any error conditions
    local status="healthy"
    local messages=()

    if [ "$clients" -gt 180 ]; then  # 90% of max_client_conn (200)
        status="warning"
        messages+=("High client connection count: $clients")
    fi

    if [ "$servers" -gt 45 ]; then  # 90% of max_db_connections (50)
        status="warning"
        messages+=("High server connection count: $servers")
    fi

    # Format response
    local message_json='[]'
    if [ ${#messages[@]} -gt 0 ]; then
        message_json=$(printf '%s\n' "${messages[@]}" | jq -R . | jq -s .)
    fi

    echo '{
        "status":"'$status'",
        "timestamp":"'$(date -Iseconds)'",
        "pools":'$pools',
        "clients":'$clients',
        "servers":'$servers',
        "databases":'$databases',
        "messages":'$message_json',
        "pool_details":"'$(echo "$pool_details" | tr '\n' ' ' | sed 's/"/\\"/g')'"
    }'
}

# Simple HTTP server
while true; do
    health_json=$(get_pgbouncer_stats)

    response="HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${#health_json}\r\nConnection: close\r\n\r\n$health_json"

    echo -e "$response" | nc -l -p $PORT -q 1

    sleep 1
done
