# Implementation Plan: Operations Dashboard Governance, Task Ownership & Trustworthy Export

**Feature Branch**: `026-phase3-operations-governance`  
**Version**: `v0.26.0`  
**Target Architecture**: React / TypeScript / Vite Application (`src/`) & Node/Express Services (`server/`)  

---

## Technical Architecture & Root Cause Analysis

### 1. Project Directory Contradiction (`src/components/ProjectListModal.tsx` & `src/App.tsx`)
- **Root Cause**:
  In `ProjectListModal.tsx`, `fetchProjects()` calls `GET /api/projects`. If the request fails, returns an empty array, or encounters an unhandled authentication state (such as missing token in `CLOUD_MODE`), `ProjectListModal` sets `projects = []` and renders `"No production projects found."`. Simultaneously, `App.tsx` has an active, populated project ID (`activeProjectId`) loaded in state and `localStorage`.
- **Target Architecture Solution**:
  - `ProjectListModal` will accept `activeProjectId` and `activeProjectTitle` props.
  - If `projects.length === 0` but `activeProjectId` is set, `ProjectListModal` falls back to rendering the active project card with an `"Active Workspace"` badge instead of rendering an empty message.
  - Handles 401 and network errors gracefully with retry buttons without wiping active project representation.

### 2. Reconciled Department Task Totals (`src/components/ProductionDashboardModal.tsx` & `server/workflows/dashboardEngine.ts`)
- **Root Cause**:
  In `ProductionDashboardModal.tsx` line 368, the subtitle for Open Department Tasks was hard-coded as:
  `Art: {data.departmentActionsSummary.ART_DEPT} | Legal: {data.departmentActionsSummary.LEGAL_COUNSEL} (Research Queue)`
  which completely omitted `LOCATIONS` (1 task) and `PRODUCTION_MGMT` (0 tasks). Thus, while `data.kpis.pendingActionsCount` displayed **11** total tasks, the printed breakdown only showed `Art: 1 | Legal: 9` (summing to 10 $\neq$ 11).
- **Target Architecture Solution**:
  - `ProductionDashboardModal.tsx` renders all 4 departments in the subtitle:
    `Art: {ART_DEPT} | Legal: {LEGAL_COUNSEL} | Locations: {LOCATIONS} | Prod: {PRODUCTION_MGMT}`.
  - All counts derive dynamically from the single `ActionNotificationRepo` collection query (`status: OPEN | IN_PROGRESS`).

### 3. Determination on "Alerts"
- **Determination**: "Alerts" / Notifications MUST be treated as an **overlapping, event-driven notification view of existing clearance state**, rather than an additive department.
- **Reasoning**:
  1. Department task items represent actionable work assigned to operational units (`ART_DEPT`, `LEGAL_COUNSEL`, `LOCATIONS`, `PRODUCTION_MGMT`).
  2. "Alerts" / Notifications (such as `🚨 Shooting Alert: Scene 1 Blocked (RED)`) are event broadcasts emitted when scene shooting readiness changes. They notify operators, but do not represent separate assigned work items.
  3. Adding "Alerts" to department task counts would cause double-counting of existing clearance blockers.
  4. Therefore, department task totals sum additively across the 4 actual departments ($1 + 9 + 1 + 0 = 11$), while "Alerts" remains a cross-cutting notification layer.

### 4. Operational Task Ownership & Auditable Activity History (`server/repositories/ActionNotificationRepo.ts`, `server/api/actionRoutes.ts`, `src/components/ActionListModal.tsx`)
- **Architecture**:
  - Add `assignee`, `dueDate`, `isOverdue` evaluation, and `activityHistory` array to `ClearanceActionItem`.
  - Add `PATCH /api/projects/:projectId/actions/:actionId` endpoint to handle task reassignments, due date edits, and status changes, appending an `ActionAuditEvent` record on every edit.
  - Update `ActionListModal.tsx` with an expandable task details drawer rendering assignee controls, date picker, overdue badge, and audit timeline.

