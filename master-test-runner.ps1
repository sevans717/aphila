# master-test-runner.ps1
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
    [string]$Environment = "test",
    [switch]$Parallel,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Configuration
$TestConfig = @{
    Backend = @{
        Script = ".\scripts\backend-tests.ps1"
        Types = @("Unit", "Integration", "TypeCheck", "Lint")
    }
    Mobile = @{
        Script = ".\scripts\mobile-tests.ps1"
        Types = @("Unit", "E2E")
    }
    Desktop = @{
        Script = ".\scripts\desktop-tests.ps1"
        Types = @("Unit", "Integration", "Build")
    }
    Web = @{
        Script = ".\scripts\web-tests.ps1"
        Types = @("Unit", "Integration", "E2E")
    }
    Integration = @{
        Script = ".\scripts\integration-tests.ps1"
        Types = @("API", "Database", "Services", "FullStack")
    }
    Performance = @{
        Script = ".\scripts\performance-tests.ps1"
        Types = @("API", "Web")
    }
    Security = @{
        Script = ".\scripts\security-tests.ps1"
        Types = @("Auth", "API", "Database", "Full")
    }
    Database = @{
        Script = ".\scripts\database-tests.ps1"
        Types = @("Schema", "Migrations", "Seed", "Performance")
    }
    API = @{
        Script = ".\scripts\api-tests.ps1"
        Types = @("Health", "Auth", "Posts", "Users", "All")
    }
}

function Write-TestHeader {
    param([string]$Title)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "`n[$timestamp] === $Title ===" -ForegroundColor Cyan
}

function Write-TestResult {
    param([string]$TestName, [bool]$Success, [string]$Duration)

    $status = if ($Success) { "✓ PASS" } else { "✗ FAIL" }
    $color = if ($Success) { "Green" } else { "Red" }

    Write-Host "$status $TestName ($Duration)" -ForegroundColor $color
}

function Run-TestSuite {
    param(
        [string]$SuiteName,
        [string]$ScriptPath,
        [string[]]$TestTypes,
        [bool]$RunInParallel = $false
    )

    Write-TestHeader "Running $SuiteName Test Suite"

    $suiteStartTime = Get-Date
    $results = @()

    if ($RunInParallel -and $TestTypes.Count -gt 1) {
        # Run tests in parallel
        $jobs = @()

        foreach ($testType in $TestTypes) {
            $job = Start-Job -ScriptBlock {
                param($Script, $Type, $Env)

                $startTime = Get-Date

                try {
                    $arguments = @("-${Type}")
                    if ($Env -and $Env -ne "test") {
                        $arguments += "-Environment", $Env
                    }

                    & $Script @arguments
                    $success = $LASTEXITCODE -eq 0
                } catch {
                    $success = $false
                }

                $duration = (Get-Date) - $startTime

                return @{
                    TestType = $Type
                    Success = $success
                    Duration = $duration
                }
            } -ArgumentList $ScriptPath, $testType, $Environment

            $jobs += $job
        }

        # Wait for all jobs to complete
        $jobs | Wait-Job | Out-Null

        # Collect results
        foreach ($job in $jobs) {
            $result = Receive-Job -Job $job
            $results += $result
            Remove-Job -Job $job
        }
    } else {
        # Run tests sequentially
        foreach ($testType in $TestTypes) {
            $testStartTime = Get-Date

            try {
                $arguments = @("-${Type}")
                if ($Environment -and $Environment -ne "test") {
                    $arguments += "-Environment", $Environment
                }

                & $ScriptPath @arguments
                $success = $LASTEXITCODE -eq 0
            } catch {
                $success = $false
                if ($Verbose) {
                    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
                }
            }

            $duration = (Get-Date) - $testStartTime

            $results += @{
                TestType = $testType
                Success = $success
                Duration = $duration
            }
        }
    }

    # Display results
    $suiteEndTime = Get-Date
    $suiteDuration = $suiteEndTime - $suiteStartTime

    Write-TestHeader "$SuiteName Test Results"

    $totalTests = $results.Count
    $passedTests = ($results | Where-Object { $_.Success }).Count
    $failedTests = $totalTests - $passedTests

    foreach ($result in $results) {
        $durationStr = "{0:mm}m {0:ss}s" -f $result.Duration
        Write-TestResult -TestName "$SuiteName.$($result.TestType)" -Success $result.Success -Duration $durationStr
    }

    Write-Host "`nSuite Summary: $passedTests/$totalTests passed ($failedTests failed)" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
    Write-Host "Total Duration: $([math]::Round($suiteDuration.TotalSeconds, 2))s" -ForegroundColor Yellow

    return $failedTests -eq 0
}

