# Codex Rules

## Purpose

This file defines how AI agents should work inside `nexoraxs-v2/`.

## Read Order Before Coding

1. `README.md`
2. `AGENTS.md`
3. `docs/PRODUCT_SPEC.md`
4. `docs/ARCHITECTURE.md`
5. the domain-specific doc for the task

## Hard Rules

- Do not copy code from the old NexoraXS project.
- Do not implement broad features in one task.
- Do not add Clinics, Cars, Maintenance, or billing flows yet.
- Do not use JWT for app auth.
- Do not store auth state in `localStorage`.
- Use Laravel Sanctum cookies only.
- Every tenant-owned table must include `workspace_id`.
- Every workspace query must be scoped by `workspace_id`.
- Never trust client-supplied workspace identity as the source of truth.

## Scope Rules

In the current phase, allowed work is limited to:
- project scaffolding
- architecture and config foundations
- auth foundation
- tenancy foundation
- shared package foundations
- deployment and CI foundations
- documentation updates

Not allowed in one jump:
- full Shops implementation
- billing integration
- extra SaaS verticals
- large repo-wide refactors without a documented reason

## Task Sizing Rules

Every task should be:
- small
- reviewable
- testable
- scoped to one concern

Good task examples:
- scaffold Laravel app and confirm it boots
- add workspace and membership migrations
- scaffold `core-app` and wire a health page
- add shared auth package interfaces

Bad task examples:
- build the whole Core Platform
- implement all Shops features
- create billing, subscriptions, and payments together

## Required Implementation Behavior

- Keep backend business rules in Laravel, not in frontend apps
- Keep frontend packages small and reusable
- Resolve workspace context server-side
- Use additive schema changes
- Add or update tests for any new runtime behavior
- Update docs when a decision boundary changes

## If a Request Is Too Large

Do not improvise a giant implementation. Split it into smaller tasks and finish the smallest correct next slice.

## If Docs Conflict With a Request

Pause and update the docs or clarify the change before writing code.

## Definition of Done

A future code task is done only when:
- it stays within documented scope
- it respects auth and tenancy rules
- it includes focused verification
- it leaves the repo easier for the next agent to continue safely
