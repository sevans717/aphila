# ===========================================
# ENVIRONMENT SWITCHING SCRIPT
# ===========================================
# This script helps you switch between different environments
# Usage: .\switch-env.ps1 [development|staging|production]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment
)

$envFile = ".env.$Environment"
$targetFile = ".env"

if (Test-Path $envFile) {
    Copy-Item $envFile $targetFile -Force
    Write-Host "Switched to $Environment environment"
    Write-Host "Active .env file now points to $Environment configuration"
} else {
    Write-Error "Environment file $envFile not found!"
    exit 1
}

# Display current environment
$currentEnv = Get-Content $targetFile | Select-String "NODE_ENV=" | ForEach-Object { $_.Line.Split('=')[1] }
Write-Host "Current NODE_ENV: $currentEnv"
