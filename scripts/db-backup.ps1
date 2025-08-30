# Database Backup Script
# Creates compressed database backups with timestamp

param(
    [Parameter()]
    [string]$BackupDir = "./backups",

    [Parameter()]
    [string]$DatabaseUrl = $env:DATABASE_URL,

    [Parameter()]
    [switch]$Compress = $true,

    [Parameter()]
    [int]$RetentionDays = 30
)

# Ensure backup directory exists
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force
    Write-Host "Created backup directory: $BackupDir"
}

# Parse database connection details
if (!$DatabaseUrl) {
    Write-Error "DATABASE_URL environment variable not set"
    exit 1
}

# Extract connection details from DATABASE_URL
$uri = [System.Uri]$DatabaseUrl
$hostname = $uri.Host
$port = $uri.Port
$database = $uri.LocalPath.TrimStart('/')
$userInfo = $uri.UserInfo.Split(':')
$username = $userInfo[0]
$password = if ($userInfo.Length -gt 1) { $userInfo[1] } else { "" }

# Set environment variables for pg_dump
$env:PGPASSWORD = $password

# Generate backup filename
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = Join-Path $BackupDir "sav3_backup_$timestamp"

try {
    Write-Host "Starting database backup..."
    Write-Host "Database: $database@$hostname:$port"
    Write-Host "Backup file: $backupFile"

    if ($Compress) {
        $backupFile += ".dump"
        # Use custom format for compression
        & pg_dump -h $hostname -p $port -U $username -d $database -Fc -f $backupFile
    } else {
        $backupFile += ".sql"
        # Use plain text format
        & pg_dump -h $hostname -p $port -U $username -d $database -f $backupFile
    }

    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $backupFile).Length / 1MB
        Write-Host "✅ Backup completed successfully!"
        Write-Host "📁 File: $backupFile"
        Write-Host "📏 Size: $([math]::Round($fileSize, 2)) MB"

        # Clean up old backups
        Write-Host "🧹 Cleaning up backups older than $RetentionDays days..."
        Get-ChildItem $BackupDir -Filter "sav3_backup_*" |
            Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-$RetentionDays) } |
            ForEach-Object {
                Remove-Item $_.FullName -Force
                Write-Host "🗑️  Removed old backup: $($_.Name)"
            }

        Write-Host "✅ Backup and cleanup completed!"
    } else {
        Write-Error "❌ Backup failed with exit code: $LASTEXITCODE"
        exit 1
    }

} catch {
    Write-Error "❌ Backup failed: $_"
    exit 1
} finally {
    # Clear password from environment
    $env:PGPASSWORD = $null
}
