param(
  [switch]$once
)

# Determine repository root (assume script sits in repo/scripts)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root = Resolve-Path (Join-Path $scriptDir '..')
Write-Host "Starting autopilot runner from $scriptDir; using repo root $root"

# Look for config in repo root
$configPath = Join-Path $root '.autopilot.json'
if (-Not (Test-Path $configPath)) { Write-Host "No autopilot config found at $configPath"; exit 1 }
$cfg = Get-Content $configPath | ConvertFrom-Json

while ($true) {
  Write-Host "Running build..."
  npm run build
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed"
    if ($cfg.autoCreateIssues) {
      gh issue create --title "Autopilot: build failure" --body "Build failed during autopilot run. Check logs." --repo sevans717/aphila
    }
  }

  if ($cfg.autoCommit) {
    git add -A
    $commit = git commit -m "chore(autopilot): automated changes" 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Host "No changes to commit" } else { git push origin main }
  }

  if ($once) { break }
  Start-Sleep -Seconds ($cfg.runIntervalMinutes * 60)
}
