<#
PowerShell helper to integrate this project into an existing main project.
It copies backend code, migrations, netlify functions, and merges package.json dependencies and scripts.

Usage: run from this repo root:
  pwsh .\scripts\integrate_into_main_project.ps1

The script prompts for the target main project root. It will:
 - copy services/backend -> <target>/src/backend
 - merge migrations -> <target>/src/backend/migrations
 - copy netlify/functions -> <target>/src/frontend/netlify/functions (or <target>/netlify/functions)
 - merge dependencies and scripts from this repo's package.json into target package.json (non-destructive)

It does NOT automatically run npm install or run migrations. Review changes and run CI/tests in the target repo.
#>

Param()

function Abort($msg){ Write-Host "ABORT: $msg" -ForegroundColor Red; exit 1 }

# Confirm we're in the source repo root
$repoRoot = Resolve-Path -Path "..\" -ErrorAction SilentlyContinue
# We'll use script location as repo root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path $scriptDir
Write-Host "This script runs from repo: $repoRoot"

$target = Read-Host "Enter absolute path to target main project root (e.g. C:\path\to\main-project)"
if (-not (Test-Path $target)) { Abort "Target path does not exist: $target" }

# Confirm intent
$confirm = Read-Host "Proceed to copy files into $target ? Type YES to continue"
if ($confirm -ne 'YES') { Abort "User cancelled" }

# Helper copy function
function Copy-Tree($src, $dst, $what) {
    if (-not (Test-Path $src)) { Write-Host "Skipping $what; source not found: $src"; return }
    Write-Host "Copying $what from $src to $dst"
    New-Item -ItemType Directory -Path $dst -Force | Out-Null
    robocopy $src $dst /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
}

# 1) Copy backend
$srcBackend = Join-Path $repoRoot 'services\backend'
$dstBackend = Join-Path $target 'src\backend'
Copy-Tree $srcBackend $dstBackend 'backend service'

# 2) Merge migrations
$srcMigs = Join-Path $repoRoot 'migrations'
$dstMigs = Join-Path $dstBackend 'migrations'
if (Test-Path $srcMigs) {
    New-Item -ItemType Directory -Path $dstMigs -Force | Out-Null
    Get-ChildItem -Path $srcMigs -File | ForEach-Object {
        $dstFile = Join-Path $dstMigs $_.Name
        if (Test-Path $dstFile) {
            Write-Host "Migration exists in target, skipping: $($_.Name)" -ForegroundColor Yellow
        } else {
            Copy-Item $_.FullName $dstFile
            Write-Host "Copied migration: $($_.Name)"
        }
    }
} else { Write-Host "No migrations found in source repo" }

# 3) Copy netlify functions
$srcNetlifyFn = Join-Path $repoRoot 'netlify\functions'
$dstNetlifyFnCandidate = Join-Path $target 'src\frontend\netlify\functions'
$dstNetlifyFnAlt = Join-Path $target 'netlify\functions'
if (Test-Path $srcNetlifyFn) {
    if (Test-Path (Join-Path $target 'src\frontend')) {
        Copy-Tree $srcNetlifyFn $dstNetlifyFnCandidate 'Netlify functions to frontend'
    } else {
        Copy-Tree $srcNetlifyFn $dstNetlifyFnAlt 'Netlify functions root'
    }
} else { Write-Host "No netlify functions to copy" }

# 4) Merge package.json dependencies and scripts
$srcPkg = Join-Path $repoRoot 'package.json'
$dstPkg = Join-Path $target 'package.json'
if (-not (Test-Path $dstPkg)) {
    Write-Host "Target package.json not found at $dstPkg; creating from source"
    Copy-Item $srcPkg $dstPkg
} else {
    try {
        $srcJson = Get-Content $srcPkg -Raw | ConvertFrom-Json
        $dstJson = Get-Content $dstPkg -Raw | ConvertFrom-Json
    } catch {
        Write-Host "Failed to parse package.json files. Aborting merge." -ForegroundColor Red
        exit 1
    }

    # Merge dependencies
    if ($srcJson.dependencies) {
        if (-not $dstJson.dependencies) { $dstJson | Add-Member -MemberType NoteProperty -Name dependencies -Value @{} }
        foreach ($k in $srcJson.dependencies.PSObject.Properties.Name) {
            if (-not $dstJson.dependencies.PSObject.Properties.Name -contains $k) {
                $dstJson.dependencies.$k = $srcJson.dependencies.$k
                Write-Host "Added dependency: $k@$($srcJson.dependencies.$k)"
            } else {
                Write-Host "Dependency exists, skipping: $k" -ForegroundColor Yellow
            }
        }
    }

    # Merge scripts (only add non-conflicting keys)
    if ($srcJson.scripts) {
        if (-not $dstJson.scripts) { $dstJson | Add-Member -MemberType NoteProperty -Name scripts -Value @{} }
        foreach ($k in $srcJson.scripts.PSObject.Properties.Name) {
            if (-not $dstJson.scripts.PSObject.Properties.Name -contains $k) {
                $dstJson.scripts.$k = $srcJson.scripts.$k
                Write-Host "Added script: $k -> $($srcJson.scripts.$k)"
            } else {
                Write-Host "Script exists in target, skipping: $k" -ForegroundColor Yellow
            }
        }
    }

    # Write merged package back
    $dstJson | ConvertTo-Json -Depth 10 | Set-Content $dstPkg -Encoding UTF8
    Write-Host "Merged package.json successfully"
}

Write-Host "Integration copy finished. Next steps:" -ForegroundColor Green
Write-Host " - Review copied files in $target" -ForegroundColor Green
Write-Host " - Run 'cd $target' then 'npm install' to install merged dependencies" -ForegroundColor Green
Write-Host " - Run migrations from target: cd src/backend && npm run migrate (or follow your project's migration flow)" -ForegroundColor Green
Write-Host " - Seed sample data optionally: npm run seed-sample -- 200" -ForegroundColor Green
Write-Host " - Review and run tests/CI in the main project" -ForegroundColor Green

Write-Host "Script complete." -ForegroundColor Cyan
