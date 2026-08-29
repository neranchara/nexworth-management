# Jira Card: NEX-BUG-12
**Status**: [COMPLETED] ✅
**Priority**: Critical
**Assignee**: Claude Code
**Epic**: Phase 24: Ledger Integrity Foundation

## Description
`Liability.amount` has two conflicting sign conventions in the codebase: `financial-record.controller.ts` (manual edit via the Liabilities page) stores it negative (`-Math.abs(amount)`); `transaction.controller.ts` (every transaction-driven update via `adjustAccountBalance`/`getAssetMultiplier`) treats positive as "amount owed". Any liability account whose balance is ever touched by both code paths will drift.

## Acceptance Criteria
- [x] Queried staging for existing `Liability` rows with `amount < 0` and reported findings before changing code.
- [x] `createFinancialRecordHandler` and `updateFinancialRecordHandler` store liability amounts as positive, matching the transaction-driven convention.
- [x] Unit test coverage for the fix.
- [x] No silent correction of existing data — any drift found is reported, not auto-fixed.

## Technical Notes
**Files touched:**
- `apps/api/src/controllers/financial-record.controller.ts` — both handlers now store `Math.abs(body.amount)` for liabilities instead of `-Math.abs(body.amount)`
- `apps/api/src/tests/financial-record.controller.test.ts` — new file, 4 tests (mocked prisma, no DB dependency, matching `loan.controller.test.ts` pattern)

**Staging check before the fix:** queried all `Liability` rows with `amount < 0` — found exactly 1 (`บัตรเครดิต UOB`, org `bigboss`, `-12059.42`), which is the record from the NEX-BUG-11 correction script itself, not caused by this bug. No other data affected; no additional correction needed.

**Frontend impact:** none — `liabilities/page.tsx` already wraps every displayed amount in `Math.abs()` (lines 113, 318), so the UI never showed the sign either way. This fix only changes what's stored, not what's rendered.

**Side finding while investigating:** `stg_nexworth_db` Docker container's port-forward to `localhost:5432` had gone stale after a container restart — `docker restart stg_nexworth_db` fixed it. Unrelated to the code fix, just an environment hiccup encountered mid-investigation.

**Verification:** `vitest run financial-record.controller.test.ts` → 4/4 passing; `tsc --noEmit` clean.
