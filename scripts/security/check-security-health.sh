#!/bin/bash
set -e

# Security Health Check Script
# Validates security configurations across the entire stack

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HEALTH_LOG="/var/log/security-health.log"
EXIT_CODE=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${HEALTH_LOG}"
}

check_pass() {
    log "${GREEN}✓ $1${NC}"
}

check_fail() {
    log "${RED}✗ $1${NC}"
    EXIT_CODE=1
}

check_warn() {
    log "${YELLOW}⚠ $1${NC}"
}

check_info() {
    log "${BLUE}ℹ $1${NC}"
}

# Check SSL/TLS certificates
check_certificates() {
    check_info "Checking SSL/TLS certificates..."

    local cert_dir="/etc/ssl/certs"
    local required_certs=("ca.crt" "server.crt" "client.crt" "server.key" "client.key")

    for cert in "${required_certs[@]}"; do
        if [ -f "${cert_dir}/${cert}" ]; then
            if [[ "${cert}" == *.crt ]]; then
                # Check certificate validity
                local expiry=$(openssl x509 -in "${cert_dir}/${cert}" -noout -enddate | cut -d= -f2)
                local expiry_epoch=$(date -d "${expiry}" +%s)
                local current_epoch=$(date +%s)
                local days_left=$(( (expiry_epoch - current_epoch) / 86400 ))

                if [ ${days_left} -lt 30 ]; then
                    check_warn "Certificate ${cert} expires in ${days_left} days"
                elif [ ${days_left} -lt 7 ]; then
                    check_fail "Certificate ${cert} expires in ${days_left} days"
                else
                    check_pass "Certificate ${cert} is valid (${days_left} days remaining)"
                fi
            else
                # Check private key permissions
                local perms=$(stat -c "%a" "${cert_dir}/${cert}")
                if [ "${perms}" == "600" ]; then
                    check_pass "Private key ${cert} has correct permissions"
                else
                    check_fail "Private key ${cert} has incorrect permissions: ${perms} (should be 600)"
                fi
            fi
        else
            check_fail "Required certificate ${cert} not found"
        fi
    done
}

# Check PostgreSQL security configuration
check_postgres_security() {
    check_info "Checking PostgreSQL security configuration..."

    # Check if SSL is enabled
    local ssl_status=$(docker exec postgres-primary-secure psql -U postgres -d sav3 -t -c "SHOW ssl;" 2>/dev/null | tr -d ' ')
    if [ "${ssl_status}" == "on" ]; then
        check_pass "PostgreSQL SSL is enabled"
    else
        check_fail "PostgreSQL SSL is not enabled"
    fi

    # Check pg_hba.conf for secure authentication
    local hba_config=$(docker exec postgres-primary-secure cat /var/lib/postgresql/data/pg_hba.conf 2>/dev/null || echo "")
    if echo "${hba_config}" | grep -q "scram-sha-256"; then
        check_pass "PostgreSQL uses secure authentication (scram-sha-256)"
    else
        check_fail "PostgreSQL not using secure authentication"
    fi

    # Check for password authentication over network
    if echo "${hba_config}" | grep -E "host.*trust|host.*password"; then
        check_fail "PostgreSQL allows insecure authentication methods over network"
    else
        check_pass "PostgreSQL network authentication is secure"
    fi

    # Check for encrypted connections requirement
    if echo "${hba_config}" | grep -q "hostssl"; then
        check_pass "PostgreSQL requires SSL connections"
    else
        check_warn "PostgreSQL does not require SSL connections"
    fi
}

# Check PgBouncer security configuration
check_pgbouncer_security() {
    check_info "Checking PgBouncer security configuration..."

    local config_file="/pgbouncer/pgbouncer-secure.ini"
    if [ -f "${config_file}" ]; then
        # Check authentication method
        local auth_type=$(grep "^auth_type" "${config_file}" | cut -d= -f2 | tr -d ' ')
        if [ "${auth_type}" == "scram-sha-256" ]; then
            check_pass "PgBouncer uses secure authentication"
        else
            check_fail "PgBouncer not using secure authentication: ${auth_type}"
        fi

        # Check TLS configuration
        if grep -q "server_tls_sslmode.*require" "${config_file}"; then
            check_pass "PgBouncer requires TLS for server connections"
        else
            check_fail "PgBouncer does not require TLS for server connections"
        fi

        if grep -q "client_tls_sslmode.*prefer" "${config_file}"; then
            check_pass "PgBouncer prefers TLS for client connections"
        else
            check_warn "PgBouncer does not prefer TLS for client connections"
        fi

        # Check cipher configuration
        if grep -q "server_tls_ciphers.*ECDHE" "${config_file}"; then
            check_pass "PgBouncer uses secure ciphers"
        else
            check_warn "PgBouncer cipher configuration not found or insecure"
        fi
    else
        check_fail "PgBouncer secure configuration file not found"
    fi
}

# Check Vault security
check_vault_security() {
    check_info "Checking Vault security configuration..."

    # Check if Vault is sealed
    if docker exec vault vault status 2>/dev/null | grep -q "Sealed.*false"; then
        check_pass "Vault is unsealed and operational"

        # Check if policies exist
        local policies=$(docker exec vault vault policy list 2>/dev/null || echo "")
        if echo "${policies}" | grep -q "database-secrets"; then
            check_pass "Database secrets policy exists"
        else
            check_fail "Database secrets policy not found"
        fi

        if echo "${policies}" | grep -q "api-secrets"; then
            check_pass "API secrets policy exists"
        else
            check_fail "API secrets policy not found"
        fi

        # Check if KV engine is enabled
        local engines=$(docker exec vault vault secrets list 2>/dev/null || echo "")
        if echo "${engines}" | grep -q "kv/"; then
            check_pass "KV secrets engine is enabled"
        else
            check_fail "KV secrets engine not enabled"
        fi
    elif docker exec vault vault status 2>/dev/null | grep -q "Sealed.*true"; then
        check_warn "Vault is sealed (expected in some scenarios)"
    else
        check_fail "Vault is not accessible or not running"
    fi
}

