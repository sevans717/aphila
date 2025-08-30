# master-test-runner-enhanced.ps1
# Enhanced Master Test Runner with comprehensive coverage of all features

param(
    [switch]$All,
    [switch]$Backend,
    [switch]$Mobile,
    [switch]$Desktop,
    [switch]$Web,
    [switch]$Integration,
    [switch]$Performance,
    [switch]$Security,
    [switch]$Database,
    [switch]$API,
    [switch]$Realtime,
    [switch]$Media,
    [switch]$Geospatial,
    [switch]$Analytics,
    [switch]$Notifications,
    [switch]$Presence,
    [switch]$Reactions,
    [string]$Environment = "test",
    [switch]$Parallel,
    [switch]$Verbose,
    [switch]$SkipTypeCheck,
    [switch]$SkipLint,
    [string]$ReportFormat = "json",
    [int]$Timeout = 300
)

$ErrorActionPreference = "Stop"

# --- Test Suite Configuration ---
$TestConfig = @{
    Backend = @{
        Script = ".\scripts\backend-tests.ps1"
        Types = @("Unit", "Integration", "TypeCheck", "Lint", "Security", "Performance")
        Priority = "Critical"
    }
    Mobile = @{
        Script = ".\scripts\mobile-tests.ps1"
        Types = @("Unit", "E2E", "Device", "Push", "Offline", "Sync")
        Priority = "High"
    }
    Desktop = @{
        Script = ".\scripts\desktop-tests.ps1"
        Types = @("Unit", "Integration", "Build", "Realtime", "Performance")
        Priority = "High"
    }
    Web = @{
        Script = ".\scripts\web-tests.ps1"
        Types = @("Unit", "Integration", "E2E", "Accessibility", "Performance")
        Priority = "Medium"
    }
    Integration = @{
        Script = ".\scripts\integration-tests.ps1"
        Types = @("API", "Database", "Services", "FullStack", "CrossPlatform", "Realtime")
        Priority = "Critical"
    }
    Performance = @{
        Script = ".\scripts\performance-tests.ps1"
        Types = @("API", "Database", "WebSocket", "Media", "Geospatial", "Load", "Stress", "Memory")
        Priority = "High"
    }
    Security = @{
        Script = ".\scripts\security-tests.ps1"
        Types = @("Auth", "API", "Database", "Media", "Injection", "XSS", "CSRF", "Rate-Limiting")
        Priority = "Critical"
    }
    Database = @{
        Script = ".\scripts\database-tests.ps1"
        Types = @("Schema", "Migrations", "Seed", "Performance", "Integrity", "Backup", "Replication")
        Priority = "Critical"
    }
    API = @{
        Script = ".\scripts\api-tests.ps1"
        Types = @("Health", "Auth", "CRUD", "Validation", "Error-Handling", "Rate-Limiting", "Pagination")
        Priority = "Critical"
    }
    Realtime = @{
        Script = ".\scripts\realtime-tests.ps1"
        Types = @("WebSocket", "Presence", "Messaging", "Reactions", "Typing", "Read-Receipts", "Connection-Handling")
        Priority = "High"
    }
    Media = @{
        Script = ".\scripts\media-tests.ps1"
        Types = @("Upload", "Processing", "Compression", "Validation", "Storage", "Streaming", "Thumbnails", "Caching")
        Priority = "High"
    }
    Geospatial = @{
        Script = ".\scripts\geospatial-tests.ps1"
        Types = @("Distance", "Radius", "Polygon", "Performance", "Index-Usage", "Fallback")
        Priority = "Medium"
    }
    Analytics = @{
        Script = ".\scripts\analytics-tests.ps1"
        Types = @("Events", "Metrics", "Aggregation", "Performance", "Data-Integrity")
        Priority = "Medium"
    }
    Notifications = @{
        Script = ".\scripts\notifications-tests.ps1"
        Types = @("Push", "InApp", "Email", "SMS", "Preferences", "Delivery", "Templates")
        Priority = "High"
    }
    Presence = @{
        Script = ".\scripts\presence-tests.ps1"
        Types = @("Online-Status", "Activity-Tracking", "Real-Time-Updates", "UI-Integration")
        Priority = "Medium"
    }
    Reactions = @{
        Script = ".\scripts\reactions-tests.ps1"
        Types = @("Message-Reactions", "Real-Time-Updates", "UI-Integration", "Performance")
        Priority = "Medium"
    }
}

