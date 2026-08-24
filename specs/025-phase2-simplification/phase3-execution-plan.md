# [SUPERSEDED] Phase 3 Inspection & Execution Plan

> [!IMPORTANT]
> **SUPERSEDED NOTICE**: This draft plan file under `specs/025-phase2-simplification/` has been officially superseded and migrated to the dedicated Phase 3 SpecKit feature directory:
> **[`specs/026-phase3-operations-governance/`](file:///Users/fmcgoohan/Projects/SpecKit/AntiGravity/clearancescout/specs/026-phase3-operations-governance)**
> 
> Please refer to:
> - [`specs/026-phase3-operations-governance/spec.md`](file:///Users/fmcgoohan/Projects/SpecKit/AntiGravity/clearancescout/specs/026-phase3-operations-governance/spec.md)
> - [`specs/026-phase3-operations-governance/plan.md`](file:///Users/fmcgoohan/Projects/SpecKit/AntiGravity/clearancescout/specs/026-phase3-operations-governance/plan.md)
> - [`specs/026-phase3-operations-governance/tasks.md`](file:///Users/fmcgoohan/Projects/SpecKit/AntiGravity/clearancescout/specs/026-phase3-operations-governance/tasks.md)
> - [`specs/026-phase3-operations-governance/data-model.md`](file:///Users/fmcgoohan/Projects/SpecKit/AntiGravity/clearancescout/specs/026-phase3-operations-governance/data-model.md)
> - [`specs/026-phase3-operations-governance/checklist.md`](file:///Users/fmcgoohan/Projects/SpecKit/AntiGravity/clearancescout/specs/026-phase3-operations-governance/checklist.md)

---

## 1. Executive Summary & Scope Boundary

This document provides a comprehensive inspection and implementation plan for Phase 3 (Operations Dashboard & Department Task Management). All findings, root causes, data model designs, and traceability matrices are grounded in direct source code inspection of `clearancescout`.

### Baseline Invariants (Must Remain Preserved)
- 3 scenes, 7 clearance items, 3 Cleared, 2 Action Required, 2 Review Recommended.
- 11 total open department tasks (1 Art Dept, 9 Legal Counsel, 1 Locations, 0 Production Management).
- 1 Final Clear scene, 2 blocked scenes, 33.3% shooting readiness.
- Four-state clearance machine (`NO_ISSUE_SURFACED`, `INSUFFICIENT_EVIDENCE`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`).
- Deterministic calculation pattern, strict code isolation (`server/` vs `src/`), and zero raw model chain-of-thought logging.

---

## 2. SpecKit Infrastructure & Feature Directory Alignment

- **Installed SpecKit Infrastructure**:
  - `.specify/scripts/bash/`: `check-prerequisites.sh`, `create-new-feature.sh`, `setup-plan.sh`, `setup-tasks.sh`, `common.sh`.
  - `.specify/workflows/`: `workflow-registry.json`, `speckit/workflow.yml`.
  - `./scripts/spec-check.sh`: Static spec check gate (constitution static rules, zero raw emojis).
- **Target Spec Directory**: Reusing existing feature directory `specs/025-phase2-simplification/` (containing `spec.md`, `plan.md`, `tasks.md`, `checklist.md`).
- **Deliverable Artifact**: This plan is created at `specs/025-phase2-simplification/phase3-execution-plan.md`.

---

## 3. Current Implementation Status Matrix

| # | Requirement | Current Status | Exact File & Line Citations | Details / Gaps Identified |
|---|---|---|---|---|
| **R0** | Production Heading Persisted Title | **Partially Present** | `src/App.tsx#L28`, `src/App.tsx#L291`, `src/App.tsx#L584` | Default `projectTitle` state is initialized to `'Production Project Workspace'` and newly created projects fallback to `'ClearanceScout Production Clearance Workspace'`. Ingesting screenplay does not synchronize header title with persisted script/production name. |
| **R1** | Project Directory Contradiction Fix | **Partially Present** | `src/components/ProjectListModal.tsx#L53-L72`, `src/components/ProjectListModal.tsx#L377-L383`, `src/App.tsx#L260-L277` | `ProjectListModal` displays `"No production projects found."` when `projects.length === 0` or upon unhandled fetch error, ignoring `activeProjectId` currently open and populated in `App.tsx`. |
| **R2** | Department Task Totals & Locations Reconciliation | **Partially Present** | `src/components/ProductionDashboardModal.tsx#L368`, `server/workflows/dashboardEngine.ts#L159-L164`, `server/workflows/actionDispatcher.ts#L74-L79` | `dashboardEngine.ts` calculates `ART_DEPT` (1), `LEGAL_COUNSEL` (9), `LOCATIONS` (1), `PRODUCTION_MGMT` (0) correctly (summing to 11). However, `ProductionDashboardModal.tsx` hard-codes subtitle: `Art: 1 | Legal: 9 (Research Queue)` omitting `LOCATIONS` and `PRODUCTION_MGMT`. |
| **R3** | Operational Task Ownership & Auditable History | **Partially Present** | `server/repositories/ActionNotificationRepo.ts#L22-L41`, `src/components/ActionListModal.tsx#L440-L510`, `server/api/actionRoutes.ts` | Basic actions support `status` and `targetDepartment`. However, `assignee`, `dueDate`, `isOverdue` calculation, and structured `activityHistory` (actor, timestamp, event type, before/after context) are absent from data models and UI. |
| **R4** | Trustworthy Visible Binder-Export Feedback | **Partially Present** | `src/components/BinderExportModal.tsx#L87-L114`, `src/App.tsx#L525-L540`, `server/api/binderRoutes.ts` | API `/api/projects/:id/binder/export` generates binder data. However, visible preflight readiness checks, explicit starting/processing state toasts/banners, error handling with retry, duplicate-export prevention lock, generated filename confirmation, and accessible `aria-live` announcements are absent. |
| **R5** | Real Playwright Verification (Local + Deployed) | **Present** | `tests/live_keyboard_focus_validation.js` | Suite exists and passes for Phase 2 focus/onboarding/hydration tests. Must be expanded for Phase 3 requirements R0–R4. |

---

## 4. Root Cause Analysis

### Root Cause 1: Project Directory Contradiction
1. In `ProjectListModal.tsx`, `fetchProjects()` calls `GET /api/projects`. If the request fails, returns an empty array, or encounters an unhandled authentication state (such as missing token in `CLOUD_MODE`), `ProjectListModal` sets `projects = []` and renders `"No production projects found."`.
2. Simultaneously, `App.tsx` has an active, populated project ID (e.g. `proj-cf44db8a`) stored in state and `localStorage` (`clearancescout_active_project_id`).
3. Because `ProjectListModal` does not fallback to or include the currently active workspace project when rendering the empty list state, the modal reports zero projects while the populated workspace is visible behind it.

### Root Cause 2: Department Task Total Mismatch & Omitted Locations
1. In `ProductionDashboardModal.tsx` line 368, the subtitle for Open Department Tasks was hard-coded as:
   `Art: {data.departmentActionsSummary.ART_DEPT} | Legal: {data.departmentActionsSummary.LEGAL_COUNSEL} (Research Queue)`
   which completely omitted `LOCATIONS` (1 task) and `PRODUCTION_MGMT` (0 tasks).
2. Thus, while `data.kpis.pendingActionsCount` displayed **11** total tasks, the printed breakdown only showed `Art: 1 | Legal: 9` (summing to 10 $\neq$ 11).
3. All 11 department tasks are derived from the single authoritative `ActionNotificationRepo` collection, but the dashboard UI component failed to render the complete department breakdown.

---

## 5. Determination on "Alerts"

**Determination**: "Alerts" / Notifications MUST be treated as an **overlapping, event-driven notification view of existing clearance state**, rather than an additive department.

**Reasoning**:
1. Department task items represent actionable work assigned to operational units (`ART_DEPT`, `LEGAL_COUNSEL`, `LOCATIONS`, `PRODUCTION_MGMT`).
2. "Alerts" / Notifications (such as `🚨 Shooting Alert: Scene 1 Blocked (RED)`) are event broadcasts emitted when scene shooting readiness changes. They notify operators, but do not represent separate assigned work items.
3. Adding "Alerts" to department task counts would cause double-counting of existing clearance blockers.
4. Therefore, department task totals sum additively across the 4 actual departments ($1 + 9 + 1 + 0 = 11$), while "Alerts" remains a cross-cutting notification layer.

---

## 6. Data Model & API Contract Enhancements for Task Ownership & Audit History

### Data Model Extension (`server/repositories/ActionNotificationRepo.ts`)

```typescript
export interface ActionAuditEvent {
  id: string;
  timestamp: string;
  actor: string; // e.g. "Legal Counsel", "Art Director", "System Auto-Dispatcher"
  eventType:
    | 'CREATED'
    | 'ASSIGNED'
    | 'REASSIGNED'
    | 'DUE_DATE_CHANGED'
    | 'STATUS_CHANGED'
    | 'RESOLVED'
    | 'REOPENED';
  beforeState?: Partial<ClearanceActionItem>;
  afterState?: Partial<ClearanceActionItem>;
  description: string;
}

export interface ClearanceActionItem {
  id: string;
  projectId: string;
  sceneId?: string;
  sceneNumber?: number;
  canonicalEntityId?: string;
  canonicalName?: string;
  occurrenceId?: string;
  actionType: ClearanceActionType;
  targetDepartment: DepartmentTarget;
  title: string;
  description: string;
  priority: ActionPriority;
  status: ActionStatus;
  assignee?: {
    id: string;
    name: string;
    role: string;
  };
  dueDate?: string; // ISO date string
  isOverdue?: boolean; // Evaluated dynamically: dueDate < now && status !== 'RESOLVED'
  resolutionTrigger?: string;
  resolutionReason?: string;
  resolvedAt?: string;
  activityHistory?: ActionAuditEvent[];
  createdAt: string;
  updatedAt: string;
}
```

### API Endpoint Enhancements (`server/api/actionRoutes.ts`)

- `PATCH /api/projects/:projectId/actions/:actionId`
  - Body: `{ assignee?: { id, name, role }, dueDate?: string, status?: ActionStatus, actor?: string, reason?: string }`
  - Updates action fields atomically, recalculates `isOverdue`, appends an `ActionAuditEvent` to `activityHistory`, and emits a timeline event.

---

## 7. Requirement -> Task -> Test Traceability Matrix

| Requirement | Implementation Component(s) | Task ID | Automated Test File | Test Type |
|---|---|---|---|---|
| **R0: Persisted Production Title** | `App.tsx`, `ProjectRepo.ts`, `CommandBar.tsx` | `T001-P3` | `tests/live_keyboard_focus_validation.js` [Section 1] | Real Playwright & Vitest |
| **R1: Project Directory Contradiction** | `ProjectListModal.tsx`, `App.tsx` | `T002-P3` | `tests/live_keyboard_focus_validation.js` [Section 7] | Real Playwright (Chromium) |
| **R2: Department Task Totals & Locations** | `ProductionDashboardModal.tsx`, `dashboardEngine.ts` | `T003-P3` | `tests/contract/test_production_dashboard.test.ts` | Real Playwright & Vitest |
| **R3: Operational Task Ownership & History** | `ActionNotificationRepo.ts`, `actionRoutes.ts`, `ActionListModal.tsx` | `T004-P3`, `T005-P3` | `tests/contract/test_task_ownership_history.test.ts` | Real Playwright & Vitest |
| **R4: Trustworthy Binder-Export Feedback** | `BinderExportModal.tsx`, `App.tsx`, `binderRoutes.ts` | `T006-P3`, `T007-P3` | `tests/live_keyboard_focus_validation.js` [Section 9] | Real Playwright & Vitest |
| **R5: Real Playwright Validation** | `tests/live_keyboard_focus_validation.js` | `T008-P3` | `tests/live_keyboard_focus_validation.js` against Local & Cloud Run | Real Playwright Production |

---

## 8. Verification Strategy & Pre-Implementation Commands

1. **Static Analysis & Spec Check Gate**:
   - Command: `./scripts/spec-check.sh`
   - Purpose: Ensure zero static constitution or emoji violations across `src/`.
2. **Vitest Unit & Contract Suite**:
   - Command: `npm test`
   - Purpose: Verify all existing 95 test files (252 tests) remain 100% green without regressions.
3. **Real Playwright Chromium Automation**:
   - Command: `BASE_URL=http://localhost:3001 node tests/live_keyboard_focus_validation.js`
   - Command: `BASE_URL=https://clearancescout-n3tcx4jcbq-uc.a.run.app node tests/live_keyboard_focus_validation.js`
   - Purpose: Verify real rendered browser behavior across both local development server and live Cloud Run deployment.
