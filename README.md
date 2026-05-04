# NexoraXS V2

NexoraXS V2 is a fresh monorepo foundation for a multi-SaaS platform built for small shops and retail businesses.

Current state:
- Documentation and directory foundation only
- No feature implementation yet
- No legacy code copied from the old project
- Initial product focus is the Core Platform plus the Shops SaaS

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

This repo is intentionally in a planning-first state. The next work should be small, testable bootstrap tasks that follow these docs exactly.
