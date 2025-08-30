#!/bin/bash
# PgBouncer configuration tuning script

set -e

CONFIG_FILE=${1:-"./pgbouncer/pgbouncer-optimized.ini"}
CPU_CORES=$(nproc 2>/dev/null || echo "4")
MEMORY_GB=$(free -g 2>/dev/null | awk '/^Mem:/{print $2}' || echo "8")

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
}

calculate_optimal_settings() {
    # Calculate optimal pool sizes based on system resources
    local optimal_default_pool=$((CPU_CORES * 2))
    local optimal_max_client=$((optimal_default_pool * 10))
    local optimal_max_db=$((optimal_default_pool * 2))

    # Adjust based on memory
    if [ "$MEMORY_GB" -lt 4 ]; then
        optimal_default_pool=$((optimal_default_pool / 2))
        optimal_max_client=$((optimal_max_client / 2))
        optimal_max_db=$((optimal_max_db / 2))
    fi

    log_info "System resources detected: ${CPU_CORES} cores, ${MEMORY_GB}GB RAM"
    log_info "Recommended settings:"
    log_info "  default_pool_size: $optimal_default_pool"
    log_info "  max_client_conn: $optimal_max_client"
    log_info "  max_db_connections: $optimal_max_db"

    # Update configuration file
    if [ -f "$CONFIG_FILE" ]; then
        cp "$CONFIG_FILE" "${CONFIG_FILE}.backup"

        sed -i "s/^default_pool_size = .*/default_pool_size = $optimal_default_pool/" "$CONFIG_FILE"
        sed -i "s/^max_client_conn = .*/max_client_conn = $optimal_max_client/" "$CONFIG_FILE"
        sed -i "s/^max_db_connections = .*/max_db_connections = $optimal_max_db/" "$CONFIG_FILE"

        log_info "Configuration updated in $CONFIG_FILE"
        log_info "Backup saved as ${CONFIG_FILE}.backup"
    else
        log_error "Configuration file not found: $CONFIG_FILE"
        exit 1
    fi
}

validate_configuration() {
    log_info "Validating PgBouncer configuration..."

    if command -v pgbouncer >/dev/null; then
        if pgbouncer -t "$CONFIG_FILE" 2>/dev/null; then
            log_info "Configuration validation: PASSED"
        else
            log_error "Configuration validation: FAILED"
            exit 1
        fi
    else
        log_warn "pgbouncer command not available for validation"
    fi
}

usage() {
    echo "Usage: $0 [config-file]"
    echo "Automatically tunes PgBouncer configuration based on system resources"
    echo "Default config file: ./pgbouncer/pgbouncer-optimized.ini"
}

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

log_info "Starting PgBouncer configuration tuning..."
calculate_optimal_settings
validate_configuration
log_info "Configuration tuning completed successfully"
