#!/bin/bash
# Backup maintenance - cleanup old logs and run health checks

set -e

LOG_DIR="/var/log/backups"
RETENTION_DAYS=${RETENTION_DAYS:-30}

# Cleanup old backup logs
find "$LOG_DIR" -name "backup-*.log" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# Cleanup old WAL archives (pgbackrest handles this, but double-check)
if command -v pgbackrest >/dev/null; then
    pgbackrest --stanza="${PGBACKREST_STANZA:-main}" expire --log-level-console=error >/dev/null 2>&1 || true
fi

# Log current backup repository status
if [ -d "/var/lib/pgbackrest" ]; then
    repo_size=$(du -sh /var/lib/pgbackrest 2>/dev/null | cut -f1 || echo "unknown")
    repo_usage=$(df /var/lib/pgbackrest | tail -1 | awk '{print $5}' || echo "unknown")

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup repo size: $repo_size, usage: $repo_usage" >> "$LOG_DIR/maintenance.log"
fi

# Rotate maintenance log
if [ -f "$LOG_DIR/maintenance.log" ] && [ $(wc -l < "$LOG_DIR/maintenance.log") -gt 1000 ]; then
    tail -500 "$LOG_DIR/maintenance.log" > "$LOG_DIR/maintenance.log.tmp"
    mv "$LOG_DIR/maintenance.log.tmp" "$LOG_DIR/maintenance.log"
fi
