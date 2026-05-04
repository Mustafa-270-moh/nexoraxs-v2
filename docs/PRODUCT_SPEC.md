# Product Spec

## Purpose

NexoraXS is a multi-SaaS platform for small shops and retail businesses. V2 starts as a clean rebuild with a shared core platform and one product vertical: Shops.

This phase is for foundation and documentation only. It does not include feature implementation.

## Product Direction

The platform should support multiple SaaS products over time while keeping:
- a shared identity and workspace system
- shared billing and subscription concepts
- shared UI and layout primitives
- isolated product domains for each SaaS

Only these areas are in scope now:
- Core Platform
- Shops SaaS

These areas are explicitly out of scope now:
- Clinics
- Cars
- Maintenance
- Billing provider integration
- Native mobile apps
- Marketplace integrations

## Customer Profile

Primary target customers:
- independent shop owners
- small retail teams
- multi-branch small businesses

Primary user roles:
- owner
- manager
- cashier or operations staff

## Core Platform Scope

The Core Platform is responsible for:
- user identity
- login and logout
- workspace creation and switching
- workspace membership and roles
- shared navigation and account settings
- product access control between apps

The Core Platform is not responsible for product-specific workflows such as inventory or order handling. Those belong inside the Shops domain.

## Shops SaaS Scope

The initial product is Shops. Its future MVP should support the essential operational workflows a small shop needs to manage products, stock, customers, and sales activity.

Implementation is deferred, but the foundation must assume Shops will need:
- one workspace owning all shop data
- support for one or more stores per workspace later
- clear separation between platform data and shop domain data

## Product Principles

- Multi-tenant from day one
- Production-ready deployment assumptions from day one
- API-first backend
- Shared platform, isolated product domains
- Incremental delivery through small, testable tasks
- No legacy code migration by copy-paste

## Non-Negotiable Constraints

- Every tenant-owned table must include `workspace_id`
- Every workspace query must be scoped by `workspace_id`
- Auth must use Laravel Sanctum cookie-based sessions only
- JWT is not allowed for app auth
- `localStorage` must not be used for auth persistence

## Initial Success Criteria

This foundation phase is successful when:
- the monorepo structure is clear
- the platform boundaries are documented
- tenancy rules are explicit
- the auth model is fixed
- the future API and schema directions are clear enough for safe incremental coding
