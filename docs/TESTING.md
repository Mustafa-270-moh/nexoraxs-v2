# Testing

## Testing Principle

Every future code task must be small enough to test in isolation.

If a requested change cannot be verified by a focused test or a very small test set, the change is too large and should be split.

## Test Layers

### Backend

Recommended backend testing layers:
- unit tests for pure rules and policies
- feature tests for HTTP endpoints, auth, and tenancy
- integration tests for database-backed flows where needed

Preferred default for Laravel:
- Pest or PHPUnit, chosen once during scaffold work and then kept consistent

### Frontend Apps

Recommended frontend testing layers:
- component tests for shared UI behavior
- route or page tests for app-shell logic
- end-to-end smoke tests for critical auth and workspace journeys later

Recommended defaults:
- Vitest for package and component-level tests
- Playwright for cross-app browser flows

## Mandatory Invariants to Test

Every workspace-owned feature should have tests for:
- correct access inside the current workspace
- denied access outside the workspace
- rejected attempts to spoof another workspace

Every auth-related feature should have tests for:
- login success and failure
- logout
- unauthenticated access rejection
- authenticated identity fetch

## Test Requirements by Change Type

Schema change:
- migration test or database assertion where practical

API change:
- request validation test
- auth or tenancy test
- happy-path response test

Frontend auth change:
- cookie-session behavior verification
- unauthenticated redirect or session-expiry handling

Shared package change:
- focused unit or component tests

## CI Expectation

The repo should eventually run:
- backend tests
- package tests
- app tests as they are added
- linting and type checks

Preview environments and smoke checks should be added as the runtime scaffold appears.

## Current Scope

No tests are implemented yet because no runtime code exists in V2 yet. This document defines the minimum standard future tasks must satisfy.
