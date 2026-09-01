# Feature Specification: Enterprise Collaboration, Departmental Workflows & High-Scale Production Management (Phase 4)

**Feature Branch**: `027-phase4-collaboration-scale`  
**Version**: `v0.27.0-phase4-propose`  
**Created**: 2026-08-26  
**Status**: Proposed / Pending Approval (PROPOSE Stage)  
**Input**: Phase 4 Orchestrator Proposal Directive (`/tmp/agy-p4-propose.md`)  

---

## Executive Objective

Specify ClearanceScout Phase 4 as an enterprise-grade collaborative production-control system. Phase 4 extends the single-operator clearance workflow established in Phases 1–3 into a multi-department, multi-role collaborative environment supporting accountable handoffs, rich file attachments, bulk task operations, saved filter views, role-based workspace perspectives, in-product notifications, cross-project portfolio tracking, high-scale performance ($\ge 1,000$ tasks), server-enforced security/RBAC, and 100% WCAG 2.2 AA accessibility compliance.

---

## Baseline Invariants & Preservation Rules

The system MUST preserve all verified Phase 1–3 state, state machines, and calculation patterns without reopening completed work:
- **Baseline Synchronized Benchmark**: 3 scenes, 7 clearance items, 3 Cleared (`NO_ISSUE_SURFACED`), 2 Action Required (`ACTION_REQUIRED`), 2 Review Recommended (`REVIEW_RECOMMENDED`), 11 department tasks (1 Art Dept, 9 Legal Counsel, 1 Locations, 0 Production Management), 1 Final Clear scene, 2 blocked scenes, 33.3% shooting readiness.
- **Clearance State Machine**: Four canonical states (`NO_ISSUE_SURFACED`, `INSUFFICIENT_EVIDENCE`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`).
- **Code Isolation & Security**: `server/` handles backend agents, model calls, storage, and security; `src/` handles UI components and API client hooks. Zero raw model chain-of-thought is ever logged or rendered.
- **Single Source of Truth**: Zero duplicate data sources for projects, tasks, counts, rights, readiness, or audit history. All views, dashboards, and metrics derive from authoritative backend repositories.

---

## 12 Core Capability Areas

### Area 1: Task Discussion & Threaded Activity Stream
- Timestamped comments per department task.
- Author identity and department attribution (`authorName`, `authorRole`, `authorDepartment`).
- `@mentions` to alert specific users or roles (e.g. `@LegalCounsel`, `@SarahJenkins`).
- Comment editing and deletion with mandatory audit trail records.
- Unread activity indicators per user/task.
- Single unified chronological activity stream combining user comments and system task status mutations.

### Area 2: Task Attachments & Evidence Management
- Attachment upload support for releases, permits, licenses, prop artwork, and correspondence.
- Exposed metadata: filename, MIME type, file size, uploader, timestamp, optional description, download/preview links, version/replacement history.
- Explicit processing states: `UPLOADING`, `COMPLETED`, `FAILED`, `CANCELLED` with retry and cancellation mechanisms.
- Security and content validation: safe filenames, MIME type whitelist, file size limits ($\le 25$ MB per file).
- Server-enforced authorization for upload, preview, download, replacement, and removal.
- Permanent audit log generation for attachment removal or replacement.
- Durable attachment retention across task reassignment, status resolution, entity merging, and script re-ingestion.

### Area 3: Bulk Task Operations & Batch Management
- Multi-task selection and batch modifications: assign department, assign owner, set due date, update status, adjust priority, mark in-progress, resolve.
- Selection count indicator, select-all-filtered toggle across paginated/virtualized lists.
- Bulk preview and confirmation modal detailing affected tasks and proposed changes.
- Destructive operation safeguards (confirmation prompt required for bulk resolution or status reset).
- Per-task authorization enforcement during batch processing.
- Partial-failure reporting and recovery: if $3$ out of $10$ tasks fail authorization or validation, successful updates commit while failed items are highlighted with actionable retry options.
- Atomic per-task audit trail entry for every modified item in the batch.

### Area 4: Saved Views & Advanced Multi-Parameter Filtering
- Multi-parameter filter engine: department, assignee, status, priority, due date range, overdue status, scene ID, clearance item category, readiness impact, unread activity.
- Preset management: save view, name preset, rename, set default view, share preset with team, delete preset, clear filters.
- Built-in default view presets: `My Open Tasks`, `My Overdue Tasks`, `Shooting Blockers`, `Legal Review Queue`, `Expiring Rights`, `Recently Updated`.
- View precedence rules (personal default $\rightarrow$ project default $\rightarrow$ unfiltered system default).
- Invalid/outdated filter state recovery.
- URL deep-linking support (`/workspace/:id?view=:presetId` or query params) preserving filter context across reloads and sharing.

### Area 5: Role-Based Workspaces & Persona Perspectives
- Specialized workspace perspectives over single authoritative data model for 6 core roles:
  1. **Legal Counsel**: Emphasizes legal research, rights agreements, counsel overrides, expirations, and clearance approvals.
  2. **Art Department**: Emphasizes prop graphics, replacement assets, design approvals, and art delivery due dates.
  3. **Locations**: Emphasizes location permits, owner releases, shoot dates, and venue restrictions.
  4. **Production Management**: Emphasizes shooting blockers, production deadlines, ownership gaps, and overall readiness.
  5. **Clearance Coordinator**: Emphasizes cross-department triage queue, task assignment, and handoff tracking.
  6. **Administrator**: Emphasizes system configuration, user role management, and access controls without cluttering operational workflows.
- Seamless context switching for operators holding multiple roles.

### Area 6: In-Product Notification Center
- Real-time in-product notification drawer and header badge.
- Event triggers: task assignment/reassignment, `@mentions` and replies, approaching due dates ($\le 48$ hours), overdue status, expiring rights warnings, new shooting blockers, changed counsel decisions, failed screenplay ingestion/sync, binder export completion/failure.
- Deep links directly to target task, entity, or modal context.
- Read/unread status management, mark all as read, notification category preferences.
- Automated escalation notifications for unassigned overdue shooting blockers.
- Accessible live region announcements (`role="status"`, `aria-live="polite"`).
- Explicit exclusion of email, SMS, or third-party external messaging integrations.

### Area 7: High-Scale Performance & Volume Capacity
- Architecture engineered for large studio productions: $\ge 500$ clearance items, $\ge 1,000$ department tasks, $\ge 200$ scenes across multiple simultaneous productions.
- List virtualization and paginated rendering for tables and cards.
- Layout density options (Compact vs Comfortable view).
- Multi-column sorting, instant text search, multi-page selection preservation.
- Measurable performance budgets:
  - Initial workspace load $\le 1.5$s.
  - Client-side filter/search response $\le 100$ms.
  - Bulk operation commit ($100$ items) $\le 500$ms.
  - Page scroll rendering $\ge 60$ FPS without frame drop.

### Area 8: Cross-Project Studio Portfolio Directory
- Portfolio dashboard rendering active studio productions.
- Metrics per project: title, owner, shooting readiness %, blocked scene count, overdue task count, rights expiration warnings, script version, last sync timestamp.
- Project-level authorization boundaries preventing unauthorized access.
- Absolute cross-project data isolation: zero count, task, or entity leakage between project contexts.

### Area 9: Accessibility Compliance (WCAG 2.2 AA)
- Mandatory WCAG 2.2 AA conformance across all UI components.
- 100% keyboard-only navigation with visible focus indicators (`:focus-visible`).
- Logical focus trapping and focus restoration on all modals and drawers.
- Accessible live regions (`role="status"`, `aria-live="polite"`) for comments, attachments, bulk actions, and notifications.
- Non-color-only status indicators (text badges + distinct ARIA labels).
- Support for $200\%$ and $400\%$ zoom/reflow without text overlap or horizontal scroll traps.

### Area 10: Multi-Form Factor Responsiveness
- Full responsiveness across Desktop ($\ge 1280$px), Tablet ($768$px–$1279$px), and Mobile ($\le 767$px).
- Adaptive wide-table to structured-card reflow on narrow viewports.
- Touch target sizing $\ge 44 \times 44$px for mobile/tablet.
- Elimination of nested scroll traps on small viewports.

### Area 11: Security & Server-Enforced RBAC
- Backend authorization enforcement (`server/middleware/auth.ts`):
  - Project read/write authorization.
  - Task creation, assignment, and status transition permissions.
  - Legal Counsel override permissions restricted to `LEGAL_COUNSEL` and `ADMINISTRATOR` roles.
  - Attachment upload/removal permissions.
  - Binder export permissions.
- Actionable permission denial messaging without exposing confidential project details.

### Area 12: Auditability & Immutable Data Integrity
- Immutable append-only audit trail logging actor, timestamp, project ID, target entity/task ID, previous value, new value, action type, and optional rationale.
- Strict mathematical count reconciliation across header, tabs, dashboards, saved views, notifications, portfolio cards, and exported clearance binders.

---

## 16 Required User Stories & Acceptance Criteria

### US-P4-01: Coordinator Comments on Task & Mentions Counsel (Priority: P1)
**As a** Clearance Coordinator,  
**I want** to post a timestamped comment on a department task and `@mention` Legal Counsel,  
**So that** legal counsel is alerted to review a clearance issue without changing the task status.

- **Scenario 1 (Add Comment without Status Change)**:
  - **Given** an open department task (`task-102`),  
  - **When** the coordinator types `"@LegalCounsel please review the trademark disclaimer on this placard"` and clicks `"Post Comment"`,  
  - **Then** the comment appears in the task's chronological stream with author name, role, timestamp, and `@LegalCounsel` highlight, while task status remains `OPEN`.
- **Scenario 2 (Audit Trail Recording)**:
  - **Given** a new comment is posted on `task-102`,  
  - **When** the task activity trail is expanded,  
  - **Then** a `COMMENT_ADDED` event is recorded in `activityHistory` detailing actor, timestamp, and comment excerpt.

---

### US-P4-02: Counsel Receives Notification & Opens Task (Priority: P1)
**As a** Legal Counsel,  
**I want** to receive an in-product notification when mentioned and click it to navigate directly to the exact task,  
**So that** I can immediately inspect the clearance context.

- **Scenario 1 (Notification Delivery & Unread Badge)**:
  - **Given** Legal Counsel is logged in,  
  - **When** a coordinator posts a comment mentioning `@LegalCounsel`,  
  - **Then** the header notification badge increments by `1` and an in-product notification appears reading `"Coordinator mentioned you on Task: Titan Industrial Hazard Placard"`.
- **Scenario 2 (Deep Link Navigation)**:
  - **Given** an unread mention notification in the notification drawer,  
  - **When** Legal Counsel clicks the notification,  
  - **Then** `ActionListModal` opens focused directly on `task-102` with the comment thread visible, and the notification is marked as `READ`.

---

### US-P4-03: Counsel Attaches Signed License & Updates Task (Priority: P1)
**As a** Legal Counsel,  
**I want** to upload a signed music synchronization license PDF to a task and mark it resolved,  
**So that** clearance proof is permanently attached to the production record.

- **Scenario 1 (Attachment Upload & Validation)**:
  - **Given** Legal Counsel viewing `task-104` (*Secure Music Synchronization License: Nocturne of the Wild*),  
  - **When** counsel uploads `Nocturne_Sync_License_Signed.pdf` ($1.2$ MB),  
  - **Then** the file uploads with progress indicator, validates MIME type (`application/pdf`), and displays filename, size, uploader, timestamp, and download/preview buttons.
- **Scenario 2 (Task Resolution & Audit Retention)**:
  - **Given** `task-104` with signed license attached,  
  - **When** counsel changes status to `RESOLVED`,  
  - **Then** status updates to `RESOLVED`, an `ATTACHMENT_ADDED` and `STATUS_CHANGED` event are appended to `activityHistory`, and the attached file is durably retained.

---

### US-P4-04: Coordinator Bulk-Assigns Filtered Tasks (Priority: P1)
**As a** Clearance Coordinator,  
**I want** to select multiple filtered tasks and assign them to a team member in a single bulk operation,  
**So that** workload distribution is fast and error-free.

- **Scenario 1 (Bulk Selection & Confirmation)**:
  - **Given** 5 open Legal Counsel tasks in `ActionListModal`,  
  - **When** the coordinator checks select-all, chooses `"Assign to: Sarah Jenkins"`, and clicks `"Apply Bulk Action"`,  
  - **Then** a confirmation modal displays `"Assign 5 tasks to Sarah Jenkins?"`, and upon confirmation, all 5 tasks update their assignee.
- **Scenario 2 (Atomic Audit Trail per Task)**:
  - **Given** bulk assignment of 5 tasks,  
  - **When** inspecting any of the 5 tasks,  
  - **Then** each task contains an independent `TASK_REASSIGNED` audit event with actor, timestamp, previous assignee, and new assignee.

---

### US-P4-05: User Saves "My Overdue Blockers" View Preset (Priority: P2)
**As a** Line Producer,  
**I want** to create and save a custom filter preset for overdue shooting blockers and set it as my default view,  
**So that** my critical daily queue opens automatically upon login.

- **Scenario 1 (Preset Creation & Default Persistence)**:
  - **Given** workspace task list,  
  - **When** the producer filters by `Status: OPEN`, `Overdue: TRUE`, `Readiness Impact: BLOCKS_SHOOTING`, clicks `"Save View As"`, names it `"My Overdue Blockers"`, and checks `"Set as My Default"`,  
  - **Then** the view preset is saved and set as default for subsequent logins.
- **Scenario 2 (Deep Link Preservation)**:
  - **Given** a saved view preset ID `preset-88`,  
  - **When** the user opens `/workspace/proj-101?view=preset-88`,  
  - **Then** the task list initializes automatically with `preset-88` active and correct filtered counts.

---

### US-P4-06: Production Management Reviews Readiness Across Portfolio (Priority: P2)
**As a** Head of Production,  
**I want** to view a cross-project portfolio summary listing all active studio productions with readiness metrics and blocker counts,  
**So that** executive production oversight is unified.

- **Scenario 1 (Portfolio Summary Dashboard)**:
  - **Given** 4 active studio projects in the system,  
  - **When** Production Management opens the Studio Portfolio view,  
  - **Then** a project grid displays title, owner, readiness %, blocked scenes, overdue tasks, and script version for each project.
- **Scenario 2 (Cross-Project Isolation Guarantee)**:
  - **Given** Production Management inspecting `Project A`,  
  - **When** navigating between project cards,  
  - **Then** `Project A` metrics and tasks NEVER bleed into `Project B` or `Project C`.

---

### US-P4-07: Art User Reviews Replacement Assets in Compact Queue (Priority: P2)
**As an** Art Director,  
**I want** to switch to the Art Department Workspace view to focus exclusively on prop graphics and replacement assets in a compact layout,  
**So that** design tasks are clear without legal distraction.

- **Scenario 1 (Role-Based Workspace View Switch)**:
  - **Given** Art Director logged in,  
  - **When** selecting `"Art Department Workspace"` role perspective,  
  - **Then** the view filters task list to Art Dept items, highlights prop graphic replacement requirements, displays delivery due dates, and switches to compact density mode.

---

### US-P4-08: Locations User Finds Permits Due Before Shoot Date (Priority: P2)
**As a** Location Manager,  
**I want** to filter tasks by Locations department and sort by approaching due date,  
**So that** location permits are secured prior to filming dates.

- **Scenario 1 (Locations Permit Queue Filter & Sort)**:
  - **Given** workspace task list,  
  - **When** Location Manager selects `Department: LOCATIONS` and sorts by `Due Date (Ascending)`,  
  - **Then** tasks display location permit requirements ordered by nearest deadline with visual urgency indicators.

---

### US-P4-09: Multi-Role Operator Switches Work Context (Priority: P2)
**As a** Production Executive acting as both Clearance Coordinator and Legal Counsel,  
**I want** to switch workspace role perspectives seamlessly,  
**So that** my active view matches my current operational focus.

- **Scenario 1 (Context Switch without Data Mutation)**:
  - **Given** operator viewing Legal Counsel workspace perspective,  
  - **When** operator switches role dropdown to `"Clearance Coordinator Workspace"`,  
  - **Then** UI perspective updates immediately to coordinator triage queue while underlying project data remains 100% synchronized and unmutated.

---

### US-P4-10: Partial Bulk-Update Failure Reporting & Recovery (Priority: P2)
**As a** Clearance Coordinator,  
**I want** explicit feedback if a bulk update partially fails due to permission or validation constraints,  
**So that** successful updates commit while failed items are easily retried.

- **Scenario 1 (Partial Failure Handling)**:
  - **Given** bulk selection of 10 tasks where 2 tasks require Legal Counsel override permission,  
  - **When** a non-legal coordinator attempts bulk resolution,  
  - **Then** 8 non-restricted tasks resolve successfully, 2 restricted tasks remain open, and a summary modal states `"8 tasks resolved successfully. 2 tasks require Legal Counsel permission"` with an option to notify Legal Counsel.

---

### US-P4-11: Keyboard-Only User Filters, Selects, Updates, & Comments (Priority: P1)
**As a** Keyboard-Only Operator,  
**I want** to execute all filter, bulk selection, status update, and comment actions using keyboard navigation alone,  
**So that** the application is fully operable without a mouse.

- **Scenario 1 (100% Keyboard Operation)**:
  - **Given** keyboard focus inside `ActionListModal`,  
  - **When** operator uses `Tab`, `Arrow` keys, `Space`, and `Enter` to apply filters, select 3 tasks, bulk-assign them, and add a comment,  
  - **Then** focus stays visibly indicated (`:focus-visible`), focus is trapped inside modal/drawers, and focus restores to trigger upon dismissal.

---

### US-P4-12: Screen-Reader User Receives Accurate Count Semantics (Priority: P1)
**As a** Vision-Impaired Operator using a Screen Reader (VoiceOver/NVDA),  
**I want** live status region updates when filtering, updating tasks, or receiving notifications,  
**So that** spoken announcements match visual count changes.

- **Scenario 1 (Spoken Live Region Announcements)**:
  - **Given** Screen Reader active,  
  - **When** user applies a department filter in Action Center,  
  - **Then** a `role="status"` `aria-live="polite"` region speaks `"Showing 9 of 11 department tasks"` matching visual totals.

---

### US-P4-13: Administrator Changes User Role (Priority: P3)
**As a** System Administrator,  
**I want** to update a user's role assignments in the User Administration panel,  
**So that** security permissions match organizational responsibility.

- **Scenario 1 (Role Assignment Mutation)**:
  - **Given** Administrator in User Administration panel,  
  - **When** admin changes user `j.doe@studio.com` from `ART_DEPT` to `LEGAL_COUNSEL` and clicks `"Save User Role"`,  
  - **Then** backend updates user role, logs an administrative audit event, and user `j.doe@studio.com` receives Legal Counsel permissions on next request.

---

### US-P4-14: Unauthorized User Attempts to Access Restricted Project (Priority: P1)
**As a** Studio Security Officer,  
**I want** unauthorized project access attempts to be rejected on the backend with clean permission messages,  
**So that** confidential production data is protected.

- **Scenario 1 (Server-Enforced Access Denial)**:
  - **Given** a user without permission for `Project Alpha`,  
  - **When** user attempts to open `/workspace/proj-alpha` or call `/api/projects/proj-alpha/entities`,  
  - **Then** backend returns `HTTP 403 Forbidden` (`{"error": "Access Denied: You do not have permission to view Project Alpha"}`), UI displays clean access error card, and zero project details are leaked.

---

### US-P4-15: Binder Export References Attached Task Evidence (Priority: P1)
**As a** Legal Counsel,  
**I want** exported Legal Clearance Binders to include an attachment index referencing signed licenses and permits,  
**So that** binder artifacts contain complete audit proof.

- **Scenario 1 (Binder Artifact Attachment Index)**:
  - **Given** a project with attached signed licenses,  
  - **When** Legal Counsel exports the Clearance Binder,  
  - **Then** generated binder JSON/Markdown artifact contains an `attachments` summary array listing file names, SHA-256 digests, timestamps, and uploader attribution for every clearance item.

---

### US-P4-16: High-Volume Production (1,000 Tasks) Operates Within Budgets (Priority: P2)
**As a** Studio Executive,  
**I want** a production workspace with 1,000 tasks and 500 clearance items to load and scroll smoothly,  
**So that** large film productions experience zero lag.

- **Scenario 1 (Virtualization Performance Verification)**:
  - **Given** a test project populated with 1,000 department tasks and 500 clearance items,  
  - **When** opening `ActionListModal` and scrolling through items,  
  - **Then** DOM renders only visible virtualized rows, memory consumption remains stable, scroll FPS $\ge 60$, and filtering completes in $\le 100$ms.

---

## Key Data Entities

```
+------------------+         +-------------------+         +---------------------+
|     Project      | 1 --- * |   ClearanceItem   | 1 --- * |   DepartmentTask    |
| (Title, Owner)   |         | (Status, Category)|         | (Assignee, DueDate) |
+------------------+         +-------------------+         +---------------------+
         |                                                            |
         | 1                                                          | 1
         *                                                            *
+------------------+                                       +---------------------+
|  ProjectMember   |                                       |   TaskAttachment    |
| (User, Role)     |                                       | (FileName, GCS_URI) |
+------------------+                                       +---------------------+
                                                                      |
                                                                      | 1
                                                                      *
                                                           +---------------------+
                                                           |     TaskComment     |
                                                           | (Author, Content)   |
                                                           +---------------------+
                                                                      |
                                                                      | 1
                                                                      *
                                                           +---------------------+
                                                           |   ActionAuditEvent  |
                                                           | (Actor, Timestamp)  |
                                                           +---------------------+
```

---

## Success Criteria & Performance Budgets

- **SC-001 (Functional Completeness)**: 100% pass across all 16 Phase 4 user stories and acceptance scenarios.
- **SC-002 (Performance Budgets)**:
  - Initial workspace page load $\le 1.5$s.
  - Multi-parameter filter/search response $\le 100$ms.
  - Bulk operation processing ($100$ tasks) $\le 500$ms.
  - Virtualized list scroll frame rate $\ge 60$ FPS.
- **SC-003 (Accessibility Compliance)**: Zero WCAG 2.2 AA violations reported by automated static checks and 100% pass on real Playwright keyboard/focus validation.
- **SC-004 (Data Integrity)**: $100\%$ count reconciliation across header, tabs, saved views, notification drawer, portfolio dashboard, and exported binders.

---

## Assumptions & Exclusions

### Assumptions
1. Phase 1–3 backend repositories (`ProjectRepo`, `ActionNotificationRepo`, `ClearanceItemRepo`) and workflows will be extended rather than rewritten.
2. User authentication will pass authenticated identity headers/tokens (`x-demo-token` or Bearer JWT) to backend endpoints.
3. System runs on standard web browsers (Chrome, Firefox, Safari, Edge) on Desktop, Tablet, and Mobile viewports.

### Exclusions
1. Email, SMS, or external third-party messaging integrations (Slack, Teams).
2. Third-party project management tool synchronization (Jira, Asana, Trello).
3. Automated legal decision-making or AI-generated legal guarantees.
4. Native iOS/Android mobile apps (web application reflow handles mobile access).

---

## Explicit Unresolved Architectural & Governance Decision Matrix

The following decision matrix surfaces all unresolved technical and policy options requiring explicit approval. No implicit assumptions are made.

| # | Unresolved Decision Area | Recommended Default | Viable Alternative | Impact of Deferral | Approval Required Before PLAN? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **D-01** | User Identity & Authentication Engine | Firebase Auth / Cloud Identity Bearer JWT tokens | Custom session cookies / signed request headers | Authentication enforcement delayed until late slice | **YES** |
| **D-02** | Role & Permission Model Definition | 6 discrete role roles (`LEGAL_COUNSEL`, `ART_DEPT`, `LOCATIONS`, `PRODUCTION_MGMT`, `COORDINATOR`, `ADMINISTRATOR`) | Fine-grained permission strings (`task:edit`, `override:create`, `binder:export`) | Coarse authorization boundaries in early implementation | **YES** |
| **D-03** | Project Membership & Access Model | Explicit `ProjectMember` mapping table in Firestore (`projectId`, `userId`, `projectRole`) | Open organization-wide access with domain restriction | Inability to restrict confidential studio projects | **YES** |
| **D-04** | `@Mention` Parsing & Resolution | Server-side regex extraction of `@role` or `@user` matching `ProjectMember` collection | Client-side pre-parsed user ID arrays attached to comment payload | Mismatched mention notifications across clients | No |
| **D-05** | Notification Delivery & Unread Semantics | Real-time SSE / Firestore snapshot listeners with `userNotifications` collection | Periodic polling of GET `/api/notifications/unread` | Latency in in-product mention announcements | No |
| **D-06** | Attachment Storage, Scanning, Limits & Access | Google Cloud Storage (GCS) bucket with 15-min signed URLs; 25 MB max limit; Cloud Storage Malware Scanner | Local server filesystem (`server/uploads/`); client MIME validation only | Storage non-scalable across Cloud Run instances | **YES** |
| **D-07** | Concurrency & Partial Failure Strategy | Optimistic concurrency control (`version` field) + transactional partial-failure result array | Last-write-wins with appended conflict audit event | Overwriting concurrent edits in multi-user sessions | **YES** |
| **D-08** | Saved View Ownership & Sharing | User-owned presets stored in `userSavedViews` with optional `isSharedWithTeam` flag | Project-level shared presets only | Personal views overwrite team view defaults | No |
| **D-09** | Portfolio Access Authorization | Restricted to users with `PRODUCTION_MGMT` or `ADMINISTRATOR` project role | Open to all authenticated studio members | Executive portfolio metrics visible to sub-contractors | **YES** |
| **D-10** | Performance Budgets & Measurement Methods | Chrome DevTools Performance Trace & Playwright `performance.mark()` timing assertions | Manual browser timing observation | Vague non-quantified performance evaluation | No |
| **D-11** | Audit Immutability & Retention Policy | Permanent append-only Firestore collection with GCS cold-storage archive | 7-year rolling retention with automated TTL purge | Exposure during legal discovery or compliance audit | No |
| **D-12** | Source of Current Time for Due Dates & Escalations | Server UTC timestamp (`new Date().toISOString()` / Firestore ServerTimestamp) | Client-provided timestamp | Clock skew across client machines triggering false overdue badges | No |
| **D-13** | Accessibility Verification Environments | Automated axe-core / static checks + Playwright focus validation + explicit macOS VoiceOver manual test procedure | Automated axe-core / Playwright assertions alone | Conflating DOM ARIA attributes with real screen-reader speech | No |

---

## Proposed Delivery Slices

- **Slice 1: Task Discussion, Attachments & Notification Center (Priority: P1)**
  - US-P4-01, US-P4-02, US-P4-03, US-P4-15.
  - Value: Enables rich task collaboration, file attachments, and in-product alerting.
- **Slice 2: Bulk Operations, Saved Views & Role Workspaces (Priority: P1)**
  - US-P4-04, US-P4-05, US-P4-07, US-P4-08, US-P4-09, US-P4-10.
  - Value: Streamlines coordinator batch workflows and provides role-tailored queues.
- **Slice 3: Scale, Portfolio Directory & Performance (Priority: P2)**
  - US-P4-06, US-P4-16.
  - Value: Supports studio executive portfolio oversight and $\ge 1,000$-task performance budgets.
- **Slice 4: Server RBAC, Accessibility & Mobile Reflow (Priority: P2)**
  - US-P4-11, US-P4-12, US-P4-13, US-P4-14.
  - Value: Hardens security permissions, WCAG 2.2 AA accessibility, and mobile layout.

---

## Future Verification Plan (Specified for Later Execution — Do Not Run Now)

The future implementation of Phase 4 will be verified using the following comprehensive, multi-layered validation sequence:

### 1. Functional User Story Coverage
- **US-P4-01 to US-P4-16**: Every single user story will have dedicated Vitest contract tests and Playwright end-to-end browser assertions covering primary success paths and edge cases.

### 2. Phase 1–3 Regression Suite
- Re-run full 101+ file Vitest suite (`npm test`) asserting baseline preservation:
  - Benchmark: 3 scenes, 7 clearance items, 3 Cleared / 2 Action Required / 2 Review Recommended; 11 department tasks (Art 1 / Legal 9 / Locations 1 / Prod 0); 1 Final Clear / 2 blocked scenes; 33.3% shooting readiness.
  - State machine invariants: 4 canonical states (`NO_ISSUE_SURFACED`, `INSUFFICIENT_EVIDENCE`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`).

