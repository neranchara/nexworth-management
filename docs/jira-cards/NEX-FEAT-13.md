# Jira Card: NEX-FEAT-13
**Status**: [COMPLETED] ✅
**Priority**: High
**Assignee**: Cursor Agent
**Epic**: Phase 25: Transaction Type Taxonomy Cleanup

## Description
Split the combined org type **ออม/ลงทุน** (`SAVING`) into:
- **ออม** → behavior `SAVING`
- **ลงทุน** → behavior `INVESTMENT`

Keep **GOAL** (account) and **GOAL_SAVING** (transaction park-to-goal) separate. Do not merge them.

## Acceptance Criteria
- [x] New orgs seed `ออม` + `ลงทุน` (no `ออม/ลงทุน`).
- [x] Categories remapped: saving cats → ออม; investment cats → ลงทุน; goal-like → เงินมีเป้าหมาย; mis-seeded consumption → รายจ่าย.
- [x] Backfill script for existing orgs **and global (organizationId=null)** types: rename/create types, move categories, sync `Transaction.typeId`.
- [x] Unit test for category→type mapping table (5/5 passing).
- [x] Staging: ran backfill against `stg_nexworth_db` — legacy active count = 0; sample cats map correctly.

## Technical Notes
**Files:**
- `apps/api/src/constants/savingInvestmentSplit.ts` — mapping + `targetTypeNameForCategory()`
- `apps/api/src/scripts/backfill-saving-investment-split.ts`
- `apps/api/src/scripts/verify-saving-investment-split.ts`
- `apps/api/src/tests/saving_investment_split.test.ts`
- `apps/api/src/services/organization.service.ts` — seed split
- `apps/api/src/scripts/seed-master-db.ts` — global type names
- `apps/bot/src/services/organization.service.ts` — synced seed

**Staging run:** global scope moved 117 cats; org scopes cleaned; `legacyActive=0`, 4+ orgs have ออม + ลงทุน.
