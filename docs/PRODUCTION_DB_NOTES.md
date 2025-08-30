# DATABASE_URL - Locations & Guidance

This file lists locations in the repository where `DATABASE_URL` is referenced and gives quick guidance for ensuring the runtime uses PgBouncer in production.

Files referencing `DATABASE_URL`:

- `docker-compose.yml` (local compose) - defaults to direct Postgres at `db:5432` for simple dev
- `docker-compose.override.yml` - local override; mentions PgBouncer in comments
- `docker-compose.prod.yml` - production compose; default runtime `DATABASE_URL` points at `pgbouncer:6432`
- `docker-compose.pgbouncer.dev.yml` - dev compose (added) to test PgBouncer locally
- `.env.example` - examples and guidance for PgBouncer usage
- `.env` (local) - may contain a `DATABASE_URL` for local testing
- `prisma/schema.prisma` and generated Prisma files - Prisma reads `DATABASE_URL` from env
- `src/config/env.ts` (and `dist/config/env.js`) - the app expects `DATABASE_URL` to be set

Recommendations:

- In production, set `DATABASE_URL` to `postgresql://<user>:<pass>@pgbouncer:6432/<db>?schema=public`.
- Do NOT publish Postgres port 5432 on the host in production Compose. Use PgBouncer as the only exposed DB port if needed.
- Use `docker-compose.pgbouncer.dev.yml` to test connection pooling locally:

  docker compose -f docker-compose.pgbouncer.dev.yml up --build

- Keep `.env` out of source control. Use your secrets manager (Doppler, Vault, or environment variables in your deployment platform).
- CI workflows that run migrations should use a separate admin connection and can connect directly to Postgres (not via PgBouncer) if they need to run DDL safely; otherwise ensure `pgbouncer` is in transaction pooling mode compatible with Prisma.
