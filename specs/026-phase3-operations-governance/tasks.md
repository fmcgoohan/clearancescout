# Task Breakdown: Operations Dashboard Governance, Task Ownership & Trustworthy Export

**Feature Branch**: `026-phase3-operations-governance`  
**Version**: `v0.26.0`  

---

## Phase 1: Persisted Production Name & Header Title Synchronization (US24)
- [x] **T001-P3**: Update `ProjectRepo.ts` and `projectRoutes.ts` to persist script title metadata as `project.title` during script ingestion. (Satisfied: `ScriptParserAgent.ts`, `ProjectRepo.ts`, `canonicalRegistryWorkflow.ts`)
- [x] **T002-P3**: Update `App.tsx` and `CommandBar.tsx` to synchronize `{projectTitle}` dynamically from active project metadata rather than static generic branding. (Satisfied: `App.tsx`)

## Phase 2: Project Directory & Active Workspace Coherence (US20)
- [x] **T003-P3**: Pass `activeProjectId` and `activeProjectTitle` to `ProjectListModal.tsx` and add active indicator badge on currently loaded workspace project. (Satisfied: `App.tsx`, `ProjectListModal.tsx`)
- [x] **T004-P3**: Implement fallback in `ProjectListModal.tsx` to render the active workspace project card when `projects.length === 0` or upon unhandled fetch error, eliminating the *"No production projects found"* contradiction. (Satisfied: `ProjectListModal.tsx`)

## Phase 3: Reconciled Department Task Totals & Locations Coverage (US21)
- [x] **T005-P3**: Update `ProductionDashboardModal.tsx` Open Department Tasks tile to render the full 4-department additive breakdown: `Art: {ART_DEPT} | Legal: {LEGAL_COUNSEL} | Locations: {LOCATIONS} | Prod: {PRODUCTION_MGMT}`. (Satisfied: `ProductionDashboardModal.tsx`)
- [x] **T006-P3**: Verify backend `dashboardEngine.ts` and frontend component derive all department counts dynamically from the single `ActionNotificationRepo` collection query (`status: OPEN | IN_PROGRESS`), asserting the total sums to exactly 11. (Satisfied: `dashboardEngine.ts`, `test_department_task_totals.test.tsx`)

## Phase 4: Operational Task Ownership & Auditable Activity History (US22)
- [x] **T007-P3**: Extend `ClearanceActionItem` in `ActionNotificationRepo.ts` with `assignee`, `dueDate`, `isOverdue`, and `activityHistory: ActionAuditEvent[]`. (Satisfied: `ActionNotificationRepo.ts`)
- [x] **T008-P3**: Add `PATCH /api/projects/:projectId/actions/:actionId` route in `actionRoutes.ts` to support updating assignee, due date, status, and logging `ActionAuditEvent` entries to `activityHistory`. (Satisfied: `actionRoutes.ts`)
- [x] **T009-P3**: Update `ActionListModal.tsx` and `ProductionDashboardModal.tsx` to render assignee controls, editable due date picker, `OVERDUE` badge for overdue open tasks, and expandable audit history timeline per task. (Satisfied: `ActionListModal.tsx`, `ProductionDashboardModal.tsx`)

## Phase 5: Trustworthy Visible Binder-Export Feedback (US23)
- [ ] **T010-P3**: Enhance `binderRoutes.ts` to provide preflight readiness status (`PREFLIGHT_CHECKING`) checking total scenes, blockers, and warnings prior to export.
- [ ] **T011-P3**: Update `BinderExportModal.tsx` and `App.tsx` with explicit processing state feedback, filename confirmation (`Clearance_Binder_The_Neon_Horizon_proj-cf44db8a.json`), file size, integrity checksum digest, and direct download buttons.
- [ ] **T012-P3**: Add duplicate-export prevention lock, error recovery with retry trigger, and `aria-live="polite"` status announcements in `BinderExportModal.tsx`.

## Phase 6: Automated Testing & Real Browser Verification (US20–US24 Gate)
- [ ] **T013-P3**: Create unit and contract tests in `tests/contract/test_task_ownership_history.test.ts` asserting audit history append behavior, due date overdue calculation, and 4-department total sums.
- [ ] **T014-P3**: Run `./scripts/spec-check.sh` static analysis gate to verify zero static constitution or emoji violations.
- [ ] **T015-P3**: Run full Vitest unit/contract suite (`npm test`).
- [ ] **T016-P3**: Extend `tests/live_keyboard_focus_validation.js` and execute real Playwright Chromium browser validation suite against local server (`http://localhost:3001`) AND live Cloud Run deployment URL (`https://clearancescout-n3tcx4jcbq-uc.a.run.app`).
