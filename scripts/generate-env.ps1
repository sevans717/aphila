Param(
    [string]$ExamplePath = ".env.example",
    [string]$OutPath = ".env"
)

# Generate cryptographically secure random hex string
function New-RandomHex([int]$bytes = 32) {
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $buf = New-Object byte[] $bytes
    $rng.GetBytes($buf)
    return ($buf | ForEach-Object { $_.ToString("x2") }) -join ''
}

# Read example
if (-not (Test-Path $ExamplePath)) {
    Write-Error "Example file '$ExamplePath' not found."
    exit 1
}

$content = Get-Content $ExamplePath -Raw

# Replace common placeholders with secure values
$content = $content -replace 'JWT_SECRET=\S*', "JWT_SECRET=$(New-RandomHex 48)"
$content = $content -replace 'JWT_ACCESS_SECRET=\S*', "JWT_ACCESS_SECRET=$(New-RandomHex 48)"
$content = $content -replace 'JWT_REFRESH_SECRET=\S*', "JWT_REFRESH_SECRET=$(New-RandomHex 64)"
$content = $content -replace 'ENCRYPTION_KEY=\S*', "ENCRYPTION_KEY=$(New-RandomHex 32)"
$content = $content -replace 'SESSION_SECRET=\S*', "SESSION_SECRET=$(New-RandomHex 48)"

# Ensure DB url left as-is, but if a placeholder exists, keep it
if ($content -notmatch 'DATABASE_URL=') {
    $content = "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sav3`n" + $content
}

# Write output
Set-Content -Path $OutPath -Value $content -Encoding UTF8
Write-Output "Wrote $OutPath with generated secrets. Review external service keys and fill them as needed."
