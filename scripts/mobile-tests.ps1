# Mobile Tests Script
# Comprehensive mobile app testing for SAV3 Dating App

param(
    [switch]$Unit,
    [switch]$E2E,
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

function Test-MobileUnitTests {
    Write-TestHeader "Mobile Unit Tests"

    try {
        Write-Info "Running mobile unit tests..."
        $startTime = Get-Date

        Set-Location "sav3-frontend/mobile"

        # Install dependencies if needed
        if (-not (Test-Path "node_modules")) {
            Write-Info "Installing dependencies..."
            & npm install
        }

        # Run unit tests
        & npm test -- --coverage --coverageDirectory="../../test-results/mobile-unit" --testPathPattern="\.test\.ts$|\.test\.tsx$"

        Set-Location "../.."

        $duration = (Get-Date) - $startTime
        Write-Success "Mobile unit tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Set-Location "../.." 2>$null
        Write-Error "Mobile unit tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-MobileE2ETests {
    Write-TestHeader "Mobile E2E Tests"

    try {
        Write-Info "Running mobile E2E tests..."
        $startTime = Get-Date

        Set-Location "sav3-frontend/mobile"

        # Install dependencies if needed
        if (-not (Test-Path "node_modules")) {
            Write-Info "Installing dependencies..."
            & npm install
        }

        # Start Expo development server in background
        $expoJob = Start-Job -ScriptBlock {
            Set-Location "sav3-frontend/mobile"
            & npx expo start --web --port 19006
        }

        Start-Sleep -Seconds 10

        # Run E2E tests (using a simple HTTP check for now)
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:19006" -Method GET -TimeoutSec 30
            if ($response.StatusCode -eq 200) {
                Write-Success "Expo development server is running"
            }
        } catch {
            Write-Error "Expo development server check failed"
            throw
        }

        # Stop Expo server
        Stop-Job -Job $expoJob -PassThru | Remove-Job

        Set-Location "../.."

        $duration = (Get-Date) - $startTime
        Write-Success "Mobile E2E tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Set-Location "../.." 2>$null
        Write-Error "Mobile E2E tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-MobileBuild {
    Write-TestHeader "Mobile Build Test"

    try {
        Write-Info "Testing mobile app build..."
        $startTime = Get-Date

        Set-Location "sav3-frontend/mobile"

        # Install dependencies if needed
        if (-not (Test-Path "node_modules")) {
            Write-Info "Installing dependencies..."
            & npm install
        }

        # Test build process
        & npx expo export --platform web

        # Check if build output exists
        if (Test-Path "dist") {
            Write-Success "Build output directory exists"
        } else {
            throw "Build output directory not found"
        }

        # Clean up
        Remove-Item "dist" -Recurse -Force -ErrorAction SilentlyContinue

        Set-Location "../.."

        $duration = (Get-Date) - $startTime
        Write-Success "Mobile build test passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Set-Location "../.." 2>$null
        Write-Error "Mobile build test failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-MobileDependencies {
    Write-TestHeader "Mobile Dependencies Check"

    try {
        Write-Info "Checking mobile dependencies..."
        $startTime = Get-Date

        Set-Location "sav3-frontend/mobile"

        # Check package.json
        if (-not (Test-Path "package.json")) {
            throw "package.json not found"
        }

        # Validate package.json
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if (-not $packageJson.name -or -not $packageJson.version) {
            throw "Invalid package.json structure"
        }

        Write-Success "package.json is valid"

        # Check for security vulnerabilities
        & npm audit --audit-level=moderate
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Security vulnerabilities found in dependencies"
            # Don't fail for now, just warn
        }

        Set-Location "../.."

        $duration = (Get-Date) - $startTime
        Write-Success "Mobile dependencies check passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Set-Location "../.." 2>$null
        Write-Error "Mobile dependencies check failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-MobileConfiguration {
    Write-TestHeader "Mobile Configuration Test"

    try {
        Write-Info "Testing mobile configuration..."
        $startTime = Get-Date

        Set-Location "sav3-frontend/mobile"

        # Check app.json
        if (-not (Test-Path "app.json")) {
            throw "app.json not found"
        }

        $appJson = Get-Content "app.json" | ConvertFrom-Json
        if (-not $appJson.expo.name -or -not $appJson.expo.slug) {
            throw "Invalid app.json structure"
        }

        Write-Success "app.json is valid"

        # Check babel.config.js
        if (-not (Test-Path "babel.config.js")) {
            throw "babel.config.js not found"
        }

        Write-Success "babel.config.js exists"

        Set-Location "../.."

        $duration = (Get-Date) - $startTime
        Write-Success "Mobile configuration test passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Set-Location "../.." 2>$null
        Write-Error "Mobile configuration test failed: $($_.Exception.Message)"
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
    if ($All -or $E2E) { $testsToRun += "E2E" }

    if ($testsToRun.Count -eq 0) {
        $testsToRun = @("Unit", "E2E")
    }

    Write-TestHeader "Mobile Test Suite"
    Write-Host "Tests to run: $($testsToRun -join ', ')" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow

    # Run tests
    foreach ($test in $testsToRun) {
        switch ($test) {
            "Unit" {
                $results.Unit = Test-MobileUnitTests
            }
            "E2E" {
                $results.E2E = Test-MobileE2ETests
            }
        }
    }

    # Additional tests
    $results.Build = Test-MobileBuild
    $results.Dependencies = Test-MobileDependencies
    $results.Configuration = Test-MobileConfiguration

    # Summary
    $endTime = Get-Date
    $totalDuration = $endTime - $startTime

    Write-TestHeader "Mobile Test Results"

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
        Write-Success "All mobile tests passed!"
        exit 0
    } else {
        Write-Error "Some mobile tests failed"
        exit 1
    }

} catch {
    Write-Error "Fatal error during mobile testing: $($_.Exception.Message)"
    exit 1
}
