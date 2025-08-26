# Run Prisma migrations and seed against production DB via a temporary container
# Usage: ./scripts/run-migrations-seed.ps1

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

$composeFile = "..\docker-compose.prod.yml"

Write-Host "Running migrations and seed using temporary container attached to production network"

# Use the same image build as api, but run migrations + seed against the network
# Ensure .env exists next to the compose file with DB credentials

docker compose -f $composeFile run --rm api sh -c "npx prisma migrate deploy && node dist/prisma/seed.js"

Write-Host "Migrations and seed completed (or check logs above)."
