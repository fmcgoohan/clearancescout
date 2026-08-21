# Feature Specification: 021 Release State Integrity and Operator Trust

**Feature Branch**: `021-release-state-integrity`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "Create feature 021 — Release State Integrity and Operator Trust. Release-blocking convergence from hands-on QA of the current live build. Not a redesign. Do not write application code during specify. Preserve 003-020 architecture, CLOUD_MODE authority, auth, provenance, fail-closed. Do not add unrelated product features."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deterministic Ingestion State Machine & Atomic Snapshot Synchronization (Priority: P1)

As a legal clearance operator or studio executive, I need script ingestion (both uploaded files and bundled sample scripts) to transition through explicit, observable states with honest progress metrics, so that I always know the exact operational status, never see misleading intermediate or mismatched entity counts, and receive a unified, consistent workspace state upon completion.

**Why this priority**: Ingestion is the foundational gateway to the entire clearance lifecycle. Inconsistent counts (e.g., summary banner showing 35 items while the registry shows 0), uncommunicative disabled buttons, jumping scene counts, or partial states destroy operator confidence and block release validation.

**Independent Test**: Can be tested by creating a project and initiating both custom file uploads and bundled demo script ingestion. The operator observes clear state transitions (`IDLE` → `UPLOADING` → `PARSING` → `EXTRACTING` → `RECONCILING` → `COMPLETE`), live elapsed timers, duplicate-submit protection, and upon completion, all dashboard numbers, scene lists, canonical entity tables, and readiness KPIs synchronize to the exact same snapshot without intermediate count jumps.

**Acceptance Scenarios**:

1. **Given** a new or existing project with no active ingestion, **When** an operator clicks either "Upload & Ingest Draft" or "Load 1-Click Demo Screenplay", **Then** the submission control immediately enters an active progress state, prevents duplicate submissions, and displays the `UPLOADING` stage with an active elapsed timer.
2. **Given** an in-flight screenplay ingestion, **When** the system parses scenes and extracts candidate intellectual property, **Then** the interface transitions explicitly to `PARSING` and `EXTRACTING` without claiming 90% or 100% completion prematurely, and displays realistic progress feedback.
3. **Given** an in-flight ingestion reaching database reconciliation, **When** entities and scenes are persisted, **Then** the system transitions through `RECONCILING` and only publishes scene counts and entity counts to the UI once all records are committed.
4. **Given** a successful ingestion completion, **When** the state reaches `COMPLETE`, **Then** the workspace refreshes scenes, entities, summary headers, shooting readiness KPIs, and action notifications simultaneously from a single, atomic project snapshot, guaranteeing zero discrepancy between the summary banner and the registry table.
5. **Given** an ingestion encountering an unrecoverable failure or timeout, **When** the operation terminates, **Then** the state transitions to `FAILED` with an actionable failure banner, error code, and a "Retry Ingestion" button, leaving the previous stable state intact without publishing phantom partial records.

---

### User Story 2 - Interactive Accessible Overlays & Action Drawer Stacking (Priority: P1)

As a clearance supervisor, I need the "Timeline" drawer and "Actions" modal to open reliably with visible, properly stacked overlays when clicked or triggered via keyboard, so that I can inspect audit histories and resolve action items without controls being obscured or rendered invisibly behind the main view.

**Why this priority**: Hands-on QA identified dead focus states where clicking "Actions" or "Timeline" focused elements without rendering a visible drawer or modal. Essential review workflows are completely blocked if operators cannot view audit logs or resolve flagged clearance items.

**Independent Test**: Can be tested by navigating to the workspace in any resolution or browser context, activating "Actions" and "Timeline" via mouse click and keyboard (`Enter`/`Space`), and asserting that the modal or drawer opens visibly on top of all page content (with proper layering above the header and content surfaces), traps focus appropriately, and dismisses cleanly via `Escape` or close triggers.

**Acceptance Scenarios**:

1. **Given** the clearance workspace, **When** the operator clicks the "Actions" or "Action Items" button in the primary control area, **Then** a visible modal or drawer opens above the workspace with an elevated stacking level (layering above header z-100 and workspace surfaces), displaying all pending action notifications.
2. **Given** the clearance workspace, **When** the operator clicks the "Timeline" or "Audit Stream" button, **Then** a visible timeline drawer slides in or renders distinctly above page content, showing real-time and historical execution events.
3. **Given** an active operator session without valid credentials or experiencing an auth challenge, **When** clicking "Actions" or "Timeline", **Then** the system renders a clear authentication modal or status prompt rather than silently swallowing the click or failing to display feedback.
4. **Given** an open Actions modal or Timeline drawer, **When** the operator presses `Escape` or clicks the backdrop/close button, **Then** the overlay closes cleanly and returns keyboard focus to the triggering button.

