# Tasks: Enterprise Collaboration, Departmental Workflows & High-Scale Production Management (Phase 4)

**Input**: Design documents from [`specs/027-phase4-collaboration-scale/`](./)  
**Prerequisites**: `spec.md`, `plan.md`, `data-model.md`  
**Branch**: `027-phase4-collaboration-scale`  
**Status**: Generated / Pending Implementation Approval  

---

## Task Organization Overview

Tasks are organized into 6 dependency-ordered implementation phases aligned directly with the 4 approved delivery slices from `plan.md`:
- **Phase 1: Setup & Foundational Repositories** (Data models & base infrastructure)
- **Phase 2: Slice 1 (P1 - Core Collaboration)**: Task Discussion, Attachments, In-Product Notifications, Binder Attachment Index (`US-P4-01`, `US-P4-02`, `US-P4-03`, `US-P4-15`)
- **Phase 3: Slice 2 (P1 - Workflow Automation)**: Bulk Operations, Saved Views, Role Workspaces (`US-P4-04`, `US-P4-05`, `US-P4-07` to `US-P4-10`)
- **Phase 4: Slice 3 (P2 - Studio Scale & Portfolio)**: Studio Portfolio Dashboard, 1,000-Task Virtualization (`US-P4-06`, `US-P4-16`)
- **Phase 5: Slice 4 (P2 - Security & Accessibility)**: Server RBAC, User Admin, Tiered WCAG 2.2 AA, Responsive Card Reflow (`US-P4-11` to `US-P4-14`)
- **Phase 6: Regression Verification & Validation Gates** (Phase 1–3 Invariants & Deployment Readiness)

---

## Phase 1: Setup & Foundational Repositories

**Purpose**: Establish base data schemas, TypeScript interfaces, and backend repository storage handlers required across all Phase 4 features.

- [ ] **T001-P4** `[P]` Create TypeScript data interfaces for `TaskComment`, `TaskAttachment`, `UserNotification`, `UserSavedView`, `ProjectMember`, and `ExtendedDepartmentTask` in `src/types/collaboration.ts` and `server/types/collaboration.ts`. *(FR-001, FR-007, FR-023, FR-030)*
- [ ] **T002-P4** `[P]` Implement `TaskCommentRepo` in `server/repositories/TaskCommentRepo.ts` with CRUD operations, author/department metadata, `@mention` extraction, soft-deletion, and Firestore persistence. *(FR-001–FR-006)*
- [ ] **T003-P4** `[P]` Implement `TaskAttachmentRepo` in `server/repositories/TaskAttachmentRepo.ts` managing file attachment metadata, version sequences, MIME validation, and GCS URI tracking. *(FR-007–FR-014)*
- [ ] **T004-P4** `[P]` Implement `UserNotificationRepo` in `server/repositories/UserNotificationRepo.ts` handling notification dispatching, read/unread states, and user channel queues. *(FR-037–FR-044)*
- [ ] **T005-P4** `[P]` Implement `ProjectMemberRepo` in `server/repositories/ProjectMemberRepo.ts` managing user membership mappings (`projectId`, `userId`, `projectRole`). *(FR-030, FR-071)*

**Checkpoint**: Foundational schemas and backend repositories ready. Feature slice implementation can proceed.

---

## Phase 2: Slice 1 — Task Discussion, Attachments, Notifications & Binder Index (Priority: P1 - MVP)

**Goal**: Deliver task comments with `@mentions`, document attachment uploads via GCS signed URLs, real-time in-product notification drawer, and binder attachment indexing.

### Tests for Slice 1
- [ ] **T006-P4** `[P]` `[US-P4-01]` Vitest contract test for comment endpoints (`POST /api/tasks/:id/comments`, `GET /api/tasks/:id/comments`) in `src/tests/comment_contract.test.ts`.
- [ ] **T007-P4** `[P]` `[US-P4-03]` Vitest integration test for attachment upload state machine (`UPLOADING`, `COMPLETED`, `FAILED`) and signed URL generation in `src/tests/attachment_upload.test.ts`.

### Backend Implementation for Slice 1
- [ ] **T008-P4** Implement GCS Signed URL Helper in `server/integrations/storage/gcsStorage.ts` generating 15-minute secure upload/download URLs with 25 MB size validation. *(FR-007, FR-010, D-06)*
- [ ] **T009-P4** Implement comment route handlers in `server/routes/commentRoutes.ts` supporting comment posting, author role/department attribution, `@mention` parsing, edit/delete, and audit log event generation. *(FR-001–FR-006, US-P4-01)*
- [ ] **T010-P4** Implement attachment route handlers in `server/routes/attachmentRoutes.ts` supporting signed URL requests, attachment metadata persistence, replacement versioning, and removal audit events. *(FR-007–FR-014, US-P4-03)*
- [ ] **T011-P4** Implement notification route handlers and SSE stream in `server/routes/notificationRoutes.ts` emitting events for mentions, assignments, due dates, overdue items, and binder completion. *(FR-037–FR-044, US-P4-02)*

