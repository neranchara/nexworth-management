# Jira Card: NEX-BUG-11
**Status**: [COMPLETED] ✅
**Priority**: Critical (real financial data affected — later confirmed to be mockup/test data by the user, no further correction needed)
**Assignee**: Claude Code
**Epic**: Phase 23: Credit Card Debt Transactions

## Description
The `[หนี้] ชำระหนี้` category (`TransactionBehavior.DEBT`) is supposed to represent paying down debt, but when applied directly to a `LIABILITY` account it **increases** the debt instead of decreasing it — the opposite of its name. Root cause: `getAssetMultiplier()` in `apps/api/src/constants/transactionConfig.ts` short-circuits on `direction === 'FROM'` before ever consulting `BEHAVIOR_METADATA`, and universally treats "FROM a liability account" as new borrowing (`+1`) — correct for `EXPENSE` (spending via credit card) but wrong for `DEBT` (repaying).

**Confirmed real-world impact**: found 1 existing transaction in staging (`บัตรเครดิต UOB`, org `bigboss`, amount 9059.42, date 2026-05-28, direction `FROM`) that was recorded as "ชำระหนี้" directly against the liability account and incorrectly **increased** the UOB card's tracked balance instead of decreasing it. The stored `Liability.amount` for that account is currently overstated relative to what the user intended.

## Acceptance Criteria
- [x] `getAssetMultiplier('DEBT', isLiability=true, ...)` returns `-1` regardless of direction (paying debt always reduces it).
- [x] `BEHAVIOR_METADATA.DEBT.liabMultiplier` corrected to `-1` for consistency.
- [x] Non-liability (cash account) DEBT behavior unchanged (`-1`, cash still decreases when paying from a bank account).
- [x] Unit test coverage added.
- [x] Decided with user: post a compensating correction transaction (rather than silently editing `Liability.amount`).

## Technical Notes
**Files touched:**
- `apps/api/src/constants/transactionConfig.ts` — `getAssetMultiplier()` now special-cases `behavior === 'DEBT' && isLiability` to always return `-1`, checked before the generic direction shortcut; `BEHAVIOR_METADATA.DEBT.liabMultiplier` changed from `1` to `-1`.
- `apps/api/src/tests/p6_transaction_behavior.test.ts` — added coverage for the fixed behavior (35/35 passing overall).

**Data correction:** ran a one-off script (`apps/api/src/scripts/fix-nexbug11-uob-correction.ts`, deleted after running — logic preserved here and in the created Transaction's `note` field) that posted a single auditable correction transaction on `บัตรเครดิต UOB` (org `bigboss`) using the now-fixed `DEBT` behavior, swinging the balance by -18,118.84 (undo the wrong +9,059.42, then apply the correct -9,059.42). Resulting balance came out as -12,059.42, which didn't match what the user expected (+12,059.42, same magnitude opposite sign) — investigated further and the user clarified this account is **mockup/test data**, so exact real-world balance accuracy doesn't matter here; only the underlying multiplier logic needed to be correct, which is verified by the unit tests. The correction transaction was left in place as-is (not reverted).

**Verification:** `vitest run p6_transaction_behavior.test.ts` → 35/35 passing.
