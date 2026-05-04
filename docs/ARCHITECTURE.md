# Architecture

## High-Level Overview

NexoraXS V2 is a monorepo with one Laravel API backend, multiple Next.js frontend apps, shared packages, and infrastructure definitions.

```text
Browser
  -> Next.js app
  -> Laravel API
  -> PostgreSQL
```

All authenticated product data flows through the Laravel API. Frontend apps do not access the database directly.

## Repository Boundaries

### `backend/`

Laravel API application for:
- authentication with Sanctum
- workspace resolution and authorization
- shared platform APIs
- product APIs for Shops
- background jobs and integrations later

### `apps/www-app/`

Public marketing and entry app for:
- landing pages
- pricing content later
- sign-in or sign-up entry points

### `apps/core-app/`

Authenticated platform shell for:
- account management
- workspace switching
- product access and navigation
- shared settings surfaces

### `apps/shops-app/`

Authenticated Shops product app for workspace-scoped retail workflows.

### `apps/admin-app/`

Internal operations app for the NexoraXS team. This is not a customer-facing tenant app. It may inspect cross-workspace data later under stricter authorization and audit rules.

### `packages/ui-kit/`

Shared presentational components, tokens, and primitives.

### `packages/api-client/`

Typed API client utilities shared by frontend apps.

### `packages/app-layout/`

Shared application shell and navigation framework.

### `packages/auth/`

Shared frontend auth helpers built around Sanctum cookies.

### `packages/workspace-switcher/`

Shared workspace context selector and related utilities.

### `infra/`

Deployment, containerization, CI, environment templates, and future infrastructure-as-code.

## Architectural Principles

- Monorepo with clear ownership boundaries
- Backend owns business rules and data access
- Frontend apps are thin clients plus server-rendered shells
- Shared packages stay small and generic
- Product domains stay isolated from one another
- Production and local environments should be structurally similar

## Multi-App Strategy

Separate Next.js apps are preferred over a single mega-app because they:
- keep public and authenticated concerns separated
- allow product-specific UX and deployment scaling
- reduce accidental coupling between platform and product code

## Auth and Session Topology

Auth is centralized in Laravel using Sanctum cookies.

Assumed domain model:
- `www.<base-domain>`
- `core.<base-domain>`
- `shops.<base-domain>`
- `admin.<base-domain>`
- `api.<base-domain>`

Cookies should be issued for the parent domain so authenticated frontend apps can call the API with `credentials: include`.

## Workspace Context Flow

The frontend route carries a workspace slug where relevant.

Example UI route:
- `/w/{workspaceSlug}/...`

The backend resolves the workspace from trusted route context, loads membership and permissions, and converts that context into `workspace_id` for all tenant queries.

The client must never be the source of truth for workspace ownership.

## Backend Domain Layout

Suggested backend domain split:
- Platform: users, workspaces, memberships, auth, product access
- Shops: stores, catalog, inventory, customers, orders, reporting later
- Billing: reserved for later

This split is conceptual for now. Code structure can follow it during implementation, but only through small tasks.

## Deployment Topology

Expected production shape:
- one deployed Laravel API service
- four deployed Next.js apps
- one managed PostgreSQL database
- shared TLS, DNS, and secret management
- centralized logs and monitoring

The exact hosting vendor can vary, but the runtime boundaries should remain stable.
