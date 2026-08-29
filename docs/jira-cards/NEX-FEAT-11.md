# Jira Card: NEX-FEAT-11
**Status**: [PLANNED] 📅
**Priority**: High
**Assignee**: Claude Code
**Epic**: Phase 24: Ledger Integrity Foundation

## Description
As a developer, I want `assetMultiplier`/`liabMultiplier` to be DB-driven per `TransactionType` (like `defaultDirection`/`isExpenseLike`/`cashflowBucket` already are since P6), so that adding a new transaction behavior in the future is a data change, not a code change.

## Acceptance Criteria
- [ ] `TransactionType` has `assetMultiplier`/`liabMultiplier` columns (nullable, dual-path fallback).
- [ ] `getAssetMultiplier()` prefers DB values, falls back to `BEHAVIOR_METADATA` — same pattern as `getDirection()`/`getCashflowBucket()`.
- [ ] `adjustAccountBalance` passes DB values through.
- [ ] Existing `TransactionType` rows backfilled from `BEHAVIOR_METADATA`.
- [ ] New orgs seeded with both columns.
- [ ] Unit tests: DB override works, fallback works when DB is null.
- [ ] No behavior change for any existing transaction — this is purely additive infrastructure.

## Technical Notes
_(fill in when complete)_
