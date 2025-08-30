#!/bin/bash
set -euo pipefail

# check-migration-health.sh - Comprehensive health checks for migration infrastructure

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check results
HEALTH_STATUS=0
CHECKS_PASSED=0
CHECKS_FAILED=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((CHECKS_PASSED++))
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((CHECKS_FAILED++))
    HEALTH_STATUS=1
}

# Function to check if a service is running
check_service_running() {
    local service=$1
    local description=$2

    if docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" ps "$service" 2>/dev/null | grep -q "Up"; then
        log_success "$description is running"
        return 0
    else
        log_error "$description is not running"
        return 1
    fi
}

# Function to check database connectivity
check_database_connectivity() {
    local service=$1
    local description=$2

    if docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T "$service" \
       pg_isready -U postgres >/dev/null 2>&1; then
        log_success "$description database connectivity"
        return 0
    else
        log_error "$description database connectivity failed"
        return 1
    fi
}

# Function to check database version and configuration
check_database_config() {
    local service=$1
    local description=$2

    local version=$(docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T "$service" \
                   psql -U postgres -t -c "SELECT version();" 2>/dev/null | head -n 1 | xargs)

    if [[ -n "$version" ]]; then
        log_success "$description version: $(echo "$version" | cut -d' ' -f1-3)"

        # Check important settings
        local max_connections=$(docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T "$service" \
                               psql -U postgres -t -c "SHOW max_connections;" 2>/dev/null | xargs)
        local shared_buffers=$(docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T "$service" \
                              psql -U postgres -t -c "SHOW shared_buffers;" 2>/dev/null | xargs)

        if [[ -n "$max_connections" && -n "$shared_buffers" ]]; then
            log_info "$description config: max_connections=$max_connections, shared_buffers=$shared_buffers"
        fi

        return 0
    else
        log_error "$description configuration check failed"
        return 1
    fi
}

# Function to check proxy status
check_proxy_status() {
    if docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T migration-proxy \
       curl -sf http://localhost:8080/health >/dev/null 2>&1; then

        local current_target=$(docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T migration-proxy \
                              /usr/local/bin/proxy-switch.sh current 2>/dev/null | tr -d '\r')

        log_success "Migration proxy health check"
        log_info "Current proxy target: $current_target"

        # Check proxy status endpoint
        local status=$(docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T migration-proxy \
                      curl -s http://localhost:8080/status 2>/dev/null || echo "{}")

        if [[ "$status" != "{}" ]]; then
            log_info "Proxy status: $status"
        fi

        return 0
    else
        log_error "Migration proxy health check failed"
        return 1
    fi
}

# Function to check migration controller
check_migration_controller() {
    # Check if migration controller is running
    if ! check_service_running "migration-controller" "Migration Controller"; then
        return 1
    fi

    # Check if migration controller can connect to database
    if docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T migration-controller \
       node -e "const {Client} = require('pg'); const client = new Client({host: process.env.DB_HOST, user: 'postgres', database: 'postgres', password: process.env.DB_PASSWORD}); client.connect().then(() => { console.log('OK'); client.end(); }).catch(e => process.exit(1));" >/dev/null 2>&1; then
        log_success "Migration controller database connectivity"
        return 0
    else
        log_error "Migration controller database connectivity failed"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    local min_free_gb=5

    # Check Docker volumes disk space
    local volumes_info=$(docker system df -v 2>/dev/null | grep -E "postgres|migration" || true)

    if [[ -n "$volumes_info" ]]; then
        log_info "Docker volumes disk usage:"
        echo "$volumes_info" | while read -r line; do
            log_info "  $line"
        done
    fi

    # Check host disk space (approximate)
    local available_space=$(df /var/lib/docker 2>/dev/null | awk 'NR==2 {print int($4/1024/1024)}' || echo "unknown")

    if [[ "$available_space" != "unknown" ]]; then
        if [[ $available_space -gt $min_free_gb ]]; then
            log_success "Sufficient disk space available: ${available_space}GB"
        else
            log_warning "Low disk space: ${available_space}GB (recommend >=${min_free_gb}GB)"
        fi
    else
        log_warning "Unable to determine available disk space"
    fi
}

# Function to check network connectivity between services
check_network_connectivity() {
    log_info "Checking network connectivity between services..."

    # Test proxy -> database connections
    local proxy_to_blue=$(docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T migration-proxy \
                         nc -z postgres-blue 5432 2>/dev/null && echo "OK" || echo "FAIL")

    if [[ "$proxy_to_blue" == "OK" ]]; then
        log_success "Proxy -> Blue database connectivity"
    else
        log_error "Proxy -> Blue database connectivity failed"
    fi

    # Test controller -> database connections
    local controller_to_blue=$(docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T migration-controller \
                              nc -z postgres-blue 5432 2>/dev/null && echo "OK" || echo "FAIL")

    if [[ "$controller_to_blue" == "OK" ]]; then
        log_success "Controller -> Blue database connectivity"
    else
        log_error "Controller -> Blue database connectivity failed"
    fi
}

# Function to check backup and rollback capabilities
check_backup_rollback() {
    log_info "Checking backup and rollback capabilities..."

    # Check if backup directory exists and is writable
    local backup_test=$(docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T migration-controller \
                       touch /var/lib/postgresql/backups/test-write 2>/dev/null && \
                       rm /var/lib/postgresql/backups/test-write 2>/dev/null && echo "OK" || echo "FAIL")

    if [[ "$backup_test" == "OK" ]]; then
        log_success "Backup directory is writable"
    else
        log_error "Backup directory is not writable"
    fi

    # Check pg_dump availability
    if docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T postgres-blue \
       which pg_dump >/dev/null 2>&1; then
        log_success "pg_dump is available for backups"
    else
        log_error "pg_dump is not available"
    fi
}

# Function to check environment variables
check_environment_variables() {
    log_info "Checking environment variables..."

    local required_vars=("DB_HOST" "DB_PASSWORD" "DB_NAME" "DB_USER")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T migration-controller \
           printenv "$var" >/dev/null 2>&1; then
            log_success "Environment variable $var is set"
        else
            log_error "Environment variable $var is not set"
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -eq 0 ]]; then
        log_success "All required environment variables are set"
    else
        log_error "Missing environment variables: ${missing_vars[*]}"
    fi
}

