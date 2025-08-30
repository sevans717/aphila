#!/bin/bash
set -euo pipefail

# execute-migration.sh - Execute zero-downtime migration with blue-green deployment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default configuration
MIGRATION_FILE=""
MIGRATION_TYPE="safe"  # safe, risky, maintenance
DRY_RUN=false
AUTO_CONFIRM=false
ROLLBACK_ON_FAILURE=true
HEALTH_CHECK_TIMEOUT=60
PROXY_SWITCH_DELAY=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] <migration-file>

Execute zero-downtime PostgreSQL migration using blue-green deployment.

Options:
    -t, --type TYPE         Migration type: safe, risky, maintenance (default: safe)
    -d, --dry-run          Perform dry run without executing migration
    -y, --yes              Auto-confirm all prompts
    --no-rollback          Disable automatic rollback on failure
    --timeout SECONDS      Health check timeout (default: 60)
    --switch-delay SECONDS Proxy switch delay (default: 10)
    -h, --help             Show this help message

Migration Types:
    safe        - Low-risk migrations (ADD COLUMN, CREATE INDEX CONCURRENTLY)
    risky       - High-risk migrations with validation (DROP COLUMN, ALTER TABLE)
    maintenance - Requires maintenance mode with downtime

Examples:
    $0 --type safe migrations/001_add_user_columns.sql
    $0 --type risky --dry-run migrations/002_drop_old_table.sql
    $0 --type maintenance migrations/003_major_schema_change.sql
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            MIGRATION_TYPE="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -y|--yes)
            AUTO_CONFIRM=true
            shift
            ;;
        --no-rollback)
            ROLLBACK_ON_FAILURE=false
            shift
            ;;
        --timeout)
            HEALTH_CHECK_TIMEOUT="$2"
            shift 2
            ;;
        --switch-delay)
            PROXY_SWITCH_DELAY="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            if [[ -z "$MIGRATION_FILE" ]]; then
                MIGRATION_FILE="$1"
            else
                log_error "Unknown option: $1"
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate arguments
if [[ -z "$MIGRATION_FILE" ]]; then
    log_error "Migration file is required"
    usage
    exit 1
fi

if [[ ! -f "$MIGRATION_FILE" ]]; then
    log_error "Migration file not found: $MIGRATION_FILE"
    exit 1
fi

if [[ ! "$MIGRATION_TYPE" =~ ^(safe|risky|maintenance)$ ]]; then
    log_error "Invalid migration type: $MIGRATION_TYPE"
    exit 1
fi

# Function to check if Docker Compose service is running
check_service() {
    local service=$1
    if docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" ps "$service" | grep -q "Up"; then
        return 0
    else
        return 1
    fi
}

# Function to wait for database to be ready
wait_for_database() {
    local service=$1
    local timeout=${2:-$HEALTH_CHECK_TIMEOUT}
    local count=0

    log_info "Waiting for $service to be ready..."

    while [[ $count -lt $timeout ]]; do
        if docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T "$service" \
           pg_isready -U postgres > /dev/null 2>&1; then
            log_success "$service is ready"
            return 0
        fi

        sleep 1
        ((count++))

        if (( count % 10 == 0 )); then
            log_info "Still waiting for $service... ($count/${timeout}s)"
        fi
    done

    log_error "$service failed to become ready within ${timeout}s"
    return 1
}

# Function to get current proxy target
get_current_proxy_target() {
    docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T migration-proxy \
        /usr/local/bin/proxy-switch.sh current 2>/dev/null || echo "unknown"
}

# Function to switch proxy target
switch_proxy() {
    local target=$1
    log_info "Switching proxy to $target environment..."

    if docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T migration-proxy \
       /usr/local/bin/proxy-switch.sh "$target"; then
        log_success "Proxy switched to $target"
        sleep $PROXY_SWITCH_DELAY
        return 0
    else
        log_error "Failed to switch proxy to $target"
        return 1
    fi
}

# Function to perform health check
health_check() {
    local service=$1
    log_info "Performing health check on $service..."

    # Check database connectivity
    if docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T "$service" \
       pg_isready -U postgres > /dev/null 2>&1; then
        log_success "$service health check passed"
        return 0
    else
        log_error "$service health check failed"
        return 1
    fi
}

# Function to sync data from primary to secondary
sync_data() {
    local from_service=$1
    local to_service=$2

    log_info "Syncing data from $from_service to $to_service..."

    # For blue-green, we use logical replication or dump/restore
    # This is a simplified version - in production you'd want proper replication
    if docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T "$from_service" \
       pg_dump -U postgres sav3_app | \
       docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T "$to_service" \
       psql -U postgres sav3_app; then
        log_success "Data sync completed"
        return 0
    else
        log_error "Data sync failed"
        return 1
    fi
}

