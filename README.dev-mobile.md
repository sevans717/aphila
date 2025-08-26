# Mobile Dev — Local Backend Wiring

This document explains how to run the mobile app (`sav3-frontend/mobile`) against the local backend.

1. Copy `.env.dev.example` to `.env.dev` at the repo root and update `REACT_NATIVE_API_URL` if needed.

2. Start the backend API locally:

```powershell
npm run dev
```

By default the API runs on `http://localhost:4000` (see `docker-compose.override.yml` and `PHASE3_PLAN.md`).

1. If your emulator/device cannot reach `localhost` run a tunnel or use the dev-proxy script:

```powershell
# Simple prompt-based helper (Windows PowerShell)
./scripts/dev-proxy.ps1

# Or use ngrok for a public tunnel:
ngrok http 4000
```

1. Update the Expo configuration if necessary — `sav3-frontend/mobile/app.json` contains an `extra.REACT_NATIVE_API_URL` field used by the app.

1. Start the app with Expo or your preferred workflow.

Tips:

- For quick physical device testing, `ngrok` is usually simplest.
- Keep `.env.dev` out of version control.
