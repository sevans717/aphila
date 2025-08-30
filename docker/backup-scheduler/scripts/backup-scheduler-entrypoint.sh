#!/bin/bash
set -e

echo "Starting backup scheduler service..."

# Start crond in the background
crond -f -d 8 &

# Start health check web server
/usr/local/bin/backup-health-server.sh &

# Keep the container running
while true; do
    sleep 30
    # Check if crond is still running
    if ! pgrep crond > /dev/null; then
        echo "crond died, restarting..."
        crond -f -d 8 &
    fi
done
