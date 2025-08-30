# ===========================================
# SSL CERTIFICATE MANAGER - APHILA.IO
# ===========================================
# PowerShell script for SSL certificate management via Traefik and Let's Encrypt

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("setup", "renew", "check", "backup", "restore")]
    [string]$Action,

    [string]$Domain = "aphila.io",
    [string]$Email = "admin@aphila.io"
)

Write-Host "🔐 SSL Certificate Manager for aphila.io" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

function Setup-SSL {
    Write-Host "📋 Setting up SSL certificates and ACME configuration..." -ForegroundColor Yellow

    # Create ACME directory and set permissions
    if (!(Test-Path "docker/traefik/acme")) {
        New-Item -ItemType Directory -Force -Path "docker/traefik/acme"
        Write-Host "✅ Created ACME directory"
    }

    # Create acme.json file with proper permissions
    $acmeFile = "docker/traefik/acme/acme.json"
    if (!(Test-Path $acmeFile)) {
        New-Item -ItemType File -Force -Path $acmeFile
        Write-Host "✅ Created acme.json file"
    }

    # Set restrictive permissions (equivalent to chmod 600)
    $acl = Get-Acl $acmeFile
    $acl.SetAccessRuleProtection($true, $false)
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        [System.Security.Principal.WindowsIdentity]::GetCurrent().Name,
        "FullControl",
        "Allow"
    )
    $acl.RemoveAccessRuleAll($accessRule)
    $acl.SetAccessRule($accessRule)
    Set-Acl -Path $acmeFile -AclObject $acl
    Write-Host "✅ Set secure permissions on acme.json"

    # Verify Traefik configuration
    if (Test-Path "docker/traefik/traefik.yml") {
        Write-Host "✅ Traefik configuration found"
    } else {
        Write-Host "❌ Traefik configuration missing" -ForegroundColor Red
        exit 1
    }

    if (Test-Path "docker/traefik/dynamic.yml") {
        Write-Host "✅ Dynamic configuration found"
    } else {
        Write-Host "❌ Dynamic configuration missing" -ForegroundColor Red
        exit 1
    }

    # Check if Traefik is running
    $traefikContainer = docker ps --filter "name=sav3_traefik" --format "{{.Names}}"
    if ($traefikContainer -eq "sav3_traefik") {
        Write-Host "✅ Traefik container is running"

        # Restart Traefik to apply configuration changes
        Write-Host "🔄 Restarting Traefik to apply SSL configuration..."
        docker restart sav3_traefik
        Start-Sleep -Seconds 10

        # Check Traefik health
        $health = docker inspect sav3_traefik --format='{{.State.Health.Status}}' 2>$null
        if ($health -eq "healthy") {
            Write-Host "✅ Traefik restarted and healthy"
        } else {
            Write-Host "⚠️ Traefik health check pending..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Traefik container not running" -ForegroundColor Red
        Write-Host "💡 Start with: docker-compose -f docker-compose.production.yml up -d traefik"
    }

    Write-Host "📋 SSL Setup Summary:" -ForegroundColor Green
    Write-Host "  - ACME directory: docker/traefik/acme/" -ForegroundColor Green
    Write-Host "  - Certificate storage: acme.json" -ForegroundColor Green
    Write-Host "  - Email: $Email" -ForegroundColor Green
    Write-Host "  - Domains configured for:" -ForegroundColor Green
    Write-Host "    • aphila.io" -ForegroundColor Green
    Write-Host "    • www.aphila.io" -ForegroundColor Green
    Write-Host "    • api.aphila.io" -ForegroundColor Green
    Write-Host "    • minio.aphila.io" -ForegroundColor Green
    Write-Host "    • grafana.aphila.io" -ForegroundColor Green
    Write-Host "    • traefik.aphila.io" -ForegroundColor Green
    Write-Host "    • storage.aphila.io" -ForegroundColor Green
    Write-Host "    • metrics.aphila.io" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️ IMPORTANT: Certificates will be automatically requested when:" -ForegroundColor Yellow
    Write-Host "   1. DNS records point to this server" -ForegroundColor Yellow
    Write-Host "   2. Domains are accessible via HTTP/HTTPS" -ForegroundColor Yellow
    Write-Host "   3. First request is made to each domain" -ForegroundColor Yellow
}

