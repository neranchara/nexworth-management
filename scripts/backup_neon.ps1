# Nexworth Neon Production Backup Script
# This script uses pg_dump to backup both schema and data from the Neon production database to the local backups folder.

# Configuration
$PG_DUMP_PATH = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
$BACKUP_DIR = Join-Path $PSScriptRoot "..\backups"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$OUTPUT_FILE = Join-Path $BACKUP_DIR "neon_prod_backup_$TIMESTAMP.sql"

# Check if pg_dump exists
if (!(Test-Path $PG_DUMP_PATH)) {
    # Try common alternative locations if the default fails
    $alternativePaths = @(
        "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
    )
    foreach ($path in $alternativePaths) {
        if (Test-Path $path) {
            $PG_DUMP_PATH = $path
            break
        }
    }
}

if (!(Test-Path $PG_DUMP_PATH)) {
    Write-Host "ERROR: pg_dump.exe not found at $PG_DUMP_PATH" -ForegroundColor Red
    Write-Host "Please update the `$PG_DUMP_PATH` variable in this script with your PostgreSQL bin path." -ForegroundColor Yellow
    exit 1
}

# Database URL - Now loaded from Environment Variable for safety
$DB_URL = $env:PROD_DATABASE_URL

if (-not $DB_URL) {
    Write-Host "ERROR: PROD_DATABASE_URL environment variable is not set!" -ForegroundColor Red
    Write-Host "Please set it before running this script." -ForegroundColor Yellow
    exit 1
}

# Create backup directory if it doesn't exist
if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "Created backup directory: $BACKUP_DIR" -ForegroundColor Gray
}

Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "🚀 Starting Backup of Neon Production Database" -ForegroundColor Cyan
Write-Host "📅 Time: $(Get-Date)" -ForegroundColor Gray
Write-Host "📂 Output: $OUTPUT_FILE" -ForegroundColor Gray
Write-Host "----------------------------------------------------" -ForegroundColor Cyan

# Run pg_dump
# --clean: Drop database objects before creating them
# --if-exists: Use IF EXISTS when dropping objects
# --no-owner: Skip commands to set ownership of objects
# --no-privileges: Skip commands to set access privileges (grant/revoke)
& $PG_DUMP_PATH --dbname=$DB_URL --file=$OUTPUT_FILE --clean --if-exists --no-owner --no-privileges

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $OUTPUT_FILE).Length / 1KB
    Write-Host "`n✅ Backup completed successfully!" -ForegroundColor Green
    Write-Host "📊 File size: $($fileSize.ToString("F2")) KB" -ForegroundColor Green
} else {
    Write-Host "`n❌ Backup failed with exit code $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Check your connection string and ensure pg_dump is working correctly." -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
