# Implementation Plan: Production Clearance Operating Model (Phase 6 - Action & Notification Lists)

**Branch**: `016-production-clearance-model` | **Date**: 2026-08-19 | **Status**: Plan Complete (Phase 6 Focus)  
**Specification**: [`specs/016-production-clearance-model/spec.md`](spec.md)

---

## 1. Summary of Feature & Phase 6 Scope

Phase 6 introduces **Action and Notification Lists Derived from Clearance State Transitions** (`FR-007`, `US6`). State transitions across occurrences, entities, rights agreements, and scene readiness automatically generate structured, department-routed to-do action items (`ART_DEPT`, `LEGAL_COUNSEL`, `LOCATIONS`, `PRODUCTION_MGMT`) and broadcast high-priority production alerts.

### Core Objectives (Phase 6 Only):
1. **Action & Notification Domain Modeling (`FR-007`, `US6`)**:
   - Define `ClearanceActionItem` with `actionType`, `targetDepartment`, `priority`, `status` (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `DISMISSED`), and `resolutionTrigger`.
   - Define `ClearanceNotification` with `targetDepartment`, `severity` (`INFO`, `WARNING`, `ALERT`, `CRITICAL`), and read status.
2. **Repository Layer (`server/repositories/ActionNotificationRepo.ts`)**:
   - Manage Firestore collections `projects/{projectId}/actions/{actionId}` and `projects/{projectId}/notifications/{notifId}`.
   - Support department filtering, resolution hooks, and status updates.
3. **Automated Action Dispatcher Workflow (`server/workflows/actionDispatcher.ts`)**:
   - **Art Dept Triggers**: Occurrence `ACTION_REQUIRED` for `GRAPHIC_PROP` $\to$ `ART_DEPT_REPLACEMENT` action item for prop master.
   - **Legal Counsel Triggers**: Occurrence `ACTION_REQUIRED` for `BRAND` or `ART_MUSIC` $\to$ `LEGAL_COUNSEL_RELEASE` action item for legal team.
   - **Locations Triggers**: Occurrence `REVIEW_RECOMMENDED` for `PROPRIETARY_LOCATION` $\to$ `LOCATIONS_PERMIT` action item.
   - **Production Management Triggers**: Scene readiness `RED` $\to$ `PRODUCTION_REVIEW` critical alert and action for line producer / 1st AD.
   - **Auto-Resolution**: Attaching a replacement card, recording a signed counsel override, or attaching an active license automatically marks corresponding action items as `RESOLVED`.
4. **REST API Endpoints (`server/api/actionRoutes.ts`)**:
   - `GET /api/projects/:id/actions` (filter by department/status)
   - `PATCH /api/projects/:id/actions/:actionId` (update action status)
   - `GET /api/projects/:id/notifications` (list notifications)
   - `PATCH /api/projects/:id/notifications/:notifId/read` (mark notification read)
   - `POST /api/projects/:id/actions/sync` (re-sync actions from project state)
5. **Frontend UI Integration**:
   - Create `src/components/ActionListModal.tsx` with department tabs (`Art Dept`, `Legal`, `Locations`, `Production Management`).
   - Add `📋 Actions` badge in `src/pages/WorkspacePage.tsx` with active blocker counter.
6. **Preserve Invariants (003–015 & Phases 1–5)**:
   - 100% preservation of project types, occurrence assessments, derived roll-ups, aliases, rights records, scene readiness engine, and SSE timeline streams.
7. **Strict Scope Boundary**:
   - Phases 7 through 10 (generalized placeholders, live self-clearance loop, dashboard, binder) remain strictly unbuilt until Phase 6 is implemented and converged.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | Action items and notifications are dispatched deterministically in TypeScript code based on structured state transitions. |
| **II. Live Grounding & Research Tooling** | **PASS** | Actions reference grounded research citations and occurrence context. |
| **III. Architecture & Cloud Persistence** | **PASS** | Actions and notifications persisted in Firestore under `projects/{projectId}/actions` and `notifications`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Actions link directly to canonical entities and scene occurrences; auto-resolves upon counsel override. |
| **V. Multi-Tier Execution Modes** | **PASS** | Operates identically in `TEST_MODE`, `DEMO_MODE`, and `CLOUD_MODE`. |
| **Observable Action Timeline** | **PASS** | Emits `TOOL_CALL` and `STATE_TRANSITION` events for action creation and auto-resolution. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/016-production-clearance-model/research.md`](research.md))
- **Phase 1: Data Model & Schema** ([`specs/016-production-clearance-model/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/016-production-clearance-model/contracts/actions-contract.md`](contracts/actions-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/016-production-clearance-model/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/repositories/ActionNotificationRepo.ts`:
  - New repository for action items and department notifications.
- `server/workflows/actionDispatcher.ts`:
  - Workflow for dispatching department actions on state transitions and auto-resolving upon clearance.
- `server/api/actionRoutes.ts`:
  - Express routes for action listing, status patching, and notification reading.
- `src/components/ActionListModal.tsx` & `src/pages/WorkspacePage.tsx`:
  - Department-filtered action list UI modal and header badge counter.
- `tests/contract/test_action_notifications.test.ts`:
  - Contract test for action dispatch, department filtering, and auto-resolution.
- `tests/integration/action_workflow.test.ts`:
  - Integration test verifying end-to-end action lifecycle across script ingestion, replacement attachment, and counsel override.
