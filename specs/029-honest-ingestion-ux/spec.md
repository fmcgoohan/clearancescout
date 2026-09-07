# Feature Specification: Honest Ingestion UX & Production Creation Flow

**Feature Branch**: `029-honest-ingestion-ux`  
**Created**: 2026-09-02  
**Status**: Draft  
**Input**: User description: "Honest Ingestion UX and Production Creation Flow: eliminate silent demo seeding, provide honest extraction preview before commit, persistent header New Production control, guided onboarding flow, and single clear primary action per state."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unambiguous Production Creation & Honest Empty State (Priority: P1)

As a legal clearance coordinator starting a new film project, I want to create a brand-new production directly from the main header and see a clean, unpopulated workspace with zero placeholder items, so that real productions are never polluted with synthetic demo data.

**Why this priority**: Silent demo substitution destroys user trust, creates legal ambiguity regarding clearance status, and makes it impossible to distinguish genuine uploaded script items from sample data.

**Independent Test**: Create a new production from the header control; verify the workspace shows 0 scenes, 0 clearance items, and 0 department tasks, with an explicit prompt to add a screenplay.

**Acceptance Scenarios**:
1. **Given** any view in the application, **When** the user looks at the top navigation header, **Then** a persistent "New Production" action button is directly visible and accessible without opening the project switcher.
2. **Given** the user creates a new production titled "Solaris Dawn", **When** the workspace initializes, **Then** the workspace displays 0 scenes, 0 clearance items, and 0 department tasks, and displays a prominent recommendation to "Upload Screenplay".
3. **Given** an empty production, **When** the user views the summary bar and readiness cards, **Then** the UI displays "No clearance items recorded" and "No clearance blockers recorded" rather than declaring the empty production as "Ready for Shoot".
4. **Given** an empty production, **When** the user explicitly clicks a labeled "Load Sample Production Data" action, **Then** the workspace loads sample scenes, items, and tasks with visible badges identifying them as sample reference data.

---

### User Story 2 - Honest Screenplay Ingestion Preview & Extraction Validation (Priority: P1)

As a clearance analyst uploading a screenplay document (PDF or text), I want to preview extracted scenes, page counts, and sample scene headings before committing the file to my production, and receive clear warnings and failure blocks if extraction yields zero valid scenes, so that corrupt or unsupported files never corrupt project state.

**Why this priority**: Corrupt or unparseable script files previously reported success while silently committing zero scenes or substituting synthetic sample data. Users must have authoritative confirmation of what was parsed before commit.

**Independent Test**: Upload a malformed or text-free PDF; verify extraction fails with clear diagnostics, shows 0 scenes detected, and blocks commit without modifying workspace state.

**Acceptance Scenarios**:
1. **Given** the Screenplay Intake modal, **When** a user selects a script file (PDF or plain text), **Then** the system presents an Extraction Preview displaying the filename, page count, detected scene count, and excerpted scene headings.
2. **Given** a script extraction resulting in 1 or more valid scenes, **When** the user verifies the preview and clicks "Confirm Ingestion", **Then** the scenes and candidate clearance items are committed to the project and stage transitions to Clearance Review.
3. **Given** a malformed or text-empty PDF yielding 0 detectable scenes, **When** extraction finishes, **Then** the system presents a visible warning banner explaining no scenes were detected, disables the "Confirm Ingestion" action, and prevents any workspace state mutation.
4. **Given** a failed extraction, **When** the user closes the modal, **Then** the workspace remains in its pre-upload state without substituting demo scenes or marking the project as cleared.

---

### User Story 3 - Guided Ingestion Workflow & Single Primary Action per State (Priority: P2)

As a production clearance operator, I want each workspace stage (Intake, Clearance Review, Department Tasks, Readiness, Export) to highlight exactly one unambiguous next action based on current project state, so that onboarding and clearance progression are intuitive and frictionless.

**Why this priority**: Eliminates operator confusion by avoiding competing equal-weight buttons, ensuring operators immediately understand whether they need to upload a script, review extraction, resolve blocking risks, or export the clearance binder.

