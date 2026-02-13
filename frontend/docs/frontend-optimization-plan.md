# Frontend Optimization Plan (Art Design Pro)

## Goals

- Keep current business behavior unchanged while reducing maintenance cost.
- Separate user/admin session flows and route permissions.
- Standardize page-level data loading, error handling, and pagination.
- Improve type safety and reduce implicit `any` usage.

## Phase 1: Architecture Baseline (Done)

- User/Admin session split in store (`sessionType`, dedicated tokens).
- Router guard split for admin/user info fetching and unauth redirect.
- Role boundary cleanup (`R_USER` vs `R_ADMIN`/`R_SUPER`).
- Shared domain layer introduced under `src/app/email-platform/`:
  - constants: task status, transaction type
  - utils: format, message
  - composables: pagination

## Phase 2: Admin + Project Page Refactor (Done)

- Unified style for CRUD pages in `admin-panel` and `project`.
- Removed repeated cancel-check logic via shared helper.
- Replaced scattered `any` on critical paths with domain types.
- Unified pagination pattern and load/submit flow.

## Phase 3: Continuous Hardening (Next)

- Add route-level smoke tests (admin/user login + permission boundary).
- Add API contract tests for transformed page payloads.
- Introduce lint/type CI gate for changed pages.

## Code Standards

- Use shared utils/composables before writing local helpers.
- Keep API functions strongly typed (params + response).
- Keep `catch` blocks explicit (no silent `catch {}`).
- For destructive actions, always route through confirm + cancel-safe handler.