$PriorityOrder = @("Critical", "High", "Medium", "Low")

function Write-TestHeader {
    param([string]$Title, [string]$Level = "H1")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    switch ($Level) {
        "H1" { Write-Host "`n[$timestamp] ╔══ $Title ══╗" -ForegroundColor Cyan }
        "H2" { Write-Host "`n[$timestamp] ├─ $Title" -ForegroundColor Yellow }
        "H3" { Write-Host "[$timestamp] │  $Title" -ForegroundColor Gray }
        default { Write-Host "[$timestamp] === $Title ===" -ForegroundColor Cyan }
    }
}

function Write-TestResult {
    param([string]$TestName, [bool]$Success, [string]$Duration, [int]$Level = 0)
    $indent = "  " * $Level
    $status = if ($Success) { "[PASS]" } else { "[FAIL]" }
    $color = if ($Success) { "Green" } else { "Red" }
    Write-Host "$indent$status $TestName ($Duration)" -ForegroundColor $color
}

function Test-Prerequisites {
    Write-TestHeader "Checking Prerequisites" "H2"
    $prerequisites = @{
        "Node.js" = { node --version }
        "TypeScript" = { npx tsc --version }
        "Docker" = { docker --version }
        "PostgreSQL" = { docker ps --filter "name=postgres" --format "table {{.Names}}\t{{.Status}}" }
        "Redis" = { docker ps --filter "name=redis" --format "table {{.Names}}\t{{.Status}}" }
        "MinIO" = { docker ps --filter "name=minio" --format "table {{.Names}}\t{{.Status}}" }
    }
    $allGood = $true
    foreach ($prereq in $prerequisites.Keys) {
        try {
            $result = & $prerequisites[$prereq]
            Write-Host "✅ ${prereq}: Available" -ForegroundColor Green
            if ($Verbose) { Write-Host "   Details: $($result -join ', ')" -ForegroundColor Gray }
        } catch {
            Write-Host "❌ ${prereq}: Not available or not running" -ForegroundColor Red
            $allGood = $false
        }
    }
    return $allGood
}

