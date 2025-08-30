# Production Docker Compose for aphila

Files added:

- `docker-compose.prod.yml` - Production compose with Traefik, PgBouncer, Postgres, API, and backup job.
- `traefik/traefik.yml` - Minimal Traefik static config.
- `pgbouncer/pgbouncer.ini` - PgBouncer configuration.
- `pgbouncer/userlist.txt` - Placeholder userlist for PgBouncer.
- `scripts/start-prod.ps1` - PowerShell helper to start the prod compose stack.
- `scripts/compose-seed.sh` - Shell helper to run migrations and seed inside the api container.

Quickstart:

- Ensure DNS for `aphila.io` and `www.aphila.io` point to this host's public IP.
- Create `.env` with the required variables: `POSTGRES_PASSWORD`, `POSTGRES_USER`, `POSTGRES_DB`, `JWT_SECRET`, `DATABASE_URL` (optional)
- Run in PowerShell: `.
scripts\start-prod.ps1`
- After services are up, run migrations and seed: `bash scripts/compose-seed.sh`

Notes:

- Traefik will attempt to obtain Let's Encrypt certificates automatically when TLS challenge succeeds. Ensure ports 80/443 are open.
- Replace `pgbouncer/userlist.txt` with proper MD5 hashes for production users.
- Backups are stored in `postgres/backups`.
