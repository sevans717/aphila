# ===========================================
# PRODUCTION SERVER SETUP FOR APHILA.IO (Windows)
# ===========================================
# Sets up production environment for Sav3 dating app on Windows

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "${Green}🏗️ Production Server Setup for aphila.io (Windows)${Reset}"
Write-Host "========================================================"

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "${Yellow}⚠️  Not running as administrator${Reset}"
    Write-Host "${Yellow}💡 Some operations may require elevated permissions${Reset}"
}

# Check if Docker Desktop is installed
Write-Host "🐳 Checking Docker Desktop installation..."
try {
    $dockerVersion = docker --version
    Write-Host "${Green}✅ Docker found: $dockerVersion${Reset}"

    # Check if Docker is running
    try {
        docker info | Out-Null
        Write-Host "${Green}✅ Docker is running${Reset}"
    }
    catch {
        Write-Host "${Red}❌ Docker is not running${Reset}"
        Write-Host "${Yellow}💡 Please start Docker Desktop and try again${Reset}"
        exit 1
    }
}
catch {
    Write-Host "${Red}❌ Docker Desktop is not installed${Reset}"
    Write-Host "${Yellow}💡 Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/${Reset}"
    exit 1
}

# Check Docker Compose
Write-Host "🔧 Checking Docker Compose..."
try {
    $composeVersion = docker-compose --version
    Write-Host "${Green}✅ Docker Compose found: $composeVersion${Reset}"
}
catch {
    Write-Host "${Red}❌ Docker Compose not found${Reset}"
    Write-Host "${Yellow}💡 Docker Compose should be included with Docker Desktop${Reset}"
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating required directories..."
$directories = @(
    "logs\traefik",
    "logs\api",
    "logs\postgres",
    "logs\redis",
    "logs\minio",
    "logs\grafana",
    "logs\prometheus",
    "logs\pgbouncer",
    "backups\postgres",
    "backups\minio",
    "backups\redis",
    "docker\traefik\acme",
    "uploads"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "${Green}✅ Created: $dir${Reset}"
    } else {
        Write-Host "${Blue}ℹ️  Exists: $dir${Reset}"
    }
}

# Check environment file
Write-Host "🔐 Checking environment configuration..."
if (Test-Path ".env.production") {
    Write-Host "${Green}✅ Production environment file found${Reset}"

    # Verify critical environment variables
    $envContent = Get-Content ".env.production" -Raw
    $requiredVars = @("POSTGRES_PASSWORD", "JWT_SECRET", "MINIO_ROOT_PASSWORD", "GRAFANA_ADMIN_PASSWORD")
    $missingVars = @()

    foreach ($var in $requiredVars) {
        if (-not ($envContent -match "$var=.+")) {
            $missingVars += $var
        }
    }

    if ($missingVars.Count -eq 0) {
        Write-Host "${Green}✅ All required environment variables are configured${Reset}"
    } else {
        Write-Host "${Red}❌ Missing required environment variables:${Reset}"
        foreach ($var in $missingVars) {
            Write-Host "  - $var"
        }
        Write-Host "${Yellow}💡 Please configure all variables in .env.production${Reset}"
        exit 1
    }
} else {
    Write-Host "${Red}❌ .env.production file not found${Reset}"
    Write-Host "${Yellow}💡 Please create .env.production with your configuration${Reset}"
    exit 1
}

# Check Node.js for VAPID key generation
Write-Host "🔑 Checking Node.js for VAPID key generation..."
try {
    $nodeVersion = node --version
    Write-Host "${Green}✅ Node.js found: $nodeVersion${Reset}"

    # Check if web-push is available globally
    try {
        npx web-push --help | Out-Null
        Write-Host "${Green}✅ web-push available for VAPID key generation${Reset}"
    }
    catch {
        Write-Host "${Yellow}⚠️  web-push not available${Reset}"
        Write-Host "${Yellow}💡 Install with: npm install -g web-push${Reset}"
    }
}
catch {
    Write-Host "${Yellow}⚠️  Node.js not found${Reset}"
    Write-Host "${Yellow}💡 VAPID key generation may not work${Reset}"
}

# Validate Docker Compose files
Write-Host "🔍 Validating Docker Compose configuration..."
if (Test-Path "docker-compose.production.yml") {
    try {
        docker-compose -f docker-compose.production.yml config | Out-Null
        Write-Host "${Green}✅ Docker Compose configuration is valid${Reset}"
    }
    catch {
        Write-Host "${Red}❌ Docker Compose configuration has errors${Reset}"
        Write-Host "${Yellow}💡 Run: docker-compose -f docker-compose.production.yml config${Reset}"
        exit 1
    }
} else {
    Write-Host "${Red}❌ docker-compose.production.yml not found${Reset}"
    exit 1
}

