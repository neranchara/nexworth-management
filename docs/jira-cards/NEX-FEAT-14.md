# Jira Card: NEX-FEAT-14
**Status**: [COMPLETED] ✅
**Priority**: Low
**Assignee**: Claude Code
**Epic**: Phase 23: Credit Card Debt Transactions (UX follow-up)

## Description
The "หมวดหมู่" (category), "จากบัญชี" (from account), and "เข้าบัญชี" (to account) dropdowns on the Transactions page each listed every option as one long, flat, unsorted list, making them hard to scan. Group by type and sort alphabetically instead.

## Acceptance Criteria
- [x] Category options grouped by `TransactionType` name using `<optgroup>`.
- [x] From/To account options grouped by `AccountType` label (via the existing `ACCOUNT_TYPES` config already used on the Accounts page) using `<optgroup>`.
- [x] Groups sorted alphabetically (Thai locale-aware); options within each group sorted alphabetically.
- [x] Existing LOAN_BORROW/LOAN_REPAY/LEND_OUT/LEND_REPAY category exclusion filter unchanged.
- [x] Existing 💳 badge on `LIABILITY`-type accounts preserved.
- [x] `onChange` / form state logic unchanged — purely a rendering/grouping change.

## Technical Notes
**Files touched:** `apps/web/src/app/dashboard/transactions/page.tsx`
- Category dropdown: replaced the flat `.map()` with a grouped structure (`Record<typeName, TransactionCategory[]>` via `forEach`, then `Object.entries(...).sort(...)` rendered as `<optgroup>`). Dropped the `[typeName]` text prefix since the `<optgroup label>` now carries that.
- From/To account dropdowns: added `groupedAccountOptions` (computed once, reused by both selects) grouping `accounts` by their Thai label from the `accountTypes` state (already fetched from `/configs?category=DROPDOWNS` → `ACCOUNT_TYPES`, the same source `accounts/page.tsx` uses for account-type labels — no new API call needed).

**Verification:** `tsc --noEmit` clean on `apps/web`. Not click-tested in a running browser (low-risk presentational change, same data source and `onChange` handlers as before) — flagged to the user, offered to verify live if wanted.