function Check-SSL {
    Write-Host "🔍 Checking SSL certificate status..." -ForegroundColor Yellow

    $acmeFile = "docker/traefik/acme/acme.json"
    if (!(Test-Path $acmeFile)) {
        Write-Host "❌ ACME file not found. Run setup first." -ForegroundColor Red
        return
    }

    $acmeContent = Get-Content $acmeFile -Raw
    if ([string]::IsNullOrEmpty($acmeContent) -or $acmeContent -eq "{}") {
        Write-Host "⚠️ No certificates found in ACME file" -ForegroundColor Yellow
        Write-Host "💡 Certificates will be generated on first access to domains"
    } else {
        try {
            $acmeData = $acmeContent | ConvertFrom-Json
            if ($acmeData.letsencrypt -and $acmeData.letsencrypt.Certificates) {
                Write-Host "✅ SSL certificates found:" -ForegroundColor Green
                foreach ($cert in $acmeData.letsencrypt.Certificates) {
                    $domain = $cert.domain.main
                    Write-Host "  📜 Certificate for: $domain" -ForegroundColor Green
                    if ($cert.domain.sans) {
                        foreach ($san in $cert.domain.sans) {
                            Write-Host "      SAN: $san" -ForegroundColor Gray
                        }
                    }
                }
            } else {
                Write-Host "⚠️ ACME file exists but no certificates found" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ Error parsing ACME file: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    # Check Traefik logs for SSL-related messages
    Write-Host "`n🔍 Recent Traefik SSL logs:" -ForegroundColor Yellow
    docker logs sav3_traefik --tail 20 2>$null | Where-Object { $_ -match "acme|certificate|ssl|tls" } | ForEach-Object {
        if ($_ -match "error|failed") {
            Write-Host "❌ $_" -ForegroundColor Red
        } elseif ($_ -match "success|obtained") {
            Write-Host "✅ $_" -ForegroundColor Green
        } else {
            Write-Host "ℹ️ $_" -ForegroundColor Yellow
        }
    }
}

function Renew-SSL {
    Write-Host "🔄 Renewing SSL certificates..." -ForegroundColor Yellow

    # Traefik automatically renews certificates, but we can trigger renewal
    # by restarting the container, which will check and renew if needed
    docker restart sav3_traefik
    Start-Sleep -Seconds 15

    Write-Host "✅ Certificate renewal triggered" -ForegroundColor Green
    Write-Host "💡 Traefik will automatically renew certificates when needed"

    Check-SSL
}

function Backup-SSL {
    Write-Host "💾 Backing up SSL certificates..." -ForegroundColor Yellow

    $backupDir = "backups/ssl"
    if (!(Test-Path $backupDir)) {
        New-Item -ItemType Directory -Force -Path $backupDir
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = "$backupDir/acme-backup-$timestamp.json"

    $acmeFile = "docker/traefik/acme/acme.json"
    if (Test-Path $acmeFile) {
        Copy-Item $acmeFile $backupFile
        Write-Host "✅ SSL certificates backed up to: $backupFile" -ForegroundColor Green
    } else {
        Write-Host "❌ No ACME file found to backup" -ForegroundColor Red
    }
}

function Restore-SSL {
    param([string]$BackupFile)

    if (!$BackupFile) {
        Write-Host "❌ Please specify backup file path" -ForegroundColor Red
        Write-Host "Usage: ssl-manager.ps1 -Action restore -BackupFile 'path'"
        return
    }

    if (!(Test-Path $BackupFile)) {
        Write-Host "❌ Backup file not found: $BackupFile" -ForegroundColor Red
        return
    }

    Write-Host "📥 Restoring SSL certificates from: $BackupFile" -ForegroundColor Yellow

    $acmeFile = "docker/traefik/acme/acme.json"
    Copy-Item $BackupFile $acmeFile -Force

    # Restart Traefik to apply restored certificates
    docker restart sav3_traefik
    Start-Sleep -Seconds 10

    Write-Host "✅ SSL certificates restored and Traefik restarted" -ForegroundColor Green
}

# Main execution
switch ($Action) {
    "setup" { Setup-SSL }
    "check" { Check-SSL }
    "renew" { Renew-SSL }
    "backup" { Backup-SSL }
    "restore" { Restore-SSL -BackupFile $BackupFile }
    default { Write-Host "❌ Unknown action: $Action" -ForegroundColor Red }
}

Write-Host "`n🔐 SSL Certificate Manager completed" -ForegroundColor Cyan
