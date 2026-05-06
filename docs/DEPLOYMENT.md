# Deployment

## Scope

This phase adds a deployment foundation for the current backend/API stack only:
- Laravel backend
- PostgreSQL
- Redis
- Nginx web server

It does not deploy the frontend apps yet.

## Important Windows Server Assumption

This Docker setup uses standard Linux container images:
- `php`
- `nginx`
- `postgres`
- `redis`

That means your Windows Server VPS must be able to run Linux containers.

If your VPS only supports Windows containers, stop here and use one of these options first:
- a Windows Server setup that supports Linux containers
- a small Linux VM on the same VPS
- a Linux VPS instead of Windows Server

Do not continue until Linux containers work on the server.

## Files Added For Deployment

- `docker-compose.yml`
- `.env.production.example`
- `backend/Dockerfile`
- `backend/.dockerignore`
- `backend/docker/entrypoint.sh`
- `infra/nginx/default.conf`
- `infra/windows/Start-NexoraXs.ps1`
- `infra/windows/Backup-Postgres.ps1`
- `infra/windows/New-LaravelAppKey.ps1`

## What The Stack Does

- `postgres`: stores the application database
- `redis`: included as future-ready infrastructure
- `backend`: runs Laravel with PHP-FPM
- `web`: runs Nginx and exposes ports `80` and `443`

On first start, the backend container can:
- wait for PostgreSQL
- run migrations
- run seeders
- cache Laravel config

## Production Files You Will Create

You will create these local-only files on the server:
- `.env.production`
- `infra/ssl/origin.crt`
- `infra/ssl/origin.key`

Do not commit them to git.

## One-Time Server Preparation

1. Install Docker and Docker Compose on the VPS.
2. Confirm Docker can run Linux containers.
3. Open these firewall ports on the VPS:
   - `80`
   - `443`
4. Copy the `nexoraxs-v2` folder to the server.
5. Open PowerShell inside the repo root.

## Step 1: Create The Production Env File

Copy the example file:

```powershell
Copy-Item .env.production.example .env.production
```

Then edit `.env.production` and set real values for:
- `APP_KEY`
- `DB_PASSWORD`
- `POSTGRES_PASSWORD`
- domain names if your final domain differs

Important:
- keep `APP_DEBUG=false`
- keep `SESSION_SECURE_COOKIE=true`
- keep `SESSION_DOMAIN=.nexoraxs.com`
- do not switch auth to JWT

## Step 2: Generate A Laravel APP_KEY

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\windows\New-LaravelAppKey.ps1
```

Copy the output value and paste it into:

```text
APP_KEY=base64:...
```

inside `.env.production`.

## Step 3: Configure Cloudflare

### DNS

Inside Cloudflare DNS:
- add an `A` record for `api` pointing to your VPS public IP
- keep it `Proxied`

Later, when the frontend apps are deployed, add:
- `www`
- `app`
- `shops`
- `admin`

### SSL/TLS

Inside Cloudflare:
1. Open `SSL/TLS`.
2. Set encryption mode to `Full (strict)`.
3. Open `SSL/TLS > Origin Server`.
4. Create an Origin CA certificate.
5. Include at least:
   - `api.nexoraxs.com`
6. You may also include:
   - `*.nexoraxs.com`
   - `nexoraxs.com`

Save the files as:
- `infra/ssl/origin.crt`
- `infra/ssl/origin.key`

Important:
- never commit the private key
- do not use `Flexible`
- use `Full (strict)` only after the origin certificate is in place

## Step 4: Start Everything With One Command

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\windows\Start-NexoraXs.ps1
```

This runs:
- PostgreSQL
- Redis
- Laravel backend
- Nginx

The script also checks:
- `.env.production` exists
- `APP_KEY` is not still the placeholder
- Cloudflare origin certificate files exist

## Step 5: Verify Health

External health URL:

```text
https://api.nexoraxs.com/api/health
```

Expected response:

```json
{ "status": "ok", "app": "nexoraxs-api" }
```

Useful local checks:

```powershell
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=100 web
docker compose --env-file .env.production logs --tail=100 backend
```

## PostgreSQL Backups

### Create A Backup

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\windows\Backup-Postgres.ps1
```

Backup files are saved to:

```text
backups/
```

Example file name:

```text
backups/postgres-2026-05-05_17-30-00.sql
```

### Restore A Backup

Replace the file name with your own:

```powershell
docker compose --env-file .env.production exec -T postgres sh -lc "psql -U '$env:POSTGRES_USER' '$env:POSTGRES_DB' < /backups/postgres-2026-05-05_17-30-00.sql"
```

If PowerShell does not already have those env variables loaded, use literal values:

```powershell
docker compose --env-file .env.production exec -T postgres sh -lc "psql -U 'nexoraxs' 'nexoraxs' < /backups/postgres-2026-05-05_17-30-00.sql"
```

## Health Check Documentation

Current API health endpoint:
- `GET /api/health`

Response:

```json
{ "status": "ok", "app": "nexoraxs-api" }
```

Use this for:
- first deployment verification
- Cloudflare origin checks
- simple uptime monitoring

## Day-To-Day Commands

Start:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\windows\Start-NexoraXs.ps1
```

Stop:

```powershell
docker compose --env-file .env.production down
```

Restart:

```powershell
docker compose --env-file .env.production down
docker compose --env-file .env.production up -d --build
```

View logs:

```powershell
docker compose --env-file .env.production logs -f web
docker compose --env-file .env.production logs -f backend
```

## What Is Not Included Yet

This deployment foundation does not add:
- frontend containers
- payment processing
- billing workflows
- Shops business tables
- file upload infrastructure
- monitoring vendor integrations

## Production Notes

- keep Cloudflare DNS records for web traffic proxied
- do not expose PostgreSQL directly to the public internet
- do not expose Redis directly to the public internet
- keep releases small
- test backups before relying on them
