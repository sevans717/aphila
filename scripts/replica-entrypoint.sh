#!/bin/bash
set -e

PRIMARY_HOST=${PRIMARY_HOST:-pg-primary}
REPL_PASSWORD=${REPLICATION_PASSWORD:-repl_password}
PGDATA=/var/lib/postgresql/data

echo "Replica entrypoint starting. Primary: $PRIMARY_HOST"

# If PGDATA is empty, perform base backup
if [ -z "$(ls -A $PGDATA)" ]; then
  echo "PGDATA empty, performing base backup from primary..."
  PGPASSWORD=$REPL_PASSWORD pg_basebackup -h $PRIMARY_HOST -D $PGDATA -U replicator -v -P --wal-method=stream
  echo "base backup complete"
  # Create recovery signal file (Postgres 12+ uses standby.signal)
  touch $PGDATA/standby.signal
  cat > $PGDATA/recovery.conf <<EOF
primary_conninfo = 'host=$PRIMARY_HOST port=5432 user=replicator password=$REPL_PASSWORD'
EOF
  chown -R postgres:postgres $PGDATA
fi

echo "Starting postgres on replica..."
exec docker-entrypoint.sh postgres
