# Feature Specification: Operations Dashboard Governance, Task Ownership & Trustworthy Export

**Feature Branch**: `026-phase3-operations-governance`  
**Version**: `v0.26.0-phase3-propose` (Phase 3 Specification & Plan)  
**Created**: 2026-08-24  
**Updated**: 2026-08-24  
**Status**: Proposal / Pending Human Approval (PROPOSE Stage)  
**Input**: Phase 3 Orchestrator Task Brief (`/tmp/agy-P3SPECKIT-18342526.task`) & Root-Cause Findings (`phase3-execution-plan.md`)  

---

## Objective & Product Outcome

Harden ClearanceScout's Phase 3 Operations Dashboard & Department Task Center into an enterprise-grade governance system that provides coherent project directories, mathematically reconciled department task counts across all active production departments, granular task assignment with editable due dates and overdue state tracking, persistent auditable activity histories, trustworthy visible binder-export feedback, and persistent production header naming.

---

## Baseline Invariants & Preservation Rules

The system MUST preserve all verified Phase 1 & Phase 2 state and calculation patterns without reopening completed work:
- **Baseline Synchronized Benchmark**: 3 scenes, 7 clearance items, 3 Cleared (`NO_ISSUE_SURFACED`), 2 Action Required (`ACTION_REQUIRED`), 2 Review Recommended (`REVIEW_RECOMMENDED`), 11 total open department tasks (1 Art Dept, 9 Legal Counsel, 1 Locations, 0 Production Management), 1 Final Clear scene, 2 blocked scenes, 33.3% shooting readiness.
- **Clearance State Machine**: Four canonical states (`NO_ISSUE_SURFACED`, `INSUFFICIENT_EVIDENCE`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`).
- **Code Isolation & Security**: `server/` handles backend agents, model calls, and storage; `src/` handles UI components and API client hooks. Zero raw model chain-of-thought is ever logged or rendered.

---

## User Stories & Acceptance Criteria

### User Story 20: Project Directory & Active Workspace Coherence (Priority: P0)
**As a** clearance operator or studio executive,  
**I want** the Project Directory modal to list all active production projects and accurately include the currently open workspace project,  
**So that** I never encounter a contradiction where an active, populated workspace displays behind a directory stating *"No production projects found"*.

- **AC-20.1**: Opening the Project Directory modal (`ProjectListModal`) while an active workspace project exists MUST list the active project prominently with an active indicator badge (`"Active Workspace"`).
- **AC-20.2**: Network fetch errors or empty project responses MUST be handled gracefully; if `projects.length === 0` but an `activeProjectId` is loaded in memory/`localStorage`, the modal MUST fallback to displaying the active project rather than displaying `"No production projects found"`.
- **AC-20.3**: Selecting any project from the directory MUST switch active project context atomically without leaving orphaned background timers or stale cache snapshots.

---

### User Story 21: Reconciled Department Task Totals & Locations Coverage (Priority: P0)
**As a** production coordinator or legal counsel,  
**I want** the Operations Dashboard's department breakdown to account for all operational departments including Locations and sum additively to the exact total task count (11),  
**So that** department task metrics are 100% mathematically transparent and internally consistent.

- **AC-21.1**: The Operations Dashboard Open Department Tasks tile MUST render an additive breakdown covering all active departments: `Art: {ART_DEPT} | Legal: {LEGAL_COUNSEL} | Locations: {LOCATIONS} | Prod: {PRODUCTION_MGMT}`.
- **AC-21.2**: The total task count (`pendingActionsCount`) MUST equal the sum of active open/in-progress department tasks across Art Dept (1), Legal Counsel (9), Locations (1), and Production Management (0), arriving at exactly **11 Department Tasks**.
- **AC-21.3**: All department counts MUST derive from the single authoritative `ActionNotificationRepo` collection query (`status: OPEN | IN_PROGRESS`), eliminating hard-coded subtitle strings or mismatched counts.
- **AC-21.4**: "Alerts" / Notifications MUST be clearly designated as an event-driven notification layer for scene status changes rather than an additive department, preventing double-counting against department task totals.

---

### User Story 22: Operational Task Ownership & Auditable Activity History (Priority: P1)
**As a** department lead or clearance attorney,  
**I want** to assign tasks to specific individuals/roles, set editable due dates, track overdue status, and review a persistent audit history of all task modifications,  
**So that** operational accountability is maintained throughout the production clearance lifecycle.

- **AC-22.1**: Every department task in `ActionListModal` and `ProductionDashboardModal` MUST support assigning or reassigning an operational owner (`assigneeName`, `assigneeRole`).
- **AC-22.2**: Department tasks MUST support an editable due date selector (`dueDate`). Tasks whose `dueDate` precedes the current system timestamp AND whose status is NOT `RESOLVED` or `DISMISSED` MUST render a prominent `OVERDUE` badge. Resolved tasks MUST NOT be marked overdue regardless of due date.
- **AC-22.3**: Every mutation (creation, assignment, reassignment, due-date change, status transition, resolution, reopening) MUST generate a persistent, immutable `ActionAuditEvent` appended to the task's `activityHistory`.
- **AC-22.4**: Expanding a department task in `ActionListModal` MUST render an auditable activity history timeline detailing: timestamp, actor, event type, before/after context, and rationale.

---

### User Story 23: Trustworthy Visible Binder-Export Feedback (Priority: P0)
**As a** studio legal counsel or line producer,  
**I want** real-time visible feedback, preflight readiness checks, explicit processing states, download confirmation, and error recovery when exporting the Legal Clearance Binder,  
**So that** I never receive a false claim of success before a real binder artifact is generated.

- **AC-23.1**: Triggering binder export MUST execute a preflight readiness check (`PREFLIGHT_CHECKING`) verifying data integrity, shoot readiness, and unresolved blockers before generating the file.
- **AC-23.2**: The UI MUST display explicit processing feedback (`"Generating Legal Clearance Binder artifact..."`) with duplicate-export prevention locking primary controls until completion.
- **AC-23.3**: Upon successful generation, the UI MUST display the human-readable generated filename (e.g. `Clearance_Binder_The_Neon_Horizon_proj-cf44db8a.json` / `.md`), file size, integrity checksum digest, and a direct download button.
- **AC-23.4**: If binder generation fails or encounters a network error, the UI MUST present a clear error message with a `"Retry Export"` trigger and accessible live status announcement (`role="status"`, `aria-live="polite"`).

---

### User Story 24: Persisted Production Name & Header Title Synchronization (Priority: P1)
**As an** operator,  
**I want** the top header title and project cards to display the actual persisted production name (e.g. *"The Neon Horizon"*),  
**So that** the workspace displays proper project identity instead of generic placeholder text (*"ClearanceScout Production Clearance Workspace"*).

- **AC-24.1**: Ingesting a screenplay or loading a project MUST synchronize the workspace header title with the actual persisted project production title (e.g. *"The Neon Horizon"*).
- **AC-24.2**: The header bar MUST render `{projectTitle}` dynamically from the active project model rather than falling back to static default branding strings.

---

## Article 7 Mandatory Regression Clauses

- **AC-20.4 (Directory Isolation Guarantee)**: Opening the Project Directory modal MUST NOT clear, reset, or mutate the active workspace project state in `App.tsx`.
- **AC-21.5 (Department Sum Integrity Guarantee)**: Automated test suites MUST assert that `pendingActionsCount === ART_DEPT + LEGAL_COUNSEL + LOCATIONS + PRODUCTION_MGMT` across both API responses and rendered UI components.
- **AC-22.5 (Audit Log Immutability Guarantee)**: `activityHistory` events MUST be append-only. Existing audit event records MUST NOT be modified or deleted during task updates.
- **AC-23.5 (Real Artifact Download Guarantee)**: Automated Playwright tests MUST assert that binder export initiates actual browser file download or blob creation containing valid JSON/Markdown content before asserting completion.

---

## Verification & Acceptance Gate

Phase 3 implementation will be deemed complete when:
1. `./scripts/spec-check.sh` passes with 0 violations across `src/`.
2. All unit, contract, and integration test suites pass 100% green under Vitest/jsdom (`npm test`).
3. Real Playwright Chromium browser validation (`node tests/live_keyboard_focus_validation.js`) passes 100% across both local server (`http://localhost:3001`) AND live Cloud Run deployment URL (`https://clearancescout-n3tcx4jcbq-uc.a.run.app`).
