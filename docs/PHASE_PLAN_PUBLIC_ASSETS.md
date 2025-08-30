# Phase Plan: Restore & Verify Public Static Assets

Purpose

- Ensure required static assets are present in `public/` to prevent Netlify dev 404s and enable local runtime verification.

Phases

1. Inspect existing assets
   - Read `public/` and confirm presence & contents of `manifest.json`, `main.tsx`, and any requested assets.
2. Add minimal placeholders (if missing)
   - Create `manifest.json`, `main.tsx`, and `client/placeholder.txt` to satisfy basic dev server requests.
3. Provide reproducible serving method
   - Add `scripts/serve-public.ps1` and npm script `serve:public` that runs `npx http-server ./public -p 8888`.
4. Verify serving locally
   - Start the static server and confirm `manifest.json` is reachable at `http://localhost:8888/manifest.json`.
5. Document outcomes and next steps
   - Capture logs, note Netlify dev issues, and add instructions for restoring production-ready assets.

Ports

- Use port `8888` for lightweight serving (falls in allowed 10000-10999? If you need to stick to 10000-10999, change to `10088`.)

Verification

- `curl http://localhost:8888/manifest.json` returns JSON content
- Browser loads `http://localhost:8888/` and lists files

Rollback

- Remove `public/*` placeholders or restore original assets from source control

Notes

- Netlify dev sometimes exits in this environment due to CLI login state; use `npx http-server` for local verification if `netlify dev` is unstable.
