# Roadmap

## Phase 0: Documentation Foundation

Goal:
- define the V2 product, architecture, tenancy, auth, API, testing, and deployment rules

Status:
- complete in this repo state

## Phase 1: Monorepo Bootstrap

Recommended next tasks:
1. scaffold the Laravel backend application in `backend/`
2. scaffold the four Next.js apps in `apps/`
3. set up workspace tooling and package management
4. add basic CI for install, lint, and tests

Each of these should be its own small task.

## Phase 2: Core Platform Foundation

Expected slices:
1. Sanctum auth bootstrap
2. user, workspace, and membership schema
3. workspace resolution middleware or service
4. shared frontend auth package
5. core app authenticated shell
6. workspace switcher package

## Phase 3: Shops Foundation

Expected slices:
1. Shops access gating
2. Shops schema foundation
3. Shops API namespace
4. Shops app shell and navigation
5. first narrow domain slice, such as stores or products

## Phase 4: Production Hardening

Expected slices:
1. deployment manifests and environment setup
2. health checks
3. logging and monitoring
4. backup and restore validation
5. security review of auth and tenant isolation

## Phase 5: Billing and Additional SaaS Products

Only after the core platform and Shops are stable:
1. billing and entitlements
2. additional SaaS products
3. more advanced reporting and integrations

## Sequencing Rules

- Finish platform identity and tenancy before product features
- Finish Shops before adding other product verticals
- Prefer many small merges over a few large merges
- Keep every task independently testable
