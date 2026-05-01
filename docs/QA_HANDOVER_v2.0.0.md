# QA Handover Note: Nexworth Management v2.0.0
**Target Suite**: Regression & Frontend Tests
**Version**: 2.0.0 (Modern UI Update)

## 1. Overview
The v2.0.0 update introduces a "Modern Design System" which involves changes in Typography, Component Layout, and Data Display. Existing tests using hardcoded CSS classes or specific text labels may fail.

## 2. Authentication & Test Data
To satisfy behavior-based tests, ensure the database is seeded with the following updated script:

- **Seeding Command**: `cd backend && npx cross-env NODE_ENV=staging npx prisma db seed`
- **Primary Test User**: `test-admin@nexworth.net`
- **Password**: `P@ssword123`
- **Expected Metrics (for current month)**:
  - Income (Emergency): **45,000**
  - Internal Transfer (Savings): **5,000**

## 3. Selector Updates (Crucial)

### A. Navbar & Role Badges
- **Typography Change**: Role badges and User names have moved from `.font-medium` to **`.font-semibold`**.
- **Display Change**: The navbar now displays the **User's Full Name** (e.g., "Test Admin") instead of the email address if profile data exists.
- **Visibility**: The Role Badge is now responsive (`hidden lg:flex`). Ensure your Playwright Viewport is set to at least **1280x720**.

**Recommended Locator Change:**
```typescript
// Old
await expect(page.locator('.font-medium', { hasText: 'Admin' })).toBeVisible();

// New (Resilient)
await expect(page.locator('span', { hasText: /Admin/i }).first()).toBeVisible();
```

### B. Dashboard Headers (Renamed)
The following headers have been updated to match the new financial domain terminology:
- **Old**: "Monthly Cashflow Summary" -> **New**: `Financial Velocity` (h2)
- **Old**: "Multi-Goal Tracking" -> **New**: `Milestones` (h2)
- **Health Score**: Stays as `Financial Health` (h2), but verify it's not nested in an `h3`.

## 4. UI Stability Fixes
- **Hydration Mismatch**: The dashboard now uses an `isHydrated` state to prevent SSR flickering. If tests run too fast, wait for `h1:has-text("Welcome")` to be visible before asserting metrics.
- **HMR Loops**: The dev server is now isolated. Ensure you run tests against `127.0.0.1:3000` to avoid potential hostname resolution issues.

## 5. Next Steps for QA
1. Update `auth.spec.ts` to look for "Test Admin" or use a Regex for the role.
2. Update `dashboard.spec.ts` with the new h2 header names.
3. Verify the staging environment using the provided seed data before reporting failures.
