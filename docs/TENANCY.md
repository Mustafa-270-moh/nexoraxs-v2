# Tenancy

## Tenant Model

A workspace is the tenant boundary for NexoraXS V2.

Each workspace:
- owns its product data
- has one or more members
- may gain access to one or more SaaS products later

The workspace is the unit of data isolation, authorization, billing, and product access.

## Isolation Strategy

V2 uses:
- one PostgreSQL database
- shared schema
- application-enforced tenant isolation through `workspace_id`

This is the default until scale or compliance requirements justify a different strategy.

## Mandatory Tenancy Rules

- Every tenant-owned table must include `workspace_id`
- Every workspace query must be scoped by `workspace_id`
- Every create operation for tenant-owned data must assign `workspace_id`
- Every update and delete for tenant-owned data must verify the current workspace context

These rules are not optional and should be enforced in tests.

## Workspace Resolution

Workspace context should be resolved from trusted request context such as:
- a workspace slug in the route
- an authenticated membership lookup

Do not trust raw client input as the final authority for workspace access.

## Preferred URL Shape

Frontend workspace routes should follow:
- `/w/{workspaceSlug}/...`

API workspace routes should follow:
- `/api/v1/workspaces/{workspaceSlug}/...`

The backend then resolves:
- workspace record
- membership
- permissions
- internal `workspace_id`

Current foundation note:
- the initial workspace management endpoints are implemented at `/api/workspaces` and `/api/workspaces/{slug}`
- the current `GET /api/workspaces/{slug}` lookup is membership-filtered so non-members receive `404`
- broader `/api/v1/workspaces/{workspaceSlug}/...` route versioning can still be introduced later

## Query Scoping Rules

Unsafe pattern:
- load a product or order by `id` alone

Safe pattern:
- load the product or order by `workspace_id` and `id`

If an entity has a slug, the safe lookup is still scoped:
- `workspace_id + slug`

## Cross-Workspace Access

Customer-facing apps must not perform cross-workspace queries in normal workflows.

If the same user belongs to multiple workspaces:
- they switch workspace explicitly
- each request runs under exactly one resolved workspace context

Current foundation behavior:
- first workspace creation can bootstrap an `accounts` row for the authenticated user if no owner-linked workspace account exists yet
- workspace creation always creates an `owner` membership in `workspace_users`

## Internal Admin Access

Cross-workspace access belongs only in internal admin tooling and must have:
- explicit internal authorization
- clear auditability
- separate endpoints or policies from customer-facing flows

## Testing Requirements

Every new workspace-owned endpoint or service should have tests for:
- access granted inside the correct workspace
- access denied outside the workspace
- attempts to forge a different workspace context
