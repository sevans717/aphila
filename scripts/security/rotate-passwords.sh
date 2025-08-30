#!/bin/bash
set -e

# Password Rotation Script
# Automates the rotation of database passwords using Vault

VAULT_ADDR=${VAULT_ADDR:-"http://vault:8200"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/password-rotation.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

success() {
    log "${GREEN}✓ $1${NC}"
}

error() {
    log "${RED}✗ $1${NC}"
}

warn() {
    log "${YELLOW}⚠ $1${NC}"
}

info() {
    log "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."

    # Check if Vault is accessible
    if ! vault status &>/dev/null; then
        error "Vault is not accessible at ${VAULT_ADDR}"
        exit 1
    fi

    # Check if we have necessary tokens
    if [ -z "${VAULT_TOKEN}" ] && [ ! -f "/tmp/vault-tokens.env" ]; then
        error "No Vault token available"
        exit 1
    fi

    # Load tokens if available
    if [ -f "/tmp/vault-tokens.env" ]; then
        source /tmp/vault-tokens.env
        export VAULT_TOKEN="${VAULT_DB_TOKEN}"
    fi

    # Check database connectivity
    if ! docker exec postgres-primary-secure pg_isready -h localhost -p 5432 &>/dev/null; then
        error "PostgreSQL primary is not ready"
        exit 1
    fi

    success "Prerequisites check passed"
}

# Generate secure password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Rotate application user password
rotate_app_password() {
    info "Rotating application user password..."

    local new_password=$(generate_password)
    local old_password

    # Get current password from Vault
    old_password=$(vault kv get -field=password kv/database/app 2>/dev/null || echo "")

    if [ -z "${old_password}" ]; then
        error "Could not retrieve current app password from Vault"
        return 1
    fi

    # Update password in database
    export PGPASSWORD=$(vault kv get -field=password kv/database/admin)
    if psql -h postgres-primary-secure -U postgres -d sav3 -c "ALTER USER sav3_app PASSWORD '${new_password}';" &>/dev/null; then
        success "Updated app user password in database"
    else
        error "Failed to update app user password in database"
        return 1
    fi

    # Update password in Vault
    if vault kv patch kv/database/app password="${new_password}" &>/dev/null; then
        success "Updated app user password in Vault"
    else
        error "Failed to update app user password in Vault"
        # Rollback database change
        psql -h postgres-primary-secure -U postgres -d sav3 -c "ALTER USER sav3_app PASSWORD '${old_password}';" &>/dev/null
        return 1
    fi

    # Update connection string
    if vault kv patch kv/database/app connection_string="postgresql://sav3_app:${new_password}@pgbouncer-secure:6432/sav3" &>/dev/null; then
        success "Updated app user connection string"
    else
        warn "Failed to update app user connection string"
    fi

    # Update PgBouncer userlist
    "${SCRIPT_DIR}/../generate-pgbouncer-userlist.sh" &>/dev/null || warn "Failed to update PgBouncer userlist"

    success "Application user password rotated successfully"
}

# Rotate replication user password
rotate_replication_password() {
    info "Rotating replication user password..."

    local new_password=$(generate_password)
    local old_password

    # Get current password from Vault
    old_password=$(vault kv get -field=password kv/database/replica 2>/dev/null || echo "")

    if [ -z "${old_password}" ]; then
        error "Could not retrieve current replication password from Vault"
        return 1
    fi

    # Update password in database
    export PGPASSWORD=$(vault kv get -field=password kv/database/admin)
    if psql -h postgres-primary-secure -U postgres -d sav3 -c "ALTER USER replicator PASSWORD '${new_password}';" &>/dev/null; then
        success "Updated replication user password in database"
    else
        error "Failed to update replication user password in database"
        return 1
    fi

    # Update password in Vault
    if vault kv patch kv/database/replica password="${new_password}" &>/dev/null; then
        success "Updated replication user password in Vault"
    else
        error "Failed to update replication user password in Vault"
        # Rollback database change
        psql -h postgres-primary-secure -U postgres -d sav3 -c "ALTER USER replicator PASSWORD '${old_password}';" &>/dev/null
        return 1
    fi

    # Update connection string
    if vault kv patch kv/database/replica connection_string="postgresql://replicator:${new_password}@postgres-replica-secure:5432/sav3" &>/dev/null; then
        success "Updated replication user connection string"
    else
        warn "Failed to update replication user connection string"
    fi

    success "Replication user password rotated successfully"
    warn "Note: Replica containers may need to be restarted to use new password"
}

# Rotate backup user password
rotate_backup_password() {
    info "Rotating backup user password..."

    local new_password=$(generate_password)
    local old_password

    # Get current password from Vault
    old_password=$(vault kv get -field=password kv/database/backup 2>/dev/null || echo "")

    if [ -z "${old_password}" ]; then
        error "Could not retrieve current backup password from Vault"
        return 1
    fi

    # Update password in database
    export PGPASSWORD=$(vault kv get -field=password kv/database/admin)
    if psql -h postgres-primary-secure -U postgres -d sav3 -c "ALTER USER backup_user PASSWORD '${new_password}';" &>/dev/null; then
        success "Updated backup user password in database"
    else
        error "Failed to update backup user password in database"
        return 1
    fi

    # Update password in Vault
    if vault kv patch kv/database/backup password="${new_password}" &>/dev/null; then
        success "Updated backup user password in Vault"
    else
        error "Failed to update backup user password in Vault"
        # Rollback database change
        psql -h postgres-primary-secure -U postgres -d sav3 -c "ALTER USER backup_user PASSWORD '${old_password}';" &>/dev/null
        return 1
    fi

    success "Backup user password rotated successfully"
    warn "Note: Backup containers may need to be restarted to use new password"
}

# Rotate API secrets
rotate_api_secrets() {
    info "Rotating API secrets..."

    # Generate new secrets
    local new_jwt_access=$(openssl rand -base64 64)
    local new_jwt_refresh=$(openssl rand -base64 64)
    local new_encryption_key=$(openssl rand -base64 32)
    local new_session_secret=$(openssl rand -base64 32)

    # Update in Vault
    if vault kv patch kv/api/jwt \
        access_secret="${new_jwt_access}" \
        refresh_secret="${new_jwt_refresh}" \
        encryption_key="${new_encryption_key}" \
        session_secret="${new_session_secret}" &>/dev/null; then
        success "Updated API secrets in Vault"
    else
        error "Failed to update API secrets in Vault"
        return 1
    fi

    success "API secrets rotated successfully"
    warn "Note: Application containers need to be restarted to use new secrets"
}

# Rotate Stripe webhook secret
rotate_stripe_secret() {
    info "Rotating Stripe webhook secret..."

    local new_webhook_secret=$(openssl rand -base64 32)

    if vault kv patch kv/api/stripe webhook_secret="${new_webhook_secret}" &>/dev/null; then
        success "Updated Stripe webhook secret in Vault"
    else
        error "Failed to update Stripe webhook secret in Vault"
        return 1
    fi

    success "Stripe webhook secret rotated successfully"
    warn "Note: Update this secret in your Stripe dashboard"
}

# Test connectivity after rotation
test_connectivity() {
    info "Testing connectivity after password rotation..."

    # Test app user connection through PgBouncer
    local app_password=$(vault kv get -field=password kv/database/app 2>/dev/null || echo "")
    if [ -n "${app_password}" ]; then
        if PGPASSWORD="${app_password}" psql -h pgbouncer-secure -U sav3_app -d sav3 -c "SELECT 1;" &>/dev/null; then
            success "App user can connect through PgBouncer"
        else
            error "App user cannot connect through PgBouncer"
        fi
    fi

    # Test backup user connection
    local backup_password=$(vault kv get -field=password kv/database/backup 2>/dev/null || echo "")
    if [ -n "${backup_password}" ]; then
        if PGPASSWORD="${backup_password}" psql -h postgres-primary-secure -U backup_user -d sav3 -c "SELECT 1;" &>/dev/null; then
            success "Backup user can connect to primary"
        else
            error "Backup user cannot connect to primary"
        fi
    fi
}

# Generate rotation report
generate_report() {
    info "Generating password rotation report..."

    local report_file="/tmp/password-rotation-report-$(date +%Y%m%d-%H%M%S).json"
    local rotated_items=()

    # Determine what was rotated based on arguments
    for arg in "$@"; do
        case "$arg" in
            "app") rotated_items+=("application_user") ;;
            "replication") rotated_items+=("replication_user") ;;
            "backup") rotated_items+=("backup_user") ;;
            "api") rotated_items+=("api_secrets") ;;
            "stripe") rotated_items+=("stripe_webhook") ;;
            "all") rotated_items+=("application_user" "replication_user" "backup_user" "api_secrets" "stripe_webhook") ;;
        esac
    done

    cat > "${report_file}" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "rotation_type": "password_rotation",
    "rotated_items": $(printf '%s\n' "${rotated_items[@]}" | jq -R . | jq -s .),
    "log_file": "${LOG_FILE}",
    "next_rotation_due": "$(date -d '+30 days' -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    info "Password rotation report saved to: ${report_file}"
}

# Main execution
main() {
    local rotation_type="${1:-all}"

    log "Starting password rotation: ${rotation_type}"

    # Create log directory
    mkdir -p "$(dirname "${LOG_FILE}")"

    # Check prerequisites
    check_prerequisites

    # Perform rotation based on type
    case "${rotation_type}" in
        "app")
            rotate_app_password
            ;;
        "replication")
            rotate_replication_password
            ;;
        "backup")
            rotate_backup_password
            ;;
        "api")
            rotate_api_secrets
            ;;
        "stripe")
            rotate_stripe_secret
            ;;
        "all")
            rotate_app_password
            rotate_replication_password
            rotate_backup_password
            rotate_api_secrets
            rotate_stripe_secret
            ;;
        *)
            error "Invalid rotation type: ${rotation_type}"
            echo "Usage: $0 {app|replication|backup|api|stripe|all}"
            exit 1
            ;;
    esac

    # Test connectivity
    test_connectivity

    # Generate report
    generate_report "$@"

    success "Password rotation completed successfully"
}

main "$@"
