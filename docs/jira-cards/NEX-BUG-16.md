# Jira Card: NEX-BUG-16
**Status**: [COMPLETED] ✅ (attempt 2 confirmed live on Render)
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

## Fix — attempt 1 (PR #38, `hotfix/NEX-BUG-16-tsconfig-build-fix`) — INSUFFICIENT
- `apps/api/tsconfig.json`: `"ignoreDeprecations": "5.0"` → `"6.0"` (matched the already-correct value in `apps/bot/tsconfig.json`).
- Verified locally: `tsc --noEmit` and `npm run build:api` both clean, exit 0.
- **Merged and redeployed on Render — still failed with the exact same `TS5108` error, same line/column.** `ignoreDeprecations` apparently cannot suppress this on whatever TypeScript resolution Render's build actually uses, even though `package-lock.json` pins the identical `typescript@6.0.3` used locally. Root cause of *why* local and Render disagree wasn't pinned down further — moved straight to a fix that doesn't depend on version-sensitive deprecation suppression at all.

## Fix — attempt 2 (this branch) — the actual fix
- `apps/api/tsconfig.json`: drop `moduleResolution: "node"` (the removed `node10` alias) and `ignoreDeprecations` entirely. Use `moduleResolution: "bundler"` instead, kept paired with the existing `module: "CommonJS"`.
- `"bundler"` only affects how `tsc` locates **types** during type-checking — it has no effect on the emitted JS (`module: "CommonJS"` still controls the actual `require()` output), so the compiled `dist/` output and runtime behavior are unchanged.
- Unlike `moduleResolution: "node16"` (tested and rejected — TS enforces `module` must also be `"Node16"`, a much bigger ESM migration), `"bundler"` has no such pairing requirement and is already used successfully elsewhere in this monorepo (`packages/database`, `packages/ai-engine`), just paired there with `module: "ESNext"` instead of `"CommonJS"` — confirmed by testing that `bundler` + `CommonJS` also compiles clean here.

## Verification
- `npx tsc --noEmit` in `apps/api` — clean, exit 0, zero warnings.
- `npm run build:api` from repo root — the exact script Render runs (`db:generate` → build `database` → build `ai-engine` → build `api`) — completes clean, exit 0.
- `npx vitest run src/tests/controllers` — 7/7 passed (no runtime/type regression from the resolution change).
- **[VERIFIED]** Render deploy with attempt 2 — build succeeded (`Build successful`), deployed, service live: schema migrations applied, `ACCOUNT_TYPES` seeded, server listening, health checks returning 200. Confirmed via the actual Render build log, not just local verification.

## Technical Notes
Branch: `hotfix/NEX-BUG-16b-moduleresolution-bundler` from `main` (attempt 1, `hotfix/NEX-BUG-16-tsconfig-build-fix`, is already merged as PR #38 but didn't fix the deploy — this is the follow-up). Merge straight to `main` per Solo Simplified Git Flow's hotfix rule, then re-trigger the Render deploy. This is what unblocks NEX-BUG-14/NEX-FEAT-16/NEX-BUG-15 from actually going live.