# Check Windows Firewall (Windows Defender Firewall)
Write-Host "🔥 Checking Windows Firewall..."
try {
    $firewallProfile = Get-NetFirewallProfile -Profile Domain,Public,Private
    $activeProfiles = $firewallProfile | Where-Object { $_.Enabled -eq $true }

    if ($activeProfiles.Count -gt 0) {
        Write-Host "${Green}✅ Windows Firewall is enabled${Reset}"
        Write-Host "${Yellow}💡 You may need to create firewall rules for Docker services${Reset}"

        # Check if Docker Desktop has firewall rules
        $dockerRules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*Docker*" -or $_.DisplayName -like "*com.docker*" }
        if ($dockerRules.Count -gt 0) {
            Write-Host "${Green}✅ Docker firewall rules found${Reset}"
        } else {
            Write-Host "${Yellow}⚠️  No Docker firewall rules found${Reset}"
        }
    } else {
        Write-Host "${Red}❌ Windows Firewall is disabled${Reset}"
        Write-Host "${Yellow}💡 Consider enabling Windows Firewall for security${Reset}"
    }
}
catch {
    Write-Host "${Yellow}⚠️  Could not check Windows Firewall status${Reset}"
}

# Check available disk space
Write-Host "💾 Checking available disk space..."
$disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
$freeSpaceGB = [math]::Round($disk.FreeSpace / 1GB, 2)
$totalSpaceGB = [math]::Round($disk.Size / 1GB, 2)

Write-Host "   Free space: $freeSpaceGB GB / $totalSpaceGB GB"

if ($freeSpaceGB -lt 10) {
    Write-Host "${Red}❌ Low disk space (less than 10 GB available)${Reset}"
    Write-Host "${Yellow}💡 Consider freeing up disk space before deployment${Reset}"
} elseif ($freeSpaceGB -lt 20) {
    Write-Host "${Yellow}⚠️  Limited disk space (less than 20 GB available)${Reset}"
} else {
    Write-Host "${Green}✅ Sufficient disk space available${Reset}"
}

# Check memory
Write-Host "🧠 Checking available memory..."
$memory = Get-WmiObject -Class Win32_ComputerSystem
$totalMemoryGB = [math]::Round($memory.TotalPhysicalMemory / 1GB, 2)

Write-Host "   Total memory: $totalMemoryGB GB"

if ($totalMemoryGB -lt 4) {
    Write-Host "${Red}❌ Insufficient memory (less than 4 GB)${Reset}"
    Write-Host "${Yellow}💡 Production deployment requires at least 4 GB RAM${Reset}"
} elseif ($totalMemoryGB -lt 8) {
    Write-Host "${Yellow}⚠️  Limited memory (less than 8 GB recommended)${Reset}"
} else {
    Write-Host "${Green}✅ Sufficient memory available${Reset}"
}

# Test internet connectivity
Write-Host "🌐 Testing internet connectivity..."
try {
    $response = Test-NetConnection -ComputerName "8.8.8.8" -Port 53 -InformationLevel Quiet
    if ($response) {
        Write-Host "${Green}✅ Internet connectivity verified${Reset}"
    } else {
        Write-Host "${Red}❌ Internet connectivity test failed${Reset}"
    }
}
catch {
    Write-Host "${Yellow}⚠️  Could not test internet connectivity${Reset}"
}

# Summary
Write-Host ""
Write-Host "${Green}🎉 SETUP SUMMARY${Reset}"
Write-Host "================="
Write-Host ""
Write-Host "✅ Docker Desktop installed and running"
Write-Host "✅ Docker Compose available"
Write-Host "✅ Required directories created"
Write-Host "✅ Environment configuration validated"
Write-Host "✅ Docker Compose configuration validated"
Write-Host "✅ System resources checked"
Write-Host ""

Write-Host "${Blue}📋 NEXT STEPS FOR PRODUCTION DEPLOYMENT:${Reset}"
Write-Host ""
Write-Host "1. 🌐 Configure DNS records for aphila.io subdomains:"
Write-Host "   - Run: pwsh scripts\check-dns.ps1"
Write-Host "   - Add A records pointing to your server IP"
Write-Host ""
Write-Host "2. 🚀 Deploy production stack:"
Write-Host "   - Run: pwsh scripts\deploy-production.ps1"
Write-Host ""
Write-Host "3. 🔐 Verify SSL certificates:"
Write-Host "   - Run: pwsh scripts\ssl-manager.ps1 check"
Write-Host ""
Write-Host "4. 💾 Configure backups:"
Write-Host "   - Run: pwsh scripts\backup-manager.ps1 health"
Write-Host ""

Write-Host "${Yellow}💡 DEVELOPMENT MODE:${Reset}"
Write-Host "For local development, use: docker-compose up -d"
Write-Host ""

Write-Host "${Green}🚀 Ready for aphila.io production deployment!${Reset}"