# Function to run performance test
run_performance_test() {
    log_info "Running basic performance test..."

    # Simple connection performance test
    local start_time=$(date +%s%N)

    if docker-compose -f "$PROJECT_ROOT/docker-compose.migrations.yml" exec -T postgres-blue \
       psql -U postgres -c "SELECT 1;" >/dev/null 2>&1; then

        local end_time=$(date +%s%N)
        local duration_ms=$(( (end_time - start_time) / 1000000 ))

        if [[ $duration_ms -lt 1000 ]]; then
            log_success "Database response time: ${duration_ms}ms"
        elif [[ $duration_ms -lt 5000 ]]; then
            log_warning "Database response time: ${duration_ms}ms (slower than expected)"
        else
            log_error "Database response time: ${duration_ms}ms (too slow)"
        fi
    else
        log_error "Performance test failed - unable to connect"
    fi
}

# Main health check function
main() {
    echo "==============================================="
    echo "Zero-Downtime Migration Infrastructure Health Check"
    echo "==============================================="
    echo ""

    # Check if migration stack is running
    log_info "Checking migration infrastructure services..."

    # Core services
    check_service_running "postgres-blue" "Blue Database"
    check_service_running "migration-controller" "Migration Controller"
    check_service_running "migration-proxy" "Migration Proxy"

    echo ""
    log_info "Checking database connectivity and configuration..."

    # Database checks
    check_database_connectivity "postgres-blue" "Blue Database"
    check_database_config "postgres-blue" "Blue Database"

    echo ""
    log_info "Checking migration-specific components..."

    # Migration-specific checks
    check_proxy_status
    check_migration_controller
    check_backup_rollback

    echo ""
    log_info "Checking system resources and connectivity..."

    # System checks
    check_disk_space
    check_network_connectivity
    check_environment_variables

    echo ""
    log_info "Running performance tests..."

    # Performance checks
    run_performance_test

    # Summary
    echo ""
    echo "==============================================="
    echo "Health Check Summary"
    echo "==============================================="

    if [[ $HEALTH_STATUS -eq 0 ]]; then
        log_success "All health checks passed ($CHECKS_PASSED/$((CHECKS_PASSED + CHECKS_FAILED)))"
        echo ""
        echo "✅ Migration infrastructure is healthy and ready for use"
    else
        log_error "Some health checks failed ($CHECKS_FAILED/$((CHECKS_PASSED + CHECKS_FAILED)) failed)"
        echo ""
        echo "❌ Migration infrastructure has issues that should be resolved"
        echo ""
        echo "Recommended actions:"
        echo "1. Review failed checks above"
        echo "2. Check Docker Compose logs: docker-compose -f docker-compose.migrations.yml logs"
        echo "3. Restart services if needed: docker-compose -f docker-compose.migrations.yml restart"
        echo "4. Verify environment configuration"
    fi

    exit $HEALTH_STATUS
}

# Show usage if help requested
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    cat << EOF
Usage: $0 [OPTIONS]

Perform comprehensive health checks on the zero-downtime migration infrastructure.

This script checks:
- Service availability and status
- Database connectivity and configuration
- Migration proxy functionality
- Backup and rollback capabilities
- Network connectivity between services
- System resources (disk space)
- Environment variables
- Basic performance metrics

Exit codes:
  0 - All health checks passed
  1 - One or more health checks failed

Examples:
  $0                    # Run all health checks
  $0 --help            # Show this help message
EOF
    exit 0
fi

# Execute main function
main