### Frontend Implementation for Slice 1
- [ ] **T012-P4** Implement `TaskCommentThread` component in `src/components/TaskCommentThread.tsx` with threaded activity stream, author badges, `@mention` autocomplete, edit/delete triggers, and keyboard focus handling. *(US-P4-01, FR-001–FR-006)*
- [ ] **T013-P4** Implement `TaskAttachmentList` component in `src/components/TaskAttachmentList.tsx` rendering attached file cards, drag-and-drop file upload, progress bar, download/preview triggers, and removal confirmation. *(US-P4-03, FR-007–FR-014)*
- [ ] **T014-P4** Implement `NotificationDrawer` component and header badge in `src/components/NotificationDrawer.tsx` rendering unread counter, filter by type, mark as read, deep-link navigation, and `role="status"` `aria-live="polite"` announcements. *(US-P4-02, FR-037–FR-044)*
- [ ] **T015-P4** Update Legal Clearance Binder export in `server/workflows/binderExportWorkflow.ts` and `src/components/ClearanceBinderModal.tsx` to embed signed license attachment metadata digests in the binder JSON/Markdown artifact. *(US-P4-15, FR-014)*

**Checkpoint**: Slice 1 functional. Operators can comment, attach file evidence, receive in-product mention alerts, and export binders referencing attachments.

---

## Phase 3: Slice 2 — Bulk Operations, Saved Views & Role Workspaces (Priority: P1)

**Goal**: Deliver multi-task selection and batch editing, customizable saved filter view presets, and 6 role-based workspace perspectives.

### Tests for Slice 2
- [ ] **T016-P4** `[P]` `[US-P4-04]` Vitest contract test for bulk task updates (`POST /api/tasks/bulk-update`) with optimistic concurrency checks and partial failure response in `src/tests/bulk_update_contract.test.ts`.
- [ ] **T017-P4** `[P]` `[US-P4-05]` Vitest integration test for saved view presets (`POST /api/views`, `GET /api/views`) and URL deep-linking in `src/tests/saved_views.test.ts`.

### Backend Implementation for Slice 2
- [ ] **T018-P4** Implement bulk action route handler in `server/routes/bulkActionRoutes.ts` supporting batch assignment, due date adjustment, status transitions, priority updates, per-task RBAC validation, optimistic concurrency locking (`version` field), and structured partial-failure payloads (`{ succeeded: [...], failed: [...] }`). *(FR-015–FR-022, US-P4-04, US-P4-10, D-07)*
- [ ] **T019-P4** Implement saved view preset repository and routes in `server/repositories/UserSavedViewRepo.ts` and `server/routes/viewRoutes.ts` managing user presets, default view assignment, team sharing, and filter state serialization. *(FR-023–FR-029, US-P4-05)*

### Frontend Implementation for Slice 2
- [ ] **T020-P4** Implement `BulkActionBar` component and confirmation modal in `src/components/BulkActionBar.tsx` rendering select-all-filtered toggle, selected task count, action dropdown, preview confirmation modal, and partial-failure error callout. *(US-P4-04, US-P4-10, FR-015–FR-022)*
- [ ] **T021-P4** Implement `SavedViewSelector` component in `src/components/SavedViewSelector.tsx` rendering preset dropdown, built-in defaults (`My Open Tasks`, `Shooting Blockers`, etc.), save view modal, share view toggle, and URL query param deep-linking (`?view=presetId`). *(US-P4-05, FR-023–FR-029)*
- [ ] **T022-P4** Implement `RoleWorkspaceSwitcher` component in `src/components/RoleWorkspaceSwitcher.tsx` rendering 6 role perspective presets (`LEGAL_COUNSEL`, `ART_DEPT`, `LOCATIONS`, `PRODUCTION_MGMT`, `COORDINATOR`, `ADMINISTRATOR`) updating active layout density, prioritized task queues, and column highlights without mutating underlying backend data. *(US-P4-07–US-P4-09, FR-030–FR-036)*

**Checkpoint**: Slice 2 functional. Coordinator bulk workflows, saved filter presets, and multi-role workspace perspectives are active.

---

## Phase 4: Slice 3 — Studio Portfolio Directory & High-Scale Virtualization (Priority: P2)

**Goal**: Deliver cross-project executive studio portfolio dashboard and virtualized list rendering supporting $\ge 1,000$ department tasks within strict performance budgets.

