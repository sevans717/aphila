#!/bin/bash

# Health monitoring script for media storage stack
# Usage: ./scripts/check-media-health.sh

set -e

echo "=== SAV3 Media Stack Health Check ==="
echo "$(date)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service_health() {
    local service_name=$1
    local health_url=$2
    local expected_response=$3

    echo -n "Checking $service_name... "

    if response=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" 2>/dev/null); then
        if [ "$response" = "$expected_response" ]; then
            echo -e "${GREEN}✓ OK${NC}"
            return 0
        else
            echo -e "${RED}✗ FAIL (HTTP $response)${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ UNREACHABLE${NC}"
        return 1
    fi
}

# Function to check MinIO connectivity
check_minio() {
    echo -n "Checking MinIO... "

    if docker exec sav3-minio mc --version > /dev/null 2>&1; then
        if docker exec sav3-minio mc ping local > /dev/null 2>&1; then
            echo -e "${GREEN}✓ OK${NC}"
            return 0
        else
            echo -e "${RED}✗ PING FAILED${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ UNREACHABLE${NC}"
        return 1
    fi
}

# Function to check Redis
check_redis() {
    echo -n "Checking Redis... "

    if redis_response=$(docker exec sav3-redis redis-cli ping 2>/dev/null); then
        if [ "$redis_response" = "PONG" ]; then
            echo -e "${GREEN}✓ OK${NC}"
            return 0
        else
            echo -e "${RED}✗ FAIL (got: $redis_response)${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ UNREACHABLE${NC}"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    echo -n "Checking disk space... "

    # Get disk usage percentage for media volumes
    usage=$(docker system df | grep -E "(sav3-minio-data|sav3-media-uploads)" | awk '{print $3}' | sed 's/%//' | sort -nr | head -1)

    if [ -z "$usage" ]; then
        usage=0
    fi

    if [ "$usage" -lt 80 ]; then
        echo -e "${GREEN}✓ OK (${usage}% used)${NC}"
        return 0
    elif [ "$usage" -lt 90 ]; then
        echo -e "${YELLOW}⚠ WARNING (${usage}% used)${NC}"
        return 1
    else
        echo -e "${RED}✗ CRITICAL (${usage}% used)${NC}"
        return 1
    fi
}

# Function to check service containers
check_containers() {
    echo "Checking Docker containers:"

    local services=("sav3-minio" "sav3-media-proxy" "sav3-redis" "sav3-image-processor")
    local all_healthy=true

    for service in "${services[@]}"; do
        echo -n "  $service... "

        if container_status=$(docker inspect --format='{{.State.Status}}' "$service" 2>/dev/null); then
            if [ "$container_status" = "running" ]; then
                echo -e "${GREEN}✓ Running${NC}"
            else
                echo -e "${RED}✗ $container_status${NC}"
                all_healthy=false
            fi
        else
            echo -e "${RED}✗ Not found${NC}"
            all_healthy=false
        fi
    done

    if [ "$all_healthy" = true ]; then
        return 0
    else
        return 1
    fi
}

# Function to check network connectivity
check_network() {
    echo -n "Checking network connectivity... "

    if docker network inspect sav3-media-network > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ Network not found${NC}"
        return 1
    fi
}

# Main health checks
health_status=0

echo "1. Container Status"
if ! check_containers; then
    health_status=1
fi
echo

echo "2. Network Connectivity"
if ! check_network; then
    health_status=1
fi
echo

echo "3. Service Health Endpoints"
if ! check_service_health "Media Proxy" "http://localhost:10002/api/health" "200"; then
    health_status=1
fi

if ! check_minio; then
    health_status=1
fi

if ! check_redis; then
    health_status=1
fi
echo

echo "4. Resource Usage"
if ! check_disk_space; then
    health_status=1
fi
echo

# Summary
echo "=== Summary ==="
if [ $health_status -eq 0 ]; then
    echo -e "${GREEN}✓ All services are healthy${NC}"
else
    echo -e "${RED}✗ Some services have issues${NC}"
fi

echo
echo "For detailed logs, run:"
echo "  docker-compose -f docker-compose.media.yml logs -f"
echo
echo "To restart services:"
echo "  docker-compose -f docker-compose.media.yml restart"

exit $health_status
