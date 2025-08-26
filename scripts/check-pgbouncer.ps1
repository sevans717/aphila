<#
Check PgBouncer connectivity by running a small `psql` query inside a temporary container
Usage: ./scripts/check-pgbouncer.ps1
#>

$composeFile = "..\docker-compose.prod.yml"

Write-Host "Running psql connectivity check against PgBouncer (pgbouncer:6432) using docker run..."

# Use the official postgres image's psql client to attempt a connection to pgbouncer
# Expects .env (or compose) to have POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB

$envFile = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "..\..\.env"

# Load env if present
if (Test-Path $envFile) {
  Write-Host "Loading .env from project root"
  Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*([^#=]+)=(.*)$"){
      $name = $matches[1].Trim()
      $value = $matches[2].Trim(' "')
      Set-Item -Path env:$name -Value $value
    }
  }
}

$pgUser = $env:POSTGRES_USER -or "postgres"
$pgPass = $env:POSTGRES_PASSWORD -or "postgres"
$pgDb = $env:POSTGRES_DB -or "sav3"

$psqlCmd = "PGPASSWORD=$pgPass psql -h pgbouncer -p 6432 -U $pgUser -d $pgDb -c \"SELECT 1;\""

Write-Host "Executing: $psqlCmd"

docker compose -f $composeFile run --rm --no-deps --entrypoint sh pgbouncer -c "$psqlCmd"

Write-Host "PgBouncer connectivity check finished."
