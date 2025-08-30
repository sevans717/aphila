# Unified Phase Plan

This plan ties frontend, backend, and database evolution. Each phase is 100% complete before moving on, backward compatible, and documented. Services use ports 10000-10999 locally (API host port `10010` by default). CSS lives in separate files; avoid inline styles. Always create missing types/modules instead of removing.

## Phase 1: Route Surface Verification & Contracts

- Goal: Ensure every frontend call has a matching backend route and typed contract; document all endpoints.

- Backend:
  - Generate and commit `tmp/route_service_issues.resolved.json` (done) and `docs/CODEBASE_INDEX.md`.
  - Add request/response TypeScript types in `src/schemas` where missing (e.g., user.profile update, posts feed, media list).

- Frontend:
  - Centralize API base and clients (web + mobile) using a single module; ensure Netlify functions proxy preserves auth headers.

- DB:
  - No schema changes; map each endpoint to models used. Create `docs/CROSS_TIER_MAP.json` (done).

- Testing:
  - Add smoke tests for health, auth, posts feed, media list using `systematic-tester.ts`.

- Output: Updated docs, green smoke tests.

## Phase 2: Authentication & Session Hardening

- Backend: Strengthen `requireAuth`, add refresh token rotation, device tracking, rate limits for auth endpoints.
- Frontend: Persist tokens securely; handle refresh transparently.
- DB: Ensure `Device` and `Verification` usage is wired.
- Testing: Brute-force prevention, invalid token paths.

## Phase 3: Media Pipeline Stabilization

- Backend: Finalize chunked uploads with resumable support; background processing hooks.
- Frontend: Unified uploader with progress, retries.
- DB: Indexes on `MediaAsset(userId, createdAt)`; ensure bookmarks and shares link.
- Testing: Concurrency, large files.

## Phase 4: Posts, Social, and Bookmarks

- Backend: Ensure idempotent toggles; pagination and sorting; moderation hooks.
- Frontend: Virtualized feeds, optimistic updates.
- DB: Counter caches with transactional updates; add missing FKs/indexes if needed.
- Testing: Contract tests for likes/comments/bookmarks.

## Phase 5: Realtime & Messaging

- Backend: Harden presence, queues, backpressure; delivery receipts.
- Frontend: Typing indicators, unread counts.
- DB: Indexes on `Message(matchId, createdAt)`.
- Testing: Reliability under disconnects.

## Phase 6: Discovery, Geospatial, and Search

- Backend: Parameterized queries, abuse limits.
- Frontend: Filters and map UI; separate CSS.
- DB: Geospatial indexes; `SearchQuery` analytics.
- Testing: Relevance and performance.

## Phase 7: Notifications & Mobile Integration

- Backend: Topic subscriptions, granular preferences.
- Frontend: Mobile push wiring; settings UI.
- DB: Ensure `Device` and `Notification` flows.
- Testing: E2E notification delivery paths.

## Phase 8: Analytics & Admin

- Backend: Aggregations endpoints; funnel and feature tracking.
- Frontend: Admin dashboard views.
- DB: Materialized views or cached tables as needed.
- Testing: Data correctness, privacy.

## Operational Essentials

- Ports: Prefer `10000-10999` for local services (e.g., API on `10080`, web on `10081`).
- Env/config: Centralize in `.env` and `src/config` with type-safe access.
- CI/CD: Lint, typecheck, tests, Prisma generate, deploy to Netlify/containers.
- Observability: Request IDs, structured logs, health and readiness endpoints.
- Security: Helmet/CORS, input validation via schemas, RBAC, audit logs.

## Documentation

- Update this plan and `CODEBASE_INDEX.md` when endpoints/types change.
- Record migrations in `prisma/migrations` and summarize in `PRODUCTION_DB_README.md`.
