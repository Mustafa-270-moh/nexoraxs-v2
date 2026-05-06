# NexoraXS V2

NexoraXS V2 is a fresh monorepo foundation for a multi-SaaS platform built for small shops and retail businesses.

Current state:
- Laravel backend foundation is implemented
- Sanctum cookie-based Auth API is implemented
- Workspace API foundation is implemented
- Shops access backend foundation is implemented
- `core-app` auth and workspace dashboard foundation is implemented
- Shared package foundations are implemented
- Docker deployment foundation for the API stack is implemented
- No legacy code copied from the old project
- Initial product focus is the Core Platform plus the Shops SaaS

Implemented phases so far:
- Laravel API scaffold with PostgreSQL-first configuration
- Sanctum cookie/session auth endpoints: register, login, logout, me
- Core platform database foundation for accounts, products, plans, subscriptions, workspaces, and workspace users
- Workspace API endpoints: list, create, show
- `apps/core-app` login, register, session-aware dashboard, workspace list, and workspace creation UI
- backend Shops access endpoints for workspace app access and Shops subscription context
- minimal shared packages for API transport, auth, UI, layout, and workspace helpers
- Docker Compose stack for backend, PostgreSQL, Redis, and Nginx

Still not implemented:
- Shops business features
- invitations
- billing
- extra SaaS verticals
- legacy system parity beyond the documented foundation slices

Core constraints:
- Backend: Laravel API
- Frontend: Next.js apps
- Database: PostgreSQL
- Auth: Laravel Sanctum cookie-based authentication only
- Payments: explicitly deferred
- Deployment: production-ready from day one

Non-negotiable rules:
- Every tenant-owned table must include `workspace_id`
- Every workspace query must be scoped by `workspace_id`
- Never use JWT for app auth
- Never store auth state in `localStorage`
- Build Clinics, Cars, and Maintenance later, not now

Repository layout:

```text
nexoraxs-v2/
  docs/
  backend/
  apps/
    www-app/
    core-app/
    shops-app/
    admin-app/
  packages/
    ui-kit/
    api-client/
    app-layout/
    auth/
    workspace-switcher/
  infra/
```

Shared package foundations:
- `packages/api-client`: shared browser-first API transport, CSRF bootstrap, credentials handling, and JSON parsing
- `packages/auth`: typed Sanctum auth helpers built on top of `api-client`
- `packages/ui-kit`: minimal shared presentational primitives such as buttons, cards, and inputs
- `packages/app-layout`: minimal authenticated shell components for future frontend apps
- `packages/workspace-switcher`: lightweight workspace types and helper utilities only, not a full switcher UI yet

Current package note:
- these packages are intentionally minimal
- they define future reuse boundaries without pulling Shops or billing logic into shared code
- existing app code does not need to move into them all at once

Read this order before making code changes:
1. `AGENTS.md`
2. `docs/CODEX_RULES.md`
3. `docs/PRODUCT_SPEC.md`
4. `docs/ARCHITECTURE.md`
5. The domain-specific doc related to the task

Document map:
- `docs/PRODUCT_SPEC.md`: product scope and operating boundaries
- `docs/ARCHITECTURE.md`: monorepo and runtime design
- `docs/DATABASE.md`: database conventions and initial data model
- `docs/AUTH.md`: Sanctum-only authentication strategy
- `docs/TENANCY.md`: workspace isolation rules
- `docs/BILLING.md`: future billing direction, not implementation
- `docs/SHOPS_MVP.md`: Shops product scope and staged delivery
- `docs/API.md`: API contract conventions
- `docs/TESTING.md`: required testing approach
- `docs/DEPLOYMENT.md`: production readiness baseline
- `docs/ROADMAP.md`: sequencing for future work
- `docs/CODEX_RULES.md`: execution rules for AI agents

This repo is intentionally still in a foundation-first state. The next work should remain small, testable, and aligned with the docs before any Shops business features are added.

Deployment note:
- the current Docker deployment foundation targets the backend/API stack only
- start with `infra/windows/Start-NexoraXs.ps1` after completing `docs/DEPLOYMENT.md`

Local Windows 11 note:
- for local Docker Desktop + WSL2 development, read `docs/LOCAL_WINDOWS_DOCKER.md`
- local startup uses `infra/windows/Start-NexoraXs-Local.ps1`
