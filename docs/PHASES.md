# Project Phases for aphila (complete, ordered)

Phase 1 — Infrastructure (completed)

- Goal: Prepare production-ready infra for self-hosting.
- Tasks:
  - Docker Compose for production with Traefik, PgBouncer, Postgres, Adminer, and app services.
  - TLS via Let's Encrypt (Traefik), secure dashboard with basic auth.
  - PgBouncer for pooling and connection limits; helper scripts to check connectivity.
  - Backup scripts and README for production DB (pg_dump/pgbackrest, WAL archiving notes).
  - Deployment docs and env examples (`.env.example`, `PRODUCTION_DB_README.md`).

Phase 2 — Backend API Completion & Hardening (in-progress)

- Goal: Implement remaining API endpoints, refactor Prisma usage, integrate middleware, and ensure tests/builds pass.
- Tasks:
  - Ensure Prisma uses singleton client and DATABASE_URL points to PgBouncer in prod compose.
  - Implement missing route handlers and replace 'throw' placeholders.
  - Implement mock payment receipts when `DISABLE_PAYMENTS=true` (done).
  - Add S3 signed-url dev fallback (done).
  - Add runtime PgBouncer connectivity checks and graceful retry logic.
  - Add validation middleware and rate limiting where missing.
  - Add unit and integration tests for critical endpoints.
  - Update `tmp/route_service_issues.json` to reflect manual edits.

Phase 3 — Frontend Wiring & Mobile Integration

- Goal: Connect mobile frontend (`sav3-frontend`) to APIs, validate auth flows, and implement client-side feature flags.
- Tasks:
  - Verify API clients (`src/client/sav3-api-client.ts`) match server endpoints and types.
  - Implement token refresh flows and protected route handling in RN app.
  - Wire up media upload paths (signed URL flow) for profile photos and stories.
  - Add e2e smoke tests (Expo + Detox/Cypress).

Phase 4 — Payments & Billing (production-ready)

- Goal: Integrate a real payment processor (Stripe), receipts, webhooks, and subscription lifecycle.
- Tasks:
  - Replace dev payment bypass with Stripe integration and webhook handlers.
  - Persist receipts, invoices, and reconcile via background jobs.
  - Add tests for billing flows and edge cases (charge failures, retries).

Phase 5 — Observability & Scaling

- Goal: Add logging, metrics, tracing, and autoscaling patterns.
- Tasks:
  - Add Prometheus exporters, Grafana dashboards, and alerting rules.
  - Add structured logging (pino/winston) and error reporting (Sentry).
  - Add Redis for caching and presence; add worker queue for background jobs.

Phase 6 — High Availability & Backups

- Goal: Configure DB replication, automated backups, and failover.
- Tasks:
  - Implement streaming replication or managed replica strategy.
  - Add PITR with WAL archiving and pgbackrest automated restores.
  - Harden backups, rotation, and test restores.

Phase 7 — Final QA, Security Review, and Launch

- Goal: Complete testing, security audit, and launch checklist.
- Tasks:
  - Perform security audit (dependency, secret scanning, pen test checklist).
  - Run full regression test suite and performance/load tests.
  - Finalize domain DNS, TLS, and CI/CD promotions to production.

Notes:

- The repository already contains infra for Phase 1 and substantial Phase 2 work.
- Phase 2 is currently active; next concrete tasks are reviewing `tmp/route_service_issues.json`, implementing remaining placeholders (media/subscription), and adding tests.
