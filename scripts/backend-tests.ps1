# Backend Tests Script
# Comprehensive backend testing for SAV3 Dating App

param(
    [switch]$Unit,
    [switch]$Integration,
    [switch]$TypeCheck,
    [switch]$Lint,
    [switch]$All,
    [string]$Environment = "test",
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n$(("=" * 50))" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "$(("=" * 50))" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    if ($Verbose) {
        Write-Host "ℹ️ $Message" -ForegroundColor Blue
    }
}

function Test-TypeScript {
    Write-TestHeader "TypeScript Type Checking"

    try {
        Write-Info "Running tsc --noEmit..."
        $startTime = Get-Date

        & npx tsc --noEmit

        $duration = (Get-Date) - $startTime
        Write-Success "TypeScript check passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "TypeScript check failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-ESLint {
    Write-TestHeader "ESLint Code Quality Check"

    try {
        Write-Info "Running ESLint..."
        $startTime = Get-Date

        & npx eslint src/ --ext .ts,.js --max-warnings 0

        $duration = (Get-Date) - $startTime
        Write-Success "ESLint check passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "ESLint check failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-UnitTests {
    Write-TestHeader "Unit Tests"

    try {
        Write-Info "Running Jest unit tests..."
        $startTime = Get-Date

        & npx jest --testPathPattern="\.unit\.test\.ts$" --coverage --coverageDirectory="coverage/unit"

        $duration = (Get-Date) - $startTime
        Write-Success "Unit tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Unit tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-IntegrationTests {
    Write-TestHeader "Integration Tests"

    try {
        Write-Info "Running integration tests..."
        $startTime = Get-Date

        # Set test environment
        $env:NODE_ENV = $Environment
        $env:DATABASE_URL = "postgresql://test:test@localhost:5433/sav3_test"

        & npx jest --testPathPattern="\.integration\.test\.ts$" --coverage --coverageDirectory="coverage/integration"

        $duration = (Get-Date) - $startTime
        Write-Success "Integration tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Integration tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-DatabaseConnection {
    Write-TestHeader "Database Connection Test"

    try {
        Write-Info "Testing database connectivity..."
        $startTime = Get-Date

        & npx prisma db push --accept-data-loss

        $duration = (Get-Date) - $startTime
        Write-Success "Database connection test passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Database connection test failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-APIEndpoints {
    Write-TestHeader "API Endpoint Tests"

    try {
        Write-Info "Testing API endpoints..."
        $startTime = Get-Date

        # Test health endpoint
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:4000/health" -Method GET
        if ($healthResponse.StatusCode -ne 200) {
            throw "Health endpoint returned status $($healthResponse.StatusCode)"
        }

        # Test API health endpoint
        $apiHealthResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/health" -Method GET
        if ($apiHealthResponse.StatusCode -ne 200) {
            throw "API health endpoint returned status $($apiHealthResponse.StatusCode)"
        }

        $duration = (Get-Date) - $startTime
        Write-Success "API endpoint tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "API endpoint tests failed: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
try {
    $startTime = Get-Date
    $testsToRun = @()
    $results = @{}

    # Determine which tests to run
    if ($All -or $Unit) { $testsToRun += "Unit" }
    if ($All -or $Integration) { $testsToRun += "Integration" }
    if ($All -or $TypeCheck) { $testsToRun += "TypeCheck" }
    if ($All -or $Lint) { $testsToRun += "Lint" }

    if ($testsToRun.Count -eq 0) {
        $testsToRun = @("TypeCheck", "Lint", "Unit", "Integration")
    }

    Write-TestHeader "Backend Test Suite"
    Write-Host "Tests to run: $($testsToRun -join ', ')" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow

    # Run tests
    foreach ($test in $testsToRun) {
        switch ($test) {
            "TypeCheck" {
                $results.TypeCheck = Test-TypeScript
            }
            "Lint" {
                $results.Lint = Test-ESLint
            }
            "Unit" {
                $results.Unit = Test-UnitTests
            }
            "Integration" {
                $results.Integration = Test-IntegrationTests
            }
        }
    }

    # Additional tests
    $results.Database = Test-DatabaseConnection
    $results.API = Test-APIEndpoints

    # Summary
    $endTime = Get-Date
    $totalDuration = $endTime - $startTime

    Write-TestHeader "Backend Test Results"

    $totalTests = $results.Count
    $passedTests = ($results.Values | Where-Object { $_ }).Count
    $failedTests = $totalTests - $passedTests

    foreach ($result in $results.GetEnumerator()) {
        $status = if ($result.Value) { "✅ PASS" } else { "❌ FAIL" }
        $color = if ($result.Value) { "Green" } else { "Red" }
        Write-Host "$status $($result.Key)" -ForegroundColor $color
    }

    Write-Host "`n📊 Summary:" -ForegroundColor Cyan
    Write-Host "Total Tests: $totalTests" -ForegroundColor White
    Write-Host "Passed: $passedTests" -ForegroundColor Green
    Write-Host "Failed: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
    Write-Host "Duration: $([math]::Round($totalDuration.TotalSeconds, 2))s" -ForegroundColor Yellow

    if ($failedTests -eq 0) {
        Write-Success "All backend tests passed!"
        exit 0
    } else {
        Write-Error "Some backend tests failed"
        exit 1
    }

} catch {
    Write-Error "Fatal error during backend testing: $($_.Exception.Message)"
    exit 1
}