### 5. Trustworthy Binder Export Feedback (`src/components/BinderExportModal.tsx`, `src/App.tsx`, `server/api/binderRoutes.ts`)
- **Architecture**:
  - Implement 4-stage export lifecycle: `IDLE` -> `PREFLIGHT_CHECKING` -> `EXPORTING` -> `COMPLETED` / `FAILED`.
  - Present preflight summary (scenes, blockers, warnings) before file generation.
  - Render explicit filename confirmation (`Clearance_Binder_The_Neon_Horizon_proj-cf44db8a.json`), file size, SHA-256 checksum digest, and direct download links.
  - Lock export triggers during active processing to prevent duplicate requests.
  - Declare polite `aria-live="polite"` live announcements for screen readers.

---

## File Modification Plan

1. **`server/repositories/ActionNotificationRepo.ts`**:
   - Add `ActionAuditEvent` type and extend `ClearanceActionItem` with `assignee`, `dueDate`, `isOverdue`, and `activityHistory`.
2. **`server/api/actionRoutes.ts`**:
   - Add `PATCH /api/projects/:projectId/actions/:actionId` route to handle mutations and append audit events.
3. **`server/repositories/ProjectRepo.ts`**:
   - Update project title persistence and list retrieval.
4. **`src/components/ProjectListModal.tsx`**:
   - Accept `activeProjectId` and `activeProjectTitle`, fallback to active project when list fetch returns empty array or error.
5. **`src/components/ProductionDashboardModal.tsx`**:
   - Render all 4 departments (`Art`, `Legal`, `Locations`, `Prod`) in Open Department Tasks subtitle, ensuring sum equals 11.
6. **`src/components/ActionListModal.tsx`**:
   - Add task assignee selector, editable due date picker, `OVERDUE` badge rendering, and expandable audit history timeline.
7. **`src/components/BinderExportModal.tsx`**:
   - Implement preflight check, processing state, filename confirmation, duplicate-export lock, error recovery with retry, and `aria-live` announcements.
8. **`src/App.tsx`**:
   - Synchronize `projectTitle` with persisted project title from script parser and load details.
9. **`tests/live_keyboard_focus_validation.js`**:
   - Expand Playwright Chromium automation suite to cover Project Directory coherence, 4-department sum assertions, task ownership/history, and binder export lifecycle.

---

## Requirement -> Task -> Test Traceability Matrix

| Requirement | Implementation Component(s) | Task ID | Automated Test File & Target | Test Type |
|---|---|---|---|---|
| **AC-24.1–24.2** (Persisted Production Title) | `App.tsx`, `ProjectRepo.ts` | T001-P3, T002-P3 | `tests/live_keyboard_focus_validation.js` [Section 1] | Real Playwright & Vitest |
| **AC-20.1–20.4** (Project Directory Coherence) | `ProjectListModal.tsx`, `App.tsx` | T003-P3, T004-P3 | `tests/live_keyboard_focus_validation.js` [Section 7] | Real Playwright (Chromium) |
| **AC-21.1–21.5** (Department Totals & Locations) | `ProductionDashboardModal.tsx`, `dashboardEngine.ts` | T005-P3, T006-P3 | `tests/contract/test_production_dashboard.test.ts` | Real Playwright & Vitest |
| **AC-22.1–22.5** (Task Ownership & History) | `ActionNotificationRepo.ts`, `actionRoutes.ts`, `ActionListModal.tsx` | T007-P3, T008-P3, T009-P3 | `tests/contract/test_task_ownership_history.test.ts` | Real Playwright & Vitest |
| **AC-23.1–23.5** (Trustworthy Binder Feedback) | `BinderExportModal.tsx`, `App.tsx`, `binderRoutes.ts` | T010-P3, T011-P3, T012-P3 | `tests/live_keyboard_focus_validation.js` [Section 9] | Real Playwright & Vitest |
| **AC-20.5–24.5** (Real Browser Verification Gate) | `live_keyboard_focus_validation.js` | T013-P3, T014-P3 | `tests/live_keyboard_focus_validation.js` against Local & Cloud Run | Real Playwright Production |