function Initialize-TestEnvironment {
    Write-TestHeader "Initializing Test Environment"

    # Set environment variables
    $env:NODE_ENV = $Environment

    # Create test results directory
    if (-not (Test-Path "test-results")) {
        New-Item -ItemType Directory -Path "test-results" | Out-Null
    }

    # Clean previous results
    Remove-Item "test-results\*" -Recurse -Force -ErrorAction SilentlyContinue

    Write-Host "✓ Test environment initialized!" -ForegroundColor Green
}

function Generate-TestReport {
    param([hashtable]$TestResults)

    Write-TestHeader "Generating Test Report"

    $reportPath = "test-results\master-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"

    $report = @{
        timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
        environment = $Environment
        results = $TestResults
        summary = @{
            totalSuites = $TestResults.Count
            passedSuites = ($TestResults.Values | Where-Object { $_ }).Count
            failedSuites = ($TestResults.Values | Where-Object { -not $_ }).Count
        }
    }

    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8

    Write-Host "✓ Test report generated: $reportPath" -ForegroundColor Green
}

# Main execution
try {
    $startTime = Get-Date
    Initialize-TestEnvironment

    $testResults = @{}
    $suitesToRun = @()

    # Determine which test suites to run
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
    }

    if ($suitesToRun.Count -eq 0) {
        Write-Host "No test suites specified. Use -All or specific suite flags." -ForegroundColor Yellow
        Write-Host "Available suites: $($TestConfig.Keys -join ', ')" -ForegroundColor Yellow
        exit 1
    }

    Write-TestHeader "Starting Test Execution"
    Write-Host "Suites to run: $($suitesToRun -join ', ')" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow
    Write-Host "Parallel execution: $Parallel" -ForegroundColor Yellow

    # Run test suites
    foreach ($suiteName in $suitesToRun) {
        $config = $TestConfig[$suiteName]
        $scriptPath = $config.Script

        if (-not (Test-Path $scriptPath)) {
            Write-Host "Warning: Test script not found: $scriptPath" -ForegroundColor Yellow
            $testResults[$suiteName] = $false
            continue
        }

        $success = Run-TestSuite -SuiteName $suiteName -ScriptPath $scriptPath -TestTypes $config.Types -RunInParallel $Parallel
        $testResults[$suiteName] = $success
    }

    # Generate final report
    Generate-TestReport -TestResults $testResults

    # Final summary
    $endTime = Get-Date
    $totalDuration = $endTime - $startTime

    Write-TestHeader "Master Test Execution Complete"

    $totalSuites = $testResults.Count
    $passedSuites = ($testResults.Values | Where-Object { $_ }).Count
    $failedSuites = $totalSuites - $passedSuites

    Write-Host "Total Suites: $totalSuites" -ForegroundColor White
    Write-Host "Passed Suites: $passedSuites" -ForegroundColor Green
    Write-Host "Failed Suites: $failedSuites" -ForegroundColor $(if ($failedSuites -eq 0) { "Green" } else { "Red" })
    Write-Host "Total Duration: $([math]::Round($totalDuration.TotalSeconds, 2))s" -ForegroundColor Yellow

    if ($failedSuites -eq 0) {
        Write-Host "`n🎉 All test suites passed successfully!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`n❌ Some test suites failed. Check the logs above for details." -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "Fatal error during test execution: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
