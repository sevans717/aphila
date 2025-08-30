#!/bin/bash
# ===========================================
# BACKUP MANAGEMENT FOR APHILA.IO
# ===========================================
# Manages automated backups for all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}💾 Backup Management for aphila.io${NC}"
echo "===================================="

# Configuration
BACKUP_BASE_DIR="backups"
POSTGRES_BACKUP_DIR="$BACKUP_BASE_DIR/postgres"
MINIO_BACKUP_DIR="$BACKUP_BASE_DIR/minio"
REDIS_BACKUP_DIR="$BACKUP_BASE_DIR/redis"
CONFIG_BACKUP_DIR="$BACKUP_BASE_DIR/configs"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Ensure backup directories exist
mkdir -p "$POSTGRES_BACKUP_DIR" "$MINIO_BACKUP_DIR" "$REDIS_BACKUP_DIR" "$CONFIG_BACKUP_DIR"

# Function to log messages
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Function to backup PostgreSQL
backup_postgres() {
    log "Starting PostgreSQL backup..."

    local backup_file="$POSTGRES_BACKUP_DIR/postgres-backup-$TIMESTAMP.sql"
    local backup_file_gz="$backup_file.gz"

    # Create database backup
    if docker-compose -f docker-compose.production.yml exec -T db pg_dumpall -U postgres > "$backup_file"; then
        # Compress the backup
        gzip "$backup_file"

        local size=$(du -h "$backup_file_gz" | cut -f1)
        log "✅ PostgreSQL backup completed: $backup_file_gz ($size)"

        # Test backup integrity
        if gzip -t "$backup_file_gz"; then
            log "✅ Backup file integrity verified"
        else
            log "❌ Backup file integrity check failed"
            return 1
        fi

        return 0
    else
        log "❌ PostgreSQL backup failed"
        rm -f "$backup_file" "$backup_file_gz"
        return 1
    fi
}

# Function to backup MinIO data
backup_minio() {
    log "Starting MinIO backup..."

    local backup_dir="$MINIO_BACKUP_DIR/minio-backup-$TIMESTAMP"
    mkdir -p "$backup_dir"

    # Get MinIO credentials from environment
    source .env.production

    # Configure MinIO client
    docker run --rm \
        --network sav3-backend_app-network \
        -v "$(pwd)/$backup_dir:/backup" \
        minio/mc:latest sh -c "
        mc alias set minio http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
        mc mirror minio/uploads /backup/uploads
        mc mirror minio/media /backup/media
        mc mirror minio/avatars /backup/avatars
        mc mirror minio/backups /backup/backups
    "

    if [ $? -eq 0 ]; then
        # Create tar archive
        tar -czf "$backup_dir.tar.gz" -C "$MINIO_BACKUP_DIR" "$(basename "$backup_dir")"
        rm -rf "$backup_dir"

        local size=$(du -h "$backup_dir.tar.gz" | cut -f1)
        log "✅ MinIO backup completed: $backup_dir.tar.gz ($size)"
        return 0
    else
        log "❌ MinIO backup failed"
        rm -rf "$backup_dir" "$backup_dir.tar.gz"
        return 1
    fi
}

# Function to backup Redis data
backup_redis() {
    log "Starting Redis backup..."

    local backup_file="$REDIS_BACKUP_DIR/redis-backup-$TIMESTAMP.rdb"

    # Trigger Redis save and copy RDB file
    docker-compose -f docker-compose.production.yml exec -T redis redis-cli BGSAVE

    # Wait for background save to complete
    sleep 10

    # Copy RDB file from container
    if docker cp "$(docker-compose -f docker-compose.production.yml ps -q redis):/data/dump.rdb" "$backup_file"; then
        local size=$(du -h "$backup_file" | cut -f1)
        log "✅ Redis backup completed: $backup_file ($size)"
        return 0
    else
        log "❌ Redis backup failed"
        rm -f "$backup_file"
        return 1
    fi
}