### 3. Multi-Project Isolation Verification
- Playwright test creating Project A and Project B, asserting zero cross-project data leakage:
  - Project A tasks, comments, attachments, title, and onboarding states MUST NOT appear in Project B context.

### 4. Server Permission Boundaries
- Vitest API contract tests attempting unauthorized actions under non-permitted user roles:
  - Non-legal user attempting counsel override $\rightarrow$ `HTTP 403 Forbidden`.
  - Non-admin user attempting user role update $\rightarrow$ `HTTP 403 Forbidden`.
  - Unauthorized user accessing restricted project endpoint $\rightarrow$ `HTTP 403 Forbidden`.

### 5. Mathematical Count Reconciliation
- Automated contract assertions validating that `pendingActionsCount === ART_DEPT + LEGAL_COUNSEL + LOCATIONS + PRODUCTION_MGMT` across:
  - Header total badges, Operations Dashboard tiles, Action Center status text, Saved View preset counters, Notification drawer badges, Portfolio project cards, and Exported binder manifests.

### 6. Audit History Integrity
- Verification that `activityHistory` is 100% append-only. No mutation endpoint or task update may edit or purge existing audit event records.

### 7. Comment & Attachment Persistence
- Integration test creating a task comment and uploading an attachment, executing a screenplay re-ingestion, entity merge, and status resolution, verifying comment threads and file attachment URIs remain 100% intact.

