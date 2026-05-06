# NexoraXS API Backend

Fresh Laravel API foundation for NexoraXS V2.

Current scope:
- Laravel API foundation
- PostgreSQL-oriented configuration
- Laravel Sanctum configured for cookie-based SPA auth
- Auth API foundation
- Workspace API foundation
- Shops access foundation only
- one unauthenticated health endpoint at `GET /api/health`

Out of scope in this phase:
- Shops business data such as products, customers, and orders
- invitations
- billing
- payments
- JWT or `localStorage` auth

## Local Run

1. Copy `.env.example` to `.env` if needed.
2. Update PostgreSQL credentials in `.env` for your local database.
3. Install dependencies:

```bash
composer install
```

4. Run the current foundation migrations and seeders:

```bash
php artisan migrate --seed
```

5. Start the API server:

```bash
php artisan serve
```

6. Open the health endpoint:

```text
http://127.0.0.1:8000/api/health
```

Expected response:

```json
{ "status": "ok", "app": "nexoraxs-api" }
```

## Docker Deployment

Production Docker deployment files now live at the repo root.

Read:
- `../docs/DEPLOYMENT.md`
- `../docs/LOCAL_WINDOWS_DOCKER.md` for Windows 11 local Docker development

The external health endpoint remains:
- `GET https://api.nexoraxs.com/api/health`

Expected response:

```json
{ "status": "ok", "app": "nexoraxs-api" }
```

Local Docker health endpoint:

```text
http://localhost:8080/api/health
```

## PostgreSQL Verification

The backend schema has been verified against a real local PostgreSQL database, not only SQLite.

Local app database shape:
- `DB_CONNECTION=pgsql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=<your-local-postgres-port>`
- `DB_DATABASE=<your-local-app-database>`
- `DB_USERNAME=<your-local-postgres-user>`
- `DB_PASSWORD=<your-local-postgres-password-or-empty>`

To verify the schema and seeders on PostgreSQL:

```bash
php artisan migrate:fresh --seed
```

To run the test suite on PostgreSQL as well, provide PostgreSQL testing environment variables for the process or create a matching `.env.testing`. This avoids falling back to a SQLite-only test connection.

Example process-level run:

```powershell
$env:APP_ENV='testing'
$env:DB_CONNECTION='pgsql'
$env:DB_HOST='127.0.0.1'
$env:DB_PORT='5432'
$env:DB_DATABASE='your_test_database'
$env:DB_USERNAME='your_postgres_user'
$env:DB_PASSWORD='your_postgres_password'
php artisan test
```

## Sanctum Notes

- Auth is session and cookie based.
- First-party SPA domains are configured via `SANCTUM_STATEFUL_DOMAINS`.
- Session cookies should be shared on the parent domain via `SESSION_DOMAIN`.
- Production reverse proxies should be trusted via `TRUSTED_PROXIES`.
- No JWT or browser token storage should be added.
