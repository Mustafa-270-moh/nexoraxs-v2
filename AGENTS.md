# Agent Operating Guide

This repository is documentation-first. Treat it as a clean V2 foundation, not as a place to port code from the legacy NexoraXS project.

Before any code task:
1. Read `README.md`.
2. Read `docs/CODEX_RULES.md`.
3. Read the relevant domain docs for the requested task.
4. Confirm the requested change is still within the current scope.

Hard rules:
- Do not copy code from the old project.
- Do not implement broad features in one task.
- Do not build Clinics, Cars, Maintenance, or billing flows yet.
- Do not introduce JWT, bearer-token auth, or `localStorage` auth persistence.
- Use Laravel Sanctum cookies only.
- Every tenant-owned table must include `workspace_id`.
- Every workspace query must be scoped by `workspace_id`.
- Never trust a client-provided `workspace_id` without resolving workspace context server-side.

Current scope:
- Core Platform foundation
- Shops SaaS foundation
- Production-ready architecture decisions
- Documentation that is specific enough for safe incremental delivery

Task sizing rules:
- Prefer one bounded task per change.
- Each task must be testable in isolation.
- Each task should touch one concern at a time: auth, tenancy, schema, API contract, app shell, or deployment.
- If a request is too large, split it into smaller tasks first.

Definition of done for future code tasks:
- The change stays inside current product scope.
- The change follows the architecture and data rules in `docs/`.
- Tests cover the new behavior or invariant.
- Documentation is updated if the decision surface changes.

If documentation and implementation ever conflict, update the documentation first or pause and clarify before coding.
