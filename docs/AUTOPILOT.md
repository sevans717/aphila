# Autopilot Runner

Purpose:

- Enable an automated "no confirmation" process for routine checks (builds, simple fixes, and issue creation) while keeping commits optional and safe.

Files added:

- `.autopilot.json` — control flags (`autoProceed`, `autoCommit`, `runIntervalMinutes`, `autoCreateIssues`).
- `scripts/autopilot-run.ps1` — local runner that reads `.autopilot.json`, runs `npm run build`, optionally commits and pushes changes, and can create GitHub issues when failures occur.
- `.github/workflows/autopilot.yml` — scheduled GitHub Action that runs hourly and files issues on failure.

How to use locally (PowerShell):

```powershell
# Run once
.\scripts\autopilot-run.ps1 -once

# Run continuously (background)
Start-Job -ScriptBlock { .\scripts\autopilot-run.ps1 }
```

Safety:

- `autoCommit` is `false` by default. Turn it on only if you trust automated commits and have secure tokens configured.
- The CI workflow only opens issues on failures — it does not push changes.
