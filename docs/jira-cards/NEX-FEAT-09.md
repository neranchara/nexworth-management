# Jira Card: NEX-FEAT-09
**Status**: [COMPLETED] ✅
**Priority**: High
**Assignee**: Claude Code
**Epic**: Phase 23: Credit Card Debt Transactions

## Description
As a user, I want to record credit card charges (รูดบัตร) and credit card payments (ชำระหนี้บัตรเครดิต) as ordinary transactions that appear in the Transaction History page, so that my credit card debt balance stays accurate and auditable through the normal transaction ledger instead of manual balance edits.

## Acceptance Criteria
- [x] Charging a credit card (EXPENSE category + `fromAccountId` = LIABILITY account) increases the liability balance and appears in transaction history (confirmed via code trace — pre-existing correct behavior, no change needed).
- [x] Paying a credit card (transfer with `toAccountId` = LIABILITY account) decreases the liability balance, is labeled "ชำระบัตรเครดิต" (not generic "โอนเข้าภายใน"), and appears in transaction history.
- [x] `LIABILITY_PAYMENT` behavior added to schema + `BEHAVIOR_METADATA` with correct multipliers (`assetMultiplier: -1`, `liabMultiplier: -1`).
- [x] New orgs get the `ชำระหนี้บัตรเครดิต` type / `ชำระบัตรเครดิต` category seeded automatically.
- [x] Backfill script run against staging — all 4 existing orgs now have the category (verified by query).
- [x] Transactions page: no extra buttons (removed per user feedback — user wants everything driven through the existing category/account dropdowns, not new UI); kept a small 💳 badge on liability accounts in the existing account dropdowns for visual clarity only.
- [x] Unit test coverage for `LIABILITY_PAYMENT` in `p6_transaction_behavior.test.ts` (35/35 passing).
- [x] `db:generate` + `db:push` run against `stg_nexworth_db` — schema live.
- [ ] Manual click-through E2E in the browser — not done (would need the dev server running + browser interaction); logic-level verification (unit tests + direct DB query of seeded categories) done instead.

## Technical Notes
**Files touched:**
- `packages/database/schema.prisma` — added `LIABILITY_PAYMENT` to `TransactionBehavior` enum
- `apps/api/src/constants/transactionConfig.ts` — added `LIABILITY_PAYMENT_SYS` key + `BEHAVIOR_METADATA.LIABILITY_PAYMENT`; also see NEX-BUG-11 for the `DEBT`/`getAssetMultiplier` fix made in the same file while investigating this feature
- `apps/api/src/services/organization.service.ts` — seed type + system category for new orgs
- `apps/api/src/scripts/backfill-liability-payment-type.ts` — backfill script (pattern copied from `migrate-transaction-behavior-metadata.ts`), run once against staging, kept in the repo like other one-off migration scripts
- `apps/api/src/controllers/transaction.controller.ts` — transfer-path category override when destination account is `LIABILITY` (both the expense-like and default transfer branches); reuses the `toAccount` already fetched at the top of the transfer block, no extra query added
- `apps/web/src/app/dashboard/transactions/page.tsx` — kept the existing unified category + from/to account form as-is; only added a 💳 prefix on `LIABILITY`-type accounts in both account dropdowns (no new state, no new buttons — an earlier version with quick-select chips was built then reverted per user feedback, see conversation)
- `apps/api/src/tests/p6_transaction_behavior.test.ts` — added `LIABILITY_PAYMENT` coverage
- `docs/standards/QA & Testing/e2e-locators-map.md` — added `transactions-form-sel-from-account` / `transactions-form-sel-to-account` entries (local edit only — this is a git submodule; **still needs `git -C docs/standards add . && commit && push`** to the standards repo, not done automatically)
- `.cursorrules` / `CLAUDE.md` / `AGENTS.md` — Jira-style task tracking + git flow rules (co-authored with the user directly, already committed on this branch)

**Migration executed on staging (`stg_nexworth_db`):**
1. Stopped 2 stray `src/server.ts` dev-server processes that were holding `query_engine-windows.dll.node` locked (PIDs 12540, 48904 — confirmed via loaded-module inspection before stopping, nothing else touched)
2. `npm run db:generate` → succeeded
3. `npm run db:push` → "Your database is now in sync with your Prisma schema"
4. `npx tsx apps/api/src/scripts/backfill-liability-payment-type.ts` → all 4 orgs backfilled, verified by direct query
5. `vitest run p6_transaction_behavior.test.ts` → 35/35 passing; `tsc --noEmit` clean on `apps/api` and `apps/web`

**Note for the user:** the dev server processes that were stopped in step 1 will need to be restarted manually (`npm run dev` or however you normally start it) — a new instance auto-restarted itself already (different PID), so likely already running, but worth double-checking.

**Not done:** full browser click-through E2E (would need to launch the app and manually charge + pay a mock credit card, watching the transaction history). Verified at the logic + DB level instead.
