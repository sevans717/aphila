#!/bin/bash

# Media data backup script
# Usage: ./scripts/backup-media-data.sh [backup-location]

set -e

BACKUP_LOCATION=${1:-"./backups/media"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKUP_LOCATION/$TIMESTAMP"

echo "=== SAV3 Media Backup ==="
echo "Timestamp: $(date)"
echo "Backup location: $BACKUP_DIR"
echo

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to backup MinIO data
backup_minio() {
    echo "Backing up MinIO data..."

    if docker exec sav3-minio mc alias set backup /data > /dev/null 2>&1; then
        # Export bucket data
        docker exec sav3-minio mc mirror backup/sav3-media /backup/minio/sav3-media
        docker exec sav3-minio mc mirror backup/sav3-thumbnails /backup/minio/sav3-thumbnails

        # Copy to host backup location
        docker cp sav3-minio:/backup/minio "$BACKUP_DIR/"

        echo "✓ MinIO backup complete"
    else
        echo "✗ MinIO backup failed"
        return 1
    fi
}

# Function to backup Redis data
backup_redis() {
    echo "Backing up Redis data..."

    # Force Redis to save current state
    if docker exec sav3-redis redis-cli BGSAVE > /dev/null 2>&1; then
        # Wait for background save to complete
        while [ "$(docker exec sav3-redis redis-cli LASTSAVE)" = "$(docker exec sav3-redis redis-cli LASTSAVE)" ]; do
            sleep 1
        done

        # Copy Redis dump
        docker cp sav3-redis:/data/dump.rdb "$BACKUP_DIR/redis_dump.rdb"

        echo "✓ Redis backup complete"
    else
        echo "✗ Redis backup failed"
        return 1
    fi
}

# Function to backup local uploads
backup_local_uploads() {
    echo "Backing up local uploads..."

    if [ -d "./uploads" ]; then
        cp -r ./uploads "$BACKUP_DIR/"
        echo "✓ Local uploads backup complete"
    else
        echo "ℹ No local uploads directory found"
    fi
}

# Function to backup configuration
backup_configuration() {
    echo "Backing up configuration..."

    # Copy Docker Compose files
    cp docker-compose.media.yml "$BACKUP_DIR/"

    # Copy MinIO policies
    if [ -d "./docker/minio" ]; then
        cp -r ./docker/minio "$BACKUP_DIR/"
    fi

    # Copy environment configuration
    if [ -f "./.env" ]; then
        # Copy .env but mask sensitive values
        sed 's/=.*/=***MASKED***/g' .env > "$BACKUP_DIR/.env.template"
    fi

    echo "✓ Configuration backup complete"
}

# Function to create backup metadata
create_metadata() {
    echo "Creating backup metadata..."

    cat > "$BACKUP_DIR/backup_info.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0",
  "components": {
    "minio": $(docker inspect sav3-minio --format='{{.State.Running}}' 2>/dev/null || echo false),
    "redis": $(docker inspect sav3-redis --format='{{.State.Running}}' 2>/dev/null || echo false),
    "media-proxy": $(docker inspect sav3-media-proxy --format='{{.State.Running}}' 2>/dev/null || echo false)
  },
  "sizes": {
    "minio": "$(docker exec sav3-minio du -sh /data 2>/dev/null | cut -f1 || echo 'N/A')",
    "redis": "$(docker exec sav3-redis redis-cli DBSIZE 2>/dev/null || echo 'N/A') keys"
  },
  "backup_location": "$BACKUP_DIR"
}
EOF

    echo "✓ Metadata created"
}

# Function to compress backup
compress_backup() {
    echo "Compressing backup..."

    cd "$BACKUP_LOCATION"
    tar -czf "${TIMESTAMP}.tar.gz" "$TIMESTAMP/"

    if [ $? -eq 0 ]; then
        rm -rf "$TIMESTAMP/"
        echo "✓ Backup compressed to ${BACKUP_LOCATION}/${TIMESTAMP}.tar.gz"
    else
        echo "✗ Compression failed"
        return 1
    fi
}

# Main backup process
backup_status=0

echo "Starting backup process..."
echo

# Check if media stack is running
if ! docker-compose -f docker-compose.media.yml ps | grep -q "Up"; then
    echo "⚠ Media stack is not running. Some backups may be incomplete."
fi

# Perform backups
if ! backup_minio; then
    backup_status=1
fi

if ! backup_redis; then
    backup_status=1
fi

backup_local_uploads
backup_configuration
create_metadata

# Compress if requested
if [ "$2" = "--compress" ] || [ "$2" = "-c" ]; then
    if ! compress_backup; then
        backup_status=1
    fi
fi

echo
echo "=== Backup Summary ==="
if [ $backup_status -eq 0 ]; then
    echo "✓ Backup completed successfully"
    echo "Location: $BACKUP_DIR"
else
    echo "✗ Backup completed with errors"
fi

echo
echo "To restore from this backup:"
echo "  ./scripts/restore-media-backup.sh $BACKUP_DIR"

exit $backup_status
