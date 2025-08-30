Backend service for Aphila - Railway-like DB provisioner and recommendation engine

Quick commands

Start locally (requires docker-compose stack):

  cd services/backend
  npm install
  npm run dev

Seed sample users (Postgres must be running and PostGIS enabled):

  npm run seed-sample 100

Generate recommendations (runs worker once):

  npm run generate-recs

API endpoints of interest

  GET /health
  GET /databases
  POST /databases
  POST /recommendations/generate  { user_id, limit }
  GET  /recommendations/:userId
  PATCH /recommendations/:userId  { candidate_id, status }
  POST  /recommendations/:userId/seen  { candidate_ids: [] }

Notes

- The recommendation worker is configured via environment variable `RECS_INTERVAL_SECONDS` and runs inside docker-compose as `recs_worker`.
- This is demo code; in production move worker logic into a dedicated job system (Sidekiq, BullMQ, Kubernetes CronJob) and ensure idempotency and backpressure controls.
