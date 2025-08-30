#!/bin/bash
set -e

echo "Creating replication role..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
CREATE ROLE replicator WITH REPLICATION LOGIN ENCRYPTED PASSWORD '$REPLICATION_PASSWORD';
EOSQL

echo "Configuring pg_hba.conf for replication..."
cat >> /var/lib/postgresql/data/pg_hba.conf <<'HBA'
# Allow replication connections from local network (Docker overlay)
host replication replicator 0.0.0.0/0 md5
HBA

echo "Primary init script complete."
