# Jira Card: NEX-FEAT-12
**Status**: [PLANNED] 📅
**Priority**: High
**Assignee**: Claude Code
**Epic**: Phase 24: Ledger Integrity Foundation

## Description
As a developer, I want manual balance edits on the Liabilities/Assets pages to post a real `Transaction` (via the same `adjustAccountBalance` path everything else uses) instead of upserting `Liability.amount`/`Asset.amount` directly, so that every account's balance has exactly one source of truth (the transaction ledger) and can never drift out of sync with the sign/multiplier convention again.

## Acceptance Criteria
- [ ] New `BALANCE_ADJUSTMENT` behavior added (schema + metadata).
- [ ] System type/category "ปรับยอดเปิดบัญชี" seeded for new orgs + backfilled for existing orgs.
- [ ] `createFinancialRecordHandler`/`updateFinancialRecordHandler` compute a delta and post a `Transaction` instead of a raw upsert.
- [ ] API response contract unchanged — frontend (`liabilities/page.tsx`, `assets/page.tsx`) needs no changes.
- [ ] Editing a balance now creates a visible row in Transaction History.
- [ ] Existing historical balances untouched (this only changes the code path for future edits).
- [ ] Test coverage + manual verification on staging.

## Technical Notes
_(fill in when complete)_
