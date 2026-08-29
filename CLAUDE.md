# Nexworth — Instructions for Claude Code

Full agent rules live in [.cursorrules](.cursorrules) (MANDATORY & STRICT — read it in full), cross-vendor entry point [AGENTS.md](AGENTS.md), and testing/architecture standards in `docs/standards/`. This file surfaces the rules most relevant to how Claude Code (and other Claude agents) must start and finish work here.

## Solo Simplified Git Flow (MANDATORY)

Do **not** use `develop` or `release/*`. Source of truth: `docs/standards/Development & Git/GIT_WORKFLOW.md` and `.cursorrules` rule #12.

1. Branch from **`main`**: `git checkout main && git pull && git checkout -b feature/NEX-xxx`
2. One branch = one ticket / one concern
3. Merge back to **`main`** (PR into `main` is fine)
4. Releases: tag `vX.Y.Z` — do not create `release/*` branches
5. Hotfix only: `hotfix/NEX-xxx` from `main` → merge to `main`

Tiny safe edits (typo / docs / one-line rule) may commit on `main` after pull.

## Task Tracking (Jira-style, MANDATORY)

This repo tracks work like Jira, in-repo:

- **Board**: `docs/IMPLEMENTATION_PLAN.md` — Epic → Story → Sub-task, with checkboxes and a Status badge (`[PLANNED] 📅` / `[COMPLETED] ✅`)
- **Cards**: `docs/jira-cards/<TICKET-ID>.md` — one file per ticket (Status/Priority/Assignee/Epic/Description/Acceptance Criteria/Technical Notes)

Before implementing anything (feature, fix, or refactor):

1. Add or update the relevant Epic/Story/Sub-task in `docs/IMPLEMENTATION_PLAN.md`, and create a `docs/jira-cards/<TICKET-ID>.md` card. Pick the next TICKET-ID after the highest one already in `IMPLEMENTATION_PLAN.md` (e.g. `NEX-FEAT-xx`, `NEX-BUG-xx`).
2. Tick `[x]` on each sub-task the moment it's actually done — not batched at the end.
3. When the Story is fully done, set Status to `[COMPLETED] ✅` in both the board and the jira-card, and fill in Technical Notes (files touched, migrations run, tests added).

This applies to every agent/subagent that writes code in this repo — never skip it, even for small changes.

See also: `.cursorrules` rules #10–#12, `AGENTS.md`, and `docs/standards/Development & Git/GIT_WORKFLOW.md`.

## UI data-testid (MANDATORY)

Every interactive element needs `data-testid="[module]-[feature]-[elementtype]-[xxx]"`. Reuse IDs from `docs/standards/QA & Testing/e2e-locators-map.md`. See `.cursorrules` rule #11.
