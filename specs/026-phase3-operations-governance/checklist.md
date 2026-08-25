# Quality & Verification Checklist: Operations Dashboard Governance & Task Ownership

**Feature**: [spec.md](./spec.md)  
**Created**: 2026-08-24  

---

## Project Directory & Header Title Synchronization

- [x] **CHK001**: Header title displays the persisted production name (e.g. *"The Neon Horizon"*) dynamically derived from active project metadata (`AC-24.1`, `AC-24.2`).
- [x] **CHK002**: `ProjectListModal` includes the currently open workspace project with an `"Active Workspace"` badge (`AC-20.1`).
- [x] **CHK003**: `ProjectListModal` falls back to displaying the active project when list fetch returns empty array or error, eliminating `"No production projects found"` contradiction (`AC-20.2`).

## Department Task Totals & Locations Reconciliation

- [x] **CHK004**: Open Department Tasks tile in `ProductionDashboardModal` renders all 4 active departments: `Art: 1 | Legal: 9 | Locations: 1 | Prod: 0` (`AC-21.1`).
- [x] **CHK005**: Department task breakdown sums additively to exactly 11 tasks ($1 + 9 + 1 + 0 = 11$) derived from single `ActionNotificationRepo` query (`AC-21.2`, `AC-21.3`).
- [x] **CHK006**: "Alerts" / Notifications are treated as an event-driven notification layer rather than an additive department (`AC-21.4`).

## Operational Task Ownership & Auditable Activity History

- [x] **CHK007**: Every department task supports assignee assignment/reassignment (`AC-22.1`).
- [x] **CHK008**: Tasks with `dueDate < now` and status $\neq$ `RESOLVED`/`DISMISSED` render a prominent `OVERDUE` badge (`AC-22.2`).
- [x] **CHK009**: Task mutations append immutable `ActionAuditEvent` entries to `activityHistory` timeline (`AC-22.3`, `AC-22.4`).

## Trustworthy Visible Binder-Export Feedback

- [x] **CHK010**: Binder export executes preflight check before file generation (`AC-23.1`).
- [x] **CHK011**: Export UI displays explicit processing state, filename confirmation, file size, SHA-256 digest, and download buttons (`AC-23.2`, `AC-23.3`).
- [x] **CHK012**: Primary controls lock during processing to prevent duplicate export requests (`AC-23.2`).
- [x] **CHK013**: Errors display retry trigger and announce status via `aria-live="polite"` (`AC-23.4`).

## Automated Testing & Real Browser Verification

- [x] **CHK014**: `./scripts/spec-check.sh` passes with zero static constitution or emoji violations.
- [x] **CHK015**: Vitest unit and contract suite (`npm test`) passes 100% green across 95+ test files.
- [x] **CHK016**: Real Playwright Chromium automation (`tests/live_keyboard_focus_validation.js`) passes 100% green against both local server (`http://localhost:3001`) AND live Cloud Run deployment (`https://clearancescout-n3tcx4jcbq-uc.a.run.app`).