**Independent Test**: Walk through a production lifecycle from empty -> intake -> review -> export, verifying the primary action updates deterministically at each step.

**Acceptance Scenarios**:
1. **Given** an empty production with no script, **When** viewing the workspace, **Then** the primary action card displays "Upload Screenplay" directing to intake.
2. **Given** an ingested script with unresolved high-risk items, **When** viewing the workspace, **Then** the primary action card displays "Resolve Next Blocker" (or "Review X Clearance Blockers") directing to the Clearance Items tab.
3. **Given** all clearance items cleared and tasks complete, **When** viewing the workspace, **Then** the primary action card displays "Export Clearance Binder" opening the export drawer.
4. **Given** the main navigation header, **When** viewing controls, **Then** secondary administrative controls (execution mode, live quota count, serving revision) are relocated to the Settings dialog, keeping the header focused on identity, New Production, Switch Project, and Alerts.

---

### User Story 4 - Preservation of Sample Reference Benchmarks (Priority: P2)

As a judge or evaluator assessing the system, I want sample reference productions (The Neon Horizon and Cyberpunk Odyssey) to remain available via explicit sample selection with their exact validated benchmark metrics, so that system capabilities can be tested against established ground truths.

**Why this priority**: Preserves existing golden test cases and demo flows without compromising the isolation and integrity of newly created user productions.

**Independent Test**: Select "The Neon Horizon" from the portfolio switcher; verify 3 scenes, 7 items, 11 tasks, 33.3% readiness, and 2 blocked scenes are displayed.

**Acceptance Scenarios**:
1. **Given** the Portfolio / Switch Project view, **When** the user selects "The Neon Horizon", **Then** the workspace displays 3 scenes, 7 clearance items, 11 tasks, 33.3% shooting readiness, and 2 blocked scenes, labeled with a "Sample Reference Project" indicator.
2. **Given** the Portfolio / Switch Project view, **When** the user selects "Cyberpunk Odyssey", **Then** the workspace displays 0% readiness (PENDING_REVIEW) and 0 blocked scenes in full isolation from other projects.
3. **Given** any sample project, **When** switching back to a custom user production, **Then** no sample items or state leak into the user production.

---

### Edge Cases

- What happens when a multi-page PDF contains vector graphics only without extractable text streams? The system displays a warning "No extractable text found in PDF" with detected scene count 0, disables the ingestion confirm button, and suggests uploading a plain text screenplay or OCR-processed PDF.
- What happens when a user creates a new production and immediately closes their browser before uploading a screenplay? The project remains saved as an empty production with 0 scenes and 0 items; on reload, it remains clean without automatic demo seeding.
- What happens when a user uploads a script with unnumbered scene headings (e.g. `INT. WAREHOUSE - NIGHT`)? The extraction preview identifies standard script sluglines, numbers them sequentially for review, and previews the headings for user confirmation.
- What happens when a notification targets an item in an empty project? The notification tombstone renders disabled with "Link Disabled: Referenced task not found" and announces "This task is no longer available." without crashing or navigating.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST NOT automatically seed demo or sample data into any newly created or empty user production under any circumstances.
- **FR-002**: The top header navigation MUST provide a persistent, high-visibility "New Production" button that directly opens the creation workflow without requiring the user to open the project switcher.
- **FR-003**: The project switcher control MUST be dedicated exclusively to switching active projects or viewing the portfolio dashboard.
- **FR-004**: The production creation workflow MUST guide the user through structured steps: Production Details -> Screenplay Intake -> Extraction Preview & Validation -> Ingestion Confirmation.
- **FR-005**: Screenplay ingestion MUST provide a pre-commit Extraction Preview displaying the document filename, page count, detected scene count, sample scene headings, and any extraction warnings.
- **FR-006**: Ingestion MUST block commitment and display an explicit error alert when extraction produces 0 valid scenes or empty text, preventing any project state mutation.
- **FR-007**: A project with 0 clearance items or 0 scenes MUST display "No clearance items recorded" and "No clearance blockers recorded" and MUST NOT indicate the project is "Ready for Shoot" or "100% Ready".
- **FR-008**: Sample benchmark productions (The Neon Horizon and Cyberpunk Odyssey) MUST be accessible only through explicit user selection and MUST display a prominent "Sample Reference Project" badge to distinguish them from user-created data.
- **FR-009**: The workspace MUST compute exactly one primary recommendation card following a deterministic state hierarchy:
  1. No script ingested -> "Upload Screenplay"
  2. Parsing / processing -> Progress indicator
  3. Action Required blockers exist -> "Resolve Clearance Blockers"
  4. Review Recommended items exist -> "Review Recommended Items"
  5. Unfinished department tasks -> "View Department Tasks"
  6. All items cleared -> "Export Clearance Binder"
