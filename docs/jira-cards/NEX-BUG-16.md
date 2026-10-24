# Jira Card: NEX-BUG-16
**Status**: [COMPLETED] ✅
**Priority**: Critical (production deploy blocker)
**Assignee**: Claude Code
**Epic**: Hotfix

## Description
Render deploy of `main` (`24e0eac`, the NEX-BUG-15 merge) failed to build:
```
tsconfig.json(7,25): error TS5108: Option 'moduleResolution=node10' has been removed.
npm error Lifecycle script `build` failed with error: npm error code 2
```
`apps/api/tsconfig.json` set `"moduleResolution": "node"` (TypeScript's legacy alias for `"node10"`) with `"ignoreDeprecations": "5.0"`. TypeScript 6.x needs `"ignoreDeprecations": "6.0"` to keep allowing this value — `apps/bot/tsconfig.json` already had the correct `"6.0"` value (presumably fixed there before), `apps/api/tsconfig.json` was never updated to match and only surfaced as a hard failure once a fresh `npm install` on Render resolved a `typescript` patch version where this is enforced more strictly than whatever is cached in the local `node_modules`.

Not caused by any of NEX-BUG-14/NEX-FEAT-16/NEX-BUG-15's actual code changes — those just happened to be the deploy that first triggered a fresh build.

## Fix
- `apps/api/tsconfig.json`: `"ignoreDeprecations": "5.0"` → `"6.0"` (one line, matches the already-correct value in `apps/bot/tsconfig.json`).
- Considered switching to `moduleResolution: "node16"` instead (matches `tsconfig.base.json`) but that also requires `module: "Node16"`, which is a much bigger ESM migration — not safe to rush while production is down. Deferred; `ignoreDeprecations: "6.0"` is the matching fix already proven in this same repo for `apps/bot`.

## Verification
- `npx tsc --noEmit` in `apps/api` — clean, exit 0 (previously: `error TS5107` printed, though it didn't abort locally since the installed TS patch version wasn't as strict as Render's at the time).
- `npm run build:api` from repo root — the exact script Render runs (`db:generate` → build `database` → build `ai-engine` → build `api`) — completes clean, exit 0.

## Technical Notes
Branch: `hotfix/NEX-BUG-16-tsconfig-build-fix` from `main`, merge straight back to `main` per Solo Simplified Git Flow's hotfix rule. After merge, re-trigger the Render deploy that failed (or it may auto-redeploy on push, depending on the service's trigger settings) — this is what unblocks NEX-BUG-14/NEX-FEAT-16/NEX-BUG-15 from actually going live.
