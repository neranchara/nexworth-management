# Jira Card: NEX-BUG-18
**Status**: [COMPLETED] ✅
**Priority**: Critical (operational — one-off scripts silently wrote to the wrong database)
**Assignee**: Claude Code
**Epic**: Hotfix / Tooling

## Description
While investigating a transaction-balance question for the user, a diagnostic script was run against what was believed to be production (`$env:DATABASE_URL="<neon production URL>" npx tsx src/scripts/...`). The output was identical, byte-for-byte, to a local staging run. Added an explicit "which database am I actually connected to" check to the script and confirmed: **it was connecting to local `stg_nexworth_db` regardless of the shell's `DATABASE_URL`.**

## Root Cause
Every one-off script under `apps/api/src/scripts/` that imports the shared `{ prisma } from '../lib/prisma.js'` client gets a `PrismaClient` instance with no explicit `datasources` override. Prisma's generated client automatically loads a `.env` file associated with the schema's package (`packages/database/.env`), which hardcodes `DATABASE_URL` to the local Docker staging Postgres (`postgresql://postgres:***@localhost:5432/stg_nexworth_db`). This auto-loaded value wins over whatever `DATABASE_URL` is exported in the calling shell — so `$env:DATABASE_URL="<production>" npx tsx src/scripts/some-script.ts` silently ran against local staging the entire time, with no error or warning.

**This means NEX-BUG-15's "goals" permission backfill — which the user ran earlier believing it targeted production (output: "Found 13 roles... 13 Permission rows upserted") — likely never actually reached the real production database.** That run's smaller role count was almost certainly local staging at an earlier point in this session (role count changes as local test activity adds orgs), not production.

The actual Render-deployed API itself is **not** affected — `apps/api/src/config/index.ts` skips all local dotenv loading when `process.env.RENDER` is set, so the live app correctly uses Render's platform-injected `DATABASE_URL`. This bug is scoped entirely to engineers/operators running one-off scripts locally against a remote DB.

## Fix
- New `apps/api/src/lib/prisma-script.ts`: a `PrismaClient` built with an explicit `datasources: { db: { url: process.env.DATABASE_URL } } }`, which cannot be silently overridden by any auto-loaded `.env`. Exits with a clear error if `DATABASE_URL` isn't set at all (rather than silently falling back to something unexpected). Also exports `logConnectedDatabase()` — prints `current_database()` (never credentials) so every run self-reports which DB it actually hit.
- `backfill-goals-permission.ts`: switched to this helper, calls `logConnectedDatabase()` first thing.
- Any future one-off script meant to run against staging/production by DATABASE_URL override should import from `lib/prisma-script.ts`, not `lib/prisma.ts`.

## Verification
- `npx tsc --noEmit` clean.
- Ran `backfill-goals-permission.ts` with `DATABASE_URL` pointed at local staging — correctly reports `[prisma-script] connected to database: stg_nexworth_db` and completes as expected (54 roles, idempotent re-run).
- Confirmed the override actually works by pointing at a *different* local DB (`prod_nexworth_db` container) and seeing the connection-check line change accordingly.

## Follow-up — resolved
- **Re-ran `backfill-goals-permission.ts` against real production, confirmed.** Even after this fix, the user's first few re-attempts still showed `stg_nexworth_db` — traced to running the commands in **Cursor's integrated terminal**, which appears to auto-load this project's local `.env` into every shell session, re-overriding the manually-exported `DATABASE_URL` regardless of the Prisma-level fix above. Running the exact same commands in a **standalone PowerShell window opened outside the IDE** worked correctly on the first try: `username: neondb_owner`, `connected to database: neondb`, `Found 13 roles across all orgs`, `13 Permission rows upserted`. **This is believed to be the first time this backfill actually reached production** — the original NEX-BUG-15 "13 roles" run was very likely also local staging at an earlier point in the session (see note below), not this same real result by coincidence.
- **Takeaway for anyone running these scripts locally:** use a plain OS-level terminal (Windows Terminal / PowerShell launched from the Start menu), not an IDE-integrated one, when overriding `DATABASE_URL` for a one-off script against a remote database. The `prisma-script.ts` diagnostics added here (username / neon.tech / localhost checks) are what made this catchable instead of silently wrong.
- Other historical one-off scripts in this directory (`backfill-saving-investment-split.ts`, `backfill-type-multipliers.ts`, `backfill-balance-adjustment-type.ts`, `backfill-liability-payment-type.ts`) use the same vulnerable `lib/prisma.ts` import and were likely also run from an IDE terminal — worth independently re-verifying if any of those backfills' effects are ever in doubt. Not re-audited here (out of scope / time-boxed).
