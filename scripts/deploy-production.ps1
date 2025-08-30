# ===========================================
# PRODUCTION DEPLOYMENT SCRIPT FOR APHILA.IO (PowerShell)
# ===========================================
# Deploys Sav3 dating app to production environment on Windows

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "${Green}🚀 Starting Sav3 Production Deployment for aphila.io${Reset}"
Write-Host "====================================================="

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
    Write-Host "${Red}❌ Please don't run this script as administrator${Reset}"
    Write-Host "${Yellow}💡 Use: pwsh scripts\deploy-production.ps1${Reset}"
    exit 1
}

# Check if Docker is installed and running
Write-Host "🐳 Checking Docker installation..."
try {
    $dockerVersion = docker --version
    Write-Host "${Green}✅ Docker found: $dockerVersion${Reset}"

    try {
        docker info | Out-Null
        Write-Host "${Green}✅ Docker is running${Reset}"
    }
    catch {
        Write-Host "${Red}❌ Docker is not running or you don't have permissions${Reset}"
        Write-Host "${Yellow}💡 Please start Docker Desktop and try again${Reset}"
        exit 1
    }
}
catch {
    Write-Host "${Red}❌ Docker is not installed${Reset}"
    Write-Host "${Yellow}💡 Please run scripts\setup-production-server.ps1 first${Reset}"
    exit 1
}

# Verify environment file exists
if (-not (Test-Path ".env.production")) {
    Write-Host "${Red}❌ .env.production file not found${Reset}"
    Write-Host "${Yellow}💡 Please create .env.production with your configuration${Reset}"
    exit 1
}

Write-Host "${Green}✅ Environment validation passed${Reset}"

# Create production Docker image
Write-Host "🏗️ Building production Docker image..."
try {
    docker build --target production -t sav3-api:latest . | Out-Host
    Write-Host "${Green}✅ Docker image built successfully${Reset}"
}
catch {
    Write-Host "${Red}❌ Failed to build Docker image${Reset}"
    exit 1
}

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..."
try {
    docker-compose -f docker-compose.production.yml down 2>$null | Out-Null
    Write-Host "${Green}✅ Existing containers stopped${Reset}"
}
catch {
    Write-Host "${Blue}ℹ️  No existing containers to stop${Reset}"
}

# Start infrastructure services first
Write-Host "🚀 Starting infrastructure services..."
try {
    docker-compose -f docker-compose.production.yml up -d traefik db redis | Out-Host
    Write-Host "${Green}✅ Infrastructure services started${Reset}"
}
catch {
    Write-Host "${Red}❌ Failed to start infrastructure services${Reset}"
    Write-Host "${Yellow}📋 Checking logs...${Reset}"
    docker-compose -f docker-compose.production.yml logs
    exit 1
}

Write-Host "${Yellow}⏳ Waiting for database to be ready...${Reset}"
Start-Sleep -Seconds 30

# Check database health
Write-Host "🔍 Checking database connectivity..."
$timeout = 60
$count = 0

while ($count -lt $timeout) {
    try {
        $dbCheck = docker-compose -f docker-compose.production.yml exec -T db pg_isready -U postgres 2>$null
        if ($dbCheck -match "accepting connections") {
            Write-Host "${Green}✅ Database is ready${Reset}"
            break
        }
    }
    catch {
        # Continue waiting
    }

    if ($count -ge $timeout) {
        Write-Host "${Red}❌ Database failed to start within $timeout seconds${Reset}"
        Write-Host "${Yellow}📋 Database logs:${Reset}"
        docker-compose -f docker-compose.production.yml logs db
        exit 1
    }

    Write-Host "${Yellow}⏳ Waiting for database... ($count/$timeout)${Reset}"
    Start-Sleep -Seconds 5
    $count += 5
}

# Start PgBouncer
Write-Host "🔄 Starting PgBouncer connection pooler..."
try {
    docker-compose -f docker-compose.production.yml up -d pgbouncer | Out-Host
    Start-Sleep -Seconds 10
    Write-Host "${Green}✅ PgBouncer started${Reset}"
}
catch {
    Write-Host "${Red}❌ Failed to start PgBouncer${Reset}"
    exit 1
}

