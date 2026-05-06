# NexoraXS Shops App

Minimal placeholder shell for `shops.nexoraxs.com`.

Current scope:
- workspace-aware Shops entry route
- Shops onboarding mode selection
- placeholder Shops dashboard
- browser-to-Laravel Sanctum session auth

Out of scope in this phase:
- products
- inventory
- sales
- invoices
- customers
- suppliers
- expenses
- reports
- branches
- online store implementation
- orders
- payments
- shipping

## Environment

Production-like example:

```bash
NEXT_PUBLIC_API_BASE=https://api.nexoraxs.com
NEXT_PUBLIC_CORE_APP_BASE=https://app.nexoraxs.com
```

Local example:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8080
NEXT_PUBLIC_CORE_APP_BASE=http://localhost:3000
```

## Local Run

1. Copy `.env.local.example` to `.env.local`
2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3001
```

## Workspace Route

The current placeholder route is:

```text
/w/{workspaceSlug}
```

Example:

```text
http://localhost:3001/w/blue-market
```

## Local Backend Requirement

If your local backend Docker env file was created before `shops-app` existed, add these origins to `.env.local.docker` and restart the backend stack:

```text
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000,localhost:3001,127.0.0.1:3001,localhost:8080,127.0.0.1:8080
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:8080,http://127.0.0.1:8080
```