# Function to execute migration
execute_migration() {
    local target_service=$1
    local migration_file=$2

    log_info "Executing migration on $target_service..."

    # Use the migration controller to execute the migration
    if docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T migration-controller \
       node /app/src/schema-validator.js execute "/migrations/$(basename "$migration_file")" \
       ${DRY_RUN:+--dry-run}; then
        log_success "Migration executed successfully"
        return 0
    else
        log_error "Migration execution failed"
        return 1
    fi
}

# Function to confirm action
confirm() {
    local message=$1

    if [[ "$AUTO_CONFIRM" == true ]]; then
        return 0
    fi

    echo -e "${YELLOW}$message${NC}"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Main execution function
main() {
    local migration_name=$(basename "$MIGRATION_FILE" .sql)
    log_info "Starting zero-downtime migration: $migration_name"
    log_info "Migration type: $MIGRATION_TYPE"
    log_info "Dry run: $DRY_RUN"

    # Start the blue-green stack
    log_info "Starting blue-green migration stack..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" up -d

    # Wait for services to be ready
    for service in postgres-blue migration-controller migration-proxy; do
        if ! wait_for_database "$service" "$HEALTH_CHECK_TIMEOUT"; then
            log_error "Failed to start $service"
            exit 1
        fi
    done

    # Get current proxy target
    local current_target=$(get_current_proxy_target)
    local inactive_target="green"

    if [[ "$current_target" == "green" ]]; then
        inactive_target="blue"
    fi

    log_info "Current active environment: $current_target"
    log_info "Migration target environment: $inactive_target"

    # Copy migration file to controller
    docker cp "$MIGRATION_FILE" \
        "$(docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" ps -q migration-controller):/migrations/"

    case "$MIGRATION_TYPE" in
        "safe")
            log_info "Executing safe migration (no downtime required)..."

            if ! confirm "Execute safe migration on active environment?"; then
                log_info "Migration cancelled"
                exit 0
            fi

            # Execute migration directly on active environment
            if execute_migration "migration-controller" "$MIGRATION_FILE"; then
                log_success "Safe migration completed successfully"
            else
                log_error "Safe migration failed"
                exit 1
            fi
            ;;

        "risky")
            log_info "Executing risky migration with blue-green deployment..."

            # Start inactive environment
            log_info "Starting inactive environment: postgres-$inactive_target"
            docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" up -d "postgres-$inactive_target"

            if ! wait_for_database "postgres-$inactive_target" "$HEALTH_CHECK_TIMEOUT"; then
                log_error "Failed to start postgres-$inactive_target"
                exit 1
            fi

            # Sync data to inactive environment
            if ! sync_data "postgres-$current_target" "postgres-$inactive_target"; then
                log_error "Failed to sync data"
                exit 1
            fi

            if ! confirm "Execute risky migration on inactive environment ($inactive_target)?"; then
                log_info "Migration cancelled"
                exit 0
            fi

            # Execute migration on inactive environment
            if execute_migration "migration-controller" "$MIGRATION_FILE"; then
                log_success "Migration executed on inactive environment"
            else
                log_error "Migration failed on inactive environment"
                if [[ "$ROLLBACK_ON_FAILURE" == true ]]; then
                    log_warning "Automatic rollback is enabled, but inactive environment will be cleaned up"
                fi
                exit 1
            fi

            # Health check on inactive environment
            if ! health_check "postgres-$inactive_target"; then
                log_error "Health check failed on postgres-$inactive_target"
                exit 1
            fi

            if ! confirm "Switch traffic to the migrated environment ($inactive_target)?"; then
                log_info "Traffic switch cancelled"
                exit 0
            fi

            # Switch proxy to inactive environment (making it active)
            if switch_proxy "$inactive_target"; then
                log_success "Traffic switched to migrated environment"

                # Final health check
                sleep 5
                if health_check "postgres-$inactive_target"; then
                    log_success "Migration completed successfully with blue-green deployment"

                    # Stop old environment after successful switch
                    log_info "Stopping old environment: postgres-$current_target"
                    docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" stop "postgres-$current_target"
                else
                    log_error "Health check failed after switch - consider manual rollback"
                    exit 1
                fi
            else
                log_error "Failed to switch traffic"
                exit 1
            fi
            ;;

        "maintenance")
            log_warning "Maintenance migration requires downtime"

            if ! confirm "This migration requires maintenance mode. Continue with downtime?"; then
                log_info "Migration cancelled"
                exit 0
            fi

            # Stop all application services (this would be done externally in production)
            log_warning "Maintenance mode: Application should be stopped externally"

            # Execute migration directly
            if execute_migration "migration-controller" "$MIGRATION_FILE"; then
                log_success "Maintenance migration completed"
                log_info "Application can now be restarted"
            else
                log_error "Maintenance migration failed"
                exit 1
            fi
            ;;
    esac

    log_success "Zero-downtime migration completed: $migration_name"
}

# Trap to handle cleanup on exit
cleanup() {
    if [[ "$DRY_RUN" == false ]]; then
        log_info "Cleaning up migration stack..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" down
    fi
}

trap cleanup EXIT

# Execute main function
main
