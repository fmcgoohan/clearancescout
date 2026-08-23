# Feature Specification: ClearanceScout UX Redesign

**Feature Branch**: `024-ux-redesign`  
**Created**: 2026-08-23  
**Status**: Proposed  
**Input**: UX Redesign Brief (`docs/ux-redesign-brief.md`)  

---

## Objective & Product Outcome

Refine ClearanceScout into a polished, intuitive production-clearance workspace that supports both first-time line producers and experienced clearance professionals.

Without prior training, an operator MUST be able to immediately execute the primary 6-step clearance workflow:
1. Load or upload a screenplay.
2. Review overall shooting readiness.
3. Identify highlighted clearance items in their scene context.
4. Research, mitigate, or escalate unresolved items.
5. Track assigned department work.
6. Export the final clearance binder.

---

## Preservation Invariants (Strengths Preserved)

The redesign MUST preserve and non-regress all existing system capabilities:
- Side-by-side screenplay and clearance item registry layout.
- Synchronized scene, entity, occurrence, clearance status, and department task counts.
- Replace-versus-merge screenplay ingestion options.
- Multi-stage ingestion feedback: processing stages, percentage progress, cancellation, and atomic completion summary.
- Text labels paired with status colors (no color-only status).
- Highlighted screenplay references linked to canonical clearance items.
- Search/filter controls and accessible table markup.
- Condensed registry actions with an overflow menu for secondary actions.
- Department Task Center and Operations Dashboard modals.
- Human-readable category and status labels.
- Modal focus entry, focus trapping, Escape dismissal, and focus restoration.
- Durable completion summary banner.
- Bundled demo scenario producing 3 scenes, 7 entities, and 7 department tasks.

---

## 10 UX Requirement Areas

### Area 1: Establish a Clear Primary Action
- **R1.1**: Render a Contextual Recommendation Card near the project summary and shooting readiness section.
- **R1.2**: Proactively identify the most urgent unresolved clearance blocker (e.g., *"2 clearance items require action. Start with Nocturne of the Wild."*).
- **R1.3**: Provide a 1-click direct action button leading immediately to the recommended blocker.
- **R1.4**: Automatically update or hide when state changes or no immediate action is required.

### Area 2: Simplify Terminology
- **R2.1**: Replace specialist terms on primary controls:
  - `"Ground"` $\rightarrow$ `"Research"` or `"Verify Evidence"`
  - `"Canonical Entity Registry"` $\rightarrow$ `"Clearance Items"`
  - `"Multi-Format Script Ingestion"` $\rightarrow$ `"Screenplay Intake & Clearance"`
  - `"Department Tasks"` $\rightarrow$ Assigned work
  - `"Blocking Occurrences"` $\rightarrow$ Scene appearances preventing shoot readiness
- **R2.2**: Relegate implementation details or technical terms to tooltips or advanced detail views.

### Area 3: Clarify Navigation Boundaries
- **R3.1**: Explicitly delineate five operational areas with tooltips or first-use guidance:
  1. *Clearance Items*: Review and act on entities.
  2. *Department Tasks*: Track assigned work and ownership.
  3. *Operations Dashboard*: Understand project-wide readiness and risk.
  4. *Observable Timeline*: Inspect workflow history and system activity.
  5. *Clearance Binder*: Export the legal deliverable.

### Area 4: Reduce Header Density
- **R4.1**: Header primary bar MUST prioritize Project Identity, Project Summary, and Recommended Next Action.
- **R4.2**: Relegate secondary utilities (Access Token, Execution Mode, Live Quota, Export, Timeline) to a visually subordinate toolbar or overflow menu.

### Area 5: Improve Registry Usability
- **R5.1**: Combine compact action controls with unambiguous text labels.
- **R5.2**: Hide `"Research All Pending"` when pending count is 0, or replace with a non-interactive completion badge.
- **R5.3**: Support long entity names without truncating or squishing action columns.
- **R5.4**: Support resizable or collapsible screenplay panel and card layout on mobile.

### Area 6: Improve Visual Readability
- **R6.1**: Increase font scale for supporting text, legends, badges, and filters to minimum `12px` / `0.75rem`.
- **R6.2**: Ensure minimum WCAG AA contrast (4.5:1 for body text, 3:1 for large text and UI components) against dark background.
- **R6.3**: Reduce nested borders and container padding bloat.
- **R6.4**: Retain strict color vocabulary: Cyan (nav/neutral), Amber (review), Red (action required/blocking), Green (cleared).

