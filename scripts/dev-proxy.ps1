Param()

# Simple dev proxy helper for Windows PowerShell.
# For mobile emulator/simulator that can't reach localhost, use this to forward
# requests to the local API service address.

if (-not (Test-Path -Path .env)) {
    Write-Host ".env not found in repo root. Create from .env.example and set REACT_NATIVE_API_URL or run with --api-url"
}

$apiUrl = $env:REACT_NATIVE_API_URL
if (-not $apiUrl) {
    $apiUrl = Read-Host "Enter API URL to proxy to (e.g. http://192.168.1.5:4000)"
}

Write-Host "Starting dev-proxy: forwarding mobile requests to $apiUrl"

# This script is a placeholder: for advanced proxying use `ngrok`, `localtunnel`, or a small Node script.
Write-Host "Tip: use 'ngrok http 4000' for quick public tunnels when testing on physical devices."