---

### User Story 3 - Generic Canonical Entity Disambiguation & Alias Normalization (Priority: P1)

As a clearances researcher, I need the system to automatically recognize and merge canonical entities when mentioned in scripts under varied punctuation, acronyms, parenthetical full forms, or composite aliases (e.g., "Associated Press", "A.P.", "AP", "A.P. (Associated Press)", "Associated Press / A.P."), so that duplicate clearance items are eliminated while preserving exact on-page surface mentions and line locations.

**Why this priority**: Multiple redundant entity records for the same brand or organization fragment clearance decisions, inflate research costs, and produce contradictory risk assessments across different scenes.

**Independent Test**: Can be tested by ingesting a screenplay containing various surface representations of a single brand or organization (e.g., "Associated Press", "A.P.", "AP", "A.P. (Associated Press)", and "Associated Press / A.P."). The system produces a single canonical entity record with all variants registered as aliases, mapping every individual occurrence correctly to its respective scene.

**Acceptance Scenarios**:

1. **Given** a screenplay containing mentions of "Associated Press" in Scene 1 and "A.P." in Scene 2, **When** the script is ingested and resolved, **Then** the registry contains exactly one canonical entity titled "Associated Press" with "A.P." in its alias list and two distinct occurrences linked to Scene 1 and Scene 2.
2. **Given** a script containing parenthetical or composite mentions such as "A.P. (Associated Press)" or "Associated Press / A.P.", **When** the entity resolution engine processes the mentions, **Then** the generic normalizer strips punctuation and extracts the canonical root, merging them into the primary canonical entity rather than generating isolated duplicate entities.
3. **Given** a merged canonical entity with multiple aliases, **When** inspecting occurrence details in the script view or clearance binder, **Then** each occurrence displays its authentic surface mention and line number exactly as written in the script text.

---

### User Story 4 - Occurrence-Grounded Current Draft Scoping & Historical Archival (Priority: P1)

As a production counsel, I need every active clearance entity in the current registry to be grounded by at least one real occurrence in the currently active screenplay draft, with entities from superseded historical drafts clearly segregated as archived, so that shooting readiness and risk KPIs reflect only what is actually being filmed.

**Why this priority**: Phantom entities with zero occurrences in the current script distort scene readiness calculations, generate unresolvable blockers, and confuse the production team regarding which items require clearance.

**Independent Test**: Can be tested by uploading a revision of a screenplay where an entity present in Draft 1 is removed in Draft 2. In Draft 2, the removed entity is marked `NOT_IN_CURRENT_DRAFT`, is excluded from the current draft's active entity count and shooting readiness percentage, while remaining accessible in historical audit logs.

**Acceptance Scenarios**:

1. **Given** a freshly ingested screenplay draft, **When** reviewing the active canonical entity registry, **Then** every displayed active entity possesses at least one valid occurrence linked to a valid scene in the current draft with genuine excerpt text and line provenance.
2. **Given** a project where a new screenplay draft is uploaded that omits a previously present brand, **When** the new draft is processed, **Then** the omitted entity is classified as `NOT_IN_CURRENT_DRAFT` and is excluded from current active entity counts, blocker calculations, and shooting readiness KPIs.
3. **Given** an entity marked `NOT_IN_CURRENT_DRAFT`, **When** an operator filters the registry by active draft items, **Then** the archived entity is hidden from the primary clearance view but can be inspected via an "Include Historical Revisions" filter.

---

### User Story 5 - Passive Timeline Idempotency & Side-Effect Free Observation (Priority: P1)

As a system operator, I need page loading, tab switching, polling, and SSE stream reconnections to be completely side-effect free, so that passively viewing the application does not trigger event runaway, pollute audit trails, or duplicate timeline items.

**Why this priority**: Hands-on QA observed timeline counts inflating from 1400 to 1700+ events during passive viewing. Non-idempotent reads and poll cycles cause performance degradation and degrade trust in the audit log.

