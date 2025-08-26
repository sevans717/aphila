# Self-hosted Database & Production Compose (Aphila)

This guide explains how to run the production stack for Aphila (backend + Postgres + PgBouncer + Traefik) on a single host using Docker Compose. It focuses on safe, publicly-available API hosting while keeping the database private (no direct public DB port exposure).

Goals

- Expose the API to public users via Traefik + TLS (Let's Encrypt)
- Keep Postgres unreachable from the public Internet; allow connections only via PgBouncer and internal Docker network
- Run migrations and seeds safely against the database using a temporary container connected to the internal network
- Provide daily backups and backup restoration guidance
- Provide basic hardening notes

High level architecture

- Traefik (public) -> API (internal) -> PgBouncer (internal) -> Postgres (internal)
- Backups stored on host under `./postgres/backups` (rotate/secure these files)

Quick start (on a Linux host with Docker & Docker Compose)

1. Create `.env` from `.env.example` and fill secrets (do NOT commit this file).
2. Start the production stack:

```powershell
# start-prod.ps1
.
```

3. Run migrations and seeds:

```powershell
# run-migrations-seed.ps1
.
```

Notes

- Do not publish the Postgres port (5432) to the host in the production compose. PgBouncer listens on 6432 for connection pooling.
- `DATABASE_URL` should point to PgBouncer for the running API: `postgresql://<user>:<pass>@pgbouncer:6432/<db>?schema=public`
- Traefik configuration lives in `./traefik` and stores ACME data in `./traefik/acme`.

Backups

- A `backup` service is included that can be scheduled (cron) or invoked ad-hoc to create compressed dumps into `./postgres/backups`.
- Regularly move backups off-host to a secure storage (S3, object storage, or remote server).

Security & Hardening Checklist

- Use firewall rules to allow only ports 80/443 and SSH (22) and block everything else.
- Use strong secrets and rotate them regularly.
- Limit access to backup files and manage retention/rotation.
- Consider running PgBouncer and Postgres under dedicated system users or separate VMs if you need stricter isolation.
- Enable monitoring (Prometheus, Grafana) and alerting for DB health, connection counts, and failed jobs.

Restoring backups

1. Stop services that write to the DB (api)
2. Restore with `pg_restore` into the Postgres data directory or via a recovery container; test on a staging host first.

If you want, I can add automation for scheduled backups to S3 and automated restore scripts.
