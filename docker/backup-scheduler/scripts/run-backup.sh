#!/bin/bash
# pgBackRest Backup Script with comprehensive logging and error handling

set -e
trap 'log_error "Backup failed on line $LINENO"' ERR

STANZA=${PGBACKREST_STANZA:-main}
BACKUP_TYPE=${1:-diff}
LOG_FILE="/var/log/backups/backup-$(date +%Y%m%d_%H%M%S).log"

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

log_warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $1" | tee -a "$LOG_FILE"
}

# Ensure log directory exists
mkdir -p /var/log/backups

log_info "Starting $BACKUP_TYPE backup for stanza: $STANZA"

# Pre-backup checks
log_info "Running pre-backup checks..."

# Check if PostgreSQL is accessible
if ! pg_isready -h postgres-primary -p 5432 -U postgres >/dev/null 2>&1; then
    log_error "PostgreSQL is not accessible"
    exit 1
fi

# Check pgbackrest configuration
if ! pgbackrest --stanza="$STANZA" check --log-level-console=error; then
    log_error "pgBackRest configuration check failed"
    exit 1
fi

# Run backup
log_info "Starting $BACKUP_TYPE backup..."
START_TIME=$(date +%s)

case $BACKUP_TYPE in
    full)
        pgbackrest --stanza="$STANZA" --log-level-console=info backup --type=full
        ;;
    diff)
        pgbackrest --stanza="$STANZA" --log-level-console=info backup --type=diff
        ;;
    incr)
        pgbackrest --stanza="$STANZA" --log-level-console=info backup --type=incr
        ;;
    *)
        log_error "Unknown backup type: $BACKUP_TYPE"
        exit 1
        ;;
esac

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

log_info "Backup completed successfully in ${DURATION} seconds"

# Post-backup verification
log_info "Running post-backup verification..."
BACKUP_INFO=$(pgbackrest --stanza="$STANZA" info --output=json)
LATEST_BACKUP=$(echo "$BACKUP_INFO" | jq -r '.[] | select(.name=="'$STANZA'") | .backup[-1].label')

if [ -n "$LATEST_BACKUP" ]; then
    log_info "Latest backup: $LATEST_BACKUP"

    # Verify backup integrity
    if pgbackrest --stanza="$STANZA" --set="$LATEST_BACKUP" verify --log-level-console=error; then
        log_info "Backup verification successful"
    else
        log_warn "Backup verification failed"
    fi
else
    log_warn "Could not retrieve backup information"
fi

# Update health status
echo "$(date '+%Y-%m-%d %H:%M:%S'): $BACKUP_TYPE backup completed successfully" > /var/log/backups/last-backup-status
echo "$BACKUP_TYPE" > /var/log/backups/last-backup-type
echo "$END_TIME" > /var/log/backups/last-backup-timestamp

log_info "Backup process completed"