**Independent Test**: Can be tested by opening a populated workspace, establishing an active SSE timeline connection, and allowing the browser to sit idle for 5 minutes with multiple tab switches and background poll cycles. The timeline event count remains strictly constant with zero synthetic growth.

**Acceptance Scenarios**:

1. **Given** a populated workspace with an established timeline, **When** an operator performs read-only actions (refreshing the page, switching tabs, expanding cards, or polling dashboard KPIs), **Then** zero new timeline events are generated or emitted.
2. **Given** an SSE timeline connection that disconnects and reconnects due to network variance, **When** reconnection occurs, **Then** existing events are deduplicated by ID and event sequence, preventing duplicate event display.
3. **Given** an automated background poll for project quota or readiness status, **When** the poll executes, **Then** the request executes strictly as a read-only query without emitting state transitions or query logs to the timeline.

---

### User Story 6 - Truthful Provenance Labeling & Operational Recovery Guidance (Priority: P2)

As a studio executive or competition judge, I need truthful labeling of all screenplay data sources (clearly identifying whether data originated from the bundled fictional fixture `The Neon Horizon` or an uploaded user script), and clear operational recovery guidance when operations exceed normal duration thresholds, so that I can operate the platform with complete transparency and trust.

**Why this priority**: Inaccurate labeling (e.g. labeling custom scripts as "Bundled Fictional Demo Screenplay" or vice versa) and silent dead-ends during slow processing undermine credibility and make the platform difficult to troubleshoot.

**Independent Test**: Can be tested by (a) loading the 1-click demo and verifying the UI explicitly labels the source as `The Neon Horizon (Bundled Demo)`, (b) uploading a custom script and verifying it displays the authentic filename, and (c) simulating a delayed operation to verify that stage-specific recovery guidance and a safe cancel option appear.

**Acceptance Scenarios**:

1. **Given** a project initialized with the 1-click demo screenplay, **When** viewing project details and script headers, **Then** the interface clearly indicates "Source: The Neon Horizon (Bundled Fictional Demo)" with zero reference to external third-party works.
2. **Given** a project created via user file upload (e.g. `Big-Fish.fountain`), **When** viewing project metadata, **Then** the interface accurately displays the authentic uploaded filename, file size, format, and ingestion timestamp.
3. **Given** an active operation (such as script parsing or batch research) exceeding a 30-second threshold, **When** the operator watches the progress indicator, **Then** the system displays descriptive recovery guidance explaining the current stage, reasons for potential delay (e.g., model load or large scene volume), and provides a safe "Cancel Operation" button.
4. **Given** an operation that fails due to a network error or rate limit, **When** the error is presented, **Then** the error alert includes the specific failure stage, a clear human-readable explanation, and a single-click "Retry" action that re-initiates only the failed step.

---

### User Story 7 - Secondary Interface Refinement & Streamlined Header Controls (Priority: P3)

As a frequent platform user, I need a clean, high-contrast workspace interface with a quiet header, consolidated Binder Export controls, grouped table actions, and unmistakable active project identification, so that I can focus on critical clearance decisions with minimal visual clutter and cognitive friction.

**Why this priority**: Secondary UX polish enhances long-term usability, reduces operator fatigue, and improves accessibility after core integrity P0s are guaranteed.

**Independent Test**: Can be tested by reviewing the full workspace in both light and dark themes across desktop and compact viewports, verifying that the project name is prominently visible, header controls are cleanly consolidated, row actions are logically grouped, and color contrast meets WCAG AA standards.

**Acceptance Scenarios**:

1. **Given** the main application header, **When** viewed on any page, **Then** the active project title and production company are unmistakably prominent, and administrative controls are neatly consolidated without visual clutter.
2. **Given** the clearance binder export feature, **When** the operator wants to export the binder, **Then** a single, unified "Export Binder" action provides clear options for Markdown and structured formats without redundant multiple buttons in disparate locations.
3. **Given** the canonical entity registry table, **When** an operator interacts with item rows, **Then** row-level actions (Edit, Delete, Research, Match, Replace) are grouped cleanly with accessible names and high-contrast status badges.
4. **Given** clearance status indicators across all tables and cards, **When** rendered, **Then** statuses combine unmistakable text labels with distinct, high-contrast color coding and accessible ARIA attributes to support operators with color vision deficiencies.

---

### Edge Cases

