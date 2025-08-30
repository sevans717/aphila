# Database Migrations & Seeding

This document describes the commands and steps to run Prisma migrations and the idempotent seed script for local development.

Prerequisites

- Docker & Docker Compose running (Postgres service in `docker-compose.yml`).
- Node.js installed.
- Ports: local Postgres mapped to `5432` by default in `docker-compose.yml`. Use ports in 10000-10999 for additional services if needed.

Common commands

- Install runtime dependencies (only once):
  - `npm install @prisma/client bcrypt`

- Install dev types (optional):
  - `npm install -D @types/bcrypt`

- Generate Prisma client (run after changes to `prisma/schema.prisma` or after installing deps):
  - `npx prisma generate`

- Apply migrations (development):
  - PowerShell: `$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/sav3"; npx prisma migrate dev --name <migration_name>`

- Deploy migrations (production):
  - `npm run prisma:migrate:prod`

- Seed the database (idempotent):
  - `npm run prisma:seed`

Troubleshooting

- `prisma migrate dev` may detect drift if the DB already contains schema from prior runs. If you intend to reset local DB, allow Prisma to reset the schema when prompted (this will wipe data).
- If you see missing module errors for `@prisma/client`, run `npm install @prisma/client` and then `npx prisma generate`.
- For type errors with `bcrypt`, add `@types/bcrypt` to devDependencies.

Notes

- The seed script is written to be idempotent: it uses `upsert`, `findFirst`, `create`, `createMany` with `skipDuplicates` and existence checks to avoid duplicating data.
- In production, point `DATABASE_URL` at PgBouncer (default port `6432` in production compose) rather than Postgres directly.

Contact

- For any issues, check the logs from the Docker Postgres container and Prisma CLI output.
