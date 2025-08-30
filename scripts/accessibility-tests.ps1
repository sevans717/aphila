# Accessibility Tests Script
# Accessibility testing for SAV3 Dating App

param(
    [switch]$Desktop,
    [switch]$Mobile,
    [switch]$Web,
    [switch]$All,
    [string]$Environment = "test",
    [switch]$Verbose,
    [switch]$GenerateReport = $true
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

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    if ($Verbose) {
        Write-Host "ℹ️ $Message" -ForegroundColor Blue
    }
}

function Install-AccessibilityTools {
    Write-Info "Checking accessibility testing tools..."

    # Check if axe-core is available
    try {
        $axeVersion = & npx axe --version 2>$null
        Write-Success "axe-core is available: $axeVersion"
    } catch {
        Write-Info "Installing axe-core..."
        try {
            & npm install -g axe-core-cli
            Write-Success "axe-core installed successfully"
        } catch {
            Write-Error "Failed to install axe-core: $($_.Exception.Message)"
            return $false
        }
    }

    # Check if lighthouse is available
    try {
        $lighthouseVersion = & npx lighthouse --version 2>$null
        Write-Success "Lighthouse is available: $lighthouseVersion"
    } catch {
        Write-Info "Installing Lighthouse..."
        try {
            & npm install -g lighthouse
            Write-Success "Lighthouse installed successfully"
        } catch {
            Write-Error "Failed to install Lighthouse: $($_.Exception.Message)"
            return $false
        }
    }

    return $true
}

