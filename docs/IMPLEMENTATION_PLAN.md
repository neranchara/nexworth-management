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

---

## 📅 Roadmap Summary (agent-facing — synced 2026-08-29)

### Done in code (do not rebuild)
- Phase 17; NEX-FEAT-01; NEX-BUG-01 (+ password toggle); NEX-FEAT-02  
- NEX-FEAT-06 (AuditLog base); NEX-FEAT-07 (View-As base); Phase 23 (FEAT-09, BUG-11)  
- NEX-BUG-12 (Liability sign convention)  
- Invitation **stack** (model + API + Team UI + accept page) — treat as PARTIAL gaps only

### Immediate focus (safe for next agent)
0. **NEX-FEAT-11 / NEX-FEAT-12** (Phase 24) — DB-driven multipliers + ledger-backed balance edits, in progress on `feature/NEX-BUG-12-ledger-integrity`
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
