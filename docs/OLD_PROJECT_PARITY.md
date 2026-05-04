# Old Project Parity

## Purpose

This document translates the old NexoraXS audit into V2 parity guidance.

Source:
- `D:\nexoraxs\nexoraxs-old\docs\RESTRUCTURE_AUDIT.md`

Rules:
- old code is reference only
- do not copy old code into V2
- parity means re-implementing behavior intentionally, not porting files
- V2 scope remains Core Platform + Shops only

## 1. Behaviors To Re-Implement In V2

These behaviors are worth rebuilding in V2 because they align with the V2 product direction.

### Auth Foundation

- Sanctum cookie-based SPA auth
  - old reference:
    - `nexoraxs-old/backend/app/Http/Controllers/Api/AuthController.php`
    - `nexoraxs-old/backend/config/cors.php`
    - `nexoraxs-old/backend/config/sanctum.php`
- CSRF-first browser auth flow
  - old reference:
    - `nexoraxs-old/apps/core-app/src/lib/api.ts`
- `/me` session introspection for the authenticated shell
  - old reference:
    - `nexoraxs-old/backend/app/Http/Controllers/Api/AuthController.php`

### Workspace Foundation

- workspace list for current user
  - old reference:
    - `nexoraxs-old/backend/app/Http/Controllers/Api/WorkspaceController.php`
- workspace creation with owner membership
  - old reference:
    - `nexoraxs-old/backend/app/Application/Workspaces/ProvisionWorkspaceAction.php`
    - `nexoraxs-old/backend/app/Http/Controllers/Api/WorkspaceController.php`
- workspace membership roles
  - old reference:
    - `nexoraxs-old/backend/database/migrations/2026_02_17_210000_upgrade_workspace_users_for_rbac.php`
    - `nexoraxs-old/backend/config/roles.php`
- workspace invitation issue/accept/revoke flow
  - old reference:
    - `nexoraxs-old/backend/app/Application/Invitations/InviteUserToWorkspaceAction.php`
    - `nexoraxs-old/backend/app/Http/Controllers/Api/WorkspaceInvitationController.php`

### Tenancy And Scoping

- route-driven workspace resolution
  - old reference:
    - `nexoraxs-old/backend/app/Application/Workspaces/ResolveWorkspace.php`
    - `nexoraxs-old/backend/app/Http/Middleware/ResolveWorkspaceFromSlug.php`
- trusted request context object
  - old reference:
    - `nexoraxs-old/backend/app/Support/RequestContext.php`
- strict `workspace_id` query scoping for tenant-owned data
  - old reference:
    - `nexoraxs-old/backend/app/Http/Controllers/Api/CustomerController.php`
    - `nexoraxs-old/backend/app/Http/Controllers/Api/ItemController.php`
    - `nexoraxs-old/backend/app/Http/Controllers/Api/InvoiceController.php`
    - `nexoraxs-old/backend/app/Http/Controllers/Api/PaymentController.php`

### Shops Access Foundation

- product access gating for Shops
  - old reference:
    - `nexoraxs-old/apps/shops-app/src/lib/shops-access.ts`
    - `nexoraxs-old/apps/shops-app/src/components/ShopsGuard.tsx`
- product context resolution for Shops requests
  - old reference:
    - `nexoraxs-old/backend/app/Application/Workspaces/ResolveProduct.php`
    - `nexoraxs-old/backend/app/Http/Controllers/Api/ShopContextController.php`
- workspace-aware Shops shell routes
  - old reference:
    - `nexoraxs-old/apps/shops-app/src/app/w/[workspaceSlug]/`

### Shared Frontend Shell Behaviors

- authenticated app shell with shared navigation
  - old reference:
    - `nexoraxs-old/packages/app-layout/DashboardLayout.tsx`
- workspace switcher behavior
  - old reference:
    - `nexoraxs-old/packages/workspace-switcher/WorkspaceSwitcher.tsx`
    - `nexoraxs-old/packages/workspace-switcher/useWorkspaces.ts`
- shared UI primitives for cards, buttons, empty states, system states
  - old reference:
    - `nexoraxs-old/packages/ui-kit/`

## 2. Behaviors To Drop

These old behaviors should not be recreated in V2.

- Firebase login/linking flow
  - old reference:
    - `nexoraxs-old/backend/app/Http/Controllers/Auth/FirebaseAuthController.php`
    - `nexoraxs-old/backend/app/Services/FirebaseAuthService.php`
- Firebase phone verification dependency
  - old reference:
    - `nexoraxs-old/backend/app/Http/Middleware/VerifyFirebaseIdToken.php`
    - `nexoraxs-old/apps/core-app/src/app/verify-phone/`
- social auth redirects and callbacks
  - old reference:
    - `nexoraxs-old/backend/app/Http/Controllers/Api/SocialAuthController.php`
