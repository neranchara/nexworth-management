# Jira Card: NEX-FEAT-17
**Status**: [COMPLETED] ✅
**Priority**: Low
**Assignee**: Claude Code
**Epic**: Phase 18: Stability & UX Polish

## Description
User-requested: the Accounts page already has a top summary stat card counting "ส่วนตัว" (Personal) accounts, and the create/edit form has an `isPersonal` toggle — but neither the table view nor the grid view showed, per-account, whether it's actually marked personal. Since `isPersonal` directly controls whether an account is counted in the Dashboard's Net Worth/Total Assets (`acc.isPersonal || isInvestment` in `calculateFinancialStats`), the user wanted to see this per-account instead of having to open each one's edit form to check.

## Acceptance Criteria
- [x] Table view (`/dashboard/accounts`): new "ส่วนตัว" column — small blue badge with a `User` icon when `isPersonal` is true, em-dash otherwise. Sortable like the other columns (reuses existing generic `handleSort`).
- [x] Grid view: same badge added inline next to the account-type label, shown only when `isPersonal` is true (keeps the card compact — omitted entirely rather than showing a "false" state, consistent with how the existing `#tag` badge already behaves).
- [x] No new i18n keys needed — reused the existing `accounts.personal` key already used for the summary stat card label.
- [x] `tsc --noEmit` clean on `apps/web`.

## Technical Notes
**Files touched:**
- `apps/web/src/app/dashboard/accounts/page.tsx` — added the `isPersonal` column header + `<td>` in the table view; added the badge in the grid view card.

**Verification:**
- `npx tsc --noEmit` clean.
- Not click-tested in a live browser (purely additive conditional JSX, no new state/logic — low risk). No existing test file for this page to extend.
