# Streaming Replication Guide (local Docker Compose)

This document describes a lightweight streaming replication scaffold (primary + replica) for local/dev usage using Docker Compose. It is intended as a starting point for a self-hosted replication topology for the SAV3 backend.

Files added:

- `docker-compose.replication.yml` — compose file with `pg-primary` and `pg-replica` services.
- `docker/postgres/primary/init/01-create-replication-user.sh` — init script to create the `replicator` role and update `pg_hba.conf`.
- `scripts/replica-entrypoint.sh` — replica entrypoint that runs `pg_basebackup` and starts Postgres.

Quickstart (development):

1. Start the primary and replica by running the docker compose file:

   docker compose -f docker-compose.replication.yml up --build

2. Notes and envs:

- Primary Postgres: localhost:5432
- Replica Postgres: localhost:5433
- Environment vars used in the compose: `POSTGRES_PASSWORD` and `REPLICATION_PASSWORD` — defaults in compose are for local/dev only. Replace in production.

How it works:

- Primary container initializes and runs the 01-create-replication-user.sh script which creates the replicator role and updates pg_hba.conf.
- Replica starts and if its data directory is empty runs pg_basebackup from the primary using the replicator role, writing a standby.signal to become a streaming replica.

Limitations:

- This is a development scaffold — for production you should:
  - Harden authentication and network (do not open replication to 0.0.0.0/0).
  - Use TLS for replication connections.
  - Use a cluster manager (Patroni) for automatic failover and leader election.
  - Configure WAL archiving and backups (pgBackRest or WAL-G).

Next steps (recommended):

- Add pgBackRest backup container and configure WAL archiving.
- Add pgbouncer in front of the primary and replica endpoints for pooled connections.
- Add monitoring: postgres_exporter and Prometheus + Grafana dashboards.
- Implement an automated failover manager (Patroni) for production-grade HA.
