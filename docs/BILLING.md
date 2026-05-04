# Billing

## Status

Billing is intentionally deferred. No payment provider integration should be implemented in the current phase.

## Why This Doc Exists Now

Billing affects platform design even before implementation because:
- subscriptions are attached to workspaces
- product access may depend on plan state later
- invoice and payment history will influence admin tooling

The goal now is to reserve clean architecture space without building billing flows prematurely.

## Future Billing Boundary

Billing should eventually own:
- plans
- subscriptions
- plan entitlements
- invoices
- payment events
- billing-related audit data

## Billing Ownership Model

Billing is workspace-based, not user-based.

One workspace should have:
- one active subscription per product bundle at a time
- one billing owner or billing permission role

## Current Rules

- Do not integrate Stripe or any payment gateway yet
- Do not add checkout UI yet
- Do not block core platform scaffolding on billing implementation
- Do not leak billing assumptions into product domain tables

## Design Constraints for Later

- Product access should be controlled by platform entitlements, not hard-coded app checks
- Billing events should update entitlement state asynchronously when implemented
- Billing data should remain platform-level, not embedded inside Shops tables

## Suggested Future Tables

Likely future global tables:
- `plans`
- `plan_features`
- `subscriptions`
- `subscription_items`
- `invoices`
- `payment_events`

These are platform-owned tables and therefore do not need `workspace_id` on every row if the workspace relationship is direct and singular. The relationship to workspace must still be explicit.

## Current Implementation Direction

For now, only document billing boundaries and keep the Core Platform able to add entitlements later without major redesign.
