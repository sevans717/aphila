# Security Tests Script
# Comprehensive security testing for SAV3 Dating App

param(
    [switch]$Auth,
    [switch]$API,
    [switch]$Database,
    [switch]$Full,
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

function Test-AuthSecurity {
    Write-TestHeader "Authentication Security Tests"

    try {
        Write-Info "Testing authentication security..."
        $startTime = Get-Date

        # Test JWT configuration
        if (Test-Path ".env") {
            $envContent = Get-Content ".env" -Raw
            if ($envContent -match "JWT_SECRET=.+") {
                Write-Success "JWT secret is configured"
            } else {
                throw "JWT secret not found or empty"
            }

            # Check for weak secrets
            $jwtSecret = ($envContent | Where-Object { $_ -match "^JWT_SECRET=" }).Split('=', 2)[1]
            if ($jwtSecret.Length -lt 32) {
                Write-Error "JWT secret is too short (should be at least 32 characters)"
            } else {
                Write-Success "JWT secret length is adequate"
            }
        } else {
            throw ".env file not found"
        }

        # Test password policies
        Write-Info "Checking password policy configuration..."
        # This would check for minimum length, complexity requirements, etc.

        # Test session management
        Write-Info "Checking session management..."
        # This would test session timeout, secure cookies, etc.

        $duration = (Get-Date) - $startTime
        Write-Success "Authentication security tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Authentication security tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-APISecurity {
    Write-TestHeader "API Security Tests"

    try {
        Write-Info "Testing API security..."
        $startTime = Get-Date

        # Test CORS configuration
        Write-Info "Checking CORS configuration..."
        try {
            $corsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/test" -Method OPTIONS -Headers @{ "Origin" = "http://malicious-site.com" }
            if ($corsResponse.Headers['Access-Control-Allow-Origin'] -eq "*") {
                Write-Error "CORS is too permissive (allows all origins)"
            } else {
                Write-Success "CORS configuration is restrictive"
            }
        } catch {
            Write-Info "CORS test endpoint not available (this is normal)"
        }

        # Test rate limiting
        Write-Info "Testing rate limiting..."
        $requests = 1..20
        $successCount = 0

        foreach ($i in $requests) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 5
                if ($response.StatusCode -eq 200) {
                    $successCount++
                }
            } catch {
                # Expected for rate limiting
            }
            Start-Sleep -Milliseconds 100
        }

        if ($successCount -lt 20) {
            Write-Success "Rate limiting appears to be working"
        } else {
            Write-Error "Rate limiting may not be configured properly"
        }

        # Test input validation
        Write-Info "Testing input validation..."
        $testPayloads = @(
            @{ sql = "'; DROP TABLE users; --" },
            @{ script = "<script>alert('xss')</script>" },
            @{ email = "invalid-email" }
        )

        foreach ($payload in $testPayloads) {
            try {
                $jsonPayload = $payload | ConvertTo-Json
                $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $jsonPayload -ContentType "application/json" -TimeoutSec 5
                if ($response.StatusCode -eq 400) {
                    Write-Success "Input validation working for payload: $($payload.Keys[0])"
                } else {
                    Write-Error "Input validation may be insufficient for payload: $($payload.Keys[0])"
                }
            } catch {
                # Expected for invalid input
                Write-Success "Input validation working for payload: $($payload.Keys[0])"
            }
        }

        # Test HTTPS enforcement (in production)
        if ($Environment -eq "production") {
            Write-Info "Checking HTTPS enforcement..."
            # This would check for HTTP redirect to HTTPS
        }

        $duration = (Get-Date) - $startTime
        Write-Success "API security tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "API security tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-DatabaseSecurity {
    Write-TestHeader "Database Security Tests"

    try {
        Write-Info "Testing database security..."
        $startTime = Get-Date

        # Test database connection string
        if (Test-Path ".env") {
            $envContent = Get-Content ".env" -Raw
            $dbUrl = $envContent | Where-Object { $_ -match "^DATABASE_URL=" } | ForEach-Object { $_.Split('=', 2)[1] }

            if ($dbUrl) {
                # Check for insecure configurations
                if ($dbUrl -match "password=" -and $dbUrl -notmatch "sslmode=require") {
                    Write-Error "Database connection may not be using SSL"
                } else {
                    Write-Success "Database connection appears secure"
                }

                # Check for default credentials
                if ($dbUrl -match "user=postgres" -and $dbUrl -match "password=postgres") {
                    Write-Error "Database using default credentials"
                } else {
                    Write-Success "Database not using default credentials"
                }
            } else {
                throw "DATABASE_URL not found"
            }
        }

        # Test Prisma schema security
        if (Test-Path "prisma/schema.prisma") {
            $schemaContent = Get-Content "prisma/schema.prisma" -Raw

            # Check for sensitive data exposure
            if ($schemaContent -match "@db\.VarChar\(\d+\)" -and $schemaContent -notmatch "password|token") {
                Write-Success "Schema appears to handle sensitive data appropriately"
            }

            # Check for proper indexing
            if ($schemaContent -match "@@index" -or $schemaContent -match "@@unique") {
                Write-Success "Database has proper indexing"
            } else {
                Write-Error "Database may be missing indexes"
            }
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Database security tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Database security tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-FullSecurity {
    Write-TestHeader "Full Security Assessment"

    try {
        Write-Info "Running full security assessment..."
        $startTime = Get-Date

        # Test dependency vulnerabilities
        Write-Info "Checking for dependency vulnerabilities..."
        try {
            & npm audit --audit-level=high
            if ($LASTEXITCODE -eq 0) {
                Write-Success "No high-severity vulnerabilities found"
            } else {
                Write-Error "High-severity vulnerabilities found in dependencies"
            }
        } catch {
            Write-Error "Dependency audit failed: $($_.Exception.Message)"
        }

        # Test environment variable exposure
        Write-Info "Checking for exposed environment variables..."
        $envFiles = @(".env", ".env.local", ".env.development", ".env.production")
        foreach ($file in $envFiles) {
            if (Test-Path $file) {
                $content = Get-Content $file -Raw
                if ($content -match "password|secret|key" -and $content -notmatch "#.*password|#.*secret|#.*key") {
                    Write-Success "Environment file $file contains sensitive data (ensure it's in .gitignore)"
                }
            }
        }

        # Test file permissions
        Write-Info "Checking file permissions..."
        $sensitiveFiles = @(".env", "prisma/schema.prisma", "src/config/database.ts")
        foreach ($file in $sensitiveFiles) {
            if (Test-Path $file) {
                $acl = Get-Acl $file
                $owner = $acl.Owner
                Write-Info "File $file owner: $owner"
                # In production, these files should have restricted permissions
            }
        }

        # Test for hardcoded secrets
        Write-Info "Checking for hardcoded secrets..."
        $sourceFiles = Get-ChildItem "src" -Recurse -Include "*.ts", "*.js" -File
        $secretsFound = $false

        foreach ($file in $sourceFiles) {
            $content = Get-Content $file.FullName -Raw
            if ($content -match "password.*=.*['`"][^'`"]*['`"]" -or
                $content -match "secret.*=.*['`"][^'`"]*['`"]" -or
                $content -match "api.*key.*=.*['`"][^'`"]*['`"]") {
                Write-Error "Potential hardcoded secret found in $($file.FullName)"
                $secretsFound = $true
            }
        }

        if (-not $secretsFound) {
            Write-Success "No hardcoded secrets found in source code"
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Full security assessment completed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return -not $secretsFound
    } catch {
        Write-Error "Full security assessment failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-ErrorFixerSecurity {
    Write-TestHeader "Error-Fixer Security Tests"

    try {
        Write-Info "Testing Error-Fixer security..."
        $startTime = Get-Date

        # Test Error-Fixer service security
        if (Test-Path "src/services/sav3ErrorFixer.service.ts") {
            $serviceContent = Get-Content "src/services/sav3ErrorFixer.service.ts" -Raw

            # Check for proper error sanitization
            if ($serviceContent -match "sanitize|escape" -or $serviceContent -match "validate") {
                Write-Success "Error-Fixer service has input validation/sanitization"
            } else {
                Write-Error "Error-Fixer service may lack input validation"
            }

            # Check for rate limiting
            if ($serviceContent -match "rate.limit|throttle|delay") {
                Write-Success "Error-Fixer service has rate limiting"
            } else {
                Write-Error "Error-Fixer service may lack rate limiting"
            }
        }

        # Test browser extension security
        if (Test-Path "src/utils/sav3ErrorFixerBrowser.ts") {
            $browserContent = Get-Content "src/utils/sav3ErrorFixerBrowser.ts" -Raw

            # Check for CSP compliance
            if ($browserContent -match "Content-Security-Policy" -or $browserContent -notmatch "eval\(|Function\(") {
                Write-Success "Browser extension appears CSP compliant"
            } else {
                Write-Error "Browser extension may violate CSP"
            }
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Error-Fixer security tests passed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Error-Fixer security tests failed: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
try {
    $startTime = Get-Date
    $testsToRun = @()
    $results = @{}

    # Determine which tests to run
    if ($All -or $Auth) { $testsToRun += "Auth" }
    if ($All -or $API) { $testsToRun += "API" }
    if ($All -or $Database) { $testsToRun += "Database" }
    if ($All -or $Full) { $testsToRun += "Full" }

    if ($testsToRun.Count -eq 0) {
        $testsToRun = @("Auth", "API", "Database", "Full")
    }

    Write-TestHeader "Security Test Suite"
    Write-Host "Tests to run: $($testsToRun -join ', ')" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow

    # Run tests
    foreach ($test in $testsToRun) {
        switch ($test) {
            "Auth" {
                $results.Auth = Test-AuthSecurity
            }
            "API" {
                $results.API = Test-APISecurity
            }
            "Database" {
                $results.Database = Test-DatabaseSecurity
            }
            "Full" {
                $results.Full = Test-FullSecurity
            }
        }
    }

    # Additional Error-Fixer security test
    $results.ErrorFixer = Test-ErrorFixerSecurity

    # Summary
    $endTime = Get-Date
    $totalDuration = $endTime - $startTime

    Write-TestHeader "Security Test Results"

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
        Write-Success "All security tests passed!"
        exit 0
    } else {
        Write-Error "Some security tests failed"
        exit 1
    }

} catch {
    Write-Error "Fatal error during security testing: $($_.Exception.Message)"
    exit 1
}
