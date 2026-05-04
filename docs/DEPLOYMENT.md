# Deployment

## Goal

NexoraXS V2 should be production-ready from day one in architecture, even if initial implementation starts small.

Production-ready means:
- environment separation is planned up front
- apps and API are deployable independently
- secrets, TLS, and backups are part of the design
- health checks and monitoring are expected, not optional

## Runtime Units

Expected deployable units:
- Laravel API
- `www-app`
- `core-app`
- `shops-app`
- `admin-app`
- PostgreSQL database

## Environment Model

Planned environments:
- local
- preview
- staging
- production

Staging should mirror production closely enough to validate auth cookies, domain routing, migrations, and app-to-API behavior.

## Domain Strategy

Assumed first-party domains:
- `www.<base-domain>`
- `core.<base-domain>`
- `shops.<base-domain>`
- `admin.<base-domain>`
- `api.<base-domain>`

This layout supports:
- product separation
- centralized backend auth
- shared parent-domain cookies

## Infrastructure Baseline

The `infra/` directory should later contain:
- Docker definitions
- CI pipeline configuration
- deployment manifests or infrastructure-as-code
- operational runbooks
- environment templates

The exact vendor can change, but these responsibilities should remain.

## Database and Migration Rules

- Use managed PostgreSQL in production
- Run migrations as an explicit deployment step
- Back up the database automatically
- Test restore procedures early
- Never bundle risky multi-domain schema changes into one release

## Security Baseline

- HTTPS everywhere in non-local environments
- secure cookie configuration in production
- secrets stored in a secret manager, not committed
- least-privilege access for infra and admin tools

## Observability Baseline

Plan for:
- centralized application logs
- error tracking
- uptime monitoring
- basic performance visibility

This should cover both the API and the frontend apps.

## Release Strategy

Prefer small releases that:
- change one layer at a time when possible
- keep migrations additive
- allow rollback of app code independently from data shape where feasible

## Current Scope

This is a deployment blueprint only. No deployment code or provider-specific configuration is being added in this phase.
