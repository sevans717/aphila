#!/bin/bash
# ===========================================
# DNS CONFIGURATION CHECKER FOR APHILA.IO
# ===========================================
# Verifies DNS records are properly configured before deployment

echo "🌐 Checking DNS Configuration for aphila.io"
echo "============================================="

# Required DNS records for production deployment
declare -A domains=(
    ["aphila.io"]="Main website"
    ["www.aphila.io"]="Website with www"
    ["api.aphila.io"]="API endpoints"
    ["minio.aphila.io"]="MinIO console"
    ["storage.aphila.io"]="MinIO API"
    ["grafana.aphila.io"]="Grafana dashboard"
    ["traefik.aphila.io"]="Traefik dashboard"
    ["vault.aphila.io"]="Vault interface"
    ["metrics.aphila.io"]="Prometheus metrics"
)

# Function to check if domain resolves
check_domain() {
    local domain=$1
    local description=$2

    echo -n "Checking $domain ($description)... "

    if nslookup "$domain" >/dev/null 2>&1; then
        local ip=$(nslookup "$domain" | grep -A1 "Name:" | tail -1 | awk '{print $2}')
        echo "✅ RESOLVES to $ip"
        return 0
    else
        echo "❌ DOES NOT RESOLVE"
        return 1
    fi
}

# Check all required domains
echo "📍 Checking DNS Resolution:"
echo ""

failed_domains=0

for domain in "${!domains[@]}"; do
    if ! check_domain "$domain" "${domains[$domain]}"; then
        ((failed_domains++))
    fi
done

echo ""

if [ $failed_domains -eq 0 ]; then
    echo "🎉 All DNS records are configured correctly!"
    echo "✅ Ready to proceed with SSL certificate generation"
else
    echo "⚠️  $failed_domains domain(s) not configured"
    echo ""
    echo "📋 Required DNS Configuration:"
    echo "================================"
    echo "Add these A records to your DNS provider:"
    echo ""
    for domain in "${!domains[@]}"; do
        echo "$domain    A    YOUR_SERVER_IP_ADDRESS"
    done
    echo ""
    echo "Note: Replace YOUR_SERVER_IP_ADDRESS with your actual server IP"
    echo ""
    echo "💡 Tips:"
    echo "- DNS propagation can take up to 48 hours"
    echo "- Use 'dig' or 'nslookup' to verify changes"
    echo "- Consider using Cloudflare for DNS management"
fi

echo ""
echo "🔧 Next Steps:"
if [ $failed_domains -eq 0 ]; then
    echo "1. ✅ DNS configuration complete"
    echo "2. 🚀 Run the production deployment script"
    echo "3. 🔐 SSL certificates will be automatically generated"
else
    echo "1. ⚙️  Configure missing DNS records"
    echo "2. ⏳ Wait for DNS propagation"
    echo "3. 🔄 Re-run this script to verify"
fi