# Function to backup configurations
backup_configs() {
    log "Starting configuration backup..."

    local backup_file="$CONFIG_BACKUP_DIR/configs-backup-$TIMESTAMP.tar.gz"

    # Create tar archive of configuration files
    tar -czf "$backup_file" \
        .env.production \
        docker-compose.production.yml \
        docker/traefik/ \
        docker/postgres/ \
        docker/minio/ \
        docker/redis/ \
        docker/pgbouncer/ \
        prisma/schema.prisma \
        scripts/ \
        2>/dev/null || true

    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        log "✅ Configuration backup completed: $backup_file ($size)"
        return 0
    else
        log "❌ Configuration backup failed"
        return 1
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."

    local deleted_count=0

    for backup_dir in "$POSTGRES_BACKUP_DIR" "$MINIO_BACKUP_DIR" "$REDIS_BACKUP_DIR" "$CONFIG_BACKUP_DIR"; do
        if [ -d "$backup_dir" ]; then
            local old_files=$(find "$backup_dir" -type f -mtime +$RETENTION_DAYS)
            if [ -n "$old_files" ]; then
                echo "$old_files" | while read -r file; do
                    rm -f "$file"
                    log "🗑️  Deleted old backup: $(basename "$file")"
                    ((deleted_count++))
                done
            fi
        fi
    done

    log "✅ Cleanup completed ($deleted_count files deleted)"
}

# Function to list all backups
list_backups() {
    log "Listing all backups..."
    echo ""

    for backup_type in postgres minio redis configs; do
        backup_dir="$BACKUP_BASE_DIR/$backup_type"
        if [ -d "$backup_dir" ]; then
            echo -e "${YELLOW}📁 $backup_type backups:${NC}"
            if [ "$(ls -A "$backup_dir" 2>/dev/null)" ]; then
                ls -lah "$backup_dir" | tail -n +2 | while read -r line; do
                    echo "  $line"
                done
            else
                echo "  No backups found"
            fi
            echo ""
        fi
    done
}

# Function to restore from backup
restore_backup() {
    local backup_type="$1"
    local backup_file="$2"

    if [ -z "$backup_type" ] || [ -z "$backup_file" ]; then
        echo -e "${RED}❌ Usage: bash backup-manager.sh restore <type> <backup-file>${NC}"
        echo "Types: postgres, minio, redis, configs"
        return 1
    fi

    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ Backup file not found: $backup_file${NC}"
        return 1
    fi

    log "Starting $backup_type restore from: $backup_file"

    case "$backup_type" in
        "postgres")
            log "⚠️  This will overwrite the current database!"
            read -p "Are you sure? (type 'yes' to continue): " -r
            if [[ $REPLY != "yes" ]]; then
                log "Restore cancelled"
                return 1
            fi

            # Stop API to prevent connections
            docker-compose -f docker-compose.production.yml stop api

            # Restore database
            if [[ "$backup_file" == *.gz ]]; then
                zcat "$backup_file" | docker-compose -f docker-compose.production.yml exec -T db psql -U postgres
            else
                cat "$backup_file" | docker-compose -f docker-compose.production.yml exec -T db psql -U postgres
            fi

            # Start API
            docker-compose -f docker-compose.production.yml start api
            log "✅ PostgreSQL restore completed"
            ;;

        "minio")
            log "⚠️  This will overwrite current MinIO data!"
            read -p "Are you sure? (type 'yes' to continue): " -r
            if [[ $REPLY != "yes" ]]; then
                log "Restore cancelled"
                return 1
            fi

            # Extract backup
            local temp_dir="/tmp/minio-restore-$$"
            mkdir -p "$temp_dir"
            tar -xzf "$backup_file" -C "$temp_dir"

            # Restore data using MinIO client
            source .env.production
            docker run --rm \
                --network sav3-backend_app-network \
                -v "$temp_dir:/restore" \
                minio/mc:latest sh -c "
                mc alias set minio http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
                mc mirror /restore/*/uploads minio/uploads
                mc mirror /restore/*/media minio/media
                mc mirror /restore/*/avatars minio/avatars
                mc mirror /restore/*/backups minio/backups
            "

            rm -rf "$temp_dir"
            log "✅ MinIO restore completed"
            ;;

        "redis")
            log "⚠️  This will overwrite current Redis data!"
            read -p "Are you sure? (type 'yes' to continue): " -r
            if [[ $REPLY != "yes" ]]; then
                log "Restore cancelled"
                return 1
            fi

            # Stop Redis, replace RDB file, start Redis
            docker-compose -f docker-compose.production.yml stop redis
            docker cp "$backup_file" "$(docker-compose -f docker-compose.production.yml ps -q redis):/data/dump.rdb"
            docker-compose -f docker-compose.production.yml start redis
            log "✅ Redis restore completed"
            ;;

        "configs")
            log "⚠️  This will overwrite current configuration files!"
            read -p "Are you sure? (type 'yes' to continue): " -r
            if [[ $REPLY != "yes" ]]; then
                log "Restore cancelled"
                return 1
            fi

            # Extract configuration backup
            tar -xzf "$backup_file"
            log "✅ Configuration restore completed"
            log "💡 Restart services to apply restored configurations"
            ;;

        *)
            echo -e "${RED}❌ Unknown backup type: $backup_type${NC}"
            return 1
            ;;
    esac
}

