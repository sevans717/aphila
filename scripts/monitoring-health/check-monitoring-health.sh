#!/bin/bash

# Monitoring Stack Health Check Script
# Checks all monitoring components and reports status

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== SAV3 Monitoring Stack Health Check ==="
echo "Timestamp: $(date)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a service is healthy
check_service_health() {
    local service_name=$1
    local health_url=$2
    local timeout=${3:-10}

    echo -n "Checking $service_name... "

    if curl -s --max-time $timeout "$health_url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ Unhealthy${NC}"
        return 1
    fi
}

# Function to check Docker service
check_docker_service() {
    local service_name=$1
    echo -n "Checking Docker service $service_name... "

    if docker-compose -f docker-compose.monitoring.yml ps "$service_name" | grep -q "Up"; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not Running${NC}"
        return 1
    fi
}

# Check if monitoring stack is running
echo "=== Docker Services Status ==="
cd "$PROJECT_ROOT"

services=(
    "postgres-monitored"
    "postgres-exporter"
    "pgbouncer-exporter"
    "prometheus"
    "grafana"
    "alertmanager"
    "node-exporter"
)

for service in "${services[@]}"; do
    check_docker_service "$service"
done
echo

# Check service health endpoints
echo "=== Service Health Endpoints ==="
check_service_health "PostgreSQL Exporter" "http://localhost:9187/metrics"
check_service_health "PgBouncer Exporter" "http://localhost:9127/metrics"
check_service_health "Prometheus" "http://localhost:9090/-/healthy"
check_service_health "Grafana" "http://localhost:3000/api/health"
check_service_health "AlertManager" "http://localhost:9093/-/healthy"
check_service_health "Node Exporter" "http://localhost:9100/metrics"
echo

# Check Prometheus targets
echo "=== Prometheus Targets Status ==="
echo -n "Checking Prometheus targets... "

targets_response=$(curl -s "http://localhost:9090/api/v1/targets" 2>/dev/null || echo "")

if [ -n "$targets_response" ]; then
    # Check if all targets are up
    down_targets=$(echo "$targets_response" | jq -r '.data.activeTargets[] | select(.health != "up") | .labels.job' 2>/dev/null || echo "")

    if [ -z "$down_targets" ]; then
        echo -e "${GREEN}✓ All targets up${NC}"
    else
        echo -e "${YELLOW}⚠ Some targets down: $down_targets${NC}"
    fi
else
    echo -e "${RED}✗ Cannot connect to Prometheus${NC}"
fi
echo

# Check AlertManager status
echo "=== AlertManager Status ==="
echo -n "Checking active alerts... "

alerts_response=$(curl -s "http://localhost:9093/api/v1/alerts" 2>/dev/null || echo "")

if [ -n "$alerts_response" ]; then
    alert_count=$(echo "$alerts_response" | jq -r '.data | length' 2>/dev/null || echo "0")

    if [ "$alert_count" -eq 0 ]; then
        echo -e "${GREEN}✓ No active alerts${NC}"
    else
        echo -e "${YELLOW}⚠ $alert_count active alert(s)${NC}"
        echo "$alerts_response" | jq -r '.data[] | "  - \(.labels.alertname): \(.annotations.summary)"' 2>/dev/null || true
    fi
else
    echo -e "${RED}✗ Cannot connect to AlertManager${NC}"
fi
echo

# Check PostgreSQL metrics
echo "=== PostgreSQL Metrics Status ==="
echo -n "Checking PostgreSQL connection metrics... "

pg_metrics=$(curl -s "http://localhost:9187/metrics" 2>/dev/null | grep "pg_up" || echo "")

if echo "$pg_metrics" | grep -q "pg_up 1"; then
    echo -e "${GREEN}✓ PostgreSQL metrics available${NC}"
else
    echo -e "${RED}✗ PostgreSQL metrics unavailable${NC}"
fi

echo -n "Checking replication metrics... "
repl_metrics=$(curl -s "http://localhost:9187/metrics" 2>/dev/null | grep "pg_replication_lag" || echo "")

if [ -n "$repl_metrics" ]; then
    echo -e "${GREEN}✓ Replication metrics available${NC}"
else
    echo -e "${YELLOW}⚠ No replication metrics (may not be configured)${NC}"
fi
echo

# Summary
echo "=== Health Check Summary ==="
echo "Monitoring stack health check completed."
echo "For detailed metrics, visit:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3000 (admin/admin)"
echo "  - AlertManager: http://localhost:9093"
echo "  - PostgreSQL Metrics: http://localhost:9187/metrics"
echo
echo "Dashboard URLs:"
echo "  - PostgreSQL Dashboard: http://localhost:3000/d/postgres-dashboard"
echo
echo "To restart monitoring stack: docker-compose -f docker-compose.monitoring.yml restart"
echo "To view logs: docker-compose -f docker-compose.monitoring.yml logs [service_name]"
