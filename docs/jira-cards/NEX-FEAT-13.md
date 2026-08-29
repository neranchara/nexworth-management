# Jira Card: NEX-FEAT-13
**Status**: [IN PROGRESS] 🚀
**Priority**: High
**Assignee**: Cursor Agent
**Epic**: Phase 25: Transaction Type Taxonomy Cleanup

## Description
Split the combined org type **ออม/ลงทุน** (`SAVING`) into:
- **ออม** → behavior `SAVING`
- **ลงทุน** → behavior `INVESTMENT`

Keep **GOAL** (account) and **GOAL_SAVING** (transaction park-to-goal) separate. Do not merge them.

## Acceptance Criteria
- [ ] New orgs seed `ออม` + `ลงทุน` (no `ออม/ลงทุน`).
- [ ] Categories remapped: saving cats → ออม; investment cats → ลงทุน; goal-like → เงินมีเป้าหมาย where applicable.
- [ ] Backfill script for existing orgs: rename/create types, move categories, sync `Transaction.typeId`.
- [ ] Unit test for category→type mapping table.
- [ ] Staging: run backfill against `stg_nexworth_db` when user approves.

## Technical Notes
_(fill when complete)_
