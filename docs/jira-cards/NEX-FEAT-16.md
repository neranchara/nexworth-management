# Jira Card: NEX-FEAT-16
**Status**: [COMPLETED] ✅
**Priority**: Low
**Assignee**: Claude Code
**Epic**: Phase 27: Transactions Page UX — Filtered Summary

## Description
User-requested enhancement on `/dashboard/transactions`: show a totals summary (income / expense / net) for whatever subset of transactions the current filters (month, year, search text, type, category, account) resolve to — today the page only shows the raw filtered list with no aggregate.

## Acceptance Criteria
- [x] Summary reflects `sortedTransactions` (the list after month/year API params + client-side search/type/category/account filters) — not the unfiltered full set.
- [x] Shows: record count, total income (inflow, `direction !== 'FROM'`), total expense (outflow, `direction === 'FROM'`), net.
- [x] Placed above the transactions table, below the filter bar.
- [x] i18n keys added to both `apps/web/messages/th.json` and `en.json` under `transactions.summary`.
- [x] `tsc --noEmit` clean on `apps/web`.

## Technical Notes
**Files touched:**
- `apps/web/src/app/dashboard/transactions/page.tsx` — new `filterSummary` reducer over `sortedTransactions`; new summary bar `GlassCard` rendered between the filter bar and the table; added `data-testid="transactions-list-sel-filter-account"` to the account filter `<select>` (it had none before, needed for both the mandatory data-testid convention and this ticket's test).
- `apps/web/messages/th.json`, `en.json` — new `transactions.summary.{count,income,expense,net}` keys.
- `docs/standards/QA & Testing/e2e-locators-map.md` — new rows for the filter-account select and the 5 new summary-bar testids.
- `apps/web/src/tests/TransactionsFilteredSummary.test.tsx` — new, 2 tests (initial totals from a 3-transaction fixture; totals recompute to 0 when the account filter excludes all of them).

**Verification:**
- `npx vitest run src/tests/TransactionsFilteredSummary.test.tsx` — 2/2 passed. (The test mocks `next-intl` locally because rendering this page outside a `NextIntlClientProvider` throws — a **pre-existing** gap: 6 other test files in this suite already fail the same way on `main` without any of this branch's changes, confirmed via `git stash`.)
- `npx tsc --noEmit` clean on `apps/web`.
- Not click-tested in a live authenticated browser (no login credentials available in this session — user opted to skip live browser verification and rely on the unit test + `tsc` instead).
