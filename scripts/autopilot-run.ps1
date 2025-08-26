param(
  [switch]$once
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "Starting autopilot runner from $root"

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
    git commit -m "chore(autopilot): automated changes" || Write-Host "No changes to commit"
    git push origin main
  }

  if ($once) { break }
  Start-Sleep -Seconds ($cfg.runIntervalMinutes * 60)
}
