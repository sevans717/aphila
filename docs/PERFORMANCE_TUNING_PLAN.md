# Performance Tuning Plan

Objective: Improve database and API performance with measurable steps, enable profiling, and add automated checks.

Phases:

1. Enable Profiling and Metrics
   - Enable `pg_stat_statements` on Postgres (docker-compose, postgresql.conf, shared_preload_libraries).
   - Add Prometheus exporter metrics for slow queries and query duration.
   - Add `scripts/db/collect-slow-queries.sh` to extract top queries.

2. Index Audit
   - Audit current indexes vs query patterns (use `pg_stat_statements` and `EXPLAIN (ANALYZE, BUFFERS)`)
   - Add missing indexes in Prisma schema with migrations.
   - Identify redundant or unused indexes to remove.

3. Connection Pooling & PgBouncer
   - Verify PgBouncer modes (transaction pooling recommended) and per-role limits.
   - Tune `pgbouncer.ini` for max_client_conn, default_pool_size, reserve_pool_size, and pool_timeout.
   - Ensure Prisma connects via PgBouncer in production compose.

4. Query Optimization
   - Identify top-heavy queries and add `EXPLAIN` plans.
   - Rewrite queries to use JOINs, proper filters, and appropriate LIMIT/OFFSET or keyset pagination.
   - Add `EXPLAIN` collection scripts.

5. Caching & Redis
   - Add query caching for heavy read endpoints using Redis TTL caches.
   - Cache tokens/presigned URLs if appropriate.

6. Benchmarks & CI
   - Add `scripts/bench/` for simple load tests using `pgbench` or `artillery`.
   - Add CI job to run low-overhead smoke benchmarks on PRs for critical endpoints.

7. Monitoring & Alerts
   - Add Grafana dashboards for query latency, connection counts, and top queries.
   - Add alerts for slow query rate increase and connection saturation.

Acceptance Criteria:

- Average p95 query latency under target for critical endpoints (to be defined).
- No connection saturation during baseline load.
- Automated collection of slow queries and explain plans.

Owners: DBA/Backend team

Next step: add DB profiling scripts.