- **FR-010**: Administrative metadata and system controls (system execution mode, API quota counters, serving revision, demo tokens) MUST reside inside the Settings popover/modal and MUST NOT clutter the primary header chrome.
- **FR-011**: Plain-language labels MUST be used across all primary operator views; technical jargon (e.g., canonical entity registries, entity overrides, grounding quotas) MUST be replaced with conversational equivalents ("Clearance Items", "Manual Decision", "API Quota") or confined to developer/settings dialogs.
- **FR-012**: The application MUST maintain WCAG 2.2 AA accessibility across all newly added creation and preview surfaces, including visible focus rings, dialog focus trapping, live-region status updates, and keyboard dismissability.

---

### Proposal: Correctness & Workspace IA Architecture *(Proposed for SpecKit Plan/Tasks)*

#### 1. Release-Blocking Correctness & Data Integrity
- **FR-013**: Single Status Contract & Stale Research Task Pruning. When an entity transitions from `INSUFFICIENT_EVIDENCE` to an evaluated state (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`), all initial `RETRY_RESEARCH` department tasks associated with that entity MUST be automatically marked `RESOLVED` and pruned from active task lists, ensuring Registry, Dossier, and Action Center data remain 100% synchronized.
- **FR-014**: High-Fidelity Time-Of-Day Ingestion (`CONTINUOUS` Preservation). Slugline parsing MUST NOT normalize `CONTINUOUS`, `SAME`, `MOMENTS LATER`, `DAWN`, or `MAGIC HOUR` to `DAY`. The parsed `timeOfDay` field MUST preserve the verbatim time descriptor extracted from the script slugline.
- **FR-015**: Screenplay Page Marker Filtering. PDF and text screenplay ingestion MUST strip standalone page header/footer markers (e.g. `-- 1 of 4 --`, `-- 2 of 4 --`, `2.`, `3.`) from scene body text, character action summaries, and occurrence excerpts.
- **FR-016**: Entity-Level vs Occurrence-Level Blocker Distinction. Scene readiness summaries and failure rationales MUST distinguish between unique entity blockers and multiple scene occurrences (e.g. "1 clearance blocker ('Coors Light' across 3 occurrences) prevents shooting Scene 3" rather than repeating the entity name 3 times).

#### 2. Usability & Workspace Information Architecture (IA)
- **FR-017**: Streamlined Single-Row Header Architecture. The primary header bar MUST be compact (max height <=64px) and house only: (a) Product brand identity, (b) Project switcher dropdown, (c) Role perspective switcher, (d) Notification Alert Bell, and (e) Secondary Menu trigger. Secondary controls (`+ New Production`, `Execution Mode`, `Live Quota Counter`, `Export Binder`, `Admin`, `Settings`) MUST reside in menus.
- **FR-018**: First-Class Department Tasks Workspace View. Department Tasks MUST be accessible as a full-page workspace section/tab (`Overview`, `Screenplay`, `Clearance Items`, `Department Tasks`) rather than modal-only, supporting persistent URL query parameters and full-screen task triage.
- **FR-019**: State & Deep-Link URL Persistence on Reload. Active workspace tab selection, selected entity dossiers, and deep-linked task IDs (`?tab=tasks&task=TASK-101`) MUST be encoded in URL query parameters and restored on browser refresh.
- **FR-020**: Onboarding Guide Lifecycle & Placement. The onboarding guide banner MUST render below the Primary Recommendation Card and MUST automatically hide once a screenplay has been successfully ingested for the active production.

#### 3. Workflow Language & Canonical Domain Terminology
- **FR-021**: Canonical Domain Terminology Convergence. Primary operator UI chrome MUST strictly adopt converged clearance terminology:
  - "Clearance Items" (replacing "Entity Registry")
  - "Scene Occurrence" (replacing "use" / "uses")
  - "View Evidence" (replacing "Research" for evaluated items)
  - "API Research Quota (X of 25 remaining)" (replacing "Live Quota")
- **FR-022**: Deterministic Grammatical Pluralization. All dynamic counter strings MUST use grammatically correct singular/plural phrasing (e.g. "1 clearance item requires action" vs "2 clearance items require action", "1 scene" vs "3 scenes").

#### 4. Responsive & Touch-Target Architecture
- **FR-023**: Responsive Narrow-Viewport Card Layout. On viewports <768px (including 375px, 390px, 420px), the Clearance Items list MUST transform from a wide table into responsive stacked cards to eliminate horizontal clipping.
- **FR-024**: 44px Touch Target Size Enforcement. All buttons, icon triggers, tabs, and dismiss controls across mobile and desktop MUST meet the WCAG 2.2 AA minimum touch target size of 44x44 CSS pixels.

#### 5. Precision Mobile Layout & Semantic Correctness (Defect Remediation)
- **FR-025**: Intrinsic Responsive Mobile Header & Zero Document Overflow. On narrow viewports (320px, 375px, 390px, 420px), `document.scrollWidth <= document.documentElement.clientWidth` MUST hold strictly via intrinsic layout rather than `overflow-x: hidden`. Identity and primary actions remain visible, secondary header controls fold into an accessible overflow menu, navigation tabs scroll within an isolated container, touch targets remain >=44px, and focus remains in view under 200%/400% zoom.
- **FR-026**: High-Fidelity Occurrence & Scene Count Semantics. Clearance item occurrence badges and summaries MUST distinguish occurrences from scenes (e.g., "6 occurrences across 3 scenes" for Coors Light). The definitions of clearance item vs occurrence vs scene MUST be unified across Registry, Dossier, Scene Summaries, Filters, Action Center, Readiness, and Binder.
- **FR-027**: Canonical Entity Blocker De-Duplication. Scene readiness summaries and project blocker metrics MUST NOT count multiple occurrences of the same unresolved canonical entity as separate clearance blockers. Unique unresolved items count as 1 blocker (e.g., "1 clearance blocker ('Coors Light' across N appearances)"). Readiness scoring and binder reports MUST NOT double-count canonical blockers across occurrences.
- **FR-028**: Accessible Production Switcher Cards. Project selection items in the Project Switcher Modal MUST be rendered as native interactive `<button>` elements (never clickable `<div>` elements and never with invalid `role="option"` outside an ARIA listbox). Each item MUST have an accessible name matching the project title, an explicit valid state attribute (`aria-current="true"` or `aria-pressed="true"` for the active workspace; never `aria-selected` without a parent listbox/tablist), keyboard activation via Enter/Space, visible focus indicators, and MUST focus the production heading upon switching active projects while preserving workspace isolation.
- **FR-029**: Explicit Zero-Item Scene Review & Readiness Contract. Ingested scenes with zero detected clearance entities MUST NOT automatically transition to `FINAL_CLEAR` ("shooting ready") without verification. The status contract MUST distinguish between `PENDING_REVIEW` / `NO_CANDIDATES_DETECTED` and `FINAL_CLEAR` (human-confirmed / genuinely cleared). Zero detected items alone MUST NOT confer Final Clear or 100% shooting-ready across any production, including Cyberpunk Odyssey. Unreviewed zero-item scenes remain non-shooting-ready (`PENDING_REVIEW`) until acknowledged or verified. Clearance Binder exports MUST preserve this distinction.
- **FR-030**: Authoritative Post-Ingestion Workspace Persistence & Parity. Following screenplay ingestion confirmation, the workspace MUST immediately reflect and authoritatively persist extracted scenes and candidate clearance items (e.g. Coors Light: 6 occurrences across 3 scenes) across both local and public cloud environments, eliminating race conditions between ingestion confirmation, workspace snapshot retrieval, and project switching. The result must survive full page reload strictly from the authoritative project snapshot (not transient memory), maintaining 100% parity between local test fixtures and production Cloud Run instances without synthetic demo substitution or stale zero-entity state overwrites.
- **FR-031**: Active-Draft Task Scoping & Counter Format. Action Center and Department Task views MUST scope listed tasks to active scenes of the current script draft, excluding superseded tasks from deleted or previous script revisions. Counter copy MUST format without duplicated count numerals (e.g., "X of Y Tasks", never "X of Y Y Tasks").
- **FR-032**: Non-Contradictory Zero-Item Scene Readiness Presentation. Ingested scenes with zero detected candidate clearance entities MUST display explicit `PENDING_REVIEW` / "Pending Review" status, neutral/review badging, and copy stating that human verification is required prior to filming. Scene cards MUST NOT render "FINAL CLEAR" or "Ready for production filming" while overall readiness is 0% or pending review. Cyberpunk Odyssey Scene 1 with zero detected items presents as `PENDING_REVIEW` (0% readiness, 0 blocked scenes), strictly preserving isolation from Neon Horizon without falsely conferring 100% Final Clear.
- **FR-033**: Native Interactive Project Card Semantics. Project selection items in the Project Switcher Modal MUST use native `<button>` semantics without invalid `role="option"`. Active workspace state MUST be indicated via valid attributes (`aria-current="true"` or `aria-pressed="true"`), visible focus indicators, native Enter/Space activation, and focus placement on the active workspace production heading upon dismissal, strictly aligning with FR-028.
- **FR-034**: Ergonomic Narrow-Viewport Layout & Action Reachability. On 375px viewports, header action controls, tabs, and task filtering controls MUST provide legible text, uncluttered spacing, and >=44px touch targets without clipping or reliance on horizontal page scrolling. The header "+ New Production" control MUST maintain a clearly visible text label (e.g. "+ New") and visible discoverability on mobile (never rendering as an empty unlabeled box), while navigation tabs scroll smoothly within their existing container with `white-space: nowrap` without compressing or wrapping labels.
- **FR-035**: Project Directory Identity Disambiguation. Productions sharing identical titles in the Project Switcher and Directory MUST be visually and semantically disambiguated by displaying distinct creation metadata (such as timestamp, project code, or draft version) without deleting or merging historical projects.
- **FR-036**: Shared Neon Horizon Honest-Empty Lifecycle & Explicit Manual Load (Option B). In ephemeral storage modes (`DEMO_MODE` / in-memory store), `proj-default` lazily initializes as an honest empty workspace (0 scenes, 0 clearance items, 0 tasks) upon container boot without synthetic demo substitution, strictly reconciling with FR-030 and SC-001. The in-memory store MUST NOT auto-seed sample data. The empty project MUST be semantically labeled as an empty workspace (`Default Production Workspace` / `[PRJ-DEFAULT]`) and MUST NOT present as the populated sample baseline (`The Neon Horizon` / `[PRJ-NEON-HORIZON]`) until explicit Load Sample. Explicit operator/user action (such as clicking "Load Sample Production" in the UI or an authorized `POST /api/projects/proj-default/demo-load`) serves as the explicit path to populate sample data. When populated, the Neon Horizon baseline contract MUST evaluate deterministically to exactly 3 scenes, 7 clearance items, and 11 unique tasks (with clearance item statuses: 3 Cleared, 2 Action Required, 2 Review Recommended; 33.3% overall readiness; 2 blocked scenes; 4 open tasks describes strictly the open-filter subset, never the sample total). Furthermore, automated test runs and evaluation scripts MUST NOT mutate or overwrite shared demonstration projects (`proj-default`, `proj-cyberpunk`), requiring explicitly generated disposable project IDs (`proj-test-g-<timestamp>`) with isolation assertions and bounded cleanup.

#### 6. Pre-Walkthrough Integrity & Clearance Standards
- **FR-037**: Cyberpunk Zero-Task UI State Lifecycle. The Action Center and Department Tasks view MUST maintain explicit task fetch lifecycle state (`idle | loading | loaded | error`). Loaded-empty states (e.g. Cyberpunk Odyssey with 0 generated department tasks) MUST render "0 of 0 Tasks", zeros per department tab `(0)`, an explicit empty state message ("No department tasks have been generated for this production"), a clear navigation route or link to the recommended next action (e.g. script upload), an enabled Re-Sync button upon loaded empty success, and zero indefinite spinners or ellipsis `(…)`. Switching active projects MUST immediately reset task fetch state and task list data to prevent cross-workspace task leakage, and direct cold loading with `?tab=tasks` MUST resolve cleanly to the loaded-empty presentation without hanging.
- **FR-038**: Authoritative Cross-Format Binder Identity. Clearance Binder exports across JSON, Markdown, and Print/PDF formats MUST derive from a single authoritative active-project snapshot. Downloaded filenames for both JSON and Markdown MUST use consistent, sanitized naming derived from the active production title: `Clearance_Binder_<SanitizedTitle>_<id>.json` and `Clearance_Binder_<SanitizedTitle>_<id>.md` (e.g. `Clearance_Binder_The_Neon_Horizon_bnd-<id>.md` instead of `ClearanceBinder-proj-default.md`). Markdown and JSON exports MUST both retain stable project ID and active title metadata in header blocks, confirmation dialogs, and HTTP `Content-Disposition` headers. Switching active productions MUST immediately clear any cached binder data in client state (`setBinderData(null)`), ensuring cross-format identity and content invariants are strictly maintained across project switches.
- **FR-039**: Human-Readable Scene References in Operator Prose. All operator-facing evidence rationales, department tasks, notifications, and binder documentation MUST refer to scenes using human-readable scene numbers and headings (e.g., "Scene 1 — INT. PENTHOUSE WORKSPACE – NIGHT" or "Scene 1 (INT. PENTHOUSE WORKSPACE – NIGHT)") rather than opaque internal database identifiers (e.g., `scene-a0556326`). Internal database identifiers may appear only in secondary metadata or debugging attributes. If scene heading metadata is missing or unavailable, formatting must degrade gracefully to "Scene <sceneNumber>" or "Scene <sceneId>".
- **FR-040**: Statutory Distribution vs Production Filming Clearance Dual Standard. Clearance evaluation rationales, scene readiness assessments, evidence dossiers, department action items, and clearance binder exports MUST accurately reflect the dual clearance standard: statutory copyright law governs distribution, broadcast, and public performance, whereas production clearance policy and insurance requirements require licenses to be secured before principal photography / filming proceeds to prevent uninsurable production shutdown or reshoot liability. Musical works requiring synchronization clearance MUST explicitly state: "A synchronization license is required for distribution. This production’s clearance policy requires the license to be secured before filming proceeds."

#### 7. Proposal Scope Expansion (Operating Model Findings)
- **FR-041**: Authoritative Server Execution-Mode Display (Option A). The execution mode control in the Settings Popover and Project Creation dialog MUST be rendered as an authoritative, read-only status indicator displaying the server-reported execution mode (e.g. `DEMO_MODE (Authoritative)`) rather than an interactive `<select>` dropdown. An informative helper message MUST explain that execution mode is governed strictly by server deployment configuration and that live `CLOUD_MODE` requires server-side secret mounting (`GEMINI_API_KEY`, `PARALLEL_WEB_API_KEY`). Client-side state MUST NOT simulate mode changes without server authorization, strictly adhering to Architectural Rule 5.
- **FR-042**: Deterministic Multi-State Zero-Item Scene Classification. Scene readiness analysis MUST classify scenes across five distinct lifecycle states:
  1. `ANALYSIS_PENDING`: Screenplay ingestion or scene extraction in progress;
  2. `ANALYSIS_FAILED`: Script extraction or clearance evaluation encountered an error, requiring retry;
  3. `NO_CANDIDATES_SURFACED`: Ingestion completed with zero candidate clearance entities detected; evaluates to `PENDING_REVIEW` with 0% readiness, explicitly requiring human clearance coordinator sign-off before shooting;
  4. `HUMAN_REVIEWED_NO_CONCERN`: An operator or legal counsel has explicitly reviewed the zero-item or un-flagged scene and recorded a sign-off, transitioning the scene to `FINAL_CLEAR`;
  5. `FULLY_CLEARED`: All detected candidate items in the scene have been evaluated, licensed, replaced, or overridden.
  Zero-item scenes MUST NEVER evaluate to `FINAL_CLEAR` or display "Ready for production filming" solely because no items were surfaced.
- **FR-043**: Task Active-Draft Scope & Deduplication Hygiene. Department tasks displayed in the Action Center MUST be scoped to the active screenplay draft version. When repeated evaluation or re-ingestion occurs, superseded draft tasks MUST NOT accumulate into active task lists. Displayed badges and tab labels MUST distinguish open actionable items from total unique items (e.g., "4 open of 11 unique tasks"). Blanket deduplication by task title is strictly prohibited to preserve distinct department tasks for different scenes that share standard titles (e.g. distinct prop replacements). Existing duplicate tasks in persistent storage MUST be audited and migrated via separate data repair rather than destructive client filtering.
- **FR-044**: Occurrence Textual Appearances vs Unresolved Risk Count Semantics. Entity occurrence badges and scene readiness rationales MUST maintain strict separation between cumulative script appearances and unresolved legal clearance blockers. In the Coors Light baseline (6 appearances across 3 scenes), Scene 1 exhibits 1 unresolved blocker across 1 appearance; Scene 2 exhibits 1 unresolved blocker across 2 appearances; Scene 3 exhibits 1 unresolved blocker across 3 appearances. Rationale copy MUST enforce grammatical agreement ("1 clearance blocker prevents shooting Scene 2: \"Coors Light\" (INSUFFICIENT_EVIDENCE, appears 2 times)"). Scene 2 sluglines MUST preserve `EXT. NEIGHBORHOOD CORNER - CONTINUOUS` and `EXT • CONTINUOUS` without stripping `CONTINUOUS`.
- **FR-045**: Project Directory Stable ID Disambiguation & Historical Data Non-Mutation. Projects in the directory and switcher sharing identical titles (such as multiple iterations of "Mountain Refuge Feature") MUST be visually and semantically disambiguated by rendering their unique stable project ID (`proj-<uuid>`) and creation timestamp. Production datasets MUST NOT be deleted, reseeded, or merged without explicit, separate operator authorization.
- **FR-046**: Mobile Usability Bounded Ergonomics & Full Viewport Audit. Mobile viewport rendering across standard breakpoints (320px, 375px, 390px, 420px, 768px, 1280px) MUST verify zero horizontal overflow on both `document.documentElement` and `document.body` without relying on `overflow-x: hidden`. Header action buttons, project controls, navigation tabs, filter pills, and drawer triggers MUST maintain >=44px touch targets. Proposed criteria for operator agreement: header height <=64px and evidence drawer latency <=4s (monitored as performance measurements).

#### 8. Independent Review Defect Corrections (Post-00068 Deploy)
- **FR-047**: Design-Token Notification Drawer & Task Comment Styling (No Tailwind Dependency). The notification drawer and task comment composer MUST be styled exclusively with native application design tokens (`var(--bg-panel)`, `var(--border-color)`, `var(--text-main)`, `btn-primary`, `btn-secondary`) with zero dependency on Tailwind CSS utility classes. The notification drawer MUST render as an absolute floating modal with proper z-index and box-shadow (no raw text overlapping the header). The drawer trigger (bell icon) MUST toggle the drawer open and closed. Pressing the Escape key or clicking outside MUST close the drawer, and closing via Escape MUST restore keyboard focus directly to the bell trigger button.
- **FR-048**: First-Touch/Click Pointer Activation for Primary Controls. Interactive workspace controls, specifically the Project Switcher chip (`[data-testid="header-switch-project-btn"]`) and the "Load Sample Production" recommendation button (`[data-testid="recommendation-load-sample-btn"]`), MUST trigger their associated action on the immediate first touch or mouse pointer interaction (`onPointerDown` / `onClick`) without requiring a prior click or merely shifting focus on initial page load.
- **FR-049**: Scene 2 Readiness & Recommendation Alignment. The Neon Horizon sample production data MUST satisfy the strict contract: 3 scenes, 7 clearance items (3 Cleared, 2 Action Required, 2 Review Recommended), 11 unique department tasks (4 open), 33.3% readiness, 1 Final Clear scene (Scene 2), and 2 blocked scenes (Scene 1 and Scene 3). Scene 2 is cleared for filming via sample location permit override for Scene 2. When Scene 2 is selected or viewed, the primary recommendation card and scene readiness summaries MUST agree: Scene 2 displays "FINAL CLEAR" and "Scene 2 Cleared for Filming", and MUST NOT suggest researching items from other scenes (e.g. Nocturne of the Wild from Scene 1). When no scene is selected, project-wide recommendations target actual uncleared blockers.

### Key Entities

- **Production / Project**: A top-level container for film/television clearance analysis. Attributes include ID, title, production code, studio name, creation timestamp, and `isSample` boolean flag.
- **Screenplay Document**: An uploaded script file (PDF or text) with metadata including filename, file size, page count, raw text content, and parse status.
- **Extraction Preview**: An ephemeral validation summary generated prior to database commitment, containing detected scene count, parsed scene sluglines, token/word count, and validation warnings (e.g. 0 scenes detected).
- **Clearance Item**: A detected entity within a script that requires legal assessment.
- **Department Task**: An actionable resolution item assigned to an art, legal, or production crew department.
- **Scene Blocker**: An un-cleared item occurrence that prevents a specific scene from being marked ready for shooting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of newly created productions initialize with exactly 0 scenes, 0 clearance items, and 0 department tasks, with zero automatic demo data injections.
- **SC-002**: 100% of malformed or text-empty script uploads are halted at the preview stage with 0 false "Ingestion Successful" reports and 0 corrupted project states.
- **SC-003**: Users can initiate production creation in exactly 1 click from any application screen via the persistent header control.
- **SC-004**: Operators are presented with exactly 1 primary next-action recommendation per workspace state with 0 ambiguous competing primary buttons.
- **SC-005**: Sample benchmark projects retain 100% data integrity: Neon Horizon populated baseline evaluates to 3 scenes, 7 clearance items, 11 unique tasks, 33.3% readiness, and 2 blocked scenes; Cyberpunk Odyssey unreviewed zero-item state evaluates honestly to 0% readiness (PENDING_REVIEW, 0 blocked scenes, 0 items) isolated from Neon Horizon.
- **SC-006**: 100% of evaluated clearance items show synchronized status across Registry, Dossier, and Action Center with zero dangling `RETRY_RESEARCH` tasks for cleared items.
- **SC-007**: 100% of scene sluglines with `CONTINUOUS`, `SAME`, or `DUSK` time descriptors retain their exact time of day without normalization to `DAY`.
- **SC-008**: Mobile viewports (375px, 390px, 420px) render a header height <=64px with zero horizontal scroll and 100% touch targets >=44px.

## Assumptions

- Script uploads support standard PDF (`.pdf`), plain text (`.txt`), and Final Draft / Fountain style text formats.
- Sample reference datasets remain available in local memory/fixtures for offline evaluation and instant demonstration without external API costs.
- Users operating on 375px mobile viewports retain full access to the "New Production" action and guided creation workflow without horizontal clipping.
- Existing notification tombstone integrity (`TASK-NON-EXISTENT-999` disabled link and "This task is no longer available." announcement) is preserved throughout.