### Area 7: Improve Responsive Behavior
- **R7.1**: **Wide Desktop (>=1200px)**: Screenplay and Clearance Items rendered side-by-side.
- **R7.2**: **Medium Viewport (768px–1199px)**: Allow resizing or collapsing either panel via a toggle/splitter.
- **R7.3**: **Narrow Mobile (<768px)**: Stack screenplay and clearance items vertically; convert table rows to responsive cards.
- **R7.4**: Modals MUST fit within the viewport height and support internal scrolling without page body scrollbars.

### Area 8: Preserve Count Semantics
- **R8.1**: Maintain strict distinction between Entities, Blocking Occurrences, Department Tasks, and Scenes.
- **R8.2**: Provide tooltip/explanatory copy explaining why blocking occurrences can exceed department tasks (multiple appearances per scene).
- **R8.3**: All counts MUST update atomically upon ingestion or clearance state changes.

### Area 9: Ingestion Feedback & Accessibility
- **R9.1**: Ingestion modal MUST remain open and trap focus; background content MUST be inert (`aria-hidden="true"`).
- **R9.2**: Initial focus MUST land on "Cancel Upload" or a status container.
- **R9.3**: Live updates MUST announce stage changes using `role="status"` and `aria-live="polite"` (suppressing per-second timer noise).
- **R9.4**: Completion MUST restore focus and display a durable summary banner: *"Screenplay replaced successfully - X scenes processed - Y entities registered - Z department tasks created."*

### Area 10: Onboarding & First-Use Guidance
- **R10.1**: Provide lightweight, non-modal first-use guidance:
  - 3-step introductory walkthrough.
  - Contextual empty-state guidance.
  - Tooltips explaining specialist concepts (red scenes, insufficient evidence, rights vs placeholders vs counsel overrides).
  - Dismissible *"How clearance works"* info banner.

---

## 12 User Stories & Acceptance Criteria

### User Story 1: First-Time Screenplay Upload (Priority: P1)
**As a** first-time line producer,  
**I want to** drag and drop or select a script file and observe clear ingestion feedback,  
**So that** I know my screenplay was parsed correctly and initial clearance tasks were created.

- **AC-1.1**: Ingestion modal opens immediately upon file drop or selection.
- **AC-1.2**: Modal displays stage progress (*"Parsing text"*, *"Extracting entities"*, *"Evaluating risk"*), percentage, and cancel button.
- **AC-1.3**: Background is inert and inaccessible to keyboard/screen reader during processing.
- **AC-1.4**: On completion, a durable summary announces parsed scene, entity, and task counts. Focus returns to the primary workspace.

### User Story 2: Screenplay Replacement (Priority: P1)
**As a** clearance coordinator,  
**I want to** replace an existing script with a revised draft,  
**So that** outdated scenes and clearance items are purged while new items are registered atomically.

- **AC-2.1**: Modal provides an explicit "Replace Screenplay" choice vs "Merge Version".
- **AC-2.2**: Replacing purges prior script scenes and re-initializes entity registry and department task counts atomically.
- **AC-2.3**: Completion summary explicitly confirms *"Screenplay replaced successfully - X scenes processed - Y entities registered"*.

### User Story 3: Screenplay Version Merge (Priority: P2)
**As a** production manager,  
**I want to** merge a new script version with existing clearance progress,  
**So that** previously cleared items retain their status while newly introduced entities are added.

- **AC-3.1**: Merge option preserves existing cleared entities, recorded rights, and counsel overrides.
- **AC-3.2**: Newly added entities are highlighted in red/amber with new department tasks created.
- **AC-3.3**: Overall readiness index updates to reflect merged clearance status.

### User Story 4: Reviewing a Red Scene (Priority: P1)
**As a** line producer scanning for shoot blockers,  
**I want to** select a red scene and read why it is blocked,  
**So that** I immediately understand what prop, brand, or artwork prevents shooting.

- **AC-4.1**: Non-cleared scenes in the Readiness Band display a plain-language reason card (e.g., *"Hazard placard artwork needs rights or replacement"*).
- **AC-4.2**: Clicking the scene card scrolls the screenplay panel directly to that scene and filters the clearance items table to occurrences in that scene.
- **AC-4.3**: Highlighted entity occurrences in the screenplay panel show status-colored dotted underlines.

### User Story 5: Researching an Entity (Priority: P1)
**As a** clearance researcher,  
**I want to** click "Research" on an unresolved item,  
**So that** live web/trademark evidence is gathered and provenance citations are displayed.