# Function to check backup health
check_backup_health() {
    log "Checking backup health..."
    echo ""

    local issues=0

    # Check if backup directories exist and are writable
    for dir in "$POSTGRES_BACKUP_DIR" "$MINIO_BACKUP_DIR" "$REDIS_BACKUP_DIR" "$CONFIG_BACKUP_DIR"; do
        if [ ! -d "$dir" ]; then
            echo -e "${RED}❌ Backup directory missing: $dir${NC}"
            ((issues++))
        elif [ ! -w "$dir" ]; then
            echo -e "${RED}❌ Backup directory not writable: $dir${NC}"
            ((issues++))
        else
            echo -e "${GREEN}✅ Backup directory OK: $dir${NC}"
        fi
    done

    # Check recent backup files
    local cutoff_time=$(($(date +%s) - 86400 * 3)) # 3 days ago

    for backup_type in postgres minio redis configs; do
        backup_dir="$BACKUP_BASE_DIR/$backup_type"
        if [ -d "$backup_dir" ]; then
            recent_backup=$(find "$backup_dir" -type f -newer <(date -d "3 days ago" +%Y%m%d) | head -1)
            if [ -n "$recent_backup" ]; then
                echo -e "${GREEN}✅ Recent $backup_type backup found${NC}"
            else
                echo -e "${YELLOW}⚠️  No recent $backup_type backup (last 3 days)${NC}"
                ((issues++))
            fi
        fi
    done

    echo ""
    if [ $issues -eq 0 ]; then
        echo -e "${GREEN}✅ All backup health checks passed!${NC}"
    else
        echo -e "${RED}❌ Found $issues backup health issues${NC}"
    fi

    return $issues
}

# Main command handling
case "${1:-backup}" in
    "backup"|"full")
        log "Starting full backup process..."

        failed_backups=0

        if ! backup_postgres; then ((failed_backups++)); fi
        if ! backup_minio; then ((failed_backups++)); fi
        if ! backup_redis; then ((failed_backups++)); fi
        if ! backup_configs; then ((failed_backups++)); fi

        cleanup_old_backups

        echo ""
        if [ $failed_backups -eq 0 ]; then
            log "🎉 Full backup completed successfully!"
        else
            log "⚠️  Backup completed with $failed_backups failures"
        fi
        ;;

    "postgres")
        backup_postgres
        ;;

    "minio")
        backup_minio
        ;;

    "redis")
        backup_redis
        ;;

    "configs")
        backup_configs
        ;;

    "list")
        list_backups
        ;;

    "cleanup")
        cleanup_old_backups
        ;;

    "restore")
        restore_backup "$2" "$3"
        ;;

    "health")
        check_backup_health
        ;;

    "help"|"--help"|"-h")
        echo "Backup Manager for aphila.io"
        echo "Usage: bash backup-manager.sh [command] [options]"
        echo ""
        echo "Commands:"
        echo "  backup, full  Create full backup of all services (default)"
        echo "  postgres      Backup PostgreSQL database only"
        echo "  minio         Backup MinIO object storage only"
        echo "  redis         Backup Redis data only"
        echo "  configs       Backup configuration files only"
        echo "  list          List all available backups"
        echo "  cleanup       Remove backups older than $RETENTION_DAYS days"
        echo "  restore       Restore from backup"
        echo "  health        Check backup system health"
        echo "  help          Show this help message"
        echo ""
        echo "Examples:"
        echo "  bash backup-manager.sh backup"
        echo "  bash backup-manager.sh postgres"
        echo "  bash backup-manager.sh restore postgres backups/postgres/postgres-backup-20240101-120000.sql.gz"
        echo "  bash backup-manager.sh list"
        echo "  bash backup-manager.sh health"
        ;;

    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo -e "${YELLOW}💡 Run 'bash backup-manager.sh help' for usage information${NC}"
        exit 1
        ;;
esac
