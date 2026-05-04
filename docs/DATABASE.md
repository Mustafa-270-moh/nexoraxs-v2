# Database

## Database Strategy

PostgreSQL is the source of truth for platform and tenant data. V2 uses a single database with logical tenant isolation enforced by application rules and schema conventions.

## Core Conventions

- Use PostgreSQL for all primary relational data
- Prefer `ulid` or UUID-style string identifiers for external-facing entities
- Keep `created_at` and `updated_at` on most tables
- Use `deleted_at` only when soft delete behavior is justified
- Store money in integer minor units
- Use `jsonb` only for bounded extension data, not core relational structure

## Tenant Isolation Rule

Every tenant-owned table must include:
- `workspace_id`

Every workspace-owned query must be scoped by:
- `workspace_id`

This rule applies even when another foreign key seems sufficient. A row belongs to a workspace explicitly, not implicitly.

## Global Tables

Global tables do not require `workspace_id` because they are platform-owned.

Expected global tables:
- `users`
- `accounts`
- `products`
- `plans`
- `subscriptions`
- `workspaces`
- `workspace_users`
- `password_reset_tokens` or equivalent
- `sessions`
- `personal_access_tokens` used by Sanctum internals if needed

## Auth Foundation Note

The default Laravel `users` table remains in place during the foundation phase.

Why:
- Sanctum session auth needs a stable first-party identity table immediately
- account and workspace structure can evolve without blocking auth bootstrap
- this keeps auth foundation separate from later domain-specific user expansion

The `users` table is not a substitute for tenant-owned domain tables. It is the global auth identity base for the platform.

## Account and Subscription Readiness Tables

These platform-owned tables prepare the repo for Core Platform access and Shops subscription readiness:
- `accounts`
- `products`
- `plans`
- `subscriptions`
- `workspaces`
- `workspace_users`

`subscriptions` are account-owned platform records, not workspace-owned product data. Therefore they do not include `workspace_id`.

## Tenant-Owned Tables

Expected tenant-owned tables for future work include:
- `workspace_settings`
- `shop_stores`
- `shop_categories`
- `shop_products`
- `shop_customers`
- `inventory_items`
- `stock_movements`
- `shop_orders`
- `shop_order_items`

All of these must include `workspace_id`.

## Required Column Pattern

Tenant-owned tables should generally include:
- `id`
- `workspace_id`
- domain-specific foreign keys
- timestamps
- audit fields later when needed

If an entity is addressable by humans in URLs or admin screens, add a stable slug or code only when justified by product requirements.

## Indexing Rules

Every tenant-owned table should have:
- an index on `workspace_id`
- composite indexes that start with `workspace_id` for common lookups

Examples:
- `(workspace_id, slug)`
- `(workspace_id, status)`
- `(workspace_id, created_at)`

This keeps tenant queries fast and reduces the risk of accidental cross-tenant scans.

## Foreign Key Guidance

Use foreign keys wherever practical. For tenant-owned relationships:
- child rows must reference parents in the same workspace
- validation and persistence logic must reject cross-workspace links

When useful, enforce uniqueness inside a workspace instead of globally.

Examples:
- product SKU unique per workspace, not globally
- store slug unique per workspace, not globally

## Migration Rules

- Create tables with `workspace_id` from the first migration, not as a later patch
- Avoid polymorphic shortcuts unless the tradeoff is clearly worth it
- Prefer additive migrations
- Never combine many unrelated schema changes in one task

## Initial Data Model Priorities

The first implementation slices should likely establish:
1. users for Sanctum auth foundation
2. accounts
3. products and plans
4. workspaces
5. workspace_users
6. subscriptions

Tenant-owned Shops tables come after the platform identity, access, and subscription base is stable.
