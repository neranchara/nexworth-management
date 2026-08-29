# Jira Card: NEX-FEAT-15
**Status**: [COMPLETED] ✅
**Priority**: Medium
**Assignee**: Claude Code
**Epic**: Phase 24: Ledger Integrity Foundation (follow-up)

## Description
Follow-up to NEX-BUG-13 (which fixed inactive accounts leaking into Net Worth totals). The account-picker `<select>`s used to create/edit records still let users pick an inactive account, across 6 pages. Filter inactive accounts out of these pickers — but keep an already-selected inactive account visible when editing an existing record that references it (so editing doesn't silently blank out the field).

## Addendum
User caught a related gap via screenshot: the **Assets page list itself** (not just the form dropdown) still showed inactive accounts ("Cloud Pocket TSMC", "Cloud Pocket ASML") under "บัญชีทั้งหมด". Fixed the same way, at the list-rendering source rather than the picker:
- `apps/web/src/app/dashboard/assets/page.tsx` — `filteredRecords`/`filteredNonCounted` (which feed the visible list) now also require `r.account?.isActive !== false`. Deliberately did **not** add this to `filteredAccounts`/`filteredNonCountedAccounts` (which feed the form dropdown) — that array needs to keep inactive accounts in it so the dropdown's own `.filter(acc => acc.isActive || acc.id === formData.accountId)` can still find and display an already-selected inactive account while editing.
- `apps/web/src/app/dashboard/liabilities/page.tsx` — same issue, simpler fix since this page has no dummy-record injection: filtered `records` directly on `r.account?.isActive !== false` right where it's set.
- `tsc --noEmit` clean on `apps/web` after both changes.

## Acceptance Criteria
- [x] `DashboardCockpit.tsx` — "Add Transaction" modal account select (both `accountId` and `toAccountId` selects)
- [x] `transactions/page.tsx` — add/edit transaction modal (from/to account) — extended the existing `groupedAccountOptions` helper
- [x] `goals/page.tsx` — goal-allocation form account select
- [x] `assets/page.tsx` — asset record form account select
- [x] `liabilities/page.tsx` — liability record form account select
- [x] `loan-tracker/page.tsx` — both account selects (loan create form + repay/receive form)
- [x] Editing an existing record that references an already-inactive account still shows/keeps that account selected (never silently blanks the field) — every filter uses the pattern `acc.isActive || acc.id === <current form value>`
- [x] `tsc --noEmit` clean on `apps/web`

## Technical Notes
**Files touched (7 selects across 6 files), all using the identical filter pattern `accounts.filter(a => a.isActive || a.id === <currentFormFieldValue>)`:**
- `apps/web/src/features/dashboard-overview/DashboardCockpit.tsx` — 2 selects (`accountId`, `toAccountId`); also had to widen the local `accounts` state type (was an inline `{id, name, balance}` narrower than the real `/accounts` API response) to add `isActive?: boolean` — the field was always present at runtime, just not in the TS type
- `apps/web/src/app/dashboard/transactions/page.tsx` — extended `groupedAccountOptions` (built for NEX-FEAT-14) with the filter before grouping, so both from/to selects get it for free
- `apps/web/src/app/dashboard/goals/page.tsx`, `assets/page.tsx`, `liabilities/page.tsx` — 1 select each
- `apps/web/src/app/dashboard/loan-tracker/page.tsx` — 2 selects (`newLoanForm.accountId`, `repayForm.accountId`)

**Note on assets/liabilities pages:** their account select is `disabled={isEditing}` — the filter still had to include the "keep already-selected" clause, since a disabled `<select>` whose current `value` isn't among its `<option>`s can render blank in some browsers even while disabled.

**Verification:** `tsc --noEmit` clean on `apps/web`. **Not click-tested in a live browser** — would need authenticated sessions across 6 different pages; the dev server responds (checked `curl localhost:3000` → 307 to login) but a full walkthrough wasn't done. Flagged to the user, offered to do it if wanted. Pattern is low-risk: pure additive `.filter()` before existing `.map()`, no change to `onChange` handlers or form submission logic anywhere.
