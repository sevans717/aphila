#!/bin/bash

# Monitoring Stack Startup Script
# Starts monitoring stack with proper dependencies and health checks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== SAV3 Monitoring Stack Startup ==="
echo "Timestamp: $(date)"
echo

cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Starting monitoring stack..."

# Start the monitoring stack
echo "Bringing up Docker services..."
docker-compose -f docker-compose.monitoring.yml up -d

echo
echo "Waiting for services to become ready..."

# Wait for PostgreSQL to be ready
echo -n "Waiting for PostgreSQL... "
timeout=60
counter=0

while ! docker-compose -f docker-compose.monitoring.yml exec -T postgres-monitored pg_isready -U postgres > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo -e "${RED}✗ Timeout waiting for PostgreSQL${NC}"
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
done
echo -e "${GREEN}✓ Ready${NC}"

# Wait for Prometheus to be ready
echo -n "Waiting for Prometheus... "
timeout=60
counter=0

while ! curl -s "http://localhost:9090/-/healthy" > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo -e "${RED}✗ Timeout waiting for Prometheus${NC}"
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
done
echo -e "${GREEN}✓ Ready${NC}"

# Wait for Grafana to be ready
echo -n "Waiting for Grafana... "
timeout=60
counter=0

while ! curl -s "http://localhost:3000/api/health" > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo -e "${RED}✗ Timeout waiting for Grafana${NC}"
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
done
echo -e "${GREEN}✓ Ready${NC}"

# Wait for exporters to be ready
echo -n "Waiting for PostgreSQL Exporter... "
timeout=60
counter=0

while ! curl -s "http://localhost:9187/metrics" > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo -e "${RED}✗ Timeout waiting for PostgreSQL Exporter${NC}"
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
done
echo -e "${GREEN}✓ Ready${NC}"

echo
echo "=== Monitoring Stack Started Successfully ==="
echo
echo "Services are now available at:"
echo "  🔍 Prometheus:     http://localhost:9090"
echo "  📊 Grafana:        http://localhost:3000 (admin/admin)"
echo "  🚨 AlertManager:   http://localhost:9093"
echo "  📈 PostgreSQL:     http://localhost:9187/metrics"
echo "  💻 Node Metrics:   http://localhost:9100/metrics"
echo
echo "Pre-configured dashboards:"
echo "  📊 PostgreSQL Dashboard: http://localhost:3000/d/postgres-dashboard"
echo
echo "To check health: $SCRIPT_DIR/check-monitoring-health.sh"
echo "To view logs:    docker-compose -f docker-compose.monitoring.yml logs [service]"
echo "To stop stack:   docker-compose -f docker-compose.monitoring.yml down"
echo

# Run initial health check
echo "Running initial health check..."
echo
bash "$SCRIPT_DIR/check-monitoring-health.sh"
