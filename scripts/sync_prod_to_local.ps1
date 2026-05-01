# Nexworth Production to Local Sync Script
# This script dumps data from Neon Production and restores it directly to your local 'prod_nexworth_db'.

$PG_DUMP_PATH = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
$PSQL_PATH = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

# Neon Production URL - Now loaded from Environment Variable for safety
$NEON_URL = $env:PROD_DATABASE_URL

if (-not $NEON_URL) {
    Write-Host "ERROR: PROD_DATABASE_URL environment variable is not set!" -ForegroundColor Red
    Write-Host "Please set it before running this script (e.g., `$env:PROD_DATABASE_URL = 'your_url')`" -ForegroundColor Yellow
    exit 1
}

# Local Target Database
$LOCAL_HOST = "localhost"
$LOCAL_PORT = "5432"
$LOCAL_USER = "postgres"
$LOCAL_PASS = "nop@ssw0rd"
$LOCAL_DB   = "prod_nexworth_db"

$LOCAL_URL = "postgresql://${LOCAL_USER}@${LOCAL_HOST}:${LOCAL_PORT}/${LOCAL_DB}"

Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "🔄 Syncing Neon Production -> Local prod_nexworth_db" -ForegroundColor Cyan
Write-Host "⚠️  WARNING: This will overwrite data in your local 'prod_nexworth_db'!" -ForegroundColor Yellow
Write-Host "----------------------------------------------------" -ForegroundColor Cyan

# Check if tools exist
if (!(Test-Path $PG_DUMP_PATH) -or !(Test-Path $PSQL_PATH)) {
    Write-Host "ERROR: PostgreSQL tools not found. Please check the paths in the script." -ForegroundColor Red
    exit 1
}

Write-Host "Starting sync process... (This may take a moment)" -ForegroundColor Gray

# Use environment variable for local password to avoid URI encoding issues
$env:PGPASSWORD = $LOCAL_PASS

# Run pg_dump piped to psql
# --clean --if-exists: ensures the local schema is refreshed
& $PG_DUMP_PATH --dbname=$NEON_URL --clean --if-exists --no-owner --no-privileges | & $PSQL_PATH --dbname=$LOCAL_URL

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Sync completed successfully!" -ForegroundColor Green
    Write-Host "Local database 'prod_nexworth_db' is now up to date with Production." -ForegroundColor Green
} else {
    Write-Host "`n❌ Sync failed with exit code $LASTEXITCODE" -ForegroundColor Red
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
