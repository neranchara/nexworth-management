# Project Workflow Guidelines for AI Agents

This document defines the mandatory operational procedures for all AI coding assistants working on the Nexworth project. You MUST follow these steps for every task.

## 1. Code Management & Versioning (Git)
Whenever you are ready to commit changes, follow these exact steps:
1. **Branching**: 
   - Check for the latest version branch (e.g., `nexworth-v-2.x.x`). 
   - Create a new branch if a new version is required, or switch to the existing latest version branch.
   - **Command**: `git checkout -b nexworth-v-<version>`
2. **Cleanup & Committing**: 
   - **MANDATORY**: Delete all temporary scripts (e.g., in `backend/scripts/`), log files, or any unnecessary files created during the task before committing.
   - Add and commit your changes to the version branch.
   - **Command**: `git add .`, `git commit -m "<description>"`
3. **Merging to Main**:
   - Switch back to the `main` branch.
   - Merge the version branch into `main`.
   - **Command**: `git checkout main`, `git merge nexworth-v-<version>`

## 2. Quality Assurance & Data Safety
- **No Mockup Data**: Never use mockup data in Prisma or production. Use the `staging` environment for testing with mockup data if necessary.
- **Red Line Check**: Before committing, ensure there are no "red lines" (syntax errors or linting issues) in the modified files.
- **Testing**: 
   - Every time you add an API, function, or change logic, you MUST add a test case.
   - Run E2E tests using Playwright.
   - If tests fail, fix the bugs and re-run until all tests pass.
- **Database Environment Protocol**:
   - **STAGING (Local DB)**: Use **`.env.staging`** pointing to your **Local Database**. All development and E2E tests MUST happen here.
   - **PRODUCTION (Neon DB)**: Use **`.env.production`** pointing to **Neon (Cloud)**. This is the only source of truth. **DO NOT run tests here.**
   - **PRODUCTION (Local Backup)**: A local DB with production data is for **BACKUP ONLY**. **NEVER** use it for active work or development.

## 3. Communication & Approval
- **Function/Parameter Changes**: You MUST ask for permission before modifying any existing function signatures or parameters.
- **Refactoring**: Before refactoring, you must audit the entire related code block and request explicit permission.
