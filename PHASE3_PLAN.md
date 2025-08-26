# Phase 3 — Frontend Wiring (Aphila)

Goal: Wire the mobile frontend (`sav3-frontend` and `mobile/`) to the backend API, finish env propagation, and provide a local developer experience using `docker-compose.override.yml`.

Checklist:

- Create `docker-compose.override.yml` for local development (done).
- Verify API base URL via `config/env.ts` and surface a `REACT_NATIVE_API_URL` env var to the mobile app.
- Add a small `scripts/dev-proxy.sh|ps1` to forward API requests to local `api` service for the mobile simulator.
- Map required endpoints for the frontend (priority list):
  - Auth (`/api/v1/auth/*`): login, register, refresh token
  - Users (`/api/v1/users/*`): profile fetch/update, avatar upload
  - Discovery (`/api/v1/discovery/*`): feed, location updates
  - Stories (`/api/v1/stories/*`): CRUD and highlights
  - Messaging (`/api/v1/messages/*`): send, receive, unread counts
  - Subscriptions (`/api/v1/subscriptions/*`): plans and status
- Add sample `.env.dev` and update `mobile/app.json` / `App.tsx` to read `REACT_NATIVE_API_URL` for dev builds.
- Document steps to run mobile app against local backend (Android emulator, iOS simulator, Expo Go).

Notes:

- Testing and CI for frontend will be added in Phase 4.
- If you want, I can implement the `scripts/dev-proxy.ps1` and update `mobile/app.json` next.
