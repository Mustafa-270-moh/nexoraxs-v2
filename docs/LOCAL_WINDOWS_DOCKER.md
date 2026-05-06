# Local Docker Development On Windows 11

## Scope

This document prepares `nexoraxs-v2` for safe local development on:
- Windows 11
- Docker Desktop
- WSL 2

This local setup is for the current backend/API foundation only.

It focuses on:
- local Docker startup
- Laravel health endpoint
- migrations and seeders
- tests
- safe rollback

It does not add new product features.

## Before You Start

You need:
- Windows 11
- Docker Desktop installed
- WSL 2 installed and updated
- Linux containers enabled in Docker Desktop

Recommended:
- keep Docker Desktop running with the WSL 2 engine
- if possible, keep active development code inside a WSL filesystem for best performance

This repo can still run from a Windows path such as `D:\nexoraxs`, but file performance may be slower than a WSL path.

## Official Setup References

- Docker Desktop install on Windows:
  - https://docs.docker.com/desktop/setup/install/windows-install/
- Docker Desktop with WSL 2:
  - https://docs.docker.com/desktop/features/wsl/
- Docker development with WSL:
  - https://docs.docker.com/desktop/features/wsl/use-wsl/
- Microsoft WSL install:
  - https://learn.microsoft.com/en-us/windows/wsl/install

## One-Time Windows 11 Setup

1. Open PowerShell as Administrator.
2. Install or update WSL:

```powershell
wsl --install
wsl --update
```

3. Restart Windows if you are asked to restart.
4. Open Docker Desktop.
5. In Docker Desktop, open:
   - `Settings > General`
6. Confirm:
   - `Use the WSL 2 based engine` is enabled
7. Open:
   - `Settings > Resources > WSL Integration`
8. Enable integration for your main WSL distribution if you use one.

## Local Files Used By This Setup

- `docker-compose.local.yml`
- `.env.local.docker.example`
- `infra/windows/Start-NexoraXs-Local.ps1`
- `infra/windows/Stop-NexoraXs-Local.ps1`

## Step 1: Create The Local Docker Env File

From the repo root:

```powershell
Copy-Item .env.local.docker.example .env.local.docker
```

Then edit `.env.local.docker` only if you need different local ports or passwords.

Safe defaults:
- API URL: `http://localhost:8080`
- PostgreSQL host port: `54329`
- Redis host port: `63799`

These ports were chosen to reduce the chance of clashing with existing local services.

## Step 2: Generate A Local APP_KEY

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\windows\New-LaravelAppKey.ps1
```

Copy the output into `.env.local.docker`:

```text
APP_KEY=base64:...
```

Do not leave the placeholder value in place.

## Step 3: Start The Local Stack

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\windows\Start-NexoraXs-Local.ps1
```

This starts:
- PostgreSQL
- Redis
- one prebuilt PHP + Nginx backend container based on `serversideup/php:8.4-fpm-nginx`

On first boot, the start script then runs inside the backend container:
- `composer install` if `backend/vendor` is missing on your host machine
- `php artisan config:clear`
- `php artisan migrate --seed --force`

Important:
- local Docker now uses your host `backend/vendor` directory directly
- there is no named Docker volume mounted on `/var/www/html/vendor`
- local Docker now uses your host `backend/storage` directory directly
- local Docker now uses your host `backend/bootstrap/cache` directory directly
- if `composer install` already succeeded on Windows, the container will see the same files
- the start script creates `backend/storage/logs` and `backend/bootstrap/cache` on Windows before containers start

## Step 4: Verify The Health Endpoint

Open this URL in your browser:

```text
http://localhost:8080/api/health
```

Expected response:

```json
{ "status": "ok", "app": "nexoraxs-api" }
```

If that response appears, the local API stack is alive.

## Step 5: Check Containers

```powershell
docker compose --env-file .env.local.docker -f docker-compose.local.yml ps
docker compose --env-file .env.local.docker -f docker-compose.local.yml logs --tail=100 backend
```

## Migrations

The local backend container runs migrations automatically on startup.

If you want to run them manually:

```powershell
docker compose --env-file .env.local.docker -f docker-compose.local.yml exec backend php artisan migrate
```

If you want to reset the database and reseed it:

