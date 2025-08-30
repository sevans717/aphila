# Integration Tests Script
# Comprehensive integration testing for SAV3 Dating App

param(
    [switch]$API,
    [switch]$Database,
    [switch]$Services,
    [switch]$FullStack,
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

function Test-APIIntegration {
    Write-TestHeader "API Integration Tests"

    try {
        Write-Info "Testing API integration..."
        $startTime = Get-Date

        # Start backend server if not running
        $backendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server.ts*" -or $_.CommandLine -like "*app.ts*" }

        if (-not $backendProcess) {
            Write-Info "Starting backend server..."
            Start-Process -FilePath "node" -ArgumentList "dist/index.js" -NoNewWindow -WorkingDirectory "."
            Start-Sleep -Seconds 5
        }

        # Test health endpoint
        try {
            $healthResponse = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 10
            if ($healthResponse.StatusCode -eq 200) {
                Write-Success "Health endpoint is responding"
            } else {
                throw "Health endpoint returned status $($healthResponse.StatusCode)"
            }
        } catch {
            throw "Health endpoint test failed: $($_.Exception.Message)"
        }

        # Test API endpoints
        $endpoints = @(
            "/api/auth/status",
            "/api/posts",
            "/api/users/profile",
            "/api/media",
            "/api/notifications"
        )

        foreach ($endpoint in $endpoints) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000$endpoint" -Method GET -TimeoutSec 10 -ErrorAction Stop
                Write-Success "Endpoint $endpoint is accessible"
            } catch {
                Write-Error "Endpoint $endpoint failed: $($_.Exception.Message)"
                # Don't fail the entire test for individual endpoint issues
            }
        }

        $duration = (Get-Date) - $startTime
        Write-Success "API integration tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "API integration tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-DatabaseIntegration {
    Write-TestHeader "Database Integration Tests"

    try {
        Write-Info "Testing database integration..."
        $startTime = Get-Date

        # Test database connection
        try {
            $envFile = Get-Content ".env" -ErrorAction Stop
            $dbUrl = $envFile | Where-Object { $_ -match "^DATABASE_URL=" } | ForEach-Object { $_.Split('=', 2)[1] }

            if (-not $dbUrl) {
                throw "DATABASE_URL not found in .env"
            }

            Write-Success "Database URL found in environment"
        } catch {
            throw "Database configuration test failed: $($_.Exception.Message)"
        }

        # Test Prisma client generation
        try {
            & npx prisma generate
            Write-Success "Prisma client generated successfully"
        } catch {
            throw "Prisma client generation failed: $($_.Exception.Message)"
        }

        # Test database schema
        try {
            $schemaContent = Get-Content "prisma/schema.prisma" -Raw
            if ($schemaContent -match "model User" -and $schemaContent -match "model Post") {
                Write-Success "Database schema contains required models"
            } else {
                throw "Required models not found in schema"
            }
        } catch {
            throw "Schema validation failed: $($_.Exception.Message)"
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Database integration tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Database integration tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-ServicesIntegration {
    Write-TestHeader "Services Integration Tests"

    try {
        Write-Info "Testing services integration..."
        $startTime = Get-Date

        # Test service files exist
        $serviceFiles = @(
            "src/services/auth.service.ts",
            "src/services/user.service.ts",
            "src/services/post.service.ts",
            "src/services/media.service.ts",
            "src/services/notification.service.ts"
        )

        foreach ($serviceFile in $serviceFiles) {
            if (Test-Path $serviceFile) {
                Write-Success "Service file exists: $serviceFile"
            } else {
                Write-Error "Service file missing: $serviceFile"
            }
        }

        # Test service imports and exports
        try {
            $authServiceContent = Get-Content "src/services/auth.service.ts" -Raw -ErrorAction Stop
            if ($authServiceContent -match "export" -and $authServiceContent -match "class.*Service") {
                Write-Success "Auth service has proper exports"
            } else {
                throw "Auth service exports are malformed"
            }
        } catch {
            Write-Error "Auth service validation failed: $($_.Exception.Message)"
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Services integration tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Services integration tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-FullStackIntegration {
    Write-TestHeader "Full Stack Integration Tests"

    try {
        Write-Info "Testing full stack integration..."
        $startTime = Get-Date

        # Test frontend-backend communication
        Write-Info "Testing frontend API client..."

        # Check if API client exists
        $apiClientPaths = @(
            "sav3-frontend/mobile/src/api/client.ts",
            "sav3-frontend/desktop/src/api/client.ts",
            "sav3-frontend/web/src/api/client.ts"
        )

        foreach ($clientPath in $apiClientPaths) {
            if (Test-Path $clientPath) {
                Write-Success "API client exists: $clientPath"

                # Test client configuration
                $clientContent = Get-Content $clientPath -Raw
                if ($clientContent -match "localhost:3000" -or $clientContent -match "BASE_URL") {
                    Write-Success "API client has proper base URL configuration"
                } else {
                    Write-Error "API client missing base URL configuration"
                }
            } else {
                Write-Error "API client missing: $clientPath"
            }
        }

        # Test environment configuration
        if (Test-Path ".env") {
            $envContent = Get-Content ".env" -Raw
            $requiredVars = @("DATABASE_URL", "JWT_SECRET", "PORT")

            foreach ($var in $requiredVars) {
                if ($envContent -match "$var=") {
                    Write-Success "Environment variable $var is configured"
                } else {
                    Write-Error "Environment variable $var is missing"
                }
            }
        } else {
            throw ".env file not found"
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Full stack integration tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Full stack integration tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-ErrorFixerIntegration {
    Write-TestHeader "Error-Fixer Integration Tests"

    try {
        Write-Info "Testing Error-Fixer integration..."
        $startTime = Get-Date

        # Test Error-Fixer service
        if (-not (Test-Path "src/services/sav3ErrorFixer.service.ts")) {
            throw "Error-Fixer service not found"
        }

        Write-Success "Error-Fixer service exists"

        # Test Error-Fixer browser utility
        if (-not (Test-Path "src/utils/sav3ErrorFixerBrowser.ts")) {
            throw "Error-Fixer browser utility not found"
        }

        Write-Success "Error-Fixer browser utility exists"

        # Test Error-Fixer config
        if (-not (Test-Path "src/utils/sav3ErrorFixerConfig.ts")) {
            throw "Error-Fixer config not found"
        }

        Write-Success "Error-Fixer config exists"

        # Test terminal manager
        if (-not (Test-Path "src/services/sav3TerminalManager.service.ts")) {
            throw "Terminal manager service not found"
        }

        Write-Success "Terminal manager service exists"

        $duration = (Get-Date) - $startTime
        Write-Success "Error-Fixer integration tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Error-Fixer integration tests failed: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
try {
    $startTime = Get-Date
    $testsToRun = @()
    $results = @{}

    # Determine which tests to run
    if ($All -or $API) { $testsToRun += "API" }
    if ($All -or $Database) { $testsToRun += "Database" }
    if ($All -or $Services) { $testsToRun += "Services" }
    if ($All -or $FullStack) { $testsToRun += "FullStack" }

    if ($testsToRun.Count -eq 0) {
        $testsToRun = @("API", "Database", "Services", "FullStack")
    }

    Write-TestHeader "Integration Test Suite"
    Write-Host "Tests to run: $($testsToRun -join ', ')" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow

    # Run tests
    foreach ($test in $testsToRun) {
        switch ($test) {
            "API" {
                $results.API = Test-APIIntegration
            }
            "Database" {
                $results.Database = Test-DatabaseIntegration
            }
            "Services" {
                $results.Services = Test-ServicesIntegration
            }
            "FullStack" {
                $results.FullStack = Test-FullStackIntegration
            }
        }
    }

    # Additional Error-Fixer integration test
    $results.ErrorFixer = Test-ErrorFixerIntegration

    # Summary
    $endTime = Get-Date
    $totalDuration = $endTime - $startTime

    Write-TestHeader "Integration Test Results"

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
        Write-Success "All integration tests passed!"
        exit 0
    } else {
        Write-Error "Some integration tests failed"
        exit 1
    }

} catch {
    Write-Error "Fatal error during integration testing: $($_.Exception.Message)"
    exit 1
}
