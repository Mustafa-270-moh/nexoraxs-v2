param(
    [string]$EnvFile = ".env.production"
)

function Get-DotEnvValue {
    param(
        [string]$Path,
        [string]$Name
    )

    $line = Get-Content $Path | Where-Object { $_ -match "^$Name=" } | Select-Object -First 1

    if (-not $line) {
        throw "Missing $Name in $Path"
    }

    return ($line -split "=", 2)[1]
}

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envPath = Join-Path $projectRoot $EnvFile

if (-not (Test-Path $envPath)) {
    throw "Missing $EnvFile. Copy .env.production.example to $EnvFile first."
}

$databaseName = Get-DotEnvValue -Path $envPath -Name "POSTGRES_DB"
$databaseUser = Get-DotEnvValue -Path $envPath -Name "POSTGRES_USER"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFileName = "postgres-$timestamp.sql"

Set-Location $projectRoot
$env:APP_ENV_FILE = $EnvFile

docker compose --env-file $EnvFile exec -T postgres sh -lc "pg_dump -U '$databaseUser' '$databaseName' > /backups/$backupFileName"

Write-Host "Backup created: backups\\$backupFileName"
