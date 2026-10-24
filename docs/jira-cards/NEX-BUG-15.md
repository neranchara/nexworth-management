# Jira Card: NEX-BUG-15
**Status**: [COMPLETED] ✅
**Priority**: Medium
**Assignee**: Claude Code
**Epic**: Phase 26: Goals Experience Consistency

## Description
User-reported: the desktop sidebar (vertical nav) and the mobile bottom nav (horizontal nav) show different menu items — specifically "เป้าหมาย" (Goals) is missing from the desktop sidebar for the reporting user, but present on mobile.

## Root Cause (confirmed by code read, two independent bugs compounding)
1. **`'goals'` was never added to the RBAC resource list.** `apps/api/src/services/organization.service.ts`'s `resources` array (used by `setupOrganizationDefaults` to seed `Permission` rows for every `Role` in an org) and `apps/api/src/scripts/seed-master-db.ts`'s `ALL_RESOURCES` (system roles) both list `'dashboard', 'users', 'transactions', ..., 'categories'` — no `'goals'`. So **no role in any org, including "Admin", has a `Permission` row for `resource: 'goals'`** — `usePermissions().hasPermission('goals')` (`apps/web/src/hooks/usePermissions.ts`) falls through to `return false` for everyone except `isSystemAdmin`.
2. **The two navs don't share permission-filtering logic.** `Sidebar.tsx` (desktop) renders links from `useDashboardNav()`, which filters `MAIN_NAV_LINKS` (`apps/web/src/features/dashboard-layout/navConfig.ts`, includes `{ href: '/dashboard/goals', resource: 'goals', ... }`) through `hasPermission(link.resource)` — so Goals gets filtered out for everyone per bug #1. `MobileBottomNav.tsx` instead hardcodes its own 4-item list (`หน้าหลัก`, `ธุรกรรม`, `สินทรัพย์`, `เป้าหมาย`) with **no permission check at all** — so it always shows Goals regardless of what the user can actually access. The two navs disagreeing is a direct, visible symptom of bug #1, made worse by bug #2's inconsistent filtering.

## Acceptance Criteria
- [x] Add `'goals'` to the `resources` array in `organization.service.ts` (new orgs going forward get it seeded correctly).
- [x] Add `'goals'` to `ALL_RESOURCES` in `seed-master-db.ts` (system roles).
- [x] Backfill script: upsert a `'goals'` `Permission` row for every existing `Role` across every org — `canView/canCreate/canUpdate/canDelete = true` for `role.name === 'Admin'`, `canView = true` (create/update/delete `false`) for every other role, matching the existing pattern (`'goals'` isn't in `managementResources`).
- [x] `MobileBottomNav.tsx`: filter its Goals tab through `hasPermission('goals')` too, so it doesn't show a tab the user can't actually open.
- [x] Ran the backfill for real against `stg_nexworth_db` (user approved) instead of a mocked unit test — no existing `backfill-*.ts` script in this repo has unit tests, so this matches repo convention and is a stronger signal than a mock would be.
- [x] 3 unit tests for `MobileBottomNav.tsx`'s new permission gate (no permission → tab hidden, permission granted → tab shown, system admin → all tabs shown regardless of `permissions[]`).
- [x] **[VERIFIED]** staging: ran `backfill-goals-permission.ts` against `stg_nexworth_db` — 54 roles updated. Confirmed directly: `neranchara.ksr@gmail.com`'s "Admin" role now has `{ resource: 'goals', canView: true, canCreate: true, canUpdate: true, canDelete: true }`. (Not re-screenshotted in a live browser — DB-level confirmation plus the unchanged `useDashboardNav`/`usePermissions` logic is sufficient: both navs read the same `hasPermission('goals')` call, which now resolves `true`.)

## Technical Notes
**Files touched:**
- `apps/api/src/services/organization.service.ts` — added `'goals'` to the `resources` array seeded for every org's roles.
- `apps/api/src/scripts/seed-master-db.ts` — added `'goals'` to `ALL_RESOURCES` (system roles: Super Admin, Admin, Operation, App Support).
- `apps/api/src/scripts/backfill-goals-permission.ts` — new, one-off backfill for existing roles (run once against staging; should also be run against production before/at deploy).
- `apps/web/src/features/dashboard-layout/MobileBottomNav.tsx` — now reads `useAuthStore`/`usePermissions` and filters its tab list through `hasPermission(link.resource)` (same gate the desktop `Sidebar`/`useDashboardNav` already used), so a role without `'goals'` access no longer sees a Goals tab that would 403.
- `apps/web/src/tests/MobileBottomNav.test.tsx` — new, 3 tests.

**Verification:**
- `npx tsc --noEmit` clean on both `apps/api` and `apps/web`.
- `npx vitest run src/tests/MobileBottomNav.test.tsx` — 3/3 passed.
- Backfill executed against `stg_nexworth_db`: "Found 54 roles across all orgs" / "54 Permission rows upserted". Spot-checked the reporting user's role directly afterward (see AC above).
- **Still needs doing at deploy time:** run `backfill-goals-permission.ts` against the production DB too (this branch only touched staging) — it's idempotent (`upsert`), safe to run more than once.