- legacy SMS OTP and email OTP auth flows
  - old reference:
    - `nexoraxs-old/backend/app/Http/Controllers/Api/PhoneVerificationController.php`
    - `nexoraxs-old/backend/app/Http/Controllers/Auth/EmailOtpController.php`
    - `nexoraxs-old/backend/database/migrations/2026_02_05_170000_create_email_otps_table.php`
- legacy `/api/shops/*` and `/api/restaurants/*` compatibility routes
  - old reference:
    - `nexoraxs-old/backend/routes/api_shops_v2.php`
    - `nexoraxs-old/backend/routes/api_restaurants_v2.php`
    - `nexoraxs-old/backend/config/legacy_api.php`
- old platform bridge based on `tenants` + `workspace_apps` as the long-term model
  - old reference:
    - `nexoraxs-old/backend/database/migrations/2026_02_02_184019_create_tenants_table.php`
    - `nexoraxs-old/backend/database/migrations/2026_02_02_184027_create_workspace_apps_table.php`
    - `nexoraxs-old/backend/app/Application/Plans/SubscriptionResolver.php`
- OS onboarding shell and OS-specific routes
  - old reference:
    - `nexoraxs-old/apps/core-app/src/app/os/`
    - `nexoraxs-old/packages/os-onboarding/`
- duplicated product-specific session guards for V2 auth foundation
  - old reference:
    - `nexoraxs-old/backend/config/auth.php`

## 3. Behaviors To Defer

These may matter later, but they are not part of the current V2 implementation scope.

- billing provider integration and checkout
  - old reference:
    - `nexoraxs-old/apps/core-app/src/app/billing/overview/page.tsx`
    - `nexoraxs-old/apps/core-app/src/app/billing/plans/page.tsx`
- admin metrics and cross-workspace operational views
  - old reference:
    - `nexoraxs-old/apps/admin-app/src/lib/admin-data.ts`
    - `nexoraxs-old/apps/admin-app/src/app/metrics/page.tsx`
- one-time SSO issue/consume between platform and product apps
  - old reference:
    - `nexoraxs-old/backend/app/Application/SSO/IssueSsoTokenAction.php`
    - `nexoraxs-old/backend/app/Application/SSO/ConsumeSsoTokenAction.php`
    - `nexoraxs-old/backend/app/Http/Controllers/Api/WorkspaceSsoController.php`
- full workspace team management UI
  - old reference:
    - `nexoraxs-old/packages/team/`
- profile/settings shell richness beyond the basic core shell
  - old reference:
    - `nexoraxs-old/packages/settings-ui/`
    - `nexoraxs-old/apps/core-app/src/app/settings/page.tsx`
- advanced Shops reports
  - old reference:
    - `nexoraxs-old/apps/shops-app/src/app/w/[workspaceSlug]/shops/reports/`
- invoices and payments
  - old reference:
    - `nexoraxs-old/backend/app/Http/Controllers/Api/InvoiceController.php`
    - `nexoraxs-old/backend/app/Http/Controllers/Api/PaymentController.php`

## 4. Tests From Old Repo To Recreate In V2

Recreate these as V2-focused tests, not file copies.

### High Priority

- auth session flow
  - old reference:
    - `nexoraxs-old/backend/tests/Feature/AuthSessionTest.php`
- workspace onboarding/create flow
  - old reference:
    - `nexoraxs-old/backend/tests/Feature/WorkspaceOnboardingTest.php`
- workspace roles foundation
  - old reference:
    - `nexoraxs-old/backend/tests/Feature/WorkspaceRolesFoundationTest.php`
- workspace invitations
  - old reference:
    - `nexoraxs-old/backend/tests/Feature/WorkspaceInvitationsTest.php`
    - `nexoraxs-old/backend/tests/Feature/WorkspaceInvitationAcceptTest.php`
- workspace switcher `/me` contract expectations
  - old reference:
    - `nexoraxs-old/backend/tests/Feature/WorkspaceSwitcherMeContractTest.php`
- plan/subscription guard behavior at service level
  - old reference:
    - `nexoraxs-old/backend/tests/Unit/PlanGuardTest.php`

### Shops Priority

- workspace isolation for Shops resources
  - old reference:
    - `nexoraxs-old/backend/tests/Feature/ShopBranchWorkspaceIsolationTest.php`
    - `nexoraxs-old/backend/tests/Feature/ShopWorkspaceGuardTest.php`
- Shops branch/store limits
  - old reference:
    - `nexoraxs-old/backend/tests/Feature/ShopBranchLimitEnforcementTest.php`
    - `nexoraxs-old/backend/tests/Feature/ShopUserLimitEnforcementTest.php`
- Shops owner/admin restrictions
  - old reference:
    - `nexoraxs-old/backend/tests/Feature/ShopOnlyOwnerCanCreateUsersTest.php`
- canonical route parity
  - old reference:
    - `nexoraxs-old/backend/tests/Feature/CanonicalProductRoutesTest.php`

### Frontend Utility Priority