### Tests for Slice 3
- [ ] **T023-P4** `[P]` `[US-P4-06]` Vitest contract test for studio portfolio endpoint (`GET /api/portfolio`) verifying multi-project metrics and strict cross-project isolation in `src/tests/portfolio_contract.test.ts`.
- [ ] **T024-P4** `[P]` `[US-P4-16]` Performance stress test script in `src/tests/scale_virtualization.test.ts` populating 1,000 tasks and 500 clearance items, asserting initial render $\le 1.5$s, filter execution $\le 100$ms, and scroll frame rate $\ge 60$ FPS.

### Implementation for Slice 3
- [ ] **T025-P4** Implement portfolio route handler in `server/routes/portfolioRoutes.ts` aggregating studio project titles, owners, shooting readiness %, blocked scene counts, overdue task counts, rights expiration warnings, and script version numbers. *(FR-053–FR-058, US-P4-06)*
- [ ] **T026-P4** Implement `PortfolioDashboard` component and page in `src/components/PortfolioDashboard.tsx` and `src/pages/PortfolioPage.tsx` rendering studio project cards, readiness summary meters, blocker alerts, search/sort filters, and strict project access checks. *(US-P4-06, FR-053–FR-058)*
- [ ] **T027-P4** Implement `VirtualTaskList` component in `src/components/VirtualTaskList.tsx` utilizing list virtualization to render visible DOM rows only for lists with $\ge 1,000$ tasks, preserving scroll position, multi-page selection state, and keyboard focus order. *(US-P4-16, FR-045–FR-052)*

**Checkpoint**: Slice 3 functional. Executive portfolio dashboard renders multi-project readiness and 1,000-task lists scroll smoothly within performance budgets.

---

## Phase 5: Slice 4 — Server RBAC, Tiered Accessibility & Mobile Reflow (Priority: P2)

**Goal**: Enforce server-side security permissions, user role administration, tiered WCAG 2.2 AA accessibility (keyboard focus, live announcements, 200%/400% zoom), and responsive mobile card layout.

### Tests for Slice 4
- [ ] **T028-P4** `[P]` `[US-P4-14]` Vitest security test in `src/tests/server_rbac.test.ts` verifying backend HTTP 403 Forbidden responses when non-permitted users attempt counsel overrides, role changes, or restricted project access.
- [ ] **T029-P4** `[P]` `[US-P4-11]` Playwright keyboard and focus trap validation in `tests/live_keyboard_focus_validation.js` covering comments, attachments, bulk action modal, saved views selector, and role workspace switcher.

### Implementation for Slice 4
- [ ] **T030-P4** Extend server authorization middleware in `server/middleware/auth.ts` and implement user admin routes in `server/routes/adminRoutes.ts` enforcing role-based permissions for project read/write, counsel overrides, attachment deletion, binder exports, and user role updates. *(FR-071–FR-077, US-P4-13, US-P4-14)*
- [ ] **T031-P4** Implement User Administration panel in `src/components/UserAdminModal.tsx` allowing administrators to modify user roles and project membership mappings with full administrative audit logging. *(US-P4-13, FR-071–FR-077)*
- [ ] **T032-P4** Audit and refine WCAG 2.2 AA accessibility features across all new Phase 4 components (`TaskCommentThread`, `TaskAttachmentList`, `BulkActionBar`, `SavedViewSelector`, `RoleWorkspaceSwitcher`, `NotificationDrawer`, `PortfolioDashboard`):
  - Tier 1: Zero axe-core static violations.
  - Tier 2: `role="status"` `aria-live="polite"` announcements for comment, attachment, bulk, and notification count updates; `aria-setsize` and `aria-posinset` list semantics.
  - Tier 3: Document explicit manual macOS VoiceOver test protocol (`Cmd+F5`, `VO+Down`, `VO+Right`, `VO+Space`). *(US-P4-11, US-P4-12, FR-059–FR-065)*
- [ ] **T033-P4** Update responsive CSS and component layouts in `src/styles/` and `src/components/` supporting Desktop ($\ge 1280$px), Tablet ($768$px–$1279$px), and Mobile ($\le 767$px) viewports with adaptive wide-table to structured-card reflow, sticky bulk action bars, touch targets $\ge 44 \times 44$px, and no nested scroll traps. *(US-P4-07, US-P4-08, FR-066–FR-070)*

**Checkpoint**: Slice 4 functional. Server RBAC permissions enforced, user role administration active, WCAG 2.2 AA compliant, and responsive on mobile viewports.

---

## Phase 6: Integration, Quality Gates & Regression Verification

**Purpose**: Execute comprehensive local and live Cloud Run regression suites ensuring zero degradation of Phase 1–3 invariants.

