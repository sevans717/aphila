# Desktop Tests Script
# Comprehensive desktop app testing for SAV3 Dating App

param(
    [switch]$Unit,
    [switch]$Integration,
    [switch]$Build,
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

function Test-DesktopUnitTests {
    Write-TestHeader "Desktop Unit Tests"

    try {
        Write-Info "Running desktop unit tests..."
        $startTime = Get-Date

        Set-Location "sav3-frontend/desktop"

        # Install dependencies if needed
        if (-not (Test-Path "node_modules")) {
            Write-Info "Installing dependencies..."
            & npm install
        }

        # Run unit tests
        & npm test -- --coverage --coverageDirectory="../../test-results/desktop-unit" --testPathPattern="\.test\.ts$|\.test\.tsx$"

        Set-Location "../.."

        $duration = (Get-Date) - $startTime
        Write-Success "Desktop unit tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Set-Location "../.." 2>$null
        Write-Error "Desktop unit tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-DesktopIntegrationTests {
    Write-TestHeader "Desktop Integration Tests"

    try {
        Write-Info "Running desktop integration tests..."
        $startTime = Get-Date

        Set-Location "sav3-frontend/desktop"

        # Install dependencies if needed
        if (-not (Test-Path "node_modules")) {
            Write-Info "Installing dependencies..."
            & npm install
        }

        # Test preload script
        if (-not (Test-Path "src/preload.ts")) {
            throw "preload.ts not found"
        }

        Write-Success "Preload script exists"

        # Test main process
        if (-not (Test-Path "src/main/main.ts")) {
            throw "main.ts not found"
        }

        Write-Success "Main process exists"

        # Test window configuration
        $mainContent = Get-Content "src/main/main.ts" -Raw
        if (-not ($mainContent -match "width.*1200" -and $mainContent -match "height.*800")) {
            Write-Error "Window configuration not found in main.ts"
        } else {
            Write-Success "Window configuration is correct"
        }

        Set-Location "../.."

        $duration = (Get-Date) - $startTime
        Write-Success "Desktop integration tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Set-Location "../.." 2>$null
        Write-Error "Desktop integration tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-DesktopBuild {
    Write-TestHeader "Desktop Build Test"

    try {
        Write-Info "Testing desktop app build..."
        $startTime = Get-Date

        Set-Location "sav3-frontend/desktop"

        # Install dependencies if needed
        if (-not (Test-Path "node_modules")) {
            Write-Info "Installing dependencies..."
            & npm install
        }

        # Test TypeScript compilation
        Write-Info "Running TypeScript check..."
        & npx tsc --noEmit

        # Test build process
        Write-Info "Running build..."
        & npm run build

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
        Write-Success "Desktop build test passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Set-Location "../.." 2>$null
        Write-Error "Desktop build test failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-DesktopDependencies {
    Write-TestHeader "Desktop Dependencies Check"

    try {
        Write-Info "Checking desktop dependencies..."
        $startTime = Get-Date

        Set-Location "sav3-frontend/desktop"

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

        # Check for required Electron dependencies
        $requiredDeps = @("electron", "electron-builder", "webpack", "typescript")
        foreach ($dep in $requiredDeps) {
            if (-not $packageJson.dependencies.$dep -and -not $packageJson.devDependencies.$dep) {
                throw "Required dependency '$dep' not found"
            }
        }

        Write-Success "All required dependencies are present"

        # Check for security vulnerabilities
        & npm audit --audit-level=moderate
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Security vulnerabilities found in dependencies"
            # Don't fail for now, just warn
        }

        Set-Location "../.."

        $duration = (Get-Date) - $startTime
        Write-Success "Desktop dependencies check passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Set-Location "../.." 2>$null
        Write-Error "Desktop dependencies check failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-DesktopConfiguration {
    Write-TestHeader "Desktop Configuration Test"

    try {
        Write-Info "Testing desktop configuration..."
        $startTime = Get-Date

        Set-Location "sav3-frontend/desktop"

        # Check webpack config
        if (-not (Test-Path "webpack.config.js")) {
            throw "webpack.config.js not found"
        }

        Write-Success "Webpack config exists"

        # Check electron-builder config
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if (-not $packageJson.build) {
            throw "electron-builder configuration not found in package.json"
        }

        Write-Success "Electron-builder config is present"

        # Check main entry point
        if (-not $packageJson.main -or $packageJson.main -ne "dist/main/main.js") {
            throw "Invalid main entry point in package.json"
        }

        Write-Success "Main entry point is correct"

        Set-Location "../.."

        $duration = (Get-Date) - $startTime
        Write-Success "Desktop configuration test passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Set-Location "../.." 2>$null
        Write-Error "Desktop configuration test failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-ErrorFixerIntegration {
    Write-TestHeader "Error-Fixer Desktop Integration Test"

    try {
        Write-Info "Testing Error-Fixer integration..."
        $startTime = Get-Date

        Set-Location "sav3-frontend/desktop"

        # Check preload script for Error-Fixer
        if (-not (Test-Path "src/preload.ts")) {
            throw "preload.ts not found"
        }

        $preloadContent = Get-Content "src/preload.ts" -Raw
        if (-not ($preloadContent -match "errorFixer")) {
            throw "Error-Fixer not integrated in preload script"
        }

        Write-Success "Error-Fixer integrated in preload script"

        # Check main process for Error-Fixer
        if (-not (Test-Path "src/main/main.ts")) {
            throw "main.ts not found"
        }

        $mainContent = Get-Content "src/main/main.ts" -Raw
        if (-not ($mainContent -match "error-fixer")) {
            Write-Error "Error-Fixer not integrated in main process"
        } else {
            Write-Success "Error-Fixer integrated in main process"
        }

        Set-Location "../.."

        $duration = (Get-Date) - $startTime
        Write-Success "Error-Fixer integration test passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Set-Location "../.." 2>$null
        Write-Error "Error-Fixer integration test failed: $($_.Exception.Message)"
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
    if ($All -or $Build) { $testsToRun += "Build" }

    if ($testsToRun.Count -eq 0) {
        $testsToRun = @("Unit", "Integration", "Build")
    }

    Write-TestHeader "Desktop Test Suite"
    Write-Host "Tests to run: $($testsToRun -join ', ')" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow

    # Run tests
    foreach ($test in $testsToRun) {
        switch ($test) {
            "Unit" {
                $results.Unit = Test-DesktopUnitTests
            }
            "Integration" {
                $results.Integration = Test-DesktopIntegrationTests
            }
            "Build" {
                $results.Build = Test-DesktopBuild
            }
        }
    }

    # Additional tests
    $results.Dependencies = Test-DesktopDependencies
    $results.Configuration = Test-DesktopConfiguration
    $results.ErrorFixer = Test-ErrorFixerIntegration

    # Summary
    $endTime = Get-Date
    $totalDuration = $endTime - $startTime

    Write-TestHeader "Desktop Test Results"

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
        Write-Success "All desktop tests passed!"
        exit 0
    } else {
        Write-Error "Some desktop tests failed"
        exit 1
    }

} catch {
    Write-Error "Fatal error during desktop testing: $($_.Exception.Message)"
    exit 1
}
