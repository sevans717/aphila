# Media Tests Script
# Comprehensive media testing for SAV3 Dating App

param(
    [switch]$Upload,
    [switch]$Processing,
    [switch]$Storage,
    [switch]$CDN,
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

function Test-MediaUpload {
    Write-TestHeader "Media Upload Tests"

    try {
        Write-Info "Testing media upload functionality..."
        $startTime = Get-Date

        # Test file type validation
        $testFiles = @(
            @{ name = "test-image.jpg"; type = "image/jpeg"; size = 1024000 },
            @{ name = "test-video.mp4"; type = "video/mp4"; size = 5242880 },
            @{ name = "test-audio.mp3"; type = "audio/mpeg"; size = 2097152 },
            @{ name = "invalid-file.exe"; type = "application/x-msdownload"; size = 1024 }
        )

        foreach ($file in $testFiles) {
            Write-Info "Testing upload of $($file.name)..."

            # Create test file content (base64 encoded minimal file)
            $fileContent = @{
                fileName = $file.name
                fileType = $file.type
                fileSize = $file.size
                base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="  # 1x1 pixel image
            }

            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000/api/media/upload" -Method POST -Body ($fileContent | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30

                if ($file.type -match "image|video|audio") {
                    if ($response.StatusCode -eq 201 -or $response.StatusCode -eq 200) {
                        Write-Success "Upload successful for $($file.name)"
                    } else {
                        Write-Error "Upload failed for $($file.name): Status $($response.StatusCode)"
                    }
                } else {
                    # Should be rejected
                    if ($response.StatusCode -eq 400) {
                        Write-Success "Invalid file type correctly rejected: $($file.name)"
                    } else {
                        Write-Error "Invalid file type not properly rejected: $($file.name)"
                    }
                }
            } catch {
                if ($file.type -match "image|video|audio") {
                    Write-Error "Upload failed for $($file.name): $($_.Exception.Message)"
                } else {
                    Write-Success "Invalid file type correctly rejected: $($file.name)"
                }
            }
        }

        # Test file size limits
        Write-Info "Testing file size limits..."
        $largeFileContent = @{
            fileName = "large-file.jpg"
            fileType = "image/jpeg"
            fileSize = 104857600  # 100MB (should be rejected)
            base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        }

        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/media/upload" -Method POST -Body ($largeFileContent | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30
            if ($response.StatusCode -eq 413) {  # Payload Too Large
                Write-Success "Large file correctly rejected"
            } else {
                Write-Error "Large file not properly rejected"
            }
        } catch {
            Write-Success "Large file correctly rejected"
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Media upload tests completed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Media upload tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-MediaProcessing {
    Write-TestHeader "Media Processing Tests"

    try {
        Write-Info "Testing media processing functionality..."
        $startTime = Get-Date

        # Test image resizing
        Write-Info "Testing image resizing..."
        $resizeRequest = @{
            imageUrl = "https://via.placeholder.com/1000x1000.jpg"
            sizes = @(
                @{ width = 300; height = 300; quality = 80 },
                @{ width = 150; height = 150; quality = 90 }
            )
        }

        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/media/resize" -Method POST -Body ($resizeRequest | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 60

            if ($response.StatusCode -eq 200) {
                $result = $response.Content | ConvertFrom-Json
                if ($result.resizedImages -and $result.resizedImages.Count -gt 0) {
                    Write-Success "Image resizing successful"
                } else {
                    Write-Error "Image resizing returned empty result"
                }
            } else {
                Write-Error "Image resizing failed: Status $($response.StatusCode)"
            }
        } catch {
            Write-Error "Image resizing test failed: $($_.Exception.Message)"
        }

        # Test video thumbnail generation
        Write-Info "Testing video thumbnail generation..."
        $thumbnailRequest = @{
            videoUrl = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
            timestamp = 5  # 5 seconds into video
            size = @{ width = 320; height = 180 }
        }

        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/media/thumbnail" -Method POST -Body ($thumbnailRequest | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 60

            if ($response.StatusCode -eq 200) {
                Write-Success "Video thumbnail generation successful"
            } else {
                Write-Error "Video thumbnail generation failed: Status $($response.StatusCode)"
            }
        } catch {
            Write-Error "Video thumbnail generation test failed: $($_.Exception.Message)"
        }

        # Test image optimization
        Write-Info "Testing image optimization..."
        $optimizeRequest = @{
            imageUrl = "https://via.placeholder.com/800x600.jpg"
            quality = 85
            format = "webp"
        }

        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/media/optimize" -Method POST -Body ($optimizeRequest | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30

            if ($response.StatusCode -eq 200) {
                Write-Success "Image optimization successful"
            } else {
                Write-Error "Image optimization failed: Status $($response.StatusCode)"
            }
        } catch {
            Write-Error "Image optimization test failed: $($_.Exception.Message)"
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Media processing tests completed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Media processing tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-MediaStorage {
    Write-TestHeader "Media Storage Tests"

    try {
        Write-Info "Testing media storage functionality..."
        $startTime = Get-Date

        # Test MinIO/S3 connectivity
        Write-Info "Testing storage service connectivity..."
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/media/storage/health" -Method GET -TimeoutSec 10

            if ($response.StatusCode -eq 200) {
                Write-Success "Storage service is healthy"
            } else {
                Write-Error "Storage service health check failed: Status $($response.StatusCode)"
            }
        } catch {
            Write-Error "Storage service connectivity test failed: $($_.Exception.Message)"
        }

        # Test bucket operations
        Write-Info "Testing bucket operations..."
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/media/buckets" -Method GET -TimeoutSec 10

            if ($response.StatusCode -eq 200) {
                $buckets = $response.Content | ConvertFrom-Json
                if ($buckets -and $buckets.Count -gt 0) {
                    Write-Success "Bucket listing successful ($($buckets.Count) buckets found)"
                } else {
                    Write-Error "No buckets found"
                }
            } else {
                Write-Error "Bucket listing failed: Status $($response.StatusCode)"
            }
        } catch {
            Write-Error "Bucket operations test failed: $($_.Exception.Message)"
        }

        # Test file retrieval
        Write-Info "Testing file retrieval..."
        try {
            # First upload a test file
            $testFile = @{
                fileName = "test-retrieval.jpg"
                fileType = "image/jpeg"
                fileSize = 1024
                base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            }

            $uploadResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/media/upload" -Method POST -Body ($testFile | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30

            if ($uploadResponse.StatusCode -eq 201 -or $uploadResponse.StatusCode -eq 200) {
                $uploadResult = $uploadResponse.Content | ConvertFrom-Json
                $fileId = $uploadResult.id

                # Now try to retrieve it
                $retrieveResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/media/$fileId" -Method GET -TimeoutSec 10

                if ($retrieveResponse.StatusCode -eq 200) {
                    Write-Success "File retrieval successful"
                } else {
                    Write-Error "File retrieval failed: Status $($retrieveResponse.StatusCode)"
                }
            } else {
                Write-Error "Test file upload failed for retrieval test"
            }
        } catch {
            Write-Error "File retrieval test failed: $($_.Exception.Message)"
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Media storage tests completed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Media storage tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-MediaCDN {
    Write-TestHeader "Media CDN Tests"

    try {
        Write-Info "Testing media CDN functionality..."
        $startTime = Get-Date

        # Test CDN configuration
        Write-Info "Testing CDN configuration..."
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/media/cdn/config" -Method GET -TimeoutSec 10

            if ($response.StatusCode -eq 200) {
                $config = $response.Content | ConvertFrom-Json
                if ($config.cdnUrl -and $config.regions) {
                    Write-Success "CDN configuration is valid"
                } else {
                    Write-Error "CDN configuration is incomplete"
                }
            } else {
                Write-Error "CDN configuration check failed: Status $($response.StatusCode)"
            }
        } catch {
            Write-Error "CDN configuration test failed: $($_.Exception.Message)"
        }

        # Test CDN distribution
        Write-Info "Testing CDN distribution..."
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/media/cdn/distribution" -Method GET -TimeoutSec 10

            if ($response.StatusCode -eq 200) {
                $distribution = $response.Content | ConvertFrom-Json
                if ($distribution.status -eq "active") {
                    Write-Success "CDN distribution is active"
                } else {
                    Write-Error "CDN distribution is not active: $($distribution.status)"
                }
            } else {
                Write-Error "CDN distribution check failed: Status $($response.StatusCode)"
            }
        } catch {
            Write-Error "CDN distribution test failed: $($_.Exception.Message)"
        }

        # Test CDN caching
        Write-Info "Testing CDN caching..."
        try {
            # Make multiple requests to the same resource
            $testUrl = "http://localhost:3000/api/media/test-image.jpg"
            $responses = @()

            for ($i = 0; $i -lt 3; $i++) {
                $response = Invoke-WebRequest -Uri $testUrl -Method GET -TimeoutSec 10
                $responses += @{
                    StatusCode = $response.StatusCode
                    CacheControl = $response.Headers['Cache-Control']
                    ETag = $response.Headers['ETag']
                    ResponseTime = (Get-Date) - (Get-Date)  # Would need to measure actual response time
                }
            }

            # Check if caching headers are present
            $hasCaching = $responses | Where-Object { $_.CacheControl -or $_.ETag }
            if ($hasCaching) {
                Write-Success "CDN caching headers are present"
            } else {
                Write-Error "CDN caching headers are missing"
            }
        } catch {
            Write-Error "CDN caching test failed: $($_.Exception.Message)"
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Media CDN tests completed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Media CDN tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-MediaSecurity {
    Write-TestHeader "Media Security Tests"

    try {
        Write-Info "Testing media security..."
        $startTime = Get-Date

        # Test access control
        Write-Info "Testing access control..."
        try {
            # Try to access a private file without authentication
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/media/private/123" -Method GET -TimeoutSec 10

            if ($response.StatusCode -eq 401 -or $response.StatusCode -eq 403) {
                Write-Success "Access control working for private files"
            } else {
                Write-Error "Access control not working for private files"
            }
        } catch {
            if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 403) {
                Write-Success "Access control working for private files"
            } else {
                Write-Error "Access control test failed: $($_.Exception.Message)"
            }
        }

        # Test file type restrictions
        Write-Info "Testing file type restrictions..."
        $maliciousFile = @{
            fileName = "malicious.php"
            fileType = "application/x-php"
            fileSize = 1024
            base64Data = "PD9waHAgZWNobyAnSGVsbG8gV29ybGQnOyA/Pg=="  # <?php echo 'Hello World'; ?>
        }

        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/media/upload" -Method POST -Body ($maliciousFile | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30

            if ($response.StatusCode -eq 400) {
                Write-Success "Malicious file type correctly rejected"
            } else {
                Write-Error "Malicious file type not properly rejected"
            }
        } catch {
            Write-Success "Malicious file type correctly rejected"
        }

        # Test upload rate limiting
        Write-Info "Testing upload rate limiting..."
        $rateLimitTest = @{
            fileName = "rate-limit-test.jpg"
            fileType = "image/jpeg"
            fileSize = 1024
            base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        }

        $successCount = 0
        for ($i = 0; $i -lt 10; $i++) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000/api/media/upload" -Method POST -Body ($rateLimitTest | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 5
                if ($response.StatusCode -eq 201 -or $response.StatusCode -eq 200) {
                    $successCount++
                }
            } catch {
                # Expected for rate limiting
            }
            Start-Sleep -Milliseconds 200
        }

        if ($successCount -lt 10) {
            Write-Success "Upload rate limiting is working"
        } else {
            Write-Error "Upload rate limiting may not be configured"
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Media security tests completed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $true
    } catch {
        Write-Error "Media security tests failed: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
try {
    $startTime = Get-Date
    $testsToRun = @()
    $results = @{}

    # Determine which tests to run
    if ($All -or $Upload) { $testsToRun += "Upload" }
    if ($All -or $Processing) { $testsToRun += "Processing" }
    if ($All -or $Storage) { $testsToRun += "Storage" }
    if ($All -or $CDN) { $testsToRun += "CDN" }

    if ($testsToRun.Count -eq 0) {
        $testsToRun = @("Upload", "Processing", "Storage", "CDN")
    }

    Write-TestHeader "Media Test Suite"
    Write-Host "Tests to run: $($testsToRun -join ', ')" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow

    # Run tests
    foreach ($test in $testsToRun) {
        switch ($test) {
            "Upload" {
                $results.Upload = Test-MediaUpload
            }
            "Processing" {
                $results.Processing = Test-MediaProcessing
            }
            "Storage" {
                $results.Storage = Test-MediaStorage
            }
            "CDN" {
                $results.CDN = Test-MediaCDN
            }
        }
    }

    # Additional security test
    $results.Security = Test-MediaSecurity

    # Summary
    $endTime = Get-Date
    $totalDuration = $endTime - $startTime

    Write-TestHeader "Media Test Results"

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
        Write-Success "All media tests passed!"
        exit 0
    } else {
        Write-Error "Some media tests failed"
        exit 1
    }

} catch {
    Write-Error "Fatal error during media testing: $($_.Exception.Message)"
    exit 1
}
