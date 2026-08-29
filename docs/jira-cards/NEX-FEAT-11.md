# Jira Card: NEX-FEAT-11
**Status**: [COMPLETED] ✅
**Priority**: High
**Assignee**: Claude Code
**Epic**: Phase 24: Ledger Integrity Foundation

## Description
As a developer, I want `assetMultiplier`/`liabMultiplier` to be DB-driven per `TransactionType` (like `defaultDirection`/`isExpenseLike`/`cashflowBucket` already are since P6), so that adding a new transaction behavior in the future is a data change, not a code change.

## Acceptance Criteria
- [x] `TransactionType` has `assetMultiplier`/`liabMultiplier` columns (nullable, dual-path fallback).
- [x] `getAssetMultiplier()` prefers DB values, falls back to `BEHAVIOR_METADATA` — same pattern as `getDirection()`/`getCashflowBucket()`.
- [x] `adjustAccountBalance` passes DB values through.
- [x] Existing `TransactionType` rows backfilled from `BEHAVIOR_METADATA`.
- [x] New orgs seeded with both columns.
- [x] Unit tests: DB override works, fallback works when DB is null.
- [x] No behavior change for any existing transaction — this is purely additive infrastructure.

## Technical Notes
**Files touched:**
- `packages/database/schema.prisma` — `assetMultiplier Int?` / `liabMultiplier Int?` on `TransactionType`
- `apps/api/src/constants/transactionConfig.ts` — `getAssetMultiplier()` takes 2 new optional params (`dbAssetMultiplier`, `dbLiabMultiplier`), checked after the DEBT special-case and direction shortcuts, before the `BEHAVIOR_METADATA` fallback (`0` is respected as a valid DB value, not treated as falsy)
- `apps/api/src/controllers/transaction.controller.ts` — `adjustAccountBalance` passes `type.assetMultiplier`/`type.liabMultiplier` through (the `type` row was already being fetched, no new query)
- `apps/api/src/services/organization.service.ts` — new orgs seed both columns
- `apps/api/src/scripts/backfill-type-multipliers.ts` — new backfill script, run on staging: **136 `TransactionType` rows backfilled**
- `apps/api/src/tests/p6_transaction_behavior.test.ts` — 5 new tests

**Verification:** ran the backfill on staging, then directly queried all `DEBT`-behavior rows to confirm the NEX-BUG-11-fixed `liabMultiplier=-1` carried through correctly (not the old buggy `+1`) for every org, including legacy `organizationId=null` rows. `vitest run` → 149/149 passing across the whole `apps/api` suite; `tsc --noEmit` clean.