### 8. Bulk Operation Partial-Failure Recovery
- Integration test submitting a 10-task bulk resolution request containing 2 permission-restricted items:
  - Verifies 8 valid tasks update cleanly, 2 restricted tasks remain open, and server returns detailed partial-success payload with actionable retry metadata.

### 9. Scale & Performance Stress Testing ($\ge 1,000$ Tasks)
- Automated load test generating 1,000 tasks and 500 clearance items:
  - Asserts virtualized DOM rendering keeps page load $\le 1.5$s, filtering response $\le 100$ms, batch updates $\le 500$ms, and scroll frame rate $\ge 60$ FPS.

### 10. WCAG 2.2 AA Keyboard-Only & Screen-Reader Verification
- **Keyboard-Only**: 100% Playwright tab-cycle navigation verifying visible focus rings (`:focus-visible`), modal focus trapping, and focus restoration upon closure.
- **Screen Reader Workflows**: Strict separation of verification tiers:
  - Tier 1: Static axe-core / HTML validator check (0 violations).
  - Tier 2: Playwright DOM ARIA tree attribute assertion (`role="status"`, `aria-live="polite"`, `aria-setsize`, `aria-posinset`).
  - Tier 3: Manual macOS VoiceOver audio verification protocol (`Cmd+F5`, `VO+Down`, `VO+Right`, `VO+Space`).

### 11. Responsive Layout & Zoom Reflow
- Playwright viewport testing across Desktop ($1920 \times 1080$), Tablet ($820 \times 1180$), and Mobile ($390 \times 844$).
- Browser reflow validation at $200\%$ and $400\%$ zoom asserting zero text truncation or horizontal scroll traps.

### 12. System State Resiliency
- Robustness testing across all UI states: `EMPTY` (no data), `LOADING` (spinners/skeleton loaders), `FAILURE` (error boundary + retry trigger), `STALE` (re-synchronization badge), and `RECOVERED` (restored connection).

