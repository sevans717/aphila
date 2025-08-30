#!/bin/bash
set -euo pipefail

# proxy-switch.sh - Switch database proxy between blue and green environments

NGINX_CONF="/etc/nginx/nginx.conf"
TEMP_CONF="/tmp/nginx.conf"

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to validate environment
validate_environment() {
    local env=$1
    if [[ "$env" != "blue" && "$env" != "green" ]]; then
        log "ERROR: Invalid environment '$env'. Must be 'blue' or 'green'"
        exit 1
    fi
}

# Function to test nginx configuration
test_config() {
    nginx -t -c "$1"
}

# Function to switch to blue environment
switch_to_blue() {
    log "Switching proxy to blue environment..."

    # Create new configuration
    sed 's/server postgres-green:5432.*$/server postgres-blue:5432 max_fails=3 fail_timeout=30s;/' "$NGINX_CONF" > "$TEMP_CONF"
    sed -i 's/# server postgres-blue:5432.*$//' "$TEMP_CONF"
    sed -i 's/server postgres-blue:5432.*$/server postgres-blue:5432 max_fails=3 fail_timeout=30s;/' "$TEMP_CONF"

    # Test configuration
    if test_config "$TEMP_CONF"; then
        mv "$TEMP_CONF" "$NGINX_CONF"
        nginx -s reload
        log "Successfully switched to blue environment"
        return 0
    else
        log "ERROR: Invalid nginx configuration, not switching"
        rm -f "$TEMP_CONF"
        return 1
    fi
}

# Function to switch to green environment
switch_to_green() {
    log "Switching proxy to green environment..."

    # Create new configuration
    sed 's/server postgres-blue:5432.*$/server postgres-green:5432 max_fails=3 fail_timeout=30s;/' "$NGINX_CONF" > "$TEMP_CONF"
    sed -i 's/# server postgres-green:5432.*$//' "$TEMP_CONF"
    sed -i 's/server postgres-green:5432.*$/server postgres-green:5432 max_fails=3 fail_timeout=30s;/' "$TEMP_CONF"

    # Test configuration
    if test_config "$TEMP_CONF"; then
        mv "$TEMP_CONF" "$NGINX_CONF"
        nginx -s reload
        log "Successfully switched to green environment"
        return 0
    else
        log "ERROR: Invalid nginx configuration, not switching"
        rm -f "$TEMP_CONF"
        return 1
    fi
}

# Function to get current environment
get_current_environment() {
    if grep -q "postgres-blue:5432" "$NGINX_CONF"; then
        echo "blue"
    elif grep -q "postgres-green:5432" "$NGINX_CONF"; then
        echo "green"
    else
        echo "unknown"
    fi
}

# Function to show status
show_status() {
    local current=$(get_current_environment)
    log "Current proxy environment: $current"

    # Test connectivity
    if curl -s http://localhost:8080/health > /dev/null; then
        log "Proxy health: healthy"
    else
        log "Proxy health: unhealthy"
    fi
}

# Main execution
case "${1:-help}" in
    "blue")
        validate_environment "blue"
        switch_to_blue
        ;;
    "green")
        validate_environment "green"
        switch_to_green
        ;;
    "status")
        show_status
        ;;
    "current")
        get_current_environment
        ;;
    "help"|*)
        echo "Usage: $0 {blue|green|status|current}"
        echo ""
        echo "Commands:"
        echo "  blue     - Switch proxy to blue environment"
        echo "  green    - Switch proxy to green environment"
        echo "  status   - Show current status and health"
        echo "  current  - Show current environment only"
        echo "  help     - Show this help message"
        exit 1
        ;;
esac
