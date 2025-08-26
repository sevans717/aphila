# Starts the production compose stack
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

docker-compose -f ..\docker-compose.prod.yml up -d --build
Write-Host "Started production stack. Traefik will handle TLS for aphila.io when DNS points to this host."
