# Nexworth Testing Protocol (SOP)

This document outlines the mandatory steps for performing automated and manual tests within the Nexworth ecosystem to ensure data integrity and environment isolation.

## 1. Environment Isolation Rules
- **ALWAYS** use the Staging Database (`stg_nexworth_db`) for any test execution.
- **NEVER** use production organizations (e.g., 'neranchara') or real user accounts for automated regression tests.
- **TEST DATA ONLY**: Use the dedicated `Test Environment` organization and `test@nexworth.net` user.

## 2. Pre-Test Setup Procedure
1.  **Kill Active Node Processes**: Ensure no existing Prisma Client or Server is locking the database.
    ```powershell
    taskkill /F /IM node.exe
    ```
2.  **Reset Staging Database**: Perform a clean migration and seed.
    ```powershell
    npm run migrate:stg
    ```
3.  **Start Services in Staging Mode**:
    - **Backend**: `npm run dev:stg` (Must see `NODE_ENV=staging`)
    - **Frontend**: `npm run dev`

## 3. Test Execution
- Run specific logic tests:
  ```powershell
  npx playwright test tests/playwright/frontend/dashboard_behavior.spec.ts
  ```
- Run full regression:
  ```powershell
  npx playwright test tests/playwright/frontend/
  ```

## 4. Post-Test Cleanup
- Once tests pass, confirm stability on Staging.
- Switch back to Production environment (`npm run dev:prod`) only after all tests are green.
- **NEVER** leave the production server pointing to staging or vice versa in long-running processes.

---
*Last Updated: 2026-04-25 by Antigravity AI*