- **Corrupted or 0-byte Screenplay Upload**: The ingestion engine validates file content prior to state transitions, returning an immediate `EMPTY_FILE` or `INVALID_FORMAT` error without creating empty scene shells or orphaned entities.
- **Mid-Ingestion Browser Close or Refresh**: If an operator closes or refreshes the browser during ingestion, the backend completes atomic persistence in Firestore; upon reload, the UI fetches the completed snapshot without hanging in an intermediate state.
- **Multiple Screenplay Re-Uploads**: Re-uploading a screenplay completely supersedes prior scenes and occurrences, archiving removed entities as `NOT_IN_CURRENT_DRAFT` and invalidating outdated clearance caches.
- **High Concurrency Model 503 / 429 Errors**: The parser applies bounded parallel chunking (concurrency = 2) with exponential backoff; if retries exhaust, a visible `PARSING_FAILED` error with a retry trigger is presented without leaving phantom records.
- **Network Drop during SSE Streaming**: The client automatically reconnects with deduplication, preventing timeline event inflation or missed state transitions.
- **Punctuation-Heavy Entity Names**: Entities with varied quotation marks, slashes, ampersands, or acronym periods (e.g. `AT&T`, `A.T. & T.`, `AT & T`, `HBO / Warner`) resolve to a single canonical entity with surface forms retained.

## Requirements *(mandatory)*

### Functional Requirements

#### Ingestion State Machine & Data Synchronization (P0-1)
- **FR-001**: The system MUST implement a strict, explicit 7-state ingestion lifecycle: `IDLE`, `UPLOADING`, `PARSING`, `EXTRACTING`, `RECONCILING`, `COMPLETE`, and `FAILED`.
- **FR-002**: The UI MUST immediately reflect state transitions and display live elapsed execution time upon operator action, while disabling submission controls to prevent duplicate requests.
- **FR-003**: The ingestion engine MUST NOT publish intermediate, partial, or uncommitted scene/entity counts to the primary workspace view during active parsing.
- **FR-004**: Upon reaching `COMPLETE`, the system MUST refresh all workspace components (scenes list, entity registry, summary counters, shooting readiness KPIs, action notifications) from a single, atomic project snapshot.
- **FR-005**: If ingestion fails or times out, the system MUST transition to `FAILED`, display a visible error banner with actionable recovery guidance, and retain the previous stable state without corrupting project data.

#### Interactive Overlays & Action Accessibility (P0-2, P0-6)
- **FR-006**: The system MUST guarantee that clicking or keyboard-activating "Actions" opens a fully visible, properly layered modal overlay above all workspace surfaces (z-index ≥ 1400, header at z-index 100).
- **FR-007**: The system MUST guarantee that clicking or keyboard-activating "Timeline" opens a fully visible, properly layered audit drawer above workspace content.
- **FR-008**: All modal and drawer overlays MUST support full keyboard accessibility (focus trapping on open, `Escape` key dismissal, and focus restoration to triggering elements on close).
- **FR-009**: Primary operational controls (including Actions count and Operations Dashboard trigger) MUST remain in a fixed, stable primary control area before, during, and after screenplay ingestion.

#### Canonical Entity Merging & Disambiguation (P0-3)
- **FR-010**: The entity resolution engine MUST implement generic alias and name normalization that strips extraneous punctuation, resolves acronyms, and matches parenthetical expansions (e.g., merging `Associated Press`, `A.P.`, `AP`, `A.P. (Associated Press)`, and `Associated Press / A.P.`).
- **FR-011**: When canonical entities are merged, the system MUST consolidate all alias variants onto the primary canonical entity while preserving authentic surface mentions, line numbers, and scene IDs on individual occurrences.

#### Occurrence Grounding & Current Draft Scoping (P0-4)
- **FR-012**: Every active auto-extracted entity displayed in the primary registry MUST possess at least one valid occurrence on a scene belonging to the currently active screenplay draft.
- **FR-013**: Entities from prior screenplay revisions that have zero occurrences in the current draft MUST be classified as `NOT_IN_CURRENT_DRAFT` and excluded from active entity counts and shooting readiness metrics.
- **FR-014**: The registry table MUST provide a filter allowing operators to toggle the visibility of historical/archived entities without mixing them into current shooting readiness calculations.

#### Passive Timeline Idempotency (P0-5)
- **FR-015**: Read-only requests (GET endpoints, dashboard polling, quota checks, UI rendering, and tab switching) MUST be completely side-effect free and MUST NOT emit events to the timeline.
- **FR-016**: The SSE timeline client and backend event emitter MUST deduplicate events by event ID and timestamp upon reconnection, preventing event count inflation during passive viewing.

