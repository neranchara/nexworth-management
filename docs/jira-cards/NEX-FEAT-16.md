# Jira Card: NEX-FEAT-16
**Status**: [PLANNED] 📅
**Priority**: Low
**Assignee**: Claude Code
**Epic**: Phase 27: Transactions Page UX — Filtered Summary

## Description
User-requested enhancement on `/dashboard/transactions`: show a totals summary (income / expense / net) for whatever subset of transactions the current filters (month, year, search text, type, category, account) resolve to — today the page only shows the raw filtered list with no aggregate.

## Acceptance Criteria
- [ ] Summary reflects `sortedTransactions` (the list after month/year API params + client-side search/type/category/account filters) — not the unfiltered full set.
- [ ] Shows: record count, total income (inflow, `direction !== 'FROM'`), total expense (outflow, `direction === 'FROM'`), net.
- [ ] Placed above the transactions table, below the filter bar.
- [ ] i18n keys added to both `apps/web/messages/th.json` and `en.json` under `transactions.summary`.
- [ ] `tsc --noEmit` clean on `apps/web`.

## Technical Notes
(fill in after implementation: files touched)
