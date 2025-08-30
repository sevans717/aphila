#!/bin/bash
# PgBouncer monitoring entrypoint

set -e

echo "Starting PgBouncer monitor..."

# Start monitoring service
/usr/local/bin/pgbouncer-health-server.sh &

# Start metrics collection
/usr/local/bin/collect-metrics.sh &

# Keep container running
wait
