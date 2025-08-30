#!/bin/bash

# Media usage monitoring script
# Usage: ./scripts/monitor-media-usage.sh

set -e

echo "=== SAV3 Media Usage Report ==="
echo "Generated: $(date)"
echo

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to format bytes
format_bytes() {
    local bytes=$1
    if [ "$bytes" -ge 1073741824 ]; then
        echo "$(awk "BEGIN {printf \"%.2f GB\", $bytes/1073741824}")"
    elif [ "$bytes" -ge 1048576 ]; then
        echo "$(awk "BEGIN {printf \"%.2f MB\", $bytes/1048576}")"
    elif [ "$bytes" -ge 1024 ]; then
        echo "$(awk "BEGIN {printf \"%.2f KB\", $bytes/1024}")"
    else
        echo "${bytes} bytes"
    fi
}

# Function to get MinIO usage
get_minio_usage() {
    echo "MinIO Storage Usage:"
    echo "==================="

    if docker exec sav3-minio mc du --depth 1 local/sav3-media 2>/dev/null; then
        echo

        # Get bucket statistics
        total_objects=$(docker exec sav3-minio mc find local/sav3-media --type f | wc -l)
        echo "Total objects: $total_objects"

        # Get bucket size
        bucket_size=$(docker exec sav3-minio mc du local/sav3-media | tail -n1 | awk '{print $1}')
        echo "Total size: $(format_bytes $bucket_size)"
    else
        echo "MinIO not accessible or bucket doesn't exist"
    fi
    echo
}

# Function to get Redis usage
get_redis_usage() {
    echo "Redis Cache Usage:"
    echo "=================="

    if redis_info=$(docker exec sav3-redis redis-cli INFO memory 2>/dev/null); then
        used_memory=$(echo "$redis_info" | grep "used_memory:" | cut -d: -f2 | tr -d '\r')
        used_memory_human=$(echo "$redis_info" | grep "used_memory_human:" | cut -d: -f2 | tr -d '\r')
        max_memory=$(echo "$redis_info" | grep "maxmemory:" | cut -d: -f2 | tr -d '\r')

        echo "Used memory: $used_memory_human"
        if [ "$max_memory" != "0" ]; then
            usage_percent=$(awk "BEGIN {printf \"%.1f\", ($used_memory/$max_memory)*100}")
            echo "Usage: ${usage_percent}%"
        fi

        # Get key count
        key_count=$(docker exec sav3-redis redis-cli DBSIZE)
        echo "Keys: $key_count"
    else
        echo "Redis not accessible"
    fi
    echo
}

# Function to get local uploads usage
get_local_usage() {
    echo "Local Storage Usage:"
    echo "===================="

    if [ -d "./uploads" ]; then
        upload_size=$(du -sh ./uploads | cut -f1)
        file_count=$(find ./uploads -type f | wc -l)

        echo "Upload directory size: $upload_size"
        echo "File count: $file_count"

        # Show breakdown by user if structure exists
        if [ -d "./uploads" ] && [ "$(find ./uploads -mindepth 1 -maxdepth 1 -type d | wc -l)" -gt 0 ]; then
            echo
            echo "Top users by storage:"
            du -sh ./uploads/*/ 2>/dev/null | sort -hr | head -10
        fi
    else
        echo "No local uploads directory"
    fi
    echo
}

# Function to get Docker volume usage
get_volume_usage() {
    echo "Docker Volume Usage:"
    echo "===================="

    # Get volume sizes
    docker system df -v | grep -E "(sav3-minio-data|sav3-redis-data|sav3-media-uploads)" | while read line; do
        volume_name=$(echo "$line" | awk '{print $1}')
        volume_size=$(echo "$line" | awk '{print $3}')
        echo "$volume_name: $volume_size"
    done
    echo
}

# Function to show media service statistics from database
get_db_statistics() {
    echo "Database Media Statistics:"
    echo "=========================="

    # This would require database access - placeholder for now
    echo "Note: Database statistics require application connection"
    echo "To get detailed stats, use the admin API endpoints:"
    echo "  GET /api/admin/media/stats"
    echo
}

# Function to check growth trends
check_growth_trends() {
    echo "Growth Trends:"
    echo "=============="

    # Check if previous reports exist
    report_dir="./logs/media-usage"
    mkdir -p "$report_dir"

    current_report="$report_dir/usage-$(date +%Y%m%d).json"
    previous_report=$(ls -1 "$report_dir"/usage-*.json 2>/dev/null | tail -n2 | head -n1)

    if [ -f "$previous_report" ] && [ "$previous_report" != "$current_report" ]; then
        echo "Comparing with $(basename $previous_report)..."
        # Simple comparison - in production would be more sophisticated
        echo "Growth analysis would be shown here"
    else
        echo "No previous reports for comparison"
    fi

    # Save current stats for future comparison
    cat > "$current_report" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "minio_objects": $(docker exec sav3-minio mc find local/sav3-media --type f 2>/dev/null | wc -l),
  "redis_keys": $(docker exec sav3-redis redis-cli DBSIZE 2>/dev/null || echo 0),
  "local_files": $(find ./uploads -type f 2>/dev/null | wc -l || echo 0)
}
EOF
    echo
}

# Function to show alerts and recommendations
show_recommendations() {
    echo "Alerts & Recommendations:"
    echo "========================="

    # Check disk space
    disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        echo -e "${RED}⚠ CRITICAL: Disk usage is ${disk_usage}%${NC}"
    elif [ "$disk_usage" -gt 80 ]; then
        echo -e "${YELLOW}⚠ WARNING: Disk usage is ${disk_usage}%${NC}"
    else
        echo -e "${GREEN}✓ Disk usage is healthy (${disk_usage}%)${NC}"
    fi

    # Check Redis memory
    if docker exec sav3-redis redis-cli INFO memory 2>/dev/null | grep -q "maxmemory:0"; then
        echo -e "${YELLOW}⚠ Redis has no memory limit set${NC}"
    fi

    # Check for cleanup opportunities
    temp_files=$(find ./uploads -name "*.tmp" -o -name "*~" 2>/dev/null | wc -l)
    if [ "$temp_files" -gt 0 ]; then
        echo -e "${YELLOW}⚠ Found $temp_files temporary files that can be cleaned${NC}"
    fi

    echo
}

# Main monitoring
echo "Collecting usage statistics..."
echo

get_minio_usage
get_redis_usage
get_local_usage
get_volume_usage
get_db_statistics
check_growth_trends
show_recommendations

echo "=== End of Report ==="
echo
echo "For real-time monitoring, consider setting up Grafana dashboards."
echo "Report saved to: ./logs/media-usage/usage-$(date +%Y%m%d).json"
