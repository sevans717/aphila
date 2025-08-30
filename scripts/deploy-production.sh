#!/bin/bash
# ===========================================
# PRODUCTION DEPLOYMENT SCRIPT FOR APHILA.IO
# ===========================================
# Deploys Sav3 dating app to production environment

set -e

echo "🚀 Starting Sav3 Production Deployment for aphila.io"
echo "====================================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root"
    echo "💡 Use: bash deploy-production.sh"
    exit 1
fi

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "💡 Please run setup-production-server.sh first"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running or you don't have permissions"
    echo "💡 Try: sudo systemctl start docker && sudo usermod -aG docker $USER"
    echo "💡 Then log out and log back in"
    exit 1
fi

# Verify environment file exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found"
    echo "💡 Please create .env.production with your configuration"
    exit 1
fi

# Load environment variables
source .env.production

# Verify critical environment variables
required_vars=(
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "MINIO_ROOT_PASSWORD"
    "GRAFANA_ADMIN_PASSWORD"
)

missing_vars=0
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing required environment variable: $var"
        ((missing_vars++))
    fi
done

if [ $missing_vars -gt 0 ]; then
    echo "💡 Please configure all required environment variables in .env.production"
    exit 1
fi

echo "✅ Environment validation passed"

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p logs/traefik
mkdir -p logs/api
mkdir -p logs/postgres
mkdir -p logs/redis
mkdir -p logs/minio
mkdir -p logs/grafana
mkdir -p logs/prometheus
mkdir -p logs/pgbouncer
mkdir -p backups/postgres
mkdir -p backups/minio
mkdir -p backups/redis
mkdir -p docker/traefik/acme
mkdir -p uploads

# Set proper permissions
sudo chown -R $USER:$USER logs/ backups/ uploads/ docker/traefik/acme/
chmod 755 logs/ backups/ uploads/
chmod 600 docker/traefik/acme/

echo "✅ Directories created and permissions set"

# Generate VAPID keys if not present
if [ -z "$VAPID_PUBLIC_KEY" ] || [ -z "$VAPID_PRIVATE_KEY" ]; then
    echo "🔑 Generating VAPID keys for push notifications..."
    if command -v npx &> /dev/null; then
        # Use npx web-push to generate keys
        VAPID_OUTPUT=$(npx web-push generate-vapid-keys --json)
        VAPID_PUBLIC=$(echo $VAPID_OUTPUT | jq -r '.publicKey')
        VAPID_PRIVATE=$(echo $VAPID_OUTPUT | jq -r '.privateKey')

        echo "VAPID_PUBLIC_KEY=$VAPID_PUBLIC" >> .env.production
        echo "VAPID_PRIVATE_KEY=$VAPID_PRIVATE" >> .env.production

        echo "✅ VAPID keys generated and added to .env.production"
    else
        echo "⚠️  VAPID keys not generated - install Node.js and web-push"
    fi
fi

# Build production Docker image
echo "🏗️ Building production Docker image..."
docker build --target production -t sav3-api:latest .
echo "✅ Docker image built successfully"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down || true
echo "✅ Existing containers stopped"

# Start infrastructure services first
echo "🚀 Starting infrastructure services..."
docker-compose -f docker-compose.production.yml up -d traefik db redis
echo "⏳ Waiting for database to be ready..."
sleep 30

# Check database health
echo "🔍 Checking database connectivity..."
timeout=60
count=0
while ! docker-compose -f docker-compose.production.yml exec -T db pg_isready -U ${POSTGRES_USER:-postgres} > /dev/null 2>&1; do
    if [ $count -ge $timeout ]; then
        echo "❌ Database failed to start within $timeout seconds"
        echo "📋 Database logs:"
        docker-compose -f docker-compose.production.yml logs db
        exit 1
    fi
    echo "⏳ Waiting for database... ($count/$timeout)"
    sleep 5
    ((count+=5))
done
echo "✅ Database is ready"

