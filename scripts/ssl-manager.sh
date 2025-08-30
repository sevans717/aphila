#!/bin/bash
# ===========================================
# SSL CERTIFICATE MANAGEMENT FOR APHILA.IO
# ===========================================
# Manages Let's Encrypt SSL certificates via Traefik

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 SSL Certificate Management for aphila.io${NC}"
echo "==============================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please don't run this script as root${NC}"
    exit 1
fi

# Function to check certificate status
check_cert_status() {
    local domain=$1
    local port=${2:-443}

    echo -n "Checking $domain... "

    # Check if domain resolves
    if ! nslookup "$domain" > /dev/null 2>&1; then
        echo -e "${RED}❌ DNS RESOLUTION FAILED${NC}"
        return 1
    fi

    # Check SSL certificate
    if timeout 10 openssl s_client -connect "$domain:$port" -servername "$domain" < /dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
        # Get certificate expiry
        expiry=$(timeout 10 openssl s_client -connect "$domain:$port" -servername "$domain" < /dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || echo "0")
        current_epoch=$(date +%s)
        days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

        if [ $days_until_expiry -gt 30 ]; then
            echo -e "${GREEN}✅ VALID ($days_until_expiry days)${NC}"
        elif [ $days_until_expiry -gt 7 ]; then
            echo -e "${YELLOW}⚠️  EXPIRES SOON ($days_until_expiry days)${NC}"
        else
            echo -e "${RED}❌ EXPIRES VERY SOON ($days_until_expiry days)${NC}"
        fi
        return 0
    else
        echo -e "${RED}❌ NO VALID CERTIFICATE${NC}"
        return 1
    fi
}

# Function to force certificate renewal
force_renewal() {
    local domain=$1

    echo -e "${YELLOW}🔄 Forcing certificate renewal for $domain...${NC}"

    # Remove existing certificate
    sudo rm -f docker/traefik/acme/acme.json || true

    # Restart Traefik to trigger new certificate request
    docker-compose -f docker-compose.production.yml restart traefik

    echo "⏳ Waiting for Traefik to request new certificate..."
    sleep 30

    # Check if certificate was obtained
    local retries=0
    local max_retries=12

    while [ $retries -lt $max_retries ]; do
        if check_cert_status "$domain"; then
            echo -e "${GREEN}✅ Certificate renewed successfully!${NC}"
            return 0
        fi

        echo "⏳ Still waiting for certificate... (attempt $((retries+1))/$max_retries)"
        sleep 30
        ((retries++))
    done

    echo -e "${RED}❌ Certificate renewal failed after $max_retries attempts${NC}"
    return 1
}

# Main domains for aphila.io
domains=(
    "aphila.io"
    "api.aphila.io"
    "minio.aphila.io"
    "grafana.aphila.io"
    "traefik.aphila.io"
)

# Parse command line arguments
case "${1:-check}" in
    "check")
        echo "🔍 Checking SSL certificate status for all domains..."
        echo ""

        failed_domains=0
        for domain in "${domains[@]}"; do
            if ! check_cert_status "$domain"; then
                ((failed_domains++))
            fi
        done

        echo ""
        if [ $failed_domains -eq 0 ]; then
            echo -e "${GREEN}✅ All SSL certificates are valid!${NC}"
        else
            echo -e "${RED}❌ $failed_domains domain(s) have certificate issues${NC}"
            echo -e "${YELLOW}💡 Run 'bash ssl-manager.sh renew' to fix issues${NC}"
        fi
        ;;

    "renew")
        echo "🔄 Renewing SSL certificates for all domains..."
        echo ""

        # Check if Traefik is running
        if ! docker-compose -f docker-compose.production.yml ps traefik | grep -q "Up"; then
            echo -e "${RED}❌ Traefik is not running${NC}"
            echo -e "${YELLOW}💡 Start services first: docker-compose -f docker-compose.production.yml up -d traefik${NC}"
            exit 1
        fi

        # Force renewal for main domain (triggers renewal for all)
        force_renewal "aphila.io"

        echo ""
        echo "⏳ Waiting for all certificates to propagate..."
        sleep 60

        # Check status of all domains
        echo "🔍 Verifying renewed certificates..."
        for domain in "${domains[@]}"; do
            check_cert_status "$domain"
        done
        ;;

    "backup")
        echo "💾 Backing up SSL certificates..."

        if [ -f docker/traefik/acme/acme.json ]; then
            backup_file="backups/ssl-certificates-$(date +%Y%m%d-%H%M%S).json"
            cp docker/traefik/acme/acme.json "$backup_file"
            echo -e "${GREEN}✅ Certificates backed up to: $backup_file${NC}"
        else
            echo -e "${RED}❌ No certificate file found to backup${NC}"
        fi
        ;;

    "restore")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Usage: bash ssl-manager.sh restore <backup-file>${NC}"
            exit 1
        fi

        backup_file="$2"
        if [ ! -f "$backup_file" ]; then
            echo -e "${RED}❌ Backup file not found: $backup_file${NC}"
            exit 1
        fi

        echo "📥 Restoring SSL certificates from backup..."

        # Stop Traefik
        docker-compose -f docker-compose.production.yml stop traefik

        # Restore backup
        cp "$backup_file" docker/traefik/acme/acme.json
        chmod 600 docker/traefik/acme/acme.json

        # Start Traefik
        docker-compose -f docker-compose.production.yml start traefik

        echo -e "${GREEN}✅ Certificates restored successfully!${NC}"
        ;;

    "logs")
        echo "📋 Showing Traefik logs (last 50 lines)..."
        docker-compose -f docker-compose.production.yml logs --tail=50 traefik | grep -E "(certificate|acme|ssl|tls)" || echo "No SSL-related log entries found"
        ;;

    "info")
        echo "ℹ️  SSL Certificate Information"
        echo "=============================="
        echo ""
        echo "Certificate Authority: Let's Encrypt"
        echo "Certificate Type: RSA 2048-bit"
        echo "Renewal Method: ACME HTTP-01 Challenge"
        echo "Auto-renewal: Every 60 days"
        echo "Certificate Location: docker/traefik/acme/acme.json"
        echo ""
        echo "Domains covered:"
        for domain in "${domains[@]}"; do
            echo "  - $domain"
        done
        echo ""
        echo "Certificate file info:"
        if [ -f docker/traefik/acme/acme.json ]; then
            ls -la docker/traefik/acme/acme.json
            echo "File size: $(du -h docker/traefik/acme/acme.json | cut -f1)"
        else
            echo "  No certificate file found"
        fi
        ;;

    "help"|"--help"|"-h")
        echo "SSL Certificate Manager for aphila.io"
        echo "Usage: bash ssl-manager.sh [command]"
        echo ""
        echo "Commands:"
        echo "  check     Check SSL certificate status for all domains (default)"
        echo "  renew     Force renewal of all SSL certificates"
        echo "  backup    Backup current SSL certificates"
        echo "  restore   Restore SSL certificates from backup"
        echo "  logs      Show Traefik SSL-related logs"
        echo "  info      Show SSL configuration information"
        echo "  help      Show this help message"
        echo ""
        echo "Examples:"
        echo "  bash ssl-manager.sh check"
        echo "  bash ssl-manager.sh renew"
        echo "  bash ssl-manager.sh backup"
        echo "  bash ssl-manager.sh restore backups/ssl-certificates-20240101-120000.json"
        ;;

    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo -e "${YELLOW}💡 Run 'bash ssl-manager.sh help' for usage information${NC}"
        exit 1
        ;;
esac