```powershell
docker compose --env-file .env.local.docker -f docker-compose.local.yml exec backend php artisan migrate:fresh --seed
```

## Tests

Recommended test command from your host machine:

```powershell
Set-Location .\backend
php artisan test
```

Why this is the default recommendation:
- the repo already has a working host-side PHP test flow
- tests currently run against SQLite in memory by default
- this is the smallest and least risky validation path today

## Safe Stop

To stop containers without deleting data:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\windows\Stop-NexoraXs-Local.ps1
```

This preserves:
- PostgreSQL data
- Redis data
- Laravel files under `backend/storage`
- Laravel files under `backend/bootstrap/cache`

## Safe Rollback

Use this order.

### Level 1: Stop Only

Use this when you just want the stack off:

```powershell
docker compose --env-file .env.local.docker -f docker-compose.local.yml down
```

This does not delete your database data.

### Level 2: Rebuild Containers Only

Use this when config or Dockerfiles changed:

```powershell
docker compose --env-file .env.local.docker -f docker-compose.local.yml down
docker compose --env-file .env.local.docker -f docker-compose.local.yml up -d
```

This keeps your local database data.

### Level 3: Full Local Reset

Use this only when you want a clean local database and fresh volumes:

```powershell
docker compose --env-file .env.local.docker -f docker-compose.local.yml down -v --remove-orphans
```

Then start again:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\windows\Start-NexoraXs-Local.ps1
```

Warning:
- this deletes local Docker volumes for this stack
- your local PostgreSQL data will be erased
- it does not delete your host `backend/storage` files

## Clean Old Failed Build Cache And Start Again

If your earlier local setup got stuck while building `php:8.4-fpm-alpine`, use this exact cleanup order.

1. Stop and remove the old local stack:

```powershell
docker compose --env-file .env.local.docker -f docker-compose.local.yml down -v --remove-orphans
```

2. Remove old builder cache:

```powershell
docker builder prune -af
```

3. Remove dangling images:

```powershell
docker image prune -f
```

4. Start fresh with the new local stack:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\windows\Start-NexoraXs-Local.ps1
```

Why this works:
- the new local stack no longer builds a custom PHP image
- it pulls a prebuilt PHP + Nginx image instead
- this avoids local extension compilation on Windows 11

## Remove Old Vendor Volume Before Retrying

Older local Docker attempts used a named volume on:

```text
/var/www/html/vendor
```

That old volume can hide the real host `backend/vendor` directory.

Before retrying, remove it.

1. Stop the local stack:

```powershell
docker compose --env-file .env.local.docker -f docker-compose.local.yml down --remove-orphans
```

2. Remove the old vendor volume by name:

```powershell
docker volume rm nexoraxs-v2-local_backend_local_vendor
```

3. If your `COMPOSE_PROJECT_NAME` is different, list volumes first:

```powershell
docker volume ls
```

Then remove the matching old vendor volume for your project name.

4. Start again:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\windows\Start-NexoraXs-Local.ps1
```

## Remove Old Storage Volumes Before Retrying

Older local Docker attempts also used named volumes on:

```text
/var/www/html/storage
/var/www/html/bootstrap/cache
```

These old volumes can keep stale permissions and hide the host directories that Windows should expose directly.

Before retrying, remove them if they exist.

1. Stop the local stack:

```powershell
docker compose --env-file .env.local.docker -f docker-compose.local.yml down --remove-orphans
```

2. Remove the old storage-related volumes:

```powershell
docker volume rm nexoraxs-v2-local_backend_local_storage
docker volume rm nexoraxs-v2-local_backend_local_bootstrap_cache
```

3. If your `COMPOSE_PROJECT_NAME` is different, list volumes first:

```powershell
docker volume ls
```

Then remove the matching old storage volumes for your project name.

4. Start again:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\windows\Start-NexoraXs-Local.ps1
```

## Common Local URLs

- API health:
  - `http://localhost:8080/api/health`
- PostgreSQL from host tools:
  - host: `127.0.0.1`
  - port: `54329`
- Redis from host tools:
  - host: `127.0.0.1`
  - port: `63799`

## What This Local Setup Does Not Solve Yet

- production HTTPS cookies on real subdomains
- frontend deployment
- Shops business features
- invitations
- billing

That is intentional. This setup is only for safe local backend development.
