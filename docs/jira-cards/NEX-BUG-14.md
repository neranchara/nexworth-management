# Jira Card: NEX-BUG-14
**Status**: [PLANNED] 📅
**Priority**: Medium
**Assignee**: Claude Code
**Epic**: Phase 26: Goals Experience Consistency

## Description
The formal `Goal` model (created via the Goals page "+ สร้างเป้าหมายใหม่" button) and `GOAL`/`GOAL_SAVING`-type Accounts (created via the Accounts page) are two parallel ways a user ends up tracking a savings goal. The Dashboard cockpit widget ("Financial Goals") already falls back to synthesizing goal cards from GOAL-type accounts when no formal `Goal` rows exist for the org (`apps/api/src/controllers/dashboard.controller.ts`, `calculateFinancialStats`, lines ~177-192). The dedicated Goals page (`/dashboard/goals`, titled "เป้าหมายการเงิน") has no such fallback — `listGoalsHandler`/`getGoalsSummaryHandler` only ever read the `Goal` table.

## Evidence (confirmed on `stg_nexworth_db`)
- User `neranchara.ksr@gmail.com`, org "bigboss" (`32839490-a7f5-4730-a78f-0923f494bf47`)
- `Goal` table: **0 rows** in the entire database (not just this org)
- 4 active `GOAL`-type accounts under this org, each with `targetAmount` and an asset balance set:
  - Cloud Pocket ทำบุญ (target 3,600 / balance 2,000)
  - Cloud Pocket ค่าใช้จ่ายรถ (target 100,000 / balance 4,000)
  - Cloud Pocket เที่ยว (target 30,000 / balance 3,000)
  - ออมสิน บัญชีเงินซื้อรถ (target 350,000 / balance 282,532.08)
- Conclusion: these show on the Dashboard widget (via its fallback) but render as an empty list on the Goals page itself — which is why the user "ไม่เห็นรายการที่เคยตั้งเป้าหมายไว้" there.

## Acceptance Criteria
- [ ] `listGoalsHandler`: when `prisma.goal.findMany({ organizationId })` returns 0 rows, synthesize goal-shaped entries from `GOAL`/`GOAL_SAVING`-type accounts for that org (mirroring the Dashboard fallback), each flagged `isVirtual: true`.
- [ ] `getGoalsSummaryHandler`: apply the same fallback so `totalGoalsValue`/`totalCollected`/`goalCount`/`overallProgress` reflect the virtual goals too when there are no real ones.
- [ ] `goals/page.tsx`: hide the edit (pencil) and delete buttons on cards where `isVirtual` is true — there is no `Goal` row for `PUT/DELETE /goals/:id` to act on.
- [ ] Real `Goal` rows always take priority — the fallback only runs when the org has zero real `Goal` rows (consistent with the existing Dashboard behavior, so the two surfaces never disagree).
- [ ] Unit tests covering: org with real goals only, org with virtual-only, org with neither.
- [ ] `tsc --noEmit` clean on both `apps/api` and `apps/web`.
- [ ] **[NEEDS VERIFY]** staging: confirm the 4 real "Cloud Pocket" / "ออมสิน" accounts above now render on `/dashboard/goals` for this user.

## Technical Notes
(fill in after implementation: files touched, test results)
