# Nexworth: Production Configuration Policy

This document defines the mandatory rules for managing production settings and environment variables.

## 1. Zero-Secret-in-Git Rule
- **NEVER** commit real production values to any file in the repository.
- All `.env.production` files must remain as templates or be excluded from version control via `.gitignore`.
- Production secrets (API Keys, DB URLs, Secrets) must be managed **ONLY** via the Render/Vercel dashboards.

## 2. Environment Isolation
- **Local Dev**: Use `.env.local` only.
- **QA/Testing**: Use `.env.staging` only.
- **Production**: Use system environment variables.
- Changes to the configuration logic in `backend/src/config/index.ts` must be audited for production impact before merging.

## 3. Merge Protection
- No code should be merged into `main` without verifying that it uses the centralized `config` object instead of hardcoded strings.
- Any change to sensitive functions (Auth, DB Schema) requires an explicit permission from the lead developer (as per User Global Rules).

## 4. Operational Safety
- Production database operations (Migration, Seed) must never be run from a local machine unless absolutely necessary.
- The `npm run prod` command is the only allowed way to interact with production config locally, and it must be guarded by the `prod-guard.ts` confirmation system.

---
**Violation of these rules may lead to production downtime or security breaches.**
