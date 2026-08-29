# Jira Card: NEX-FEAT-12
**Status**: [COMPLETED] ✅
**Priority**: High
**Assignee**: Claude Code
**Epic**: Phase 24: Ledger Integrity Foundation

## Description
As a developer, I want manual balance edits on the Liabilities/Assets pages to post a real `Transaction` (via the same `adjustAccountBalance` path everything else uses) instead of upserting `Liability.amount`/`Asset.amount` directly, so that every account's balance has exactly one source of truth (the transaction ledger) and can never drift out of sync with the sign/multiplier convention again.

## Acceptance Criteria
- [x] New `BALANCE_ADJUSTMENT` behavior added (schema + metadata).
- [x] System type/category "ปรับยอดเปิดบัญชี" seeded for new orgs + backfilled for existing orgs.
- [x] `createFinancialRecordHandler`/`updateFinancialRecordHandler` compute a delta and post a `Transaction` instead of a raw upsert.
- [x] API response contract unchanged — frontend (`liabilities/page.tsx`, `assets/page.tsx`) needs no changes.
- [x] Editing a balance now creates a visible row in Transaction History.
- [x] Existing historical balances untouched (this only changes the code path for future edits).
- [x] Test coverage + manual verification on staging.

## Technical Notes
**Files touched:**
- `packages/database/schema.prisma` — `BALANCE_ADJUSTMENT` added to `TransactionBehavior`
- `apps/api/src/constants/transactionConfig.ts` — `BALANCE_ADJUSTMENT` metadata (`assetMultiplier: 1, liabMultiplier: 1` — both flat +1 since the caller passes an already-signed delta, not a magnitude); new `BALANCE_ADJUSTMENT_SYS` system-category key
- `apps/api/src/controllers/transaction.controller.ts` — exported `getSystemCategory` (was module-private) so `financial-record.controller.ts` can reuse it
- `apps/api/src/controllers/financial-record.controller.ts` — new `postBalanceAdjustmentAndGetRecord()` helper: fetches current amount → computes `delta = target - current` → if non-zero, calls `adjustAccountBalance(accountId, delta, ..., direction=null, ...)` (resolves to a flat ×1 multiplier so the signed delta applies as-is on either asset or liability accounts) and creates a `Transaction` row with `amount = Math.abs(delta)` (stored positive, matching every other transaction in the app) → separately upserts the `note` field (so a note-only edit still works even when delta is 0, without posting a no-op transaction). Both `createFinancialRecordHandler` and `updateFinancialRecordHandler` now call this instead of `prisma.liability/asset.upsert/update` directly.
- `apps/api/src/services/organization.service.ts` — seed for new orgs
- `apps/api/src/scripts/backfill-balance-adjustment-type.ts` — new backfill script, run on staging for all 4 orgs
- `apps/api/src/tests/financial-record.controller.test.ts` — rewritten (7 tests: delta computation, positive-stored-amount invariant, no-op skip, ASSET parity, response contract)
- `apps/api/src/tests/asset_note_persistence.test.ts` — 2 of 3 existing tests updated to mock `prisma.$transaction`/`getSystemCategory` instead of `prisma.asset.upsert`/`update` directly (they broke when the implementation changed; fixed to assert against the new code path, same intent)

**Manual E2E on staging:** ran the real `createFinancialRecordHandler` against the actual `บัตรเครดิต UOB` mock account — before `-12059.42`, edited to target `20000`, confirmed: response `record.amount = 20000`, `Liability.amount` after = `20000` exactly, and a real `Transaction` row was created with `amount = 32059.42` (= `|20000 - (-12059.42)|`), `behavior = BALANCE_ADJUSTMENT`, `category = "ปรับยอดเปิดบัญชี"`.

**Verification:** `vitest run` → 149/149 passing across the whole `apps/api` suite (including the 2 pre-existing tests this change broke and then fixed); `tsc --noEmit` clean on `apps/api`.