- **AC-5.1**: Primary registry table row features a clear "Research" text button.
- **AC-5.2**: Clicking "Research" triggers live lookup, displaying a loading state on that row.
- **AC-5.3**: Upon completion, status badge updates (e.g. from `INSUFFICIENT EVIDENCE` to `CLEARED` or `REVIEW RECOMMENDED`) with citation links attached.

### User Story 6: Viewing Occurrences (Priority: P2)
**As a** clearance coordinator,  
**I want to** inspect all scene appearances for a specific entity,  
**So that** I understand where in the script the item appears and which specific scenes are blocked.

- **AC-6.1**: Clicking the occurrence badge (e.g., *"2 uses"*) opens an occurrence drawer or inline detail view.
- **AC-6.2**: Each scene occurrence lists scene number, heading, character action snippet, and per-scene risk status.
- **AC-6.3**: Tooltips clarify that 1 entity can generate multiple blocking occurrences across scenes.

### User Story 7: Creating a Placeholder (Priority: P2)
**As an** art director,  
**I want to** generate a fictional replacement brand or artwork placeholder,  
**So that** a blocked commercial brand is safely replaced with a clearable alternative.

- **AC-7.1**: "Generate Replacement" action opens the Placeholder Manager modal.
- **AC-7.2**: Generates fictional name, backstory, and visual artwork card.
- **AC-7.3**: Applying the replacement updates the entity status to `CLEARED` and unblocks associated scenes.

### User Story 8: Recording Rights (Priority: P2)
**As a** legal coordinator,  
**I want to** log a signed release or rights agreement with expiration dates,  
**So that** the item is marked cleared with verifiable legal documentation.

- **AC-8.1**: "Record Rights" modal allows entering licensor name, agreement type, and expiration date.
- **AC-8.2**: Submitting updates entity status to `CLEARED` and updates the Operations Dashboard "Rights Expiring <90 Days" KPI tile.

### User Story 9: Applying a Counsel Override (Priority: P2)
**As** production counsel,  
**I want to** apply a manual clearance override with legal rationale,  
**So that** an item flagged by automated rules can be cleared under fair use or studio policy.

- **AC-9.1**: "Counsel Review" action opens the override dialog requiring written legal rationale.
- **AC-9.2**: Submitting sets status to `CLEARED (COUNSEL OVERRIDE)` with rationale logged in the Observable Timeline.

### User Story 10: Completing a Department Task (Priority: P1)
**As a** department head (Art, Legal, Props),  
**I want to** view my assigned tasks and mark them resolved,  
**So that** assigned clearance work is tracked to completion without layout shift.

- **AC-10.1**: Department Task Center modal organizes tasks into department tabs with open counts.
- **AC-10.2**: Clicking "Resolve" in-place transitions the task card smoothly to a labeled "RESOLVED" state without jumping or layout shift.
- **AC-10.3**: Resolving all department tasks for an entity updates overall readiness.

### User Story 11: Exporting a Clearance Binder (Priority: P1)
**As a** line producer,  
**I want to** export the complete clearance binder with SHA-256 digest,  
**So that** insurance underwriters and studio executives receive the official clearance deliverable.

- **AC-11.1**: "Export Clearance Binder" action generates a structured PDF/JSON binder.
- **AC-11.2**: Binder includes SHA-256 digest, readiness index, scene breakdown, entity status registry, evidence citations, and recorded rights.

### User Story 12: Completing Workflow with Keyboard & Screen Reader (Priority: P1)
**As a** keyboard or screen-reader operator,  
**I want to** navigate and operate the entire workspace using standard keyboard controls and screen reader announcements,  
**So that** the application is fully accessible per WCAG 2.2 AA.

- **AC-12.1**: All interactive elements have visible focus rings (`:focus-visible`).
- **AC-12.2**: Modals trap keyboard focus, support Escape dismissal, and restore focus upon closing.
- **AC-12.3**: Status changes and ingestion progress are announced politely via `role="status"` and `aria-live="polite"`.
- **AC-12.4**: Page layout supports 200% zoom scale without horizontal scrollbars or text clipping.

---

## Verification & Acceptance Gate

The redesign will be deemed complete when:
1. `scripts/spec-check.sh` passes with 0 violations over `src/`.
2. All 12 user stories pass automated component, integration, and Playwright E2E tests.
3. VoiceOver screen reader testing passes for ingestion, navigation, and modal flows.
4. 200% zoom and responsive viewport tests pass at 1200px, 900px, 768px, and 375px.
5. Bundled demo script reliably yields 3 scenes, 7 entities, and 7 department tasks.
6. `DESIGN_LOG.md` is appended with version `1.3.0` changes and verification evidence.
