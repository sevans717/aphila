# API & Environment Inventory

This document lists environment variables used by the backend, important configuration values, the primary HTTP API endpoints (including the dating app flows), WebSocket events, and recommendations for local/dev/prod `.env` values.

## Summary

- Backend: Node.js + Express + Prisma (PostgreSQL)
- ORM: Prisma (uses `DATABASE_URL`)
- Real-time: Socket.IO (uses `JWT_SECRET` for token verification)
- Storage: Local uploads (`UPLOAD_DIR`) or S3 (`S3_BUCKET_NAME` and AWS credentials)

## Required environment variables (core)

- `DATABASE_URL` — Prisma connection string. Example dev: `postgresql://postgres:postgres@db:5432/sav3`
- `NODE_ENV` — `development|production`
- `PORT` — server port (default `4000`)
- `JWT_SECRET` — used for Socket.IO token verification and some auth checks
- `JWT_ACCESS_SECRET` — (recommended) access token secret used in docs and token generation
- `JWT_REFRESH_SECRET` — (recommended) refresh token secret

## Secrets & encryption

- `ENCRYPTION_KEY` — used for field-level encryption examples; hex-encoded key
- `DOTENV_KEY` — optional: used by some libs for encrypted dotenv vaults

## Storage & media

- `UPLOAD_DIR` — local storage directory (default `./uploads`)
- `AWS_REGION` — AWS region (default `us-east-1`)
- `AWS_ACCESS_KEY_ID` — AWS access key id
- `AWS_SECRET_ACCESS_KEY` — AWS secret access key
- `S3_BUCKET_NAME` — bucket for media

## Firebase / Push

- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY` — newlines must be encoded (code replaces `\\n` with newlines)
- `FIREBASE_CLIENT_EMAIL`
- `ENABLE_PUSH_NOTIFICATIONS` — `true|false`

## Redis / rate limiting / caching

- `REDIS_URL` — default `redis://localhost:6379`
- `RATE_LIMIT_REDIS_URL` — optional override
- `RATE_LIMIT_WINDOW_MS` — default `60000`
- `RATE_LIMIT_MAX` — default `100`

## Email / SMTP

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`

## Feature flags & limits

- `ENABLE_EMAIL_NOTIFICATIONS`, `ENABLE_GEOSPATIAL`, `ENABLE_ANALYTICS` — `true|false`
- `DISABLE_PAYMENTS` — for local/dev
- `MAX_FILE_SIZE` — bytes (default `5242880` = 5MB)
- `ALLOWED_FILE_TYPES` — comma separated mimetypes

## Docker Compose / Postgres

- `POSTGRES_PASSWORD`, `POSTGRES_USER`, `POSTGRES_DB` — defined in `docker-compose.yml`/`docker-compose.prod.yml`

## Prisma-specific

- `PRISMA_CLIENT_ENGINE_TYPE`, `PRISMA_QUERY_ENGINE_BINARY`, `PRISMA_QUERY_ENGINE_LIBRARY` — optional overrides

## Primary HTTP APIs (grouped)

- `GET  /health` — health check
- `GET  /me` — authenticated profile summary

- Auth (`/auth`) — login, register, refresh tokens (see `src/routes/auth.ts`)

- Discovery (`/discovery`)
  - `GET /discovery/discover` — Discovery feed (filters: latitude, longitude, age, interests, limit)
  - `POST /discovery/swipe` — Perform a swipe (payload: `swipedId`, `isLike`, `isSuper`)
  - `GET /discovery/matches` — List user matches
  - `GET /discovery/likes` — Likes received
  - `GET /discovery/communities` — Communities listing

- Messaging (`/messaging`)
  - `POST /messaging/send` — Send a message
  - `GET /messaging/match/:matchId` — Get messages for a match (pagination supported)
  - `PUT /messaging/match/:matchId/read` — Mark messages as read
  - `GET /messaging/unread-count` — Unread messages count
  - `DELETE /messaging/message/:messageId` — Delete a message
  - `GET /messaging/match/:matchId/details` — Match details with messages
  - `POST /messaging/message/:messageId/report` — Report a message

- User (`/user`)
  - `PATCH /user` — Update user profile (requires auth)

- Media (`/media`) — see `src/routes/media.routes.ts` for full details
  - Endpoints for upload, chunked upload sessions, signed URLs, delete media, get user media

- Subscriptions (`/subscription`) — plans, current subscription, usage

- Stories, Posts, Social, Search, Analytics — supporting endpoints for app features

## WebSocket events (Socket.IO)

- Connection uses JWT token (verified with `JWT_SECRET`) — handshake contains token
- Events emitted/handled server-side in `WebSocketService`:
  - `join_match` — join a match room
  - `leave_match`
  - `send_message` — send message (payload contains `matchId`, `content`, `messageType`, `clientNonce`)
  - `message_ack` — ack sent message (sender receives with `clientNonce`)
  - `new_message` — broadcast to match room
  - `message_error` — error with `clientNonce`
  - `typing_start` / `typing_stop` — typing indicators
  - `mark_read` — mark read receipts (server updates DB and emits `messages_read`)
  - `notification` (emitted to `user:<userId>` room)
  - `new_match` (match notifications)

## Quick `.env.example` suggested contents

```bash
DATABASE_URL=postgresql://postgres:postgres@db:5432/sav3
NODE_ENV=development
PORT=4000
JWT_SECRET=replace_with_strong_random
JWT_ACCESS_SECRET=replace_with_strong_random
JWT_REFRESH_SECRET=replace_with_strong_random
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
UPLOAD_DIR=./uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
REDIS_URL=redis://localhost:6379
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@sav3.app
ENABLE_PUSH_NOTIFICATIONS=false
DISABLE_PAYMENTS=true
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4
```

## Integration notes / recommendations

- Add a curated `.env.example` to the repo root and document deployment secret management (Vault/Secrets Manager).
- Use `env.ts` as the single source of truth for runtime config. Add any envs discovered here to `src/config/env.ts` with sensible defaults.
- For staging/prod, point `DATABASE_URL` at PgBouncer (e.g., `postgresql://user:pass@pgbouncer:6432/sav3`) as in `docker-compose.prod.yml`.
- Enforce presence of critical secrets during deploy (CI/CD should fail if required envs missing).
- Frontend: ensure `FRONTEND_URL`/`APP_URL` match deployed app origins; adjust Socket.IO CORS accordingly.

## Frontend quick integration pointers

- Discovery: call `GET /discovery/discover` with lat/long and limit to populate swipe deck.
- Swipe action: `POST /discovery/swipe` with `swipedId`, `isLike`, `isSuper`.
- Matches list: `GET /discovery/matches` then open conversation with messages from `GET /messaging/match/:matchId`.
- Sending messages: `POST /messaging/send` or use Socket.IO `send_message` for real-time.
- Use `GET /messaging/unread-count` for badge counts.

If you want, I can now:

- Commit this file and mark the todo completed. (recommended)
- Also scaffold `sav3-frontend/mobile/src/api/discovery.ts` and `messaging.ts` stubs that call these endpoints.
