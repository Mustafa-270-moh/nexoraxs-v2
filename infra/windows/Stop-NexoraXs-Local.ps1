param(
    [string]$EnvFile = ".env.local.docker"
)

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envPath = Join-Path $projectRoot $EnvFile

if (-not (Test-Path $envPath)) {
    throw "Missing $EnvFile. Copy .env.local.docker.example to $EnvFile first."
}

Set-Location $projectRoot
$env:APP_ENV_FILE = $EnvFile

docker compose --env-file $EnvFile -f docker-compose.local.yml down
