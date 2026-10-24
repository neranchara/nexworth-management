# Jira Card: NEX-BUG-17
**Status**: [COMPLETED] ✅ (pending production deploy to take effect)
**Priority**: Critical (production — every page touching transactions is broken)
**Assignee**: Claude Code
**Epic**: Hotfix

## Description
After NEX-BUG-16 finally got the API deploying successfully, the user reported "ข้อมูลหาย" (data is gone) — Dashboard, Transactions, and Loan Tracker pages on production all showed zero/empty, with the Loan Tracker explicitly showing "โหลดข้อมูลไม่สำเร็จ".

Render logs showed the real cause — not data loss, a schema mismatch:
```
prisma:error
Invalid `prisma.transaction.findMany()` invocation:
The column `TransactionType.assetMultiplier` does not exist in the current database.
```
`PrismaClientKnownRequestError` (`P2022`) thrown from `calculateFinancialStats` (`dashboard.controller.ts`) — any query that touches `TransactionType` (dashboard, transactions, loans — all `include: { type: true }` somewhere) fails outright, which is why every one of those pages went blank/errored at once. The underlying data was never touched.

## Root Cause
`assetMultiplier`/`liabMultiplier` were added to `TransactionType` in `schema.prisma` for NEX-FEAT-11 ("Move assetMultiplier/liabMultiplier to DB"). That ticket's own notes say the columns were added and backfilled **on staging only** via `prisma db push` + a one-off script — but this repo has no `prisma migrate` history; schema changes meant for production are supposed to be mirrored into the hand-rolled `runSchemaMigrations()` boot function in `apps/api/src/server.ts` (idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements that run on every deploy). NEX-FEAT-11 added the Prisma schema fields and the `defaultDirection`/`isExpenseLike`/`cashflowBucket` columns were correctly added to `runSchemaMigrations()` — but `assetMultiplier`/`liabMultiplier` were missed. Production's actual `TransactionType` table never got the columns at all, so as soon as the Prisma Client (which always expects every schema-declared column to exist) tried to select them, every query crashed.

## Fix
`apps/api/src/server.ts`, `runSchemaMigrations()`: add the two missing lines, matching the pattern already used for the other `TransactionType` columns:
```ts
await run(`ALTER TABLE "TransactionType" ADD COLUMN IF NOT EXISTS "assetMultiplier" INTEGER`);
await run(`ALTER TABLE "TransactionType" ADD COLUMN IF NOT EXISTS "liabMultiplier" INTEGER`);
```
Both are nullable `Int?` in `schema.prisma` (no default) — adding them is purely additive, zero risk to existing rows.

**On production they'll come back `NULL` for every row** (no backfill was run there) — this is safe: `getAssetMultiplier()` (`apps/api/src/constants/transactionConfig.ts`) already has the dual-path fallback NEX-FEAT-11 built for exactly this — `if (dbValue === 1 || dbValue === -1 || dbValue === 0) return dbValue; ... return isLiability ? meta.liabMultiplier : meta.assetMultiplier;` — a `null` DB value falls straight through to the hardcoded `BEHAVIOR_METADATA` constant, i.e. the exact same math production was already running before NEX-FEAT-11 existed. No financial calculation changes; this only stops the crash.

## Verification
- `npx tsc --noEmit` in `apps/api` — clean.
- Once deployed, this runs automatically at every boot (no manual script needed) — same mechanism already relied on for 15+ other columns in production.
- **[NEEDS VERIFY]** after deploy: confirm Dashboard/Transactions/Loan Tracker load real data again on production for `neranchara.ksr@gmail.com`.
- Optional follow-up (not blocking): run the NEX-FEAT-11 backfill script against production too, so `assetMultiplier`/`liabMultiplier` get their intended per-row values instead of relying on the hardcoded fallback forever. Not urgent — the fallback produces identical results.
