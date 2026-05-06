param(
    [string]$EnvFile = ".env.production"
)

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envPath = Join-Path $projectRoot $EnvFile
$certPath = Join-Path $projectRoot "infra\\ssl\\origin.crt"
$keyPath = Join-Path $projectRoot "infra\\ssl\\origin.key"

if (-not (Test-Path $envPath)) {
    throw "Missing $EnvFile. Copy .env.production.example to $EnvFile first."
}

$envFileContent = Get-Content $envPath -Raw

if ($envFileContent -notmatch "(?m)^APP_KEY=base64:.+$" -or $envFileContent -match "APP_KEY=base64:REPLACE_WITH_A_REAL_APP_KEY") {
    throw "APP_KEY is missing or still using the placeholder value in $EnvFile."
}

if (-not (Test-Path $certPath)) {
    throw "Missing Cloudflare origin certificate file: $certPath"
}

if (-not (Test-Path $keyPath)) {
    throw "Missing Cloudflare origin private key file: $keyPath"
}

Set-Location $projectRoot
$env:APP_ENV_FILE = $EnvFile

docker compose --env-file $EnvFile up -d --build
