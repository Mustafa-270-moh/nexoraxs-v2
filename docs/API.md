# API

## API Style

The backend is a Laravel JSON API. Frontend apps should communicate with it over HTTPS using first-party cookies.

Foundational conventions:
- REST-style endpoints
- JSON request and response bodies
- versioned under `/api/v1`
- workspace-aware routes for tenant-owned resources

## Authentication Contract

Auth relies on Sanctum cookies and CSRF protection.

Baseline auth endpoints:
- `GET /sanctum/csrf-cookie`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Frontend requests must include credentials.

## Route Shape

Platform-level examples:
- `GET /api/auth/me`
- `GET /api/workspaces`

Workspace-scoped examples:
- `GET /api/v1/workspaces/{workspaceSlug}/settings`
- `GET /api/v1/workspaces/{workspaceSlug}/shops/products`
- `POST /api/v1/workspaces/{workspaceSlug}/shops/orders`

The route carries workspace context. The backend resolves `workspace_id` internally before any tenant query runs.

Current foundation note:
- the auth API is currently implemented under `/api/auth/*`
- the workspace foundation API is currently implemented under `/api/workspaces*`
- broader API versioning can still be introduced later without changing the Sanctum cookie/session model

## Current Workspace Foundation Endpoints

These workspace endpoints are implemented in the current foundation phase:

- `GET /api/workspaces`
- `POST /api/workspaces`
- `GET /api/workspaces/{slug}`

Current behavior:
- all workspace endpoints require Sanctum session authentication
- `POST /api/workspaces` accepts `name` and `slug`
- workspace creation uses the current authenticated user only
- if the user does not yet own an account through an existing workspace, the backend creates one during first workspace creation
- workspace reads are membership-scoped
- `GET /api/workspaces/{slug}` returns `404` when the current user does not belong to that workspace

## Response Shape

Success responses should follow one of these patterns:

Single resource:

```json
{
  "message": "Human-readable summary",
  "data": {}
}
```

Collection:

```json
{
  "data": [],
  "meta": {}
}
```

Validation or business errors:

```json
{
  "message": "Human-readable summary",
  "errors": {},
  "code": "OPTIONAL_MACHINE_CODE"
}
```

## Pagination

List endpoints should return:
- `data`
- `meta`
- `links` when useful

Pagination behavior should be consistent across all workspace resources.

## Authorization Rules

- `401` means unauthenticated
- `403` means authenticated but not allowed
- `404` can be used when hiding existence is safer than revealing cross-workspace records

Do not return tenant data unless the resolved workspace and membership checks pass.

## Input Rules

- Never accept raw `workspace_id` from the client as the authority for tenant scoping
- Prefer route context over custom tenant headers
- Validate payloads at the API edge
- Keep business rules inside backend services, actions, or domain layers

## Versioning Rule

Start with `/api/v1`. Breaking contract changes should create a new version or a carefully managed migration path rather than silent behavior changes.

## Current Scope

This doc defines the contract style only. It does not require implementing the full API surface now.
