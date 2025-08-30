#!/bin/bash
# Manual backup restoration script for disaster recovery testing

set -e

STANZA=${PGBACKREST_STANZA:-main}
RESTORE_TARGET=${1:-latest}
RESTORE_PATH=${2:-/tmp/postgres-restore-test}
TEST_MODE=${3:-true}

usage() {
    echo "Usage: $0 [backup-label|latest] [restore-path] [test-mode]"
    echo "Examples:"
    echo "  $0                                    # Restore latest to test location"
    echo "  $0 20241226-123456F                  # Restore specific backup"
    echo "  $0 latest /var/lib/postgresql/data false  # Actual restore (dangerous!)"
    exit 1
}

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# Safety check for production restores
if [ "$TEST_MODE" != "true" ] && [ "$RESTORE_PATH" = "/var/lib/postgresql/data" ]; then
    echo "WARNING: This will overwrite the production database!"
    echo "Type 'CONFIRM_PRODUCTION_RESTORE' to continue:"
    read -r confirmation
    if [ "$confirmation" != "CONFIRM_PRODUCTION_RESTORE" ]; then
        log_info "Restore cancelled"
        exit 0
    fi
fi

log_info "Starting restore process..."
log_info "Target: $RESTORE_TARGET"
log_info "Path: $RESTORE_PATH"
log_info "Test Mode: $TEST_MODE"

# Create restore directory
mkdir -p "$RESTORE_PATH"

# Get available backups
log_info "Checking available backups..."
BACKUP_INFO=$(pgbackrest --stanza="$STANZA" info --output=json)

if [ "$RESTORE_TARGET" = "latest" ]; then
    BACKUP_LABEL=$(echo "$BACKUP_INFO" | jq -r '.[] | select(.name=="'$STANZA'") | .backup[-1].label')
    log_info "Latest backup: $BACKUP_LABEL"
else
    BACKUP_LABEL="$RESTORE_TARGET"
    # Verify backup exists
    if ! echo "$BACKUP_INFO" | jq -e '.[] | select(.name=="'$STANZA'") | .backup[] | select(.label=="'$BACKUP_LABEL'")' >/dev/null; then
        log_error "Backup $BACKUP_LABEL not found"
        exit 1
    fi
fi

# Run restore
log_info "Restoring backup $BACKUP_LABEL to $RESTORE_PATH..."
START_TIME=$(date +%s)

pgbackrest --stanza="$STANZA" --set="$BACKUP_LABEL" --pg1-path="$RESTORE_PATH" restore

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
log_info "Restore completed in ${DURATION} seconds"

if [ "$TEST_MODE" = "true" ]; then
    log_info "Test restore completed successfully"
    log_info "Restored files are available at: $RESTORE_PATH"
    log_info "To clean up test restore: rm -rf $RESTORE_PATH"

    # Basic verification
    if [ -f "$RESTORE_PATH/postgresql.conf" ] && [ -f "$RESTORE_PATH/pg_hba.conf" ]; then
        log_info "Basic file verification: PASSED"
    else
        log_error "Basic file verification: FAILED"
        exit 1
    fi
else
    log_info "Production restore completed"
    log_info "You may need to update recovery.conf or postgresql.conf settings"
    log_info "Remember to restart PostgreSQL after restore"
fi

log_info "Restore process completed successfully"