# Check file permissions and ownership
check_file_permissions() {
    check_info "Checking file permissions and ownership..."

    local sensitive_files=(
        "/etc/ssl/certs/server.key:600"
        "/etc/ssl/certs/client.key:600"
        "/pgbouncer/userlist.txt:600"
        "/tmp/vault-tokens.env:600"
    )

    for file_perm in "${sensitive_files[@]}"; do
        local file="${file_perm%:*}"
        local expected_perm="${file_perm#*:}"

        if [ -f "${file}" ]; then
            local actual_perm=$(stat -c "%a" "${file}")
            if [ "${actual_perm}" == "${expected_perm}" ]; then
                check_pass "File ${file} has correct permissions (${actual_perm})"
            else
                check_fail "File ${file} has incorrect permissions: ${actual_perm} (should be ${expected_perm})"
            fi
        else
            check_warn "Sensitive file ${file} not found (may be expected)"
        fi
    done
}

# Check Docker security
check_docker_security() {
    check_info "Checking Docker security configuration..."

    # Check if containers are running with non-root users where applicable
    local containers=("postgres-primary-secure" "postgres-replica-secure" "pgbouncer-secure" "vault")

    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "${container}"; then
            check_pass "Container ${container} is running"

            # Check resource limits
            local memory_limit=$(docker inspect "${container}" | jq -r '.[0].HostConfig.Memory')
            if [ "${memory_limit}" != "0" ] && [ "${memory_limit}" != "null" ]; then
                check_pass "Container ${container} has memory limits"
            else
                check_warn "Container ${container} has no memory limits"
            fi
        else
            check_warn "Container ${container} is not running"
        fi
    done

    # Check for privileged containers
    local privileged_containers=$(docker ps --format "table {{.Names}}" --filter "label=privileged=true")
    if [ -z "${privileged_containers}" ]; then
        check_pass "No privileged containers detected"
    else
        check_fail "Privileged containers detected: ${privileged_containers}"
    fi
}

# Check network security
check_network_security() {
    check_info "Checking network security configuration..."

    # Check if custom networks are being used
    local networks=$(docker network ls --format "{{.Name}}" | grep -v "bridge\|host\|none")
    if [ -n "${networks}" ]; then
        check_pass "Custom Docker networks in use: ${networks}"
    else
        check_warn "No custom Docker networks detected"
    fi

    # Check for exposed ports
    local exposed_ports=$(docker ps --format "table {{.Names}}\t{{.Ports}}" | grep "0.0.0.0")
    if [ -n "${exposed_ports}" ]; then
        check_warn "Containers with exposed ports detected:"
        echo "${exposed_ports}"
    else
        check_pass "No containers exposing ports to all interfaces"
    fi
}

# Check backup security
check_backup_security() {
    check_info "Checking backup security configuration..."

    # Check if backup encryption is configured
    local pgbackrest_config="/docker/pgbackrest/pgbackrest.conf"
    if [ -f "${pgbackrest_config}" ]; then
        if grep -q "cipher-type" "${pgbackrest_config}"; then
            check_pass "Backup encryption is configured"
        else
            check_warn "Backup encryption not configured"
        fi

        if grep -q "compress-type" "${pgbackrest_config}"; then
            check_pass "Backup compression is configured"
        else
            check_warn "Backup compression not configured"
        fi
    else
        check_warn "pgBackRest configuration not found"
    fi
}

# Generate security report
generate_report() {
    check_info "Generating security health report..."

    local report_file="/tmp/security-health-report-$(date +%Y%m%d-%H%M%S).json"

    cat > "${report_file}" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": $([ ${EXIT_CODE} -eq 0 ] && echo '"PASS"' || echo '"FAIL"'),
    "checks_performed": [
        "ssl_certificates",
        "postgresql_security",
        "pgbouncer_security",
        "vault_security",
        "file_permissions",
        "docker_security",
        "network_security",
        "backup_security"
    ],
    "log_file": "${HEALTH_LOG}",
    "exit_code": ${EXIT_CODE}
}
EOF

    check_info "Security health report saved to: ${report_file}"
}

# Main execution
main() {
    log "Starting security health check..."

    # Create log directory
    mkdir -p "$(dirname "${HEALTH_LOG}")"

    # Run all checks
    check_certificates
    check_postgres_security
    check_pgbouncer_security
    check_vault_security
    check_file_permissions
    check_docker_security
    check_network_security
    check_backup_security

    # Generate report
    generate_report

    if [ ${EXIT_CODE} -eq 0 ]; then
        log "${GREEN}Security health check completed successfully${NC}"
    else
        log "${RED}Security health check completed with issues${NC}"
    fi

    exit ${EXIT_CODE}
}

# Allow running specific checks
if [ $# -gt 0 ]; then
    case "$1" in
        "certs"|"certificates")
            check_certificates
            ;;
        "postgres")
            check_postgres_security
            ;;
        "pgbouncer")
            check_pgbouncer_security
            ;;
        "vault")
            check_vault_security
            ;;
        "permissions")
            check_file_permissions
            ;;
        "docker")
            check_docker_security
            ;;
        "network")
            check_network_security
            ;;
        "backup")
            check_backup_security
            ;;
        *)
            echo "Usage: $0 [certs|postgres|pgbouncer|vault|permissions|docker|network|backup]"
            exit 1
            ;;
    esac
else
    main
fi
