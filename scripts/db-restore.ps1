# Database Restore Script
# Restores database from backup files

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,

    [Parameter()]
    [string]$DatabaseUrl = $env:DATABASE_URL,

    [Parameter()]
    [switch]$Force,

    [Parameter()]
    [string]$TargetDatabase = $null
)

# Validate backup file exists
if (!(Test-Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

# Parse database connection details
if (!$DatabaseUrl) {
    Write-Error "DATABASE_URL environment variable not set"
    exit 1
}

$uri = [System.Uri]$DatabaseUrl
$hostname = $uri.Host
$port = $uri.Port
$database = if ($TargetDatabase) { $TargetDatabase } else { $uri.LocalPath.TrimStart('/') }
$userInfo = $uri.UserInfo.Split(':')
$username = $userInfo[0]
$password = if ($userInfo.Length -gt 1) { $userInfo[1] } else { "" }

# Set environment variable for pg_restore
$env:PGPASSWORD = $password

try {
    Write-Host "🔄 Starting database restore..."
    Write-Host "📁 Backup file: $BackupFile"
    Write-Host "🎯 Target database: $database@${hostname}:${port}"

    # Warning for production
    if (!$Force) {
        $confirmation = Read-Host "⚠️  This will overwrite the existing database. Continue? (yes/no)"
        if ($confirmation -ne "yes") {
            Write-Host "❌ Restore cancelled by user"
            exit 0
        }
    }

    # Determine file type and restore accordingly
    $extension = [System.IO.Path]::GetExtension($BackupFile)

    if ($extension -eq ".dump") {
        Write-Host "📦 Restoring from custom format backup..."
        # Drop existing connections and recreate database
        & psql -h $hostname -p $port -U $username -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$database' AND pid <> pg_backend_pid();"
        & dropdb -h $hostname -p $port -U $username --if-exists $database
        & createdb -h $hostname -p $port -U $username $database

        # Restore from custom format
        & pg_restore -h $hostname -p $port -U $username -d $database -v $BackupFile
    } elseif ($extension -eq ".sql") {
        Write-Host "📄 Restoring from SQL format backup..."
        # Drop and recreate database
        & psql -h $hostname -p $port -U $username -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$database' AND pid <> pg_backend_pid();"
        & dropdb -h $hostname -p $port -U $username --if-exists $database
        & createdb -h $hostname -p $port -U $username $database

        # Restore from SQL file
        & psql -h $hostname -p $port -U $username -d $database -f $BackupFile
    } else {
        Write-Error "❌ Unsupported backup file format: $extension"
        exit 1
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database restore completed successfully!"

        # Run Prisma migration to ensure schema is up to date
        Write-Host "🔄 Running Prisma migrations to ensure schema is current..."
        & npx prisma migrate deploy

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migrations applied successfully!"
        } else {
            Write-Warning "⚠️  Migrations failed, but restore was successful"
        }

    } else {
        Write-Error "❌ Restore failed with exit code: $LASTEXITCODE"
        exit 1
    }

} catch {
    Write-Error "❌ Restore failed: $_"
    exit 1
} finally {
    # Clear password from environment
    $env:PGPASSWORD = $null
}

Write-Host ""
Write-Host "📋 Restore Summary:"
Write-Host "   Source: $BackupFile"
Write-Host "   Target: $database@${hostname}:${port}"
Write-Host "   Status: ✅ Completed"
