# NexoraXS Core App

Fresh Next.js App Router frontend shell for `app.nexoraxs.com`.

Current scope:
- `/login`
- `/register`
- `/dashboard`
- browser-to-Laravel Sanctum session auth
- workspace list and workspace creation on `/dashboard`

Out of scope in this phase:
- Shops features
- billing
- JWT
- `localStorage` auth persistence

## Environment

Copy `.env.example` to `.env.local` and keep:

```bash
NEXT_PUBLIC_API_BASE=https://api.nexoraxs.com
```

For Windows 11 local development against the local Docker backend, copy `.env.local.example` to `.env.local` instead:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8080
NEXT_PUBLIC_SHOPS_APP_BASE=http://localhost:3001
```

## Local Run

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

## Local Backend Connection

Use this mode when the backend is already running locally through Docker on Windows 11.

1. Start the local backend stack first and verify:

```text
http://localhost:8080/api/health
```

2. In `apps/core-app`, copy:

```bash
.env.local.example -> .env.local
```

3. Install frontend dependencies:

```bash
npm install
```

4. Start the frontend:

```bash
npm run dev
```

5. In `apps/shops-app`, copy `.env.local.example` to `.env.local`, then run:

```bash
npm run dev
```

6. Open:

```text
http://localhost:3000/login
```

Expected browser behavior:
- `GET http://localhost:8080/sanctum/csrf-cookie` succeeds
- `POST http://localhost:8080/api/auth/login` succeeds after valid credentials
- `GET http://localhost:8080/api/auth/me` succeeds after login
- `GET http://localhost:8080/api/workspaces` succeeds after login
- `Open Shops` sends the selected workspace to `http://localhost:3001/w/{workspaceSlug}`

This local path is for backend connection verification only. It is not a production-equivalent secure cookie test.

## What The Frontend Calls

- `GET /sanctum/csrf-cookie`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/workspaces`
- `POST /api/workspaces`
- `GET /api/workspaces/{slug}`

The API client:
- always uses `credentials: include`
- reads `XSRF-TOKEN` from browser cookies
- sends `X-XSRF-TOKEN` on POST requests
- never stores auth tokens in `localStorage`
- never reads or accepts passwords from URL query params

Security rule:
- passwords must never be passed via URL query params
- only optional email prefill may use `?email=...`
- `/login` and `/register` automatically strip any other query params from the URL before rendering

## Manual Browser Test

Basic local smoke test for frontend rendering only:
1. Start this app with `npm run dev`.
2. Open `http://localhost:3000/login`.
3. Sign in with a valid backend user session.
4. Open `http://localhost:3000/dashboard`.
5. If the authenticated user has no workspaces yet, confirm the create-workspace form appears.
6. Submit a workspace `name` and `slug`.
7. Confirm the dashboard refreshes and shows the workspace list after creation.
8. Use this mode for UI checks only, not for final secure-cookie verification.

Local backend verification smoke test:
1. Confirm the backend health endpoint returns `{ "status": "ok", "app": "nexoraxs-api" }`.
2. Start `core-app` with `.env.local` pointing to `http://localhost:8080`.
3. Open `http://localhost:3000/login`.
4. In DevTools Network, confirm `GET /sanctum/csrf-cookie` is sent to `http://localhost:8080`.
5. Log in or register with a backend user.
6. Confirm `/api/auth/me` and `/api/workspaces` both return from `http://localhost:8080`.
7. Start `shops-app` on `http://localhost:3001` and confirm `Open Shops` routes to `http://localhost:3001/w/{workspaceSlug}` instead of the production domain.

## Production-Like HTTPS Test

Because the backend is configured for secure cookies on `.nexoraxs.com`, the real browser session test should use matching HTTPS subdomains.

Recommended local mapping:
1. Map both hosts to your machine in the hosts file:

```text
127.0.0.1 app.nexoraxs.com
127.0.0.1 api.nexoraxs.com
```

2. Serve the frontend through local HTTPS on `https://app.nexoraxs.com`.
3. Serve the Laravel backend through local HTTPS on `https://api.nexoraxs.com`.
4. Open `https://app.nexoraxs.com/login`.
5. In DevTools, verify:
   - `GET https://api.nexoraxs.com/sanctum/csrf-cookie` succeeds
   - browser cookies are set for the `.nexoraxs.com` domain
   - POST login/register requests include `X-XSRF-TOKEN`
   - `GET /api/auth/me` succeeds after login
   - `GET /api/workspaces` succeeds after login
   - `POST /api/workspaces` succeeds and the dashboard list refreshes
   - `/dashboard` redirects to `/login` when the session is missing

If you test only on plain `http://localhost:3000`, secure cookie behavior will not perfectly match production.
