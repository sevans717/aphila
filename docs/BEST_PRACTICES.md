# Best Practices and Essentials

## Security

- Input validation: Use schema validation for all request bodies, params, and queries in `src/middleware` or route-level. Reject unknown fields.
- Authentication: Enforce `requireAuth` on private routes; rotate refresh tokens; bind sessions to device and IP where appropriate.
- Authorization: Apply RBAC/ABAC checks in controllers/services; avoid trusting client flags.
- Secrets: Load from environment only; never commit. Use safe defaults in `src/config`.
- Headers: Enable Helmet with strict CSP, HSTS, and sane CORS. Strip `x-powered-by`.
- Transport: Force HTTPS in production; secure cookies with `HttpOnly`, `SameSite`.
- Logging: Structured logs without PII; add request IDs; audit sensitive actions.
- Rate limiting: Per-IP and per-user limits on auth and write endpoints.

## Performance

- DB queries: Use `select`/`include` minimally; add indexes on hot paths (`createdAt`, foreign keys). Use pagination (cursor/offset) everywhere.
- Caching: Cache stable lookups (settings, public lists) at service layer; use ETags/Last-Modified for GETs.
- N+1: Batch reads and use `Promise.allSettled` carefully; avoid per-item queries in loops.
- Media: Stream responses; use chunked uploads; offload heavy transforms to background jobs.

## Testing

- Contract tests: For each route in `tmp/route_service_issues.resolved.json`, assert status codes and schema of responses.
- Auth flows: Happy path, refresh rotation, invalid/expired tokens, revoked devices.
- Media: Upload/download large-file tests, resumable edge cases.
- DB: Seed deterministic data via `prisma/seed.ts`; use transaction rollbacks for isolation.
- Frontend: Test API client to backend contract; snapshot cross-tier map.

## Developer Experience

- Types: Centralize request/response types in `src/schemas`; generate API client types where useful.
- Config: Single `src/config` module with typed getters; `.env.example` maintained.
- Scripts: Keep `scripts/` idempotent; add `npm run route:map` and `npm run route:test` tasks.
- Lint/format: Prettier + ESLint; markdownlint for docs; pre-commit hooks.

## CI/CD

- Pipeline: typecheck, lint, unit/integration tests, Prisma generate/migrate, build, deploy.
- Secrets: Use environment-scoped secrets; never in repo.
- Observability: Health/readiness checks; log aggregation; error tracking hooks.
- Rollbacks: Versioned migrations; blue/green or canary deploys where possible.

## Architecture Notes

- Ports: Run services in 10000-10999 range (API 10080, web 10081).
- CSS: Keep styles in separate CSS files; avoid inline styles.
- Backward compatibility: Evolve API with additive changes; version breaking changes.
- Types/modules: Prefer adding missing types/modules over removing usage.