# Run database migrations
Write-Host "🗄️ Running database migrations..."
try {
    docker-compose -f docker-compose.production.yml run --rm api npx prisma migrate deploy | Out-Host
    Write-Host "${Green}✅ Database migrations completed${Reset}"
}
catch {
    Write-Host "${Red}❌ Database migrations failed${Reset}"
    Write-Host "${Yellow}📋 Migration logs above${Reset}"
    exit 1
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..."
try {
    docker-compose -f docker-compose.production.yml run --rm api npx prisma generate | Out-Host
    Write-Host "${Green}✅ Prisma client generated${Reset}"
}
catch {
    Write-Host "${Red}❌ Prisma client generation failed${Reset}"
    exit 1
}

# Start storage services
Write-Host "💾 Starting storage services..."
try {
    docker-compose -f docker-compose.production.yml up -d minio | Out-Host
    Start-Sleep -Seconds 20
    Write-Host "${Green}✅ Storage services started${Reset}"
}
catch {
    Write-Host "${Red}❌ Failed to start storage services${Reset}"
    exit 1
}

# Initialize MinIO buckets
Write-Host "🗂️ Initializing MinIO buckets..."
try {
    docker-compose -f docker-compose.production.yml up minio-init | Out-Host
    Write-Host "${Green}✅ MinIO buckets initialized${Reset}"
}
catch {
    Write-Host "${Yellow}⚠️  MinIO bucket initialization may have issues${Reset}"
}

# Start monitoring services
Write-Host "📊 Starting monitoring services..."
try {
    docker-compose -f docker-compose.production.yml up -d prometheus grafana postgres-exporter redis-exporter node-exporter | Out-Host
    Start-Sleep -Seconds 15
    Write-Host "${Green}✅ Monitoring services started${Reset}"
}
catch {
    Write-Host "${Yellow}⚠️  Some monitoring services may not have started${Reset}"
}

# Start the main API service
Write-Host "🎯 Starting main API service..."
try {
    docker-compose -f docker-compose.production.yml up -d api | Out-Host
    Start-Sleep -Seconds 30
    Write-Host "${Green}✅ API service started${Reset}"
}
catch {
    Write-Host "${Red}❌ Failed to start API service${Reset}"
    exit 1
}

# Health check for API
Write-Host "🔍 Checking API health..."
$timeout = 60
$count = 0

while ($count -lt $timeout) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/health" -Method GET -TimeoutSec 5 2>$null
        if ($response.StatusCode -eq 200) {
            Write-Host "${Green}✅ API is healthy${Reset}"
            break
        }
    }
    catch {
        # Continue waiting
    }

    if ($count -ge $timeout) {
        Write-Host "${Red}❌ API failed to start within $timeout seconds${Reset}"
        Write-Host "${Yellow}📋 API logs:${Reset}"
        docker-compose -f docker-compose.production.yml logs api
        exit 1
    }

    Write-Host "${Yellow}⏳ Waiting for API... ($count/$timeout)${Reset}"
    Start-Sleep -Seconds 5
    $count += 5
}

# Start all remaining services
Write-Host "🔄 Starting remaining services..."
try {
    docker-compose -f docker-compose.production.yml up -d | Out-Host
    Start-Sleep -Seconds 10
    Write-Host "${Green}✅ All services started${Reset}"
}
catch {
    Write-Host "${Yellow}⚠️  Some services may not have started properly${Reset}"
}

# Final health checks
Write-Host "🏥 Running final health checks..."

$services = @(
    @{ Name = "API"; Url = "http://localhost:4000/api/v1/health" },
    @{ Name = "MinIO"; Url = "http://localhost:9000/minio/health/live" },
    @{ Name = "Grafana"; Url = "http://localhost:3000/api/health" }
)

$failedServices = 0

foreach ($service in $services) {
    Write-Host -NoNewline "Checking $($service.Name)... "
    try {
        $response = Invoke-WebRequest -Uri $service.Url -Method GET -TimeoutSec 10 2>$null
        if ($response.StatusCode -eq 200) {
            Write-Host "${Green}✅ HEALTHY${Reset}"
        } else {
            Write-Host "${Red}❌ UNHEALTHY${Reset}"
            $failedServices++
        }
    }
    catch {
        Write-Host "${Red}❌ UNHEALTHY${Reset}"
        $failedServices++
    }
}

# Display deployment summary
Write-Host ""
Write-Host "${Green}🎉 DEPLOYMENT COMPLETED!${Reset}"
Write-Host "========================"
Write-Host ""

if ($failedServices -eq 0) {
    Write-Host "${Green}✅ All services are healthy and running${Reset}"
} else {
    Write-Host "${Yellow}⚠️  $failedServices service(s) failed health checks${Reset}"
}

Write-Host ""
Write-Host "${Blue}🌐 Access URLs:${Reset}"
Write-Host "- Main Website: https://aphila.io"
Write-Host "- API: https://api.aphila.io"
Write-Host "- MinIO Console: https://minio.aphila.io"
Write-Host "- Grafana Dashboard: https://grafana.aphila.io"
Write-Host "- Traefik Dashboard: https://traefik.aphila.io"
Write-Host ""

# Display container status
Write-Host "${Blue}📊 Container Status:${Reset}"
docker-compose -f docker-compose.production.yml ps | Out-Host

Write-Host ""
Write-Host "${Blue}📋 Next Steps:${Reset}"
Write-Host "1. 🔍 Verify all services are accessible via HTTPS"
Write-Host "2. 🧪 Run integration tests"
Write-Host "3. 📱 Deploy mobile app updates"
Write-Host "4. 📧 Configure email notifications"
Write-Host "5. 🔔 Set up monitoring alerts"
Write-Host ""

# Show useful commands
Write-Host "${Yellow}💡 Useful Commands:${Reset}"
Write-Host "- View logs: docker-compose -f docker-compose.production.yml logs [service]"
Write-Host "- Restart service: docker-compose -f docker-compose.production.yml restart [service]"
Write-Host "- Update deployment: docker-compose -f docker-compose.production.yml pull; docker-compose -f docker-compose.production.yml up -d"
Write-Host "- Stop all: docker-compose -f docker-compose.production.yml down"
Write-Host ""

Write-Host "${Green}🚀 Sav3 is now live at https://aphila.io!${Reset}"
