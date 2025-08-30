#!/bin/bash
# Backup Health Check Server - provides HTTP health endpoint

PORT=${HEALTH_PORT:-8080}
HEALTH_CHECK_INTERVAL=${HEALTH_CHECK_INTERVAL:-300}  # 5 minutes

check_backup_health() {
    local status="healthy"
    local messages=()
    local last_backup_time=0

    # Check if last backup timestamp exists and is recent
    if [ -f "/var/log/backups/last-backup-timestamp" ]; then
        last_backup_time=$(cat /var/log/backups/last-backup-timestamp)
        current_time=$(date +%s)
        time_diff=$((current_time - last_backup_time))

        # Consider backup stale if it's older than 25 hours (allowing for daily backup + buffer)
        if [ $time_diff -gt 90000 ]; then
            status="unhealthy"
            messages+=("Last backup is $(($time_diff/3600)) hours old")
        fi
    else
        status="unhealthy"
        messages+=("No backup timestamp found")
    fi

    # Check if pgbackrest service is accessible
    if ! pgbackrest --stanza="${PGBACKREST_STANZA:-main}" info --log-level-console=error >/dev/null 2>&1; then
        status="unhealthy"
        messages+=("pgBackRest service check failed")
    fi

    # Check backup repository space
    if [ -d "/var/lib/pgbackrest" ]; then
        repo_usage=$(df /var/lib/pgbackrest | tail -1 | awk '{print $5}' | sed 's/%//')
        if [ "$repo_usage" -gt 90 ]; then
            status="unhealthy"
            messages+=("Backup repository usage is ${repo_usage}%")
        elif [ "$repo_usage" -gt 80 ]; then
            status="warning"
            messages+=("Backup repository usage is ${repo_usage}%")
        fi
    fi

    # Return health status
    if [ "$status" = "healthy" ]; then
        echo '{"status":"healthy","timestamp":"'$(date -Iseconds)'","last_backup_age_hours":"'$((($(date +%s) - $last_backup_time)/3600))'"}'
    else
        local message_json=$(printf '%s\n' "${messages[@]}" | jq -R . | jq -s .)
        echo '{"status":"'$status'","timestamp":"'$(date -Iseconds)'","messages":'$message_json',"last_backup_age_hours":"'$((($(date +%s) - $last_backup_time)/3600))'"}'
    fi
}

# Simple HTTP server using netcat
while true; do
    health_json=$(check_backup_health)

    response="HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${#health_json}\r\nConnection: close\r\n\r\n$health_json"

    echo -e "$response" | nc -l -p $PORT -q 1

    sleep 1
done
