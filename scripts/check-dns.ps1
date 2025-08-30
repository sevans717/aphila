# ===========================================
# DNS CONFIGURATION CHECKER FOR APHILA.IO
# ===========================================
# Verifies DNS records for all required subdomains

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "${Green}🌐 DNS Configuration Checker for aphila.io${Reset}"
Write-Host "============================================="

# Required DNS records for production deployment
$domains = @(
    "aphila.io",
    "api.aphila.io",
    "minio.aphila.io",
    "grafana.aphila.io",
    "traefik.aphila.io"
)

$failedDomains = 0

Write-Host "🔍 Checking DNS resolution for all required domains..."
Write-Host ""

foreach ($domain in $domains) {
    Write-Host -NoNewline "Checking $domain... "

    try {
        $result = Resolve-DnsName -Name $domain -Type A -ErrorAction Stop
        if ($result.IPAddress) {
            $ip = $result.IPAddress
            Write-Host "${Green}✅ RESOLVED → $ip${Reset}"
        } else {
            Write-Host "${Red}❌ NO A RECORD${Reset}"
            $failedDomains++
        }
    }
    catch {
        Write-Host "${Red}❌ DNS RESOLUTION FAILED${Reset}"
        $failedDomains++
    }
}

Write-Host ""

if ($failedDomains -eq 0) {
    Write-Host "${Green}✅ All DNS records are correctly configured!${Reset}"
    Write-Host ""
    Write-Host "📋 Next Steps:"
    Write-Host "1. 🚀 Run deployment: docker-compose -f docker-compose.production.yml up -d"
    Write-Host "2. 🔐 Verify SSL certificates obtain automatically"
    Write-Host "3. 🧪 Test all endpoints are accessible via HTTPS"
} else {
    Write-Host "${Red}❌ $failedDomains domain(s) failed DNS resolution${Reset}"
    Write-Host ""
    Write-Host "${Yellow}💡 DNS Configuration Required:${Reset}"
    Write-Host ""
    Write-Host "Create these A records with your DNS provider:"
    Write-Host ""

    foreach ($domain in $domains) {
        Write-Host "  $domain → [YOUR_SERVER_IP]"
    }

    Write-Host ""
    Write-Host "${Yellow}📋 Common DNS Providers:${Reset}"
    Write-Host "• Cloudflare: DNS → Records → Add A record"
    Write-Host "• Namecheap: Domain List → Manage → Advanced DNS → A Record"
    Write-Host "• GoDaddy: DNS → Records → A → Add New Record"
    Write-Host ""
    Write-Host "${Yellow}⏰ DNS propagation can take 5-60 minutes${Reset}"
    Write-Host "Re-run this script after DNS changes: pwsh scripts/check-dns.ps1"
}

Write-Host ""
Write-Host "${Blue}ℹ️  Additional DNS Information:${Reset}"
Write-Host "• TTL: Set to 300 seconds (5 minutes) for faster updates"
Write-Host "• IPv6: Optionally add AAAA records for IPv6 support"
Write-Host "• CAA: Add CAA record for Let's Encrypt: 0 issue letsencrypt.org"