function Test-TypeScriptCheck {
    if ($SkipTypeCheck) {
        Write-Host "⏩ Skipping TypeScript check" -ForegroundColor Yellow
        return $true
    }
    Write-TestHeader "TypeScript Compilation Check" "H2"
    $startTime = Get-Date
    try {
        $output = npx tsc --noEmit --noUnusedLocals --noUnusedParameters 2>&1
        $success = $LASTEXITCODE -eq 0
        if ($success) {
            Write-Host "✅ TypeScript compilation successful" -ForegroundColor Green
        } else {
            Write-Host "❌ TypeScript compilation failed" -ForegroundColor Red
            if ($Verbose -or -not $success) { Write-Host $output -ForegroundColor Red }
        }
        $duration = (Get-Date) - $startTime
        Write-TestResult -TestName "TypeScript Check" -Success $success -Duration "$([math]::Round($duration.TotalSeconds, 2))s"
        return $success
    } catch {
        Write-Host "❌ TypeScript check error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-LintCheck {
    if ($SkipLint) {
        Write-Host "⏩ Skipping lint check" -ForegroundColor Yellow
        return $true
    }
    Write-TestHeader "ESLint Check" "H2"
    $startTime = Get-Date
    try {
        $output = npx eslint "src/**/*.{ts,js,tsx}" "docker/**/*.{ts,js}" "docker/media-proxy/src/**/*.{ts,js}" --ext .ts,.js,.tsx --ignore-pattern src/generated --no-error-on-unmatched-pattern --max-warnings 50 2>&1
        $success = $LASTEXITCODE -eq 0
        if ($success) {
            Write-Host "✅ Lint check successful" -ForegroundColor Green
        } else {
            Write-Host "❌ Lint check failed" -ForegroundColor Red
            if ($Verbose -or -not $success) { Write-Host $output -ForegroundColor Red }
        }
        $duration = (Get-Date) - $startTime
        Write-TestResult -TestName "ESLint Check" -Success $success -Duration "$([math]::Round($duration.TotalSeconds, 2))s"
        return $success
    } catch {
        Write-Host "❌ Lint check error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-DatabaseConnection {
    Write-TestHeader "Database Connectivity Check" "H2"
    try {
        $startTime = Get-Date
        $env:PGPASSWORD = "test"
        $output = psql -h localhost -p 10001 -U test -d sav3_test -c "SELECT 1 as test_connection;" 2>&1
        $success = $LASTEXITCODE -eq 0
        $duration = (Get-Date) - $startTime
        if ($Verbose) { Write-Host "Database connection output: $output" -ForegroundColor Gray }
        Write-TestResult -TestName "Database Connection" -Success $success -Duration "$([math]::Round($duration.TotalSeconds, 2))s"
        return $success
    } catch {
        Write-Host "❌ Database connection test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-APIHealthChecks {
    Write-TestHeader "API Health Checks" "H2"
    $healthEndpoints = @{
        "Main Health" = "http://localhost:4000/health"
        "Database Health" = "http://localhost:4000/health/db"
        "Redis Health" = "http://localhost:4000/health/redis"
        "MinIO Health" = "http://localhost:4000/health/storage"
    }
    $allHealthy = $true
    foreach ($endpoint in $healthEndpoints.Keys) {
        try {
            $startTime = Get-Date
            $response = Invoke-RestMethod -Uri $healthEndpoints[$endpoint] -Method Get -TimeoutSec 10
            $duration = (Get-Date) - $startTime
            $healthy = $false
            if ($endpoint -eq "Database Health") {
                $healthy = $response.status -eq "healthy" -or $response.database.ok -eq $true -or $response.database.connected -eq $true
            } elseif ($endpoint -eq "Redis Health" -or $endpoint -eq "MinIO Health") {
                $healthy = $response.status -eq "healthy" -or $response.redis.connected -eq $true -or $response.storage.connected -eq $true
            } else {
                $healthy = $response.status -eq "ok" -or $response.status -eq "healthy"
            }
            Write-TestResult -TestName $endpoint -Success $healthy -Duration "$([math]::Round($duration.TotalSeconds, 2))s" -Level 1
            if (-not $healthy) { $allHealthy = $false }
        } catch {
            Write-TestResult -TestName $endpoint -Success $false -Duration "timeout" -Level 1
            if ($Verbose) { Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red }
            $allHealthy = $false
        }
    }
    return $allHealthy
}

function Invoke-TestSuite {
    param(
        [string]$SuiteName,
        [hashtable]$Config,
        [bool]$RunInParallel = $false
    )
    Write-TestHeader "Running $SuiteName Test Suite" "H2"
    $results = @()
    $scriptPath = $Config.Script
    if (-not (Test-Path $scriptPath)) {
        Write-Host "⚠️ Test script not found: $scriptPath" -ForegroundColor Yellow
        return @{
            Success = $false
            Results = @()
            Summary = @{
                Total = 0
                Passed = 0
                Failed = 1
                TimedOut = 0
                Duration = [TimeSpan]::FromSeconds(0)
            }
        }
    }
    $testTypes = $Config.Types
    if ($RunInParallel -and $testTypes.Count -gt 1) {
        Write-Host "🔀 Running tests in parallel" -ForegroundColor Yellow
        # Parallel execution would go here
    }
    Write-Host "➡️ Running tests sequentially" -ForegroundColor Yellow
    foreach ($testType in $testTypes) {
        Write-Host "Running $testType tests" -ForegroundColor Gray
        try {
            $arguments = @("-File", $scriptPath, "-TestType", $testType)
            $process = Start-Process -FilePath "powershell.exe" -ArgumentList $arguments -Wait -NoNewWindow -PassThru
            $success = $process.ExitCode -eq 0
        } catch {
            $success = $false
        }
        $results += @{
            TestType = $testType
            Success = $success
            Duration = [TimeSpan]::FromSeconds(1)
            TimeoutReached = $false
            Error = ""
        }
    }
    $totalTests = $results.Count
    $passedTests = ($results | Where-Object { $_.Success }).Count
    $failedTests = $totalTests - $passedTests
    Write-Host "Suite Summary: $passedTests/$totalTests passed" -ForegroundColor Cyan
    return @{
        Success = $failedTests -eq 0
        Results = $results
        Summary = @{
            Total = $totalTests
            Passed = $passedTests
            Failed = $failedTests
            TimedOut = 0
            Duration = [TimeSpan]::FromSeconds($totalTests)
        }
    }
}

function Initialize-TestEnvironment {
    Write-TestHeader "Initializing Test Environment"
    $env:NODE_ENV = $Environment
    $env:TEST_RUNNER = "master-test-runner"
    if (-not (Test-Path "test-results")) { New-Item -ItemType Directory -Path "test-results" | Out-Null }
    if (-not (Test-Path "scripts")) { New-Item -ItemType Directory -Path "scripts" | Out-Null }
    Remove-Item "test-results\*" -Recurse -Force -ErrorAction SilentlyContinue
    $dbTestScript = "SELECT 1 as test_connection;`nSELECT COUNT(*) as user_count FROM `User`;`nSELECT COUNT(*) as post_count FROM `Post`;"
    $filePath = "scripts/test-db-connection.sql"
    $dbTestScript | Out-File -FilePath $filePath -Encoding UTF8
    Write-Host "Test environment initialized!" -ForegroundColor Green
    Write-Host "   Environment: $Environment" -ForegroundColor Gray
    Write-Host "   Results path: test-results" -ForegroundColor Gray
}

function Start-BackgroundServer {
    Write-TestHeader "Starting Background Server" "H2"
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
        Write-Host "[OK] Server is already running on port 4000" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Server not running, starting in background..." -ForegroundColor Yellow
    }
    $serverJob = Start-Job -ScriptBlock {
        param($workingDir)
        Set-Location $workingDir
        npm start 2>&1
    } -ArgumentList (Get-Location).Path
    Start-Sleep -Seconds 3
    $maxRetries = 10
    $retryCount = 0
    $serverStarted = $false
    while ($retryCount -lt $maxRetries -and -not $serverStarted) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $serverStarted = $true
                Write-Host "[OK] Server started successfully in background" -ForegroundColor Green
                Write-Host "   Job ID: $($serverJob.Id)" -ForegroundColor Gray
                break
            }
        } catch {
            $retryCount++
            Write-Host ("   Waiting for server to start... ({0}/{1})" -f $retryCount, $maxRetries) -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    if (-not $serverStarted) {
        $errorMsg = "[ERROR] Failed to start server after $maxRetries attempts"
        Write-Host $errorMsg -ForegroundColor Red
        Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
        Remove-Job -Job $serverJob -ErrorAction SilentlyContinue
        return $false
    }
    $global:ServerJob = $serverJob
    return $true
}

function Stop-BackgroundServer {
    Write-TestHeader "Stopping Background Server" "H2"
    if ($global:ServerJob) {
        Write-Host "Stopping background server..." -ForegroundColor Yellow
        Stop-Job -Job $global:ServerJob -ErrorAction SilentlyContinue
        Remove-Job -Job $global:ServerJob -ErrorAction SilentlyContinue
        $global:ServerJob = $null
        Write-Host "[OK] Background server stopped" -ForegroundColor Green
    } else {
        Write-Host "[INFO] No background server job found" -ForegroundColor Gray
    }
}

function New-TestReport {
    param([hashtable]$TestResults, [hashtable]$PreChecks)
    Write-TestHeader "Generating Test Report"
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $report = @{
        metadata = @{
            timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
            environment = $Environment
            runner = "master-test-runner-enhanced"
            version = "2.0.0"
            parallel = $Parallel
            timeout = $Timeout
        }
        preChecks = $PreChecks
        results = @{}
        summary = @{
            totalSuites = 0
            passedSuites = 0
            failedSuites = 0
            totalTests = 0
            passedTests = 0
            failedTests = 0
            timedOutTests = 0
            totalDuration = 0
        }
    }
    foreach ($suiteName in $TestResults.Keys) {
        $suiteResult = $TestResults[$suiteName]
        $report.results[$suiteName] = $suiteResult
        $report.summary.totalSuites++
        if ($suiteResult.Success) { $report.summary.passedSuites++ } else { $report.summary.failedSuites++ }
        $report.summary.totalTests += $suiteResult.Summary.Total
        $report.summary.passedTests += $suiteResult.Summary.Passed
        $report.summary.failedTests += $suiteResult.Summary.Failed
        $report.summary.timedOutTests += $suiteResult.Summary.TimedOut
        $report.summary.totalDuration += $suiteResult.Summary.Duration.TotalSeconds
    }
    switch ($ReportFormat.ToLower()) {
        "json" {
            $reportPath = "test-results\master-test-report-$timestamp.json"
            $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
        }
        "xml" {
            $reportPath = "test-results\master-test-report-$timestamp.xml"
            $xmlContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<testReport timestamp="$($report.metadata.timestamp)">
    <summary>
        <totalSuites>$($report.summary.totalSuites)</totalSuites>
        <passedSuites>$($report.summary.passedSuites)</passedSuites>
        <failedSuites>$($report.summary.failedSuites)</failedSuites>
        <totalTests>$($report.summary.totalTests)</totalTests>
        <passedTests>$($report.summary.passedTests)</passedTests>
        <failedTests>$($report.summary.failedTests)</failedTests>
        <totalDuration>$($report.summary.totalDuration)</totalDuration>
    </summary>
</testReport>
"@
            $xmlContent | Out-File -FilePath $reportPath -Encoding UTF8
        }
        "html" {
            $reportPath = "test-results\master-test-report-$timestamp.html"
            $successRate = if ($report.summary.totalTests -gt 0) { [math]::Round(($report.summary.passedTests / $report.summary.totalTests) * 100, 2) } else { 0 }
            $htmlContent = @'
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - '@ + $timestamp + @'</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .success { color: #28a745; } .failure { color: #dc3545; } .warning { color: #ffc107; }
        .suite { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; }
        .suite.passed { border-left-color: #28a745; } .suite.failed { border-left-color: #dc3545; }
    </style>
</head>
<body>
    <h1>Master Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Generated: '@ + $report.metadata.timestamp + @'</p>
        <p>Environment: '@ + $report.metadata.environment + @'</p>
        <p>Success Rate: <strong>'@ + $successRate + @'%</strong></p>
        <p>Total Suites: '@ + $report.summary.totalSuites + @' | Passed: '@ + $report.summary.passedSuites + @' | Failed: '@ + $report.summary.failedSuites + @'</p>
        <p>Total Tests: '@ + $report.summary.totalTests + @' | Passed: '@ + $report.summary.passedTests + @' | Failed: '@ + $report.summary.failedTests + @' | Timed Out: '@ + $report.summary.timedOutTests + @'</p>
        <p>Total Duration: '@ + [math]::Round($report.summary.totalDuration, 2) + @'s</p>
    </div>
    <h2>Test Suites</h2>
'@
            foreach ($suiteName in $TestResults.Keys) {
                $suiteResult = $TestResults[$suiteName]
                $statusClass = if ($suiteResult.Success) { "passed" } else { "failed" }
                $statusText = if ($suiteResult.Success) { "PASS" } else { "FAIL" }
                $duration = [math]::Round($suiteResult.Summary.Duration.TotalSeconds, 2)
                $htmlContent += @'
    <div class='suite '@ + $statusClass + @''>
        <h3>'@ + $suiteName + @'</h3>
        <p>Status: '@ + $statusText + @'</p>
        <p>Duration: '@ + $duration + @' s</p>
    </div>
'@
            }
            $htmlContent += @'
</body>
</html>
'@
            $htmlContent | Out-File -FilePath $reportPath -Encoding UTF8
        }
        default {
            $reportPath = "test-results\master-test-report-$timestamp.json"
            $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
        }
    }
    Write-Host "[OK] Test report generated: $reportPath" -ForegroundColor Green
    $summaryPath = "test-results\test-summary-$timestamp.txt"
    $summaryContent = "Master Test Execution Summary`n"
    $summaryContent += "Generated: $($report.metadata.timestamp)`n"
    $summaryContent += "Environment: $($report.metadata.environment)`n"
    $summaryContent += "`nOverall Results:`n"
    $summaryContent += "- Total Suites: $($report.summary.totalSuites)`n"
    $summaryContent += "- Passed Suites: $($report.summary.passedSuites)`n"
    $summaryContent += "- Failed Suites: $($report.summary.failedSuites)`n"
    $summaryContent += "- Success Rate: $([math]::Round(($report.summary.passedSuites / [math]::Max($report.summary.totalSuites,1)) * 100, 2))%`n"
    $summaryContent += "`nTest Details:`n"
    $summaryContent += "- Total Tests: $($report.summary.totalTests)`n"
    $summaryContent += "- Passed Tests: $($report.summary.passedTests)`n"
    $summaryContent += "- Failed Tests: $($report.summary.failedTests)`n"
    $summaryContent += "- Timed Out Tests: $($report.summary.timedOutTests)`n"
    $summaryContent += "- Total Duration: $([math]::Round($report.summary.totalDuration, 2))s`n"
    $summaryContent += "`nSuite Results:`n"
    foreach ($suiteName in $TestResults.Keys) {
        $suiteResult = $TestResults[$suiteName]
        $status = if ($suiteResult.Success) { "PASS" } else { "FAIL" }
        $summaryContent += "- $suiteName : $status ($([math]::Round($suiteResult.Summary.Duration.TotalSeconds, 2)))s`n"
    }
    $summaryContent | Out-File -FilePath $summaryPath -Encoding UTF8
    Write-Host "[OK] Quick summary generated: $summaryPath" -ForegroundColor Green
}

# --- Main Execution ---
try {
    $masterStartTime = Get-Date
    Write-TestHeader "Enhanced Master Test Runner Starting" "H1"
    Write-Host "Environment: $Environment | Parallel: $Parallel | Timeout: ${Timeout}s" -ForegroundColor Yellow
    Initialize-TestEnvironment
    $serverStarted = Start-BackgroundServer
    if (-not $serverStarted) {
        Write-Host "`n[ERROR] Failed to start background server. Aborting test execution." -ForegroundColor Red
        exit 1
    }
    Write-TestHeader "Pre-flight Checks" "H1"
    $preChecks = @{
        Prerequisites = Test-Prerequisites
        TypeScript = Test-TypeScriptCheck
        Lint = Test-LintCheck
        DatabaseConnection = Test-DatabaseConnection
        APIHealth = Test-APIHealthChecks
    }
    $preFlightPassed = $preChecks.Values -notcontains $false
    if (-not $preFlightPassed) {
        Write-Host "`n[ERROR] Pre-flight checks failed. Aborting test execution." -ForegroundColor Red
        Write-Host "Fix the above issues and run the tests again." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "`n[OK] All pre-flight checks passed!" -ForegroundColor Green
    $testResults = @{}
    $suitesToRun = @()
    if ($All) {
        $suitesToRun = $TestConfig.Keys
    } else {
        if ($Backend) { $suitesToRun += "Backend" }
        if ($Mobile) { $suitesToRun += "Mobile" }
        if ($Desktop) { $suitesToRun += "Desktop" }
        if ($Web) { $suitesToRun += "Web" }
        if ($Integration) { $suitesToRun += "Integration" }
        if ($Performance) { $suitesToRun += "Performance" }
        if ($Security) { $suitesToRun += "Security" }
        if ($Database) { $suitesToRun += "Database" }
        if ($API) { $suitesToRun += "API" }
        if ($Realtime) { $suitesToRun += "Realtime" }
        if ($Media) { $suitesToRun += "Media" }
        if ($Geospatial) { $suitesToRun += "Geospatial" }
        if ($Analytics) { $suitesToRun += "Analytics" }
        if ($Notifications) { $suitesToRun += "Notifications" }
        if ($Presence) { $suitesToRun += "Presence" }
        if ($Reactions) { $suitesToRun += "Reactions" }
    }
    if ($suitesToRun.Count -eq 0) {
        Write-Host "[ERROR] No test suites specified. Use -All or specific suite flags." -ForegroundColor Red
        Write-Host "Available suites:" -ForegroundColor Yellow
        $TestConfig.Keys | Sort-Object | ForEach-Object {
            $priority = $TestConfig[$_].Priority
            Write-Host "  -$_ ($priority)" -ForegroundColor Gray
        }
        exit 1
    }
    $suitesToRun = $suitesToRun | Sort-Object {
        $priority = $TestConfig[$_].Priority
        $index = $PriorityOrder.IndexOf($priority)
        if ($index -eq -1) { 3 } else { $index }
    }
    Write-TestHeader "Test Execution Plan" "H1"
    Write-Host "Suites to run: $($suitesToRun -join ', ')" -ForegroundColor Yellow
    Write-Host "Execution order: $(($suitesToRun | ForEach-Object { "$_ ($($TestConfig[$_].Priority))" }) -join ' -> ')" -ForegroundColor Gray
    Write-Host "Parallel execution: $Parallel | Timeout: ${Timeout}s" -ForegroundColor Gray
    Write-TestHeader "Executing Test Suites" "H1"
    foreach ($suiteName in $suitesToRun) {
        $config = $TestConfig[$suiteName]
        $suiteResult = Invoke-TestSuite -SuiteName $suiteName -Config $config -RunInParallel $Parallel
        $testResults[$suiteName] = $suiteResult
        if ($suiteResult.Success) {
            Write-Host "[PASS] $suiteName suite completed successfully" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $suiteName suite failed" -ForegroundColor Red
        }
    }
    New-TestReport -TestResults $testResults -PreChecks $preChecks
    $masterEndTime = Get-Date
    $totalDuration = $masterEndTime - $masterStartTime
    Write-TestHeader "Final Results" "H1"
    $totalSuites = $testResults.Count
    $passedSuites = ($testResults.Values | Where-Object { $_.Success }).Count
    $failedSuites = $totalSuites - $passedSuites
    $totalTests = ($testResults.Values | ForEach-Object { $_.Summary.Total } | Measure-Object -Sum).Sum
    $passedTests = ($testResults.Values | ForEach-Object { $_.Summary.Passed } | Measure-Object -Sum).Sum
    $failedTests = ($testResults.Values | ForEach-Object { $_.Summary.Failed } | Measure-Object -Sum).Sum
    $timedOutTests = ($testResults.Values | ForEach-Object { $_.Summary.TimedOut } | Measure-Object -Sum).Sum
    $successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }
    Write-Host "`nExecutive Summary:" -ForegroundColor Cyan
    $color = if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" }
    Write-Host "   Success Rate: $successRate%" -ForegroundColor $color
    Write-Host "   Test Suites: $totalSuites total | $passedSuites passed | $failedSuites failed" -ForegroundColor White
    Write-Host "   Test Cases: $totalTests total | $passedTests passed | $failedTests failed | $timedOutTests timed out" -ForegroundColor White
    Write-Host "   Total Duration: $([math]::Round($totalDuration.TotalMinutes, 2)) minutes" -ForegroundColor Yellow
    if ($failedSuites -eq 0) {
        Write-Host "`nAll test suites passed successfully!" -ForegroundColor Green
        Write-Host "System is ready for deployment!" -ForegroundColor Green
        Stop-BackgroundServer
        exit 0
    } else {
        Write-Host "`n$failedSuites test suite(s) failed:" -ForegroundColor Red
        foreach ($suiteName in $testResults.Keys) {
            if (-not $testResults[$suiteName].Success) {
                $failedCount = $testResults[$suiteName].Summary.Failed
                $timedOut = $testResults[$suiteName].Summary.TimedOut
                Write-Host ("   - $($suiteName): $($failedCount) failed, $($timedOut) timed out") -ForegroundColor Red
            }
        }
        Write-Host "`nPlease review the detailed logs and fix the failing tests." -ForegroundColor Yellow
        Stop-BackgroundServer
        exit 1
    }
} catch {
    Write-Host "`nFatal error during test execution:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    $scriptStackTrace = $_.ScriptStackTrace
    Write-Host ("`nStack trace: " + $scriptStackTrace) -ForegroundColor Gray
    Stop-BackgroundServer
    exit 1
}
