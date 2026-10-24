# Nexworth Master Implementation Board (Jira-Sync)

> [!IMPORTANT]
> **Primary Source of Truth (Jira):** [nexworthnextgen.atlassian.net](https://nexworthnextgen.atlassian.net/jira/software/projects/KAN/boards/2/timeline)  
> **In-repo agent sync (this file):** Every coding agent (Cursor / Claude / Codex / Copilot / etc.) MUST treat statuses below as the shared board. Do **not** re-implement stories marked `[DONE IN CODE]` or invent `develop` branches (see Solo Simplified Git Flow).

---

## Agent Sync Contract (อ่านก่อนลงมือ)

| สถานะในบอร์ดนี้ | ความหมาย | Agent ทำอะไร |
|-----------------|----------|--------------|
| `[DONE IN CODE] ✅` | มี implementation ใน repo แล้ว | **ห้ามสร้างซ้ำ** — ถ้าจะแตะต้องเป็น bugfix / harden / test เท่านั้น และขออนุญาตก่อนแก้ function เดิม |
| `[PARTIAL] ⚠️` | มีของแล้วแต่ยังไม่ครบ AC | ทำเฉพาะ **ช่องว่างที่ระบุ** ใน Sub-Tasks ที่ยัง `[ ]` |
| `[PLANNED] 📅` | ยังไม่เริ่ม / ยังไม่มีของหลัก | สร้างใหม่ได้ตาม AC + สร้าง/อัปเดต `docs/jira-cards/<TICKET-ID>.md` |
| `[NEEDS VERIFY] 🔎` | โค้ดมี แต่ยังไม่ยืนยันบน staging/E2E | ห้าม rewrite — ทำ verification / handover QA |

**กฎกันงงระหว่าง Agent**

1. ก่อนเริ่มงาน: อ่าน Epic/Story นี้ + grep โค้ดว่าของมีแล้วหรือยัง (model/route/UI)
2. หนึ่ง branch = หนึ่ง ticket (`feature/NEX-xxx` จาก `main`) — Solo Simplified Flow
3. ระหว่างทำ: tick `[x]` ทีละข้อเมื่อเสร็จจริง ห้ามติ๊กยก Epic ทั้งก้อนถ้า verify ไม่ครบ
4. ถ้าพบว่าสถานะในไฟล์นี้ผิดจากโค้ด: **แก้บอร์ดนี้ก่อน** แล้วค่อย code
5. รายละเอียด Git: `docs/standards/Development & Git/GIT_WORKFLOW.md` · กฎรวม: `.cursorrules` · ข้ามค่าย: `AGENTS.md`

**Last synced against codebase:** 2026-08-29 (agent board reconciliation)

---

## 🟢 [EPIC] Phase 17: Admin/Ops Theme Decoupling & UI Hardening
- **Status:** [DONE IN CODE] ✅
- **Priority:** High
- **Description:** Separate Admin/Ops styling from the main user theme to prevent regressions.

---

## 🟣 [EPIC] Phase 18: Stability & UX Polish (v3.2.0)
- **Status:** [PARTIAL] ⚠️ — feature work largely landed; encoding/slip/E2E still need staging proof
- **Priority:** High
- **Description:** Resolve production-blocking UI bugs, stabilize environment, cashflow health, password reset.

### 📘 [STORY] NEX-FEAT-01: Cashflow Health Indicator & Liquidity Settings
- **Status:** [DONE IN CODE] ✅
- **Evidence:** `CashflowHealthWidget.tsx`, `LiquiditySettingsModal.tsx`, widget tests
- **Sub-Tasks:**
  - [x] Create `CashflowHealthWidget.tsx` for the main dashboard.
  - [x] Implement `LiquiditySettingsModal.tsx` with Min (Danger) and Max (Safe) sliders.
  - [x] Add persistence layer (API/DB) for custom thresholds.
  - [x] Integrate Logic: Danger / Watch / Safe.
  - [x] Integration tests (PATCH + Dashboard sync).
  - [ ] **[NEEDS VERIFY]** Staging UI check with BA screenshot AC (optional QA pass).

### 📘 [STORY] NEX-BUG-01: Unified Account Settings & Profile Overhaul
- **Status:** [DONE IN CODE] ✅
- **Evidence:** `dashboard/setup/page.tsx` tabs: profile, security, team; password eye toggle on profile
- **Sub-Tasks:**
  - [x] Create setup page shell.
  - [x] Mobile Navigation Drawer & Sidebar stabilization.
  - [x] Profile & LINE UI (Emerald).
  - [x] Security tab + Transparency Logs.
  - [x] Password show/hide toggle (formerly NEX-BUG-08).

### 📘 [STORY] NEX-BUG-03: Data Integrity & Thai Encoding Fix
- **Status:** [PARTIAL] ⚠️
- **Description:** Thai `????` / mojibake — partially mitigated (Prompt font, per-route charset, label merge helpers) but not fully proven org-wide.
- **Sub-Tasks:**
  - [x] Frontend Thai-capable font (`Prompt` + fallbacks) and form font inheritance.
  - [x] Some API routes set `charset=utf-8` (e.g. configs/categories).
  - [x] `mergePageLabels` / sidebar label corruption guards (partial page coverage).
  - [ ] **Gap:** Global Fastify `onSend` charset enforcement (claimed earlier — verify/add if missing).
  - [ ] **Gap:** Apply safe label merge on all `UI_LABELS_*` consumers (assets/accounts/liabilities/types).
  - [ ] **[NEEDS VERIFY]** Staging smoke: Categories / Assets / Transaction modal show Thai correctly.

### 📘 [STORY] NEX-BUG-04: AI Slip Scanning Enhancement
- **Status:** [PARTIAL] ⚠️
- **Description:** Slip UX exists (modal + scanner). Primary web path uses **local OCR + `/ai/verify-slip`**, not only Gemini `/ai/scan-slip`. Do not “re-add scanner from scratch”.
- **Evidence:** Transactions modal Smart Slip Scanner; `ocrScanner.ts` / `qrScanner.ts`; API `scan-slip` + `verify-slip` remain.
- **Sub-Tasks:**
  - [x] Transaction Modal + scanner entry points.
  - [x] Server logging for AI extraction failures.
  - [x] Optional-field UUID / `fromAccountId` mapping fixes (as previously noted).
  - [ ] **Gap:** Align unit tests with current UI flow (old tests expected `/ai/scan-slip` + different testids).
  - [ ] **[NEEDS VERIFY]** Staging: scan real slip → amount/date autofill without false failure toast.

### 📘 [STORY] NEX-FEAT-02: Secure Password Reset Flow (v3.2.0)
- **Status:** [DONE IN CODE] ✅
- **Evidence:** `PasswordReset` model; auth handlers; `reset-password` page; `password_reset.test.ts`

### 📘 [STORY] NEX-BUG-02 / NEX-BUG-06 (legacy polish & auth query token)
- **Status:** [DONE IN CODE] ✅ (keep for history; do not reopen unless regression)

---

## 🔵 [EPIC] Phase 19: Team Management & Role-Based Access Control (RBAC)
- **Status:** [PARTIAL] ⚠️ — **core invite stack already exists; do NOT recreate models/routes**
- **Priority:** High
- **Description:** Harden/complete member invitation & roles for Org owners (gap-close, not greenfield).

### 📘 [STORY] NEX-FEAT-03: Member Invitation & Role Assignment
- **Status:** [PARTIAL] ⚠️
- **Already in code (DO NOT rebuild):**
  - Prisma `Invitation` model
  - API prefix `/api/v1/invitations` (+ controller)
  - Setup → Team tab (`dashboard/team/page.tsx`)
  - Accept page `apps/web/src/app/invite/accept/page.tsx`
- **Remaining Sub-Tasks (gaps only):**
  - [ ] **Audit AC:** Confirm roles (Admin / Editor / Viewer or current role names) match BA matrix.
  - [ ] **RBAC:** Verify invite/revoke restricted to Org Admin (middleware/permission resource).
  - [ ] **Mailer:** Confirm invitation email template sent in staging (not only DB row).
  - [ ] **UI polish / i18n / data-testid** for Team + Accept flows per e2e map.
  - [ ] **[NEEDS VERIFY]** End-to-end invite → accept → member appears (staging).

---

## 🟡 [EPIC] Phase 20: Security Hardening & Data Privacy
- **Status:** [PLANNED] 📅 (mostly net-new vs current token-in-storage model)
- **Priority:** High

### 📘 [STORY] NEX-FEAT-04: Transition to HttpOnly & Secure Cookies for JWT
- **Status:** [PLANNED] 📅
- **Note:** App currently uses `localStorage` / `sessionStorage` token + Axios `Authorization` header. This is real greenfield relative to current auth client.
- **Sub-Tasks:**
  - [ ] Backend: `@fastify/cookie` + HttpOnly Secure SameSite cookie for JWT.
  - [ ] Frontend: `credentials: 'include'`; stop persisting JWT in localStorage (migration plan).
  - [ ] Impersonation / View-As session must keep working with cookie model.
  - [ ] Staging tests for cookie transport + XSS token-not-readable checks.

### 📘 [STORY] NEX-FEAT-05: AES-256-GCM Data Encryption at Rest
- **Status:** [PLANNED] 📅
- **Caution:** High risk to reporting/query/sort. Requires SA design before coding. Do not encrypt ad-hoc in random controllers.
- **Sub-Tasks:**
  - [ ] SA doc: which fields (accountNumber? notes? balances?) and migration strategy.
  - [ ] Shared crypto utility AES-256-GCM.
  - [ ] Schema + backfill plan on staging only first.
  - [ ] Tests: encrypt write / decrypt read; prove reports still work.

---

## 📜 [EPIC] Phase 21: Governance & Audit (KAN-97)
- **Status:** [PARTIAL] ⚠️ — **AuditLog middleware already exists**
- **Priority:** High

### 📘 [STORY] NEX-FEAT-06: Institutional Audit Logging System (KAN-98)
- **Status:** [DONE IN CODE] ✅ (base)
- **Evidence:** `AuditLog` model; `prisma.$use` mutation hook in `apps/api/src/lib/prisma.ts`; `audit_log.test.ts`
- **Remaining (optional harden):**
  - [ ] Document covered models vs skipped (`Session`, `ImpersonationLog`, batch Many ops).
  - [ ] Ops UI explorer completeness vs BA AC (if gaps).

### 📘 [STORY] NEX-SEC-01: Sensitive Data Masking (PII Masking) in Audit Logs (KAN-103)
- **Status:** [PLANNED] 📅
- **Gap:** Current middleware stores raw `JSON.parse(JSON.stringify(old/new))` — **no masking yet**.
- **Sub-Tasks:**
  - [ ] Utility: recursive `maskSensitiveData` (password hashes, tokens, secrets).
  - [ ] Integrate into audit middleware before write.
  - [ ] Staging verify: no raw credentials in `AuditLog` blobs.

---

## 🛠️ [EPIC] Phase 22: Operations & Support Tools (KAN-108)
- **Status:** [PARTIAL] ⚠️ — **impersonation core exists**
- **Priority:** High

### 📘 [STORY] NEX-FEAT-07: Admin Impersonation Mode (View-As) (KAN-109)
- **Status:** [DONE IN CODE] ✅ (base)
- **Evidence:** `ImpersonationLog`; `impersonation.middleware` (read-only); Axios blocks mutations when `is_impersonated`; `DashboardShell` View-As banner; ISP tests
- **Remaining Sub-Tasks (gaps only):**
  - [ ] Confirm Ops Center “View-As” entry button covers all BA AC.
  - [ ] **[NEEDS VERIFY]** Staging: start/stop View-As, mutations blocked, audit/security logs visible.

### 📘 [STORY] NEX-FEAT-08: Balance Reconciliation & Data Sanitizer (Fix-it Tool)
- **Status:** [PARTIAL] ⚠️ / [PLANNED] 📅
- **Note:** Some reconciliation/diagnostic pieces may exist under admin ops — **grep before writing new engine**.
- **Sub-Tasks:**
  - [ ] Inventory existing reconcile/diagnostic endpoints & scripts.
  - [ ] Fill only missing: aggregation query / repair script / staging tests per BA AC.

---

## 🟠 [EPIC] Phase 23: Credit Card Debt Transactions
- **Status:** [DONE IN CODE] ✅
- **Priority:** High
- **Description:** Credit card charge/payment as first-class transactions.

### 📘 [STORY] NEX-FEAT-09: รูดบัตร & ชำระหนี้บัตรเครดิต ผ่านหน้าประวัติธุรกรรม
- **Status:** [DONE IN CODE] ✅
- **Evidence:** `LIABILITY_PAYMENT` behavior; system category; transfer override; backfill script; tests in `p6_transaction_behavior.test.ts`

### 🐛 [STORY] NEX-BUG-11: "ชำระหนี้" (DEBT) increases debt instead of decreasing
- **Status:** [DONE IN CODE] ✅
- **Evidence:** `getAssetMultiplier` special-case for `DEBT` + liability; unit tests

### 📘 [STORY] NEX-FEAT-14: Group + sort the category dropdown on Transactions page
- **Status:** [DONE IN CODE] ✅
- **Evidence:** `<optgroup>` grouping by `TransactionType`, Thai-locale alphabetical sort, in `transactions/page.tsx`

---

## 🔵 [EPIC] Phase 24: Ledger Integrity Foundation
- **Status:** [DONE IN CODE] ✅ — all 3 stories done on `feature/NEX-BUG-12-ledger-integrity`, staging migrated + verified, not yet merged to `main`
- **Priority:** Critical
- **Description:** Close gaps found comparing Nexworth against standard accounting/banking principles — inconsistent sign conventions and manual balance edits that bypass the transaction ledger entirely. Prerequisite before extending the system with new use cases/behaviors (see Phase 25+ backlog discussion, not yet ticketed).

### 🐛 [STORY] NEX-BUG-12: Liability.amount sign convention conflict
- **Status:** [DONE IN CODE] ✅
- **Evidence:** `financial-record.controller.ts` now stores `Math.abs(amount)` for liabilities (was `-Math.abs`); `financial-record.controller.test.ts` (4 tests, mocked prisma)
- **Note:** Checked staging for pre-existing `amount < 0` rows before fixing — found only 1 (mock `บัตรเครดิต UOB`, self-caused by the NEX-BUG-11 correction, not this bug) — no other data affected.

### 📘 [STORY] NEX-FEAT-11: Move assetMultiplier/liabMultiplier to DB (finish P6 migration)
- **Status:** [DONE IN CODE] ✅
- **Description:** `defaultDirection`/`isExpenseLike`/`cashflowBucket` are already DB-driven per `TransactionType`; the two multipliers are still hardcoded in the `BEHAVIOR_METADATA` TS constant. Finish the migration so new behaviors are a data change, not a code change.
- **Sub-Tasks:**
  - [x] Add `assetMultiplier`/`liabMultiplier` columns to `TransactionType` (schema).
  - [x] `getAssetMultiplier()`: accept DB values, prefer them over the constant fallback (same dual-path pattern as `getDirection`/`getCashflowBucket`).
  - [x] Update `adjustAccountBalance` call site to pass DB values through.
  - [x] Backfill script for existing `TransactionType` rows — ran on staging, 136 rows backfilled, verified DEBT's fixed `liabMultiplier=-1` carried through correctly.
  - [x] Seed new orgs with both columns.
  - [x] Unit tests (5 new tests).

### 📘 [STORY] NEX-FEAT-12: Route manual balance edits through the Transaction ledger
- **Status:** [DONE IN CODE] ✅
- **Description:** Liabilities/Assets page balance edits currently upsert `Liability.amount`/`Asset.amount` directly, bypassing the transaction ledger — the root cause that made NEX-BUG-12 possible. Post a real `BALANCE_ADJUSTMENT` transaction instead, reusing `adjustAccountBalance`.
- **Sub-Tasks:**
  - [x] Add `BALANCE_ADJUSTMENT` to `TransactionBehavior` enum + metadata.
  - [x] Seed "ปรับยอดเปิดบัญชี" system type/category for new + existing orgs.
  - [x] Rework `createFinancialRecordHandler`/`updateFinancialRecordHandler` to compute delta and post a Transaction instead of raw upsert.
  - [x] Verify response contract unchanged (frontend untouched).
  - [x] Test coverage (7 new + 3 fixed existing tests) + manual E2E on staging (verified against the real UOB mock account — delta, Transaction row, and resulting balance all correct).

### 🐛 [STORY] NEX-BUG-13: Net Worth / dashboard totals count inactive accounts
- **Status:** [DONE IN CODE] ✅ — done on `fix/NEX-BUG-13-networth-inactive-accounts` (separate unmerged branch — not yet in this branch's history)
- **Evidence:** `isActive: true` added to the account query in `calculateFinancialStats`; verified live on staging (toggled a real account, confirmed totals moved by exactly its balance and restored correctly)

### 📘 [STORY] NEX-FEAT-15: Filter inactive accounts out of account-picker dropdowns
- **Status:** [DONE IN CODE] ✅
- **Description:** Follow-up to NEX-BUG-13 — 7 account `<select>`s across 6 pages let users pick an inactive account for new/edited records. Filtered them out everywhere, using `accounts.filter(a => a.isActive || a.id === <currentFormValue>)` so editing a record that already references a since-deactivated account never silently blanks the field.
- **Sub-Tasks:**
  - [x] `DashboardCockpit.tsx` (2 selects), `transactions/page.tsx` (extended `groupedAccountOptions`), `goals/page.tsx`, `assets/page.tsx`, `liabilities/page.tsx`, `loan-tracker/page.tsx` (2 selects).
  - [x] `tsc --noEmit` clean (also had to widen `DashboardCockpit.tsx`'s local `accounts` state type to include `isActive`).
  - [ ] **[NEEDS VERIFY]** Not click-tested live in a browser (would need authenticated sessions across 6 pages) — logic verified by type-check + code review only.

---

## 🟣 [EPIC] Phase 25: Transaction Type Taxonomy Cleanup
- **Status:** [DONE IN CODE] ✅
- **Priority:** High
- **Description:** Align user-facing types with financial rules — ออม ≠ ลงทุน; GOAL account ≠ GOAL_SAVING behavior.

### 📘 [STORY] NEX-FEAT-13: Split ออม/ลงทุน → ออม (SAVING) + ลงทุน (INVESTMENT)
- **Status:** [DONE IN CODE] ✅
- **Sub-Tasks:**
  - [x] Seed new orgs with `ออม` + `ลงทุน` (API + bot + seed-master).
  - [x] Remap categories (saving / investment / goal-park / expense reclass).
  - [x] Backfill script covering org-scoped **and** global `organizationId=null` leftovers.
  - [x] Unit tests (`saving_investment_split.test.ts` 5/5).
  - [x] Ran on `stg_nexworth_db` — legacy `ออม/ลงทุน` active count = 0.

---

## 🟢 [EPIC] Phase 26: Goals Experience Consistency
- **Status:** [PLANNED] 📅
- **Priority:** Medium
- **Description:** The formal `Goal` model (created via the Goals page "+" button) and `GOAL`/`GOAL_SAVING`-type Accounts (created via the Accounts page) are two parallel ways users end up tracking a savings goal. The Dashboard cockpit widget already has a fallback that synthesizes goal cards from GOAL-type accounts when no formal `Goal` rows exist — the Goals page itself does not, so a user who only ever created GOAL-type accounts sees their goals on the Dashboard but an empty list on the dedicated Goals page.

### 🐛 [STORY] NEX-BUG-14: Goals page doesn't show GOAL/GOAL_SAVING-type accounts as goals
- **Status:** [COMPLETED] ✅
- **Evidence:** Confirmed on `stg_nexworth_db` for user `neranchara.ksr@gmail.com` (org "bigboss") — 0 rows in `Goal` table, but 4 active `GOAL`-type accounts ("Cloud Pocket ทำบุญ", "Cloud Pocket ค่าใช้จ่ายรถ", "Cloud Pocket เที่ยว", "ออมสิน บัญชีเงินซื้อรถ") with `targetAmount` set — these show on the Dashboard "Financial Goals" widget (via its fallback in `calculateFinancialStats`) but not on `/dashboard/goals`.
- **Sub-Tasks:**
  - [x] `listGoalsHandler` (`apps/api/src/controllers/goal.controller.ts`): when the org has no real `Goal` rows, synthesize read-only goal entries from `GOAL`/`GOAL_SAVING`-type accounts (same pattern as `dashboard.controller.ts`'s fallback), flagged `isVirtual: true`.
  - [x] `getGoalsSummaryHandler`: same fallback for the summary totals (`totalGoalsValue`/`totalCollected`/`goalCount`).
  - [x] Frontend `goals/page.tsx`: hide edit/delete controls on `isVirtual` entries (there's no `Goal` row to update/delete via `PUT/DELETE /goals/:id`).
  - [x] Unit tests for the new fallback paths (4 new tests, `src/tests/controllers/goal.controller.test.ts`).
  - [ ] **[NEEDS VERIFY]** staging: confirm the 4 real accounts above now render on the Goals page (not click-tested live — no login credentials in this session; verified against real DB row values via unit tests instead).

### 🐛 [STORY] NEX-BUG-15: Desktop sidebar hides "เป้าหมาย" (Goals); mobile bottom nav shows it unconditionally
- **Status:** [COMPLETED] ✅
- **Root cause:** `'goals'` was never added to the RBAC resource list (`organization.service.ts`'s `resources` array, `seed-master-db.ts`'s `ALL_RESOURCES`) — no role in any org has a `Permission` row for it, so `hasPermission('goals')` is false for everyone except system admins. Desktop `Sidebar.tsx` filters `MAIN_NAV_LINKS` through `hasPermission()` and drops Goals; `MobileBottomNav.tsx` hardcodes its own list with no permission check at all, so it shows Goals regardless — hence the two navs visibly disagree.
- **Sub-Tasks:**
  - [x] Add `'goals'` to `resources` in `organization.service.ts` and `ALL_RESOURCES` in `seed-master-db.ts`.
  - [x] Backfill script: upsert a `'goals'` Permission row for every existing Role (full CRUD for `Admin`, view-only for everyone else) — ran against staging, 54 roles updated.
  - [x] `MobileBottomNav.tsx`: gate its Goals tab on `hasPermission('goals')` too.
  - [x] 3 unit tests for the nav permission gate.
  - [x] **[VERIFIED]** staging: confirmed directly in the DB that `neranchara.ksr@gmail.com`'s Admin role now has full `goals` permission.
  - [x] **[VERIFIED]** production: backfill run against the live production DB by the user — "Found 13 roles across all orgs" / "13 Permission rows upserted".

---

## 🔴 [EPIC] Hotfix: Production Deploy Blockers
- **Status:** [COMPLETED] ✅
- **Priority:** Critical

### 🐛 [STORY] NEX-BUG-18: One-off scripts silently ignore `DATABASE_URL` shell overrides
- **Status:** [COMPLETED] ✅
- **Evidence:** A diagnostic script run with `$env:DATABASE_URL="<production neon URL>" npx tsx src/scripts/...` produced output identical to a local staging run. Added a connection self-check and confirmed it: connects to local `stg_nexworth_db` regardless of the shell's `DATABASE_URL`.
- **Root cause:** Scripts importing the shared `lib/prisma.ts` client get a `PrismaClient` with no `datasources` override — Prisma's generated client auto-loads `packages/database/.env` (hardcoded to local staging), which wins over the shell's exported `DATABASE_URL`. **This means NEX-BUG-15's earlier "production" backfill (reported "13 roles") almost certainly never reached real production** — it was local staging at an earlier point in this session. The live Render-deployed API itself is unaffected (`config/index.ts` skips local dotenv loading when `RENDER` is set).
- **Sub-Tasks:**
  - [x] New `apps/api/src/lib/prisma-script.ts` — explicit `datasources: { db: { url: process.env.DATABASE_URL } }` override + `logConnectedDatabase()` self-check (prints the DB name only, never credentials), exits clearly if `DATABASE_URL` isn't set.
  - [x] `backfill-goals-permission.ts` switched to the new helper.
  - [x] New `audit-account-balances.ts` (parameterized by email + optional account type) — reconciles stored `Asset.amount` against a fresh sum of transaction history, flags likely duplicates.
  - [x] `tsc --noEmit` clean; verified the override actually works by pointing at a different local DB and seeing the self-check output change.
  - [x] **[VERIFIED]** Re-ran `backfill-goals-permission.ts` against real production (`neondb`) from a standalone PowerShell window — `Found 13 roles across all orgs` / `13 Permission rows upserted`. Root cause of the repeated false negatives: running the same commands in an **IDE-integrated terminal (Cursor)** silently re-pointed `DATABASE_URL` at local staging regardless of the manual `$env:` override — a standalone OS terminal does not have this problem.
  - [ ] Not done (out of scope): re-verify whether any *other* historical backfill script's claimed staging/production run was similarly actually a no-op against the wrong DB.

### 🐛 [STORY] NEX-BUG-17: Production `TransactionType` table missing `assetMultiplier`/`liabMultiplier` — every transaction/dashboard/loan query crashed
- **Status:** [COMPLETED] ✅ (pending deploy)
- **Evidence:** Once NEX-BUG-16 got the API actually deploying, Render logs showed `PrismaClientKnownRequestError P2022`: `The column 'TransactionType.assetMultiplier' does not exist in the current database` — every query touching `TransactionType` (Dashboard, Transactions, Loan Tracker) crashed, which looked like "all data gone" but wasn't.
- **Root cause:** NEX-FEAT-11 added these columns to `schema.prisma` and backfilled them on **staging only** (`prisma db push`, one-off script) — the corresponding `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` lines were never added to the hand-rolled `runSchemaMigrations()` boot function in `server.ts` that production actually relies on for schema sync (this repo has no `prisma migrate` history).
- **Sub-Tasks:**
  - [x] `server.ts`: add the two missing `ADD COLUMN IF NOT EXISTS` lines for `TransactionType.assetMultiplier`/`liabMultiplier` (nullable `Int?`, purely additive).
  - [x] Confirmed `getAssetMultiplier()` already falls back safely to the hardcoded `BEHAVIOR_METADATA` constant when the DB value is `null` — production rows will be `NULL` (no backfill run there) but financial math is unaffected, identical to pre-NEX-FEAT-11 behavior.
  - [x] `tsc --noEmit` clean.
  - [ ] **[NEEDS VERIFY]** after deploy: Dashboard/Transactions/Loan Tracker show real data again on production.
  - [ ] Optional, non-blocking follow-up: run the NEX-FEAT-11 backfill script against production so the columns get real per-row values instead of relying on the fallback indefinitely.

### 🐛 [STORY] NEX-BUG-16: `apps/api` Render build fails — tsconfig `moduleResolution` removed in TypeScript 6.x
- **Status:** [PLANNED] 📅 (attempt 1 merged but did NOT fix the Render build — attempt 2 open)
- **Evidence:** Render deploy of the NEX-BUG-15 merge (`24e0eac`) failed: `error TS5108: Option 'moduleResolution=node10' has been removed`.
- **Sub-Tasks:**
  - [x] Attempt 1 (PR #38, merged): `ignoreDeprecations` `"5.0"` → `"6.0"` — verified locally (`tsc`, `build:api`), **but Render redeploy still failed with the identical error.**
  - [x] Attempt 2 (`hotfix/NEX-BUG-16b-moduleresolution-bundler`): drop `moduleResolution: "node"` + `ignoreDeprecations` entirely, use `moduleResolution: "bundler"` (paired with the existing `module: "CommonJS"`) — doesn't depend on deprecation-suppression at all. Verified locally: `tsc --noEmit`, `npm run build:api`, and the controller test suite all clean.
  - [ ] **[NEEDS VERIFY]** Actual Render deploy succeeds with attempt 2 — don't trust local verification alone this time, confirm the real build log.
  - [ ] Once deploy is green: re-verify NEX-BUG-14/NEX-FEAT-16/NEX-BUG-15 are actually live.

---

## 🟢 [EPIC] Phase 27: Transactions Page UX — Filtered Summary
- **Status:** [PLANNED] 📅
- **Priority:** Low
- **Description:** User-requested enhancement — show a totals summary (income/expense/net) for whatever subset of transactions the current filters (month/year/search/type/category/account) resolve to, instead of only the raw list.

### 📘 [STORY] NEX-FEAT-16: Show income/expense/net summary for the active transaction filter
- **Status:** [COMPLETED] ✅
- **Sub-Tasks:**
  - [x] Compute totals from `sortedTransactions` (the already-filtered list) in `apps/web/src/app/dashboard/transactions/page.tsx`.
  - [x] Render a small summary row (count, total income, total expense, net) above the transactions table.
  - [x] i18n keys in `th.json`/`en.json` under `transactions.summary`.
  - [x] `tsc --noEmit` clean.
  - [x] 2 unit tests (`TransactionsFilteredSummary.test.tsx`).

---

## 📅 Roadmap Summary (agent-facing — synced 2026-08-29)

### Done in code (do not rebuild)
- Phase 17; NEX-FEAT-01; NEX-BUG-01 (+ password toggle); NEX-FEAT-02  
- NEX-FEAT-06 (AuditLog base); NEX-FEAT-07 (View-As base); Phase 23 (FEAT-09, BUG-11)  
- NEX-BUG-12 (Liability sign convention); NEX-FEAT-11 / NEX-FEAT-12 (Phase 24)  
- **NEX-FEAT-13** (ออม/ลงทุน split) — Phase 25  
- Invitation **stack** (model + API + Team UI + accept page) — treat as PARTIAL gaps only

### Immediate focus (safe for next agent)
1. **NEX-BUG-03** — finish encoding gaps + staging verify Thai UI  
2. **NEX-BUG-04** — align slip tests + staging real-slip verify  
3. **NEX-SEC-01** — PII masking on existing AuditLog middleware  
4. **NEX-FEAT-03 remaining** — invite email + RBAC AC + E2E verify (not new schema)

### Up next (after verify / with SA)
5. **NEX-FEAT-04** HttpOnly cookies (auth migration)  
6. **NEX-FEAT-05** encryption at rest (**SA design first**)  
7. **NEX-FEAT-08** reconcile tool — inventory then gap-fill  
8. Production E2E handover / release tagging on `main` (Solo Simplified Flow)

### Explicitly deferred / not on active board unless regression
- NEX-BUG-05 Admin Ops polish, NEX-BUG-07 API 400 — re-open only with new bug report evidence
