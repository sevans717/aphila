#!/bin/bash
# Backup health verification script

set -e

STANZA=${PGBACKREST_STANZA:-main}
HEALTH_ENDPOINT=${BACKUP_HEALTH_ENDPOINT:-http://localhost:8080}

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

log_warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $1"
}

# Check backup scheduler health endpoint
log_info "Checking backup scheduler health..."
if curl -s -f "$HEALTH_ENDPOINT" >/dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s "$HEALTH_ENDPOINT")
    HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status')

    case $HEALTH_STATUS in
        "healthy")
            log_info "Backup scheduler: HEALTHY"
            ;;
        "warning")
            log_warn "Backup scheduler: WARNING"
            echo "$HEALTH_RESPONSE" | jq -r '.messages[]' | while read -r msg; do
                log_warn "  $msg"
            done
            ;;
        "unhealthy")
            log_error "Backup scheduler: UNHEALTHY"
            echo "$HEALTH_RESPONSE" | jq -r '.messages[]' | while read -r msg; do
                log_error "  $msg"
            done
            ;;
        *)
            log_warn "Backup scheduler: UNKNOWN STATUS"
            ;;
    esac
else
    log_error "Backup scheduler health endpoint not accessible"
fi

# Check pgbackrest configuration
log_info "Checking pgBackRest configuration..."
if pgbackrest --stanza="$STANZA" check --log-level-console=error; then
    log_info "pgBackRest configuration: VALID"
else
    log_error "pgBackRest configuration: INVALID"
fi

# Get backup information
log_info "Retrieving backup information..."
if BACKUP_INFO=$(pgbackrest --stanza="$STANZA" info --output=json 2>/dev/null); then
    BACKUP_COUNT=$(echo "$BACKUP_INFO" | jq -r '.[] | select(.name=="'$STANZA'") | .backup | length')
    LATEST_BACKUP=$(echo "$BACKUP_INFO" | jq -r '.[] | select(.name=="'$STANZA'") | .backup[-1] | .label + " (" + .type + ")"')
    LATEST_BACKUP_TIME=$(echo "$BACKUP_INFO" | jq -r '.[] | select(.name=="'$STANZA'") | .backup[-1] | .timestamp.stop')

    log_info "Total backups: $BACKUP_COUNT"
    log_info "Latest backup: $LATEST_BACKUP"
    log_info "Latest backup time: $LATEST_BACKUP_TIME"

    # Check backup age
    if command -v date >/dev/null && [ -n "$LATEST_BACKUP_TIME" ]; then
        LATEST_EPOCH=$(date -d "$LATEST_BACKUP_TIME" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "$LATEST_BACKUP_TIME" +%s 2>/dev/null || echo "0")
        CURRENT_EPOCH=$(date +%s)
        AGE_HOURS=$(( (CURRENT_EPOCH - LATEST_EPOCH) / 3600 ))

        if [ $AGE_HOURS -gt 25 ]; then
            log_warn "Latest backup is $AGE_HOURS hours old (>25 hours)"
        else
            log_info "Latest backup age: $AGE_HOURS hours"
        fi
    fi
else
    log_error "Could not retrieve backup information"
fi

# Check repository space
log_info "Checking backup repository space..."
if [ -d "/var/lib/pgbackrest" ]; then
    REPO_SIZE=$(du -sh /var/lib/pgbackrest 2>/dev/null | cut -f1 || echo "unknown")
    REPO_USAGE=$(df /var/lib/pgbackrest 2>/dev/null | tail -1 | awk '{print $5}' | sed 's/%//' || echo "0")

    log_info "Repository size: $REPO_SIZE"
    log_info "Repository usage: ${REPO_USAGE}%"

    if [ "$REPO_USAGE" -gt 90 ]; then
        log_error "Repository usage is critically high (${REPO_USAGE}%)"
    elif [ "$REPO_USAGE" -gt 80 ]; then
        log_warn "Repository usage is high (${REPO_USAGE}%)"
    fi
fi

log_info "Backup health check completed"