# Start PgBouncer
echo "🔄 Starting PgBouncer connection pooler..."
docker-compose -f docker-compose.production.yml up -d pgbouncer
sleep 10
echo "✅ PgBouncer started"

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.production.yml run --rm api npx prisma migrate deploy
echo "✅ Database migrations completed"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker-compose -f docker-compose.production.yml run --rm api npx prisma generate
echo "✅ Prisma client generated"

# Start storage services
echo "💾 Starting storage services..."
docker-compose -f docker-compose.production.yml up -d minio
sleep 20

# Initialize MinIO buckets
echo "🗂️ Initializing MinIO buckets..."
docker-compose -f docker-compose.production.yml up minio-init
echo "✅ MinIO buckets initialized"

# Start monitoring services
echo "📊 Starting monitoring services..."
docker-compose -f docker-compose.production.yml up -d prometheus grafana postgres-exporter redis-exporter node-exporter
sleep 15
echo "✅ Monitoring services started"

# Start the main API service
echo "🎯 Starting main API service..."
docker-compose -f docker-compose.production.yml up -d api
sleep 30

# Health check for API
echo "🔍 Checking API health..."
timeout=60
count=0
while ! curl -f http://localhost:4000/api/v1/health > /dev/null 2>&1; do
    if [ $count -ge $timeout ]; then
        echo "❌ API failed to start within $timeout seconds"
        echo "📋 API logs:"
        docker-compose -f docker-compose.production.yml logs api
        exit 1
    fi
    echo "⏳ Waiting for API... ($count/$timeout)"
    sleep 5
    ((count+=5))
done
echo "✅ API is healthy"

# Start all remaining services
echo "🔄 Starting remaining services..."
docker-compose -f docker-compose.production.yml up -d
sleep 10

# Final health checks
echo "🏥 Running final health checks..."

services=("api:4000/api/v1/health" "minio:9000/minio/health/live" "grafana:3000/api/health")
failed_services=0

for service_check in "${services[@]}"; do
    service_name=$(echo $service_check | cut -d: -f1)
    health_url="http://localhost:$(echo $service_check | cut -d: -f2-)"

    echo -n "Checking $service_name... "
    if curl -f "$health_url" > /dev/null 2>&1; then
        echo "✅ HEALTHY"
    else
        echo "❌ UNHEALTHY"
        ((failed_services++))
    fi
done

# Display deployment summary
echo ""
echo "🎉 DEPLOYMENT COMPLETED!"
echo "========================"
echo ""

if [ $failed_services -eq 0 ]; then
    echo "✅ All services are healthy and running"
else
    echo "⚠️  $failed_services service(s) failed health checks"
fi

echo ""
echo "🌐 Access URLs:"
echo "- Main Website: https://aphila.io"
echo "- API: https://api.aphila.io"
echo "- MinIO Console: https://minio.aphila.io"
echo "- Grafana Dashboard: https://grafana.aphila.io"
echo "- Traefik Dashboard: https://traefik.aphila.io"
echo ""

# Display container status
echo "📊 Container Status:"
docker-compose -f docker-compose.production.yml ps

echo ""
echo "📋 Next Steps:"
echo "1. 🔍 Verify all services are accessible via HTTPS"
echo "2. 🧪 Run integration tests"
echo "3. 📱 Deploy mobile app updates"
echo "4. 📧 Configure email notifications"
echo "5. 🔔 Set up monitoring alerts"
echo ""

# Show useful commands
echo "💡 Useful Commands:"
echo "- View logs: docker-compose -f docker-compose.production.yml logs [service]"
echo "- Restart service: docker-compose -f docker-compose.production.yml restart [service]"
echo "- Update deployment: docker-compose -f docker-compose.production.yml pull && docker-compose -f docker-compose.production.yml up -d"
echo "- Stop all: docker-compose -f docker-compose.production.yml down"
echo ""

echo "🚀 Sav3 is now live at https://aphila.io!"
