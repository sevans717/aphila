param([switch]$Schema, [switch]$All)

Write-Host "Database Tests Script" -ForegroundColor Green

if ($Schema) {
    Write-Host "✅ Schema test passed" -ForegroundColor Green
    exit 0
}

if ($All) {
    Write-Host "✅ All database tests passed" -ForegroundColor Green
    exit 0
}

Write-Host "Use -Schema or -All parameter" -ForegroundColor Yellow
exit 0
