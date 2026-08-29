# AGENTS.md — Nexworth (all AI coding agents)

This file applies to **every** agent/tool working in this repository: Cursor, Claude Code, Codex, GitHub Copilot, Gemini, Antigravity, Windsurf, Continue, subagents, etc.

## Read first (mandatory)

1. **[.cursorrules](.cursorrules)** — full mandatory project rules (#1–#12)
2. **[docs/standards/Development & Git/GIT_WORKFLOW.md](docs/standards/Development%20&%20Git/GIT_WORKFLOW.md)** — Solo Simplified Git Flow
3. **`docs/standards/`** — QA, testing, architecture standards (submodule; sync if empty)

If `docs/standards` is empty:

```bash
git -c protocol.file.allow=always submodule update --init --recursive
```

## Solo Simplified Git Flow (mandatory)

Do **not** use classic GitFlow (`develop`, `release/*`).

| Action | Rule |
|--------|------|
| Default branch | `main` |
| Feature work | `feature/NEX-xxx` branched from `main`, merge back to `main` |
| Production emergency | `hotfix/NEX-xxx` → `main` |
| Release | git tag `vX.Y.Z` (no `release/*` branches) |
| Scope | One branch = one ticket / one concern |

```bash
git checkout main && git pull
git checkout -b feature/NEX-xxx
# ... implement, test, commit ...
git checkout main && git pull
git merge feature/NEX-xxx
git branch -d feature/NEX-xxx
```

Tiny safe edits (typo / docs / one-line rule) may commit directly on `main` after pull.

## Other must-follow rules (summary)

- Ask permission before changing existing functions, parameters, or doing refactors (`.cursorrules` #1–3).
- No Prisma mock data; tests use **staging DB** (#4–5, #9).
- After fixes: no red-line errors; add/run tests for new logic (#6–8).
- Task tracking in `docs/IMPLEMENTATION_PLAN.md` + `docs/jira-cards/` (#10).
- UI: every interactive element needs `data-testid` in format `[module]-[feature]-[elementtype]-[xxx]` (#11).

## Claude Code

See also [CLAUDE.md](CLAUDE.md) for Claude-specific entry notes (same rules apply).

## Skill (Cursor agents)

When available, follow `.agents/skills/project-workflow/SKILL.md` for the same Solo Simplified Flow.
