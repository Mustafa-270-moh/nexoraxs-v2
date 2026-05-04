# Auth

## Required Auth Model

Authentication must use Laravel Sanctum cookie-based sessions only.

Not allowed:
- JWT for app authentication
- bearer tokens stored in the browser
- auth state stored in `localStorage`
- custom token refresh flows in frontend apps

## Why Sanctum Cookies

Sanctum with first-party cookies fits the architecture because:
- all frontend apps are first-party applications
- Laravel remains the single auth authority
- cookies reduce frontend token handling complexity
- session invalidation is centralized server-side

## Intended Flow

1. Frontend requests Sanctum CSRF cookie.
2. User submits credentials to the Laravel API.
3. Laravel creates a session and returns secure cookies.
4. Frontend apps call the API with `credentials: include`.
5. Laravel authorizes the request from the session and workspace membership.
6. Logout destroys the server-side session and clears cookies.

## Required Endpoints

Current auth foundation endpoints:
- `GET /sanctum/csrf-cookie`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Additional auth endpoints can be added later in small tasks.

## Current Auth API Behavior

- `POST /api/auth/register` creates a user in the default Laravel `users` table, hashes the password, and starts a cookie-backed session
- `POST /api/auth/login` authenticates the user against the default Laravel `users` table and starts a cookie-backed session
- `POST /api/auth/logout` destroys the current server-side session
- `GET /api/auth/me` returns the authenticated user from the current session

These endpoints do not implement workspaces, Shops, or billing concerns.

## Cookie Rules

- Set the session cookie on the parent domain
- Use `Secure` in production
- Prefer `SameSite=Lax` unless an explicit deployment need requires otherwise
- Keep Sanctum stateful domains aligned with all first-party app subdomains

## Frontend Rules

- Always send requests with credentials included
- Let the browser manage cookies
- Never persist auth secrets in client storage
- Treat `401` as an authentication problem
- Treat `403` as an authorization or workspace access problem

## Session Storage

Start with server-managed sessions backed by the database unless infrastructure later justifies Redis. The key constraint is server-side session authority, not a client token model.

## Default Users Table

The default Laravel `users` table remains during the foundation phase.

Why:
- Sanctum needs a first-party auth identity table from the start
- account ownership and workspace membership are separate concerns
- this allows auth bootstrap without prematurely designing the full user domain

More platform-specific tables such as `accounts`, `workspaces`, and `workspace_users` can grow around that auth base incrementally.

## Authorization Layers

Authentication answers:
- who is the user

Authorization answers:
- which workspaces the user can access
- which product areas the user can open
- which actions the user can perform inside a workspace

These checks must remain server-side.

## Admin App Rule

`admin-app` uses the same auth system, but access is restricted to internal staff roles. Customer workspace permissions alone must not grant access to admin routes.
