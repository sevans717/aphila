# Prisma Deploy Log — `prisma_deploy_final.log`

This document captures the output from running `npx prisma migrate deploy` with `prisma/schema.prisma` against the local database. The deploy was run with DATABASE_URL pointing at `postgresql://postgres:postgres@localhost:5433/sav3?schema=public`.

---

```log
? GitHub Copilot CLI loaded for HApiGraS project!
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "sav3", schema "public" at "localhost:5433"

8 migrations found in prisma/migrations

Error: P3009

migrate found failed migrations in the target database, new migrations will not be applied. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve
The `001_init.obsolete` migration started at 2025-08-27 03:22:47.663670 UTC failed
```

## Summary & Next Steps

- Error `P3009` indicates there are previously-applied (or failed) migrations in the database that must be resolved before new migrations can be applied with `prisma migrate deploy`.
- Typical resolution steps:
  1. Inspect the `prisma/migrations` folder and the failed migration (`001_init.obsolete`) to see what SQL it runs.
  2. Check the `migrations` table in the database (`_prisma_migrations`) to see applied/failed statuses.
  3. If the migration partially applied, you may need to manually revert the partial changes or mark the migration as applied using `prisma migrate resolve --applied "<migration_name>"` after ensuring it's safe.
  4. For local dev, you can reset the DB (DROP/CREATE) and run `npx prisma migrate dev` — do NOT do this in production.

If you want, I can:

- Inspect `prisma/migrations/001_init.obsolete` and nearby migration files and summarize the SQL.
- Query the database `_prisma_migrations` table to show the migration status.
- Help craft safe steps to resolve the failed migration (manual SQL revert or `prisma migrate resolve`) and re-run migrations.

Which action should I take next?