- safe redirect / safe `next` parameter handling
  - old reference:
    - `nexoraxs-old/apps/core-app/src/lib/sanitizeNext.test.ts`
- workspace slug selection logic
  - old reference:
    - `nexoraxs-old/apps/core-app/src/lib/resolveInitialWorkspaceSlug.test.ts`
- layout navigation rules
  - old reference:
    - `nexoraxs-old/packages/app-layout/nav.config.test.ts`

## 5. Old Files Used As Reference Only

These files are allowed as behavior references only.

### Architecture And Audit

- `nexoraxs-old/docs/RESTRUCTURE_AUDIT.md`
- `nexoraxs-old/docs/architecture/target-platform-architecture.md`
- `nexoraxs-old/docs/decisions/ADR-0001-platform-product-boundaries.md`
- `nexoraxs-old/docs/decisions/ADR-0002-product-user-isolation.md`
- `nexoraxs-old/docs/decisions/ADR-0003-plan-guard-and-subscriptions.md`

### Backend Contracts

- `nexoraxs-old/backend/app/Application/Plans/PlanGuard.php`
- `nexoraxs-old/backend/app/Application/Plans/SubscriptionResolver.php`
- `nexoraxs-old/backend/app/Application/Workspaces/ResolveWorkspace.php`
- `nexoraxs-old/backend/app/Application/Workspaces/ResolveProduct.php`
- `nexoraxs-old/backend/app/Application/Invitations/InviteUserToWorkspaceAction.php`
- `nexoraxs-old/backend/app/Application/SSO/IssueSsoTokenAction.php`
- `nexoraxs-old/backend/app/Application/SSO/ConsumeSsoTokenAction.php`

### Backend Runtime Examples

- `nexoraxs-old/backend/app/Http/Controllers/Api/AuthController.php`
- `nexoraxs-old/backend/app/Http/Controllers/Api/WorkspaceController.php`
- `nexoraxs-old/backend/app/Http/Controllers/Api/WorkspaceInvitationController.php`
- `nexoraxs-old/backend/app/Http/Controllers/Api/ShopContextController.php`
- `nexoraxs-old/backend/app/Http/Controllers/Api/StoreController.php`

### Frontend Reference Files

- `nexoraxs-old/apps/core-app/src/lib/api.ts`
- `nexoraxs-old/packages/workspace-api/api.ts`
- `nexoraxs-old/packages/workspace-switcher/`
- `nexoraxs-old/packages/app-layout/`
- `nexoraxs-old/packages/ui-kit/`
- `nexoraxs-old/apps/shops-app/src/lib/shops-access.ts`
- `nexoraxs-old/apps/shops-app/src/components/ShopsGuard.tsx`

## 6. Shops MVP Parity Checklist

This is the V2 parity target for the first Shops release. It is a checklist, not authorization to build everything at once.

### Core Platform Dependencies

- [ ] Sanctum auth endpoints are stable in V2 backend
- [ ] core-app can register, login, logout, and fetch `/api/auth/me`
- [ ] workspace schema exists in V2 using `workspaces` + `workspace_users`
- [ ] workspace roles are enforced server-side
- [ ] workspace switcher package exists in V2

### Shops Access Foundation

- [ ] Shops app has `/w/{workspaceSlug}/...` route shape
- [ ] backend resolves workspace from route slug
- [ ] backend rejects cross-workspace access
- [ ] core platform can determine whether the current workspace has Shops access
- [ ] shops-app has a minimal access guard

### Shops Schema Foundation

- [ ] V2 introduces tenant-owned Shops tables with `workspace_id`
- [ ] every Shops query is scoped by `workspace_id`
- [ ] no Shops table relies on implicit tenant ownership
- [ ] old `stores` behavior is translated into an explicit V2 Shops model intentionally

### Narrow MVP Behaviors

- [ ] first read-only Shops API slice is defined
- [ ] first write Shops API slice is defined
- [ ] first Shops UI slice is defined
- [ ] tests prove workspace isolation for the first Shops entity

### Shops MVP Candidate Order

- [ ] stores or branches
- [ ] categories
- [ ] products
- [ ] inventory
- [ ] customers
- [ ] orders
- [ ] reports later

## 7. Explicitly Out Of Scope

These are explicitly out of scope for current V2 work unless the docs are intentionally changed first.

- restaurants
- clinic
- auto
- cars
- Firebase auth
- social auth
- email OTP auth
- phone verification flows from the old system
- legacy `/api/shops/*` compatibility routes
- legacy `/api/restaurants/*` compatibility routes
- old `tenants` bridge model as the V2 platform model
- old `workspace_apps` bridge model as the final subscription model
- OS onboarding shell

## Working Rule

When a future V2 task needs parity:
1. read this file
2. read the matching V2 doc
3. inspect the listed old reference files
4. re-implement the smallest safe behavior slice
5. add V2 tests for the new behavior

Do not port old files directly.