#### Truthful Labeling & Operational Recovery (P0-7, P0-8)
- **FR-017**: The platform MUST truthfully and unmistakably label screenplay provenance, distinguishing between the bundled fictional demo (`The Neon Horizon`) and user-uploaded screenplay files.
- **FR-018**: When any long-running operation exceeds 30 seconds, the interface MUST present descriptive operational guidance explaining the current stage, reason for duration, and a safe cancel option.
- **FR-019**: All error alerts across upload, extraction, and clearance evaluation MUST include the exact failure stage, error code, plain-language description, and a single-click retry action.

#### Secondary Interface Polish & Accessibility (Secondary UX)
- **FR-020**: The application header MUST prominently display the active project name, production company, and execution mode while keeping administrative controls quiet and organized.
- **FR-021**: The interface MUST provide a single, unified "Export Binder" action with clear format selections, eliminating redundant multiple export buttons across views.
- **FR-022**: Table row actions across entity and scene registries MUST be cleanly grouped with clear labels and tooltips.
- **FR-023**: All status indicators (clearance risk, readiness tiers, action item states) MUST combine distinct text labels, high-contrast color indicators, and appropriate ARIA roles to ensure accessibility.
- **FR-024**: The client-side upload timeout MUST be calibrated to at least 270 seconds (`UPLOAD_TIMEOUT_MS >= 270000`), aligned with Cloud Run execution limits.

### Key Entities *(include if feature involves data)*

- **IngestionState**: Represents the active lifecycle phase of screenplay ingestion (`IDLE`, `UPLOADING`, `PARSING`, `EXTRACTING`, `RECONCILING`, `COMPLETE`, `FAILED`), including elapsed seconds, progress percentage, current chunk index, total chunks, error details, and cancellation token.
- **CanonicalEntitySnapshot**: The unified, immutable data structure representing the committed state of all canonical entities, active occurrences, historical draft associations, aliases, and rollup clearance statuses for a specific project revision.
- **SceneOccurrenceMapping**: The relational mapping binding individual entity surface mentions and line locations strictly to valid scenes within the active screenplay draft.
- **ObservableTimelineStream**: The idempotent event stream capturing genuine state transitions, AI tool invocations, and operator actions without synthetic duplicates or read-induced inflation.
- **OperationalControlBar**: The persistent, fixed-location primary toolbar hosting critical workspace controls (Actions, Operations Dashboard, Ingestion trigger, Binder Export).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of screenplay ingestions (both bundled fixture and uploaded files) execute through visible, sequential state transitions with zero intermediate count discrepancies between summary banners and the entity registry.
- **SC-002**: Screenplay ingestion for a feature-length screenplay (~150 scenes / 140KB) completes in under 45 seconds in live `CLOUD_MODE`.
- **SC-003**: 100% of clicks and keyboard triggers on "Actions" and "Timeline" controls open visibly rendered overlays with appropriate z-index stacking above all page elements.
- **SC-004**: 100% of entity alias variations across punctuation, acronyms, and parenthetical forms (e.g. `Associated Press`, `A.P.`, `AP`) merge into a single canonical entity while preserving 100% of individual occurrence locations and surface mentions.
- **SC-005**: 100% of active entities displayed in the current registry possess at least one occurrence in the current active screenplay draft, with 0 phantom entities inflating shooting readiness metrics.
- **SC-006**: Passive viewing sessions of 5+ minutes generate exactly 0 synthetic timeline events, maintaining a strictly constant timeline event count during idle observation.
- **SC-007**: 100% of operations taking longer than 30 seconds display stage-specific recovery guidance and a functional cancel option.
- **SC-008**: Full automated test suite passes with 100% green status across all contract, unit, and interaction test suites.

## Assumptions

- The backend runtime continues to adhere strictly to the Google ADK and `@google/genai` Gemini 3.6 Flash model standards defined in the ClearanceScout Constitution.
- Live `CLOUD_MODE` execution authority remains strictly enforced, failing visibly if credentials are missing without synthetic demo fallbacks.
- Existing deterministic test fixtures and mock datasets (`The Neon Horizon`) are preserved for deterministic offline verification in `TEST_MODE`.
- All modal and drawer components utilize standard CSS classes and inline React styles matching the project's established dark aesthetic without external utility frameworks (such as Tailwind CSS).