- [ ] **T034-P4** Re-run full Vitest test suite (`npm test`) asserting 100% pass across all 101+ test files, verifying Phase 1–3 baseline preservation:
  - Benchmark: 3 scenes, 7 clearance items, 3 Cleared / 2 Action Required / 2 Review Recommended; 11 department tasks (Art 1 / Legal 9 / Locations 1 / Prod 0); 1 Final Clear / 2 blocked scenes; 33.3% shooting readiness.
  - Mapped dynamically to $1 + 9 + 1 + 0 = 11$ open tasks.
  - 4 canonical clearance states (`NO_ISSUE_SURFACED`, `INSUFFICIENT_EVIDENCE`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`). *(Phase 1–3 Regression Gate)*
- [ ] **T035-P4** Execute Playwright live keyboard and focus validation script (`BASE_URL=http://localhost:3001 node tests/live_keyboard_focus_validation.js`) locally and against live Cloud Run deployment, verifying 100% pass across all sub-checks. *(Live Deployment Gate)*

---

## Traceability Summary: User Stories to Tasks

| User Story | Title | Implementation & Test Tasks |
| :--- | :--- | :--- |
| **US-P4-01** | Coordinator Comments & Mentions | `T001-P4`, `T002-P4`, `T006-P4`, `T009-P4`, `T012-P4` |
| **US-P4-02** | Counsel In-Product Notification Deep-Link | `T004-P4`, `T011-P4`, `T014-P4` |
| **US-P4-03** | Counsel Signed License Attachment | `T003-P4`, `T007-P4`, `T008-P4`, `T010-P4`, `T013-P4` |
| **US-P4-04** | Coordinator Bulk Task Assignment | `T016-P4`, `T018-P4`, `T020-P4` |
| **US-P4-05** | Save Custom Filter View Preset | `T017-P4`, `T019-P4`, `T021-P4` |
| **US-P4-06** | Studio Portfolio Executive Review | `T023-P4`, `T025-P4`, `T026-P4` |
| **US-P4-07** | Art Dept Replacement Asset Queue | `T022-P4`, `T033-P4` |
| **US-P4-08** | Locations Permit Deadline Queue | `T022-P4`, `T033-P4` |
| **US-P4-09** | Multi-Role Context Switching | `T022-P4` |
| **US-P4-10** | Partial Bulk Failure Recovery | `T016-P4`, `T018-P4`, `T020-P4` |
| **US-P4-11** | 100% Keyboard-Only Operations | `T029-P4`, `T032-P4` |
| **US-P4-12** | Screen Reader Count Semantics | `T014-P4`, `T032-P4` |
| **US-P4-13** | Administrator Role Modification | `T030-P4`, `T031-P4` |
| **US-P4-14** | Server Permission Access Denial | `T028-P4`, `T030-P4` |
| **US-P4-15** | Binder Export Attachment Index | `T015-P4` |
| **US-P4-16** | 1,000-Task Virtualization Budgets | `T024-P4`, `T027-P4` |

---

## Phase 7: Phase 4 Recovery Items (P0 / P1 / P2)

**Purpose**: Execute specific recovery fixes for P0 workspace project switching, P1 idempotent fixture seeding and notification target alignment, and P2 portfolio card layout density.

- [ ] **T036-P4** `[P0]` Fix `InMemoryStore.doc()` in `server/repositories/firestoreClient.ts` and method chaining in `server/repositories/ProjectRepo.ts` so `GET /api/projects/proj-cyberpunk` returns HTTP 200 without throwing 500 error (`this.db.doc(...).get is not a function`).
- [ ] **T037-P4** `[P0]` Update portfolio "Open Production" in `src/App.tsx` & `src/components/PortfolioDashboard.tsx` to pass the card's stable `projectId`, fetch the snapshot for that ID, and update workspace state only when confirmed; fail gracefully without showing false navigation success on API error.
- [ ] **T038-P4** `[P1]` Ensure idempotent project seeding in `server/repositories/ProjectRepo.ts` with stable deterministic project IDs (`proj-default` / `proj-cyberpunk`), avoiding random UUID project creation on re-initializations.
- [ ] **T039-P4** `[P1]` Align notification target task IDs in `server/repositories/UserNotificationRepo.ts` and `src/components/NotificationDrawer.tsx` to match task heading IDs and accessible names, maintaining scroll, expand, and live region announcements.
- [ ] **T040-P4** `[P2]` Update card grid layout density in `src/components/PortfolioDashboard.tsx` with explicit spacing between metric numbers and text labels (`"2 Blocked Scenes"`), displaying project title, code, studio name, and keyboard-visible focus indicators.

---

## Confirmation of Boundary Limits
- **Implementation Status**: Zero tasks executed during this TASKS stage. All tasks are specified for future implementation upon authorization.
- **Source Code**: 0 application source files modified.
- **Tests**: 0 tests executed.
- **Deployments / Git**: 0 builds, 0 deployments, 0 commits, 0 pushes.

