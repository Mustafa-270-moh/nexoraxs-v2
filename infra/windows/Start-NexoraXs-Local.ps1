param(
    [string]$EnvFile = ".env.local.docker"
)

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envPath = Join-Path $projectRoot $EnvFile

if (-not (Test-Path $envPath)) {
    throw "Missing $EnvFile. Copy .env.local.docker.example to $EnvFile first."
}

$envFileContent = Get-Content $envPath -Raw
$cacheLaravelConfig = $envFileContent -match "(?m)^CACHE_LARAVEL_CONFIG=true\s*$"

if ($envFileContent -notmatch "(?m)^APP_KEY=base64:.+$" -or $envFileContent -match "APP_KEY=base64:REPLACE_WITH_A_REAL_APP_KEY") {
    throw "APP_KEY is missing or still using the placeholder value in $EnvFile."
}

$requiredDirectories = @(
    "backend\\storage",
    "backend\\storage\\app",
    "backend\\storage\\framework",
    "backend\\storage\\framework\\cache",
    "backend\\storage\\framework\\cache\\data",
    "backend\\storage\\framework\\sessions",
    "backend\\storage\\framework\\views",
    "backend\\storage\\logs",
    "backend\\bootstrap",
    "backend\\bootstrap\\cache"
)

foreach ($relativePath in $requiredDirectories) {
    $absolutePath = Join-Path $projectRoot $relativePath

    if (-not (Test-Path $absolutePath)) {
        New-Item -ItemType Directory -Path $absolutePath -Force | Out-Null
    }
}

Set-Location $projectRoot
$env:APP_ENV_FILE = $EnvFile

docker compose --env-file $EnvFile -f docker-compose.local.yml up -d

$containerReady = $false

for ($attempt = 1; $attempt -le 30; $attempt++) {
    docker compose --env-file $EnvFile -f docker-compose.local.yml exec -T backend php -v *> $null

    if ($LASTEXITCODE -eq 0) {
        $containerReady = $true
        break
    }

    Start-Sleep -Seconds 2
}

if (-not $containerReady) {
    throw "The local backend container did not become ready in time."
}

if (-not (Test-Path (Join-Path $projectRoot "backend\\vendor\\autoload.php"))) {
    Write-Host "Host vendor directory is missing. Running composer install inside the local backend container..."
}

docker compose --env-file $EnvFile -f docker-compose.local.yml exec -T backend sh -lc "if [ ! -f vendor/autoload.php ]; then composer install --prefer-dist --no-interaction --no-progress; fi"
docker compose --env-file $EnvFile -f docker-compose.local.yml exec -T backend php artisan migrate --seed --force

if ($cacheLaravelConfig) {
    docker compose --env-file $EnvFile -f docker-compose.local.yml exec -T backend php artisan config:cache
} else {
    docker compose --env-file $EnvFile -f docker-compose.local.yml exec -T backend php artisan config:clear
}