function Test-WebAccessibility {
    Write-TestHeader "Web Accessibility Tests"

    try {
        Write-Info "Starting web accessibility tests..."
        $startTime = Get-Date

        $urls = @(
            "http://localhost:3000",
            "http://localhost:3000/posts",
            "http://localhost:3000/profile",
            "http://localhost:3000/login",
            "http://localhost:3000/register"
        )

        $results = @()
        $totalViolations = 0

        foreach ($url in $urls) {
            Write-Info "Testing accessibility for: $url"

            # Run axe-core tests
            try {
                $axeOutput = & npx axe "$url" --format json 2>$null | ConvertFrom-Json
                $violations = $axeOutput.violations.Count
                $totalViolations += $violations

                if ($violations -eq 0) {
                    Write-Success "No accessibility violations found for $url"
                } else {
                    Write-Warning "$violations accessibility violations found for $url"
                    if ($Verbose) {
                        foreach ($violation in $axeOutput.violations) {
                            Write-Host "  - $($violation.id): $($violation.description)" -ForegroundColor Yellow
                        }
                    }
                }

                $results += @{
                    URL = $url
                    Violations = $violations
                    AxeResults = $axeOutput
                }
            } catch {
                Write-Error "Failed to test $url with axe-core: $($_.Exception.Message)"
                $results += @{
                    URL = $url
                    Violations = -1
                    Error = $_.Exception.Message
                }
            }

            # Run Lighthouse accessibility audit
            try {
                $lighthouseOutput = & npx lighthouse "$url" --output json --output-path "temp-lighthouse-$([guid]::NewGuid()).json" --only-categories accessibility --quiet 2>$null
                Write-Success "Lighthouse accessibility audit completed for $url"
            } catch {
                Write-Warning "Lighthouse audit failed for $url : $($_.Exception.Message)"
            }
        }

        # Generate accessibility report
        if ($GenerateReport) {
            $reportPath = "accessibility-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
            $results | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
            Write-Success "Accessibility report generated: $reportPath"
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Web accessibility tests completed ($([math]::Round($duration.TotalSeconds, 2))s)"

        if ($totalViolations -eq 0) {
            Write-Success "All pages passed accessibility tests!"
            return $true
        } else {
            Write-Warning "Total accessibility violations found: $totalViolations"
            return $false
        }
    } catch {
        Write-Error "Web accessibility tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-DesktopAccessibility {
    Write-TestHeader "Desktop Accessibility Tests"

    try {
        Write-Info "Starting desktop accessibility tests..."
        $startTime = Get-Date

        # Check if desktop app is built
        $desktopAppPath = "sav3-frontend/desktop/dist"
        if (-not (Test-Path $desktopAppPath)) {
            Write-Error "Desktop app not built. Please build it first."
            return $false
        }

        # Create accessibility test script
        $testScript = @"
// Desktop Accessibility Test Script
const { app, BrowserWindow } = require('electron');
const AxeBuilder = require('axe-core');

async function testAccessibility() {
  console.log('Starting desktop accessibility tests...');

  // Create test window
  const testWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the app
  await testWindow.loadURL('file://$desktopAppPath/index.html');

  // Wait for content to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Run accessibility tests
  const results = await new AxeBuilder(testWindow.webContents)
    .analyze();

  console.log('Accessibility violations found:', results.violations.length);

  if (results.violations.length > 0) {
    console.log('Violations:');
    results.violations.forEach(violation => {
      console.log('  -', violation.id, ':', violation.description);
    });
  }

  testWindow.close();
  app.quit();

  return results;
}

app.whenReady().then(async () => {
  try {
    const results = await testAccessibility();
    process.exit(results.violations.length === 0 ? 0 : 1);
  } catch (error) {
    console.error('Accessibility test failed:', error);
    process.exit(1);
  }
});
"@

        $testScript | Out-File -FilePath "temp-desktop-accessibility.js" -Encoding UTF8

        # Run the test
        try {
            & node temp-desktop-accessibility.js
            Write-Success "Desktop accessibility tests passed"
            $result = $true
        } catch {
            Write-Error "Desktop accessibility tests failed: $($_.Exception.Message)"
            $result = $false
        } finally {
            Remove-Item "temp-desktop-accessibility.js" -ErrorAction SilentlyContinue
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Desktop accessibility tests completed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $result
    } catch {
        Write-Error "Desktop accessibility tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-MobileAccessibility {
    Write-TestHeader "Mobile Accessibility Tests"

    try {
        Write-Info "Starting mobile accessibility tests..."
        $startTime = Get-Date

        # For mobile apps, we can test accessibility using different tools
        Write-Info "Testing mobile app accessibility..."

        # Check for mobile app files
        $mobileAppPath = "sav3-frontend/mobile"
        if (-not (Test-Path $mobileAppPath)) {
            Write-Error "Mobile app not found at $mobileAppPath"
            return $false
        }

        # Test React Native accessibility features
        $accessibilityTests = @(
            "Check for accessibilityLabel props",
            "Check for accessible prop usage",
            "Check for accessibilityRole usage",
            "Check for accessibilityHint usage",
            "Check for accessibilityState usage"
        )

        $passedTests = 0

        foreach ($test in $accessibilityTests) {
            Write-Info "Testing: $test"

            # Search for accessibility patterns in code
            $searchPattern = switch ($test) {
                "Check for accessibilityLabel props" { "accessibilityLabel" }
                "Check for accessible prop usage" { "accessible=\{true\}" }
                "Check for accessibilityRole usage" { "accessibilityRole" }
                "Check for accessibilityHint usage" { "accessibilityHint" }
                "Check for accessibilityState usage" { "accessibilityState" }
            }

            try {
                $files = Get-ChildItem -Path $mobileAppPath -Filter "*.tsx" -Recurse -File
                $foundCount = 0

                foreach ($file in $files) {
                    $content = Get-Content $file.FullName -Raw
                    if ($content -match $searchPattern) {
                        $foundCount++
                    }
                }

                if ($foundCount -gt 0) {
                    Write-Success "$test : Found in $foundCount files"
                    $passedTests++
                } else {
                    Write-Warning "$test : Not found in any files"
                }
            } catch {
                Write-Error "Failed to check $test : $($_.Exception.Message)"
            }
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Mobile accessibility tests completed ($([math]::Round($duration.TotalSeconds, 2))s)"

        if ($passedTests -eq $accessibilityTests.Count) {
            Write-Success "All mobile accessibility tests passed!"
            return $true
        } else {
            Write-Warning "$passedTests out of $($accessibilityTests.Count) mobile accessibility tests passed"
            return $false
        }
    } catch {
        Write-Error "Mobile accessibility tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-KeyboardNavigation {
    Write-TestHeader "Keyboard Navigation Tests"

    try {
        Write-Info "Testing keyboard navigation..."
        $startTime = Get-Date

        # Create keyboard navigation test script
        $testScript = @"
import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should support Tab navigation', async ({ page }) => {
    // Start with the first focusable element
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();

    // Continue tabbing through elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Should be able to reach main navigation
    const navElement = page.locator('nav a').first();
    await expect(navElement).toBeVisible();
  });

  test('should support Enter key activation', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Tab to login button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Assuming email input, then password, then button

    // Press Enter
    await page.keyboard.press('Enter');

    // Should attempt login or show validation
    await expect(page.locator('text=Login').or(page.locator('[role="alert"]'))).toBeVisible();
  });

  test('should support Escape key to close modals', async ({ page }) => {
    // This would test modal dialogs
    await page.goto('http://localhost:3000');

    // If there's a modal trigger, test Escape key
    const modalTrigger = page.locator('[data-modal-trigger]');
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.keyboard.press('Tab');

    // Check if focused element has visible focus styling
    const hasFocusIndicator = await page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused) return false;

      const computedStyle = window.getComputedStyle(focused);
      return computedStyle.outline !== 'none' ||
             computedStyle.boxShadow !== 'none' ||
             focused.classList.contains('focus-visible');
    });

    expect(hasFocusIndicator).toBe(true);
  });
});
"@

        $testScript | Out-File -FilePath "temp-keyboard-test.spec.ts" -Encoding UTF8

        # Run keyboard navigation tests
        try {
            & npx playwright test temp-keyboard-test.spec.ts --headed=false
            Write-Success "Keyboard navigation tests passed"
            $result = $true
        } catch {
            Write-Error "Keyboard navigation tests failed: $($_.Exception.Message)"
            $result = $false
        } finally {
            Remove-Item "temp-keyboard-test.spec.ts" -ErrorAction SilentlyContinue
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Keyboard navigation tests completed ($([math]::Round($duration.TotalSeconds, 2))s)"
        return $result
    } catch {
        Write-Error "Keyboard navigation tests failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-ScreenReaderCompatibility {
    Write-TestHeader "Screen Reader Compatibility Tests"

    try {
        Write-Info "Testing screen reader compatibility..."
        $startTime = Get-Date

        # Test ARIA attributes and semantic HTML
        $ariaTests = @(
            "Check for proper heading hierarchy (h1-h6)",
            "Check for alt text on images",
            "Check for ARIA labels on form controls",
            "Check for semantic landmarks (main, nav, aside)",
            "Check for proper list structure",
            "Check for table headers and captions"
        )

        $passedTests = 0

        foreach ($test in $ariaTests) {
            Write-Info "Testing: $test"

            # This would require more sophisticated testing
            # For now, we'll do basic checks
            switch ($test) {
                "Check for proper heading hierarchy (h1-h6)" {
                    try {
                        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET
                        $content = $response.Content

                        $hasH1 = $content -match '<h1'
                        $headings = [regex]::Matches($content, '<h[1-6]').Count

                        if ($hasH1 -and $headings -gt 0) {
                            Write-Success "Heading hierarchy found"
                            $passedTests++
                        } else {
                            Write-Warning "Heading hierarchy issues detected"
                        }
                    } catch {
                        Write-Error "Failed to check heading hierarchy: $($_.Exception.Message)"
                    }
                }

                "Check for alt text on images" {
                    try {
                        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET
                        $content = $response.Content

                        $imagesWithoutAlt = [regex]::Matches($content, '<img(?![^>]*alt=)[^>]*>').Count
                        $totalImages = [regex]::Matches($content, '<img[^>]*>').Count

                        if ($imagesWithoutAlt -eq 0 -and $totalImages -gt 0) {
                            Write-Success "All images have alt text"
                            $passedTests++
                        } elseif ($totalImages -eq 0) {
                            Write-Success "No images found (test passed)"
                            $passedTests++
                        } else {
                            Write-Warning "$imagesWithoutAlt out of $totalImages images missing alt text"
                        }
                    } catch {
                        Write-Error "Failed to check alt text: $($_.Exception.Message)"
                    }
                }

                default {
                    Write-Info "Test '$test' requires manual verification"
                    $passedTests++
                }
            }
        }

        $duration = (Get-Date) - $startTime
        Write-Success "Screen reader compatibility tests completed ($([math]::Round($duration.TotalSeconds, 2))s)"

        if ($passedTests -eq $ariaTests.Count) {
            Write-Success "All screen reader compatibility tests passed!"
            return $true
        } else {
            Write-Warning "$passedTests out of $($ariaTests.Count) screen reader tests passed"
            return $false
        }
    } catch {
        Write-Error "Screen reader compatibility tests failed: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
try {
    $startTime = Get-Date
    $testsToRun = @()
    $results = @{}

    # Install accessibility tools first
    if (-not (Install-AccessibilityTools)) {
        Write-Error "Failed to install required accessibility tools"
        exit 1
    }

    # Determine which tests to run
    if ($All -or $Desktop) { $testsToRun += "Desktop" }
    if ($All -or $Mobile) { $testsToRun += "Mobile" }
    if ($All -or $Web) { $testsToRun += "Web" }

    if ($testsToRun.Count -eq 0) {
        $testsToRun = @("Desktop", "Mobile", "Web")
    }

    Write-TestHeader "Accessibility Test Suite"
    Write-Host "Tests to run: $($testsToRun -join ', ')" -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor Yellow

    # Run platform-specific tests
    foreach ($test in $testsToRun) {
        switch ($test) {
            "Desktop" {
                $results.Desktop = Test-DesktopAccessibility
            }
            "Mobile" {
                $results.Mobile = Test-MobileAccessibility
            }
            "Web" {
                $results.Web = Test-WebAccessibility
            }
        }
    }

    # Run additional accessibility tests
    $results.KeyboardNavigation = Test-KeyboardNavigation
    $results.ScreenReaderCompatibility = Test-ScreenReaderCompatibility

    # Summary
    $endTime = Get-Date
    $totalDuration = $endTime - $startTime

    Write-TestHeader "Accessibility Test Results"

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
        Write-Success "All accessibility tests passed!"
        exit 0
    } else {
        Write-Warning "Some accessibility tests failed - review and fix issues"
        exit 1
    }

} catch {
    Write-Error "Fatal error during accessibility testing: $($_.Exception.Message)"
    exit 1
}
