# Feature Specification: Clearance Binder Export & Studio Counsel Review Module

**Feature Directory**: `specs/003-counsel-review-binder`  
**Created**: 2026-08-17  
**Updated**: 2026-08-18  
**Status**: Specified & Clarified  
**Input**: User description: "Add the Clearance Binder Export & Studio Counsel Review module: 1. Clearance Binder Export (Downloadable, timestamped PDF/JSON Legal Clearance Binder with all scene occurrences, risk flags, and live parallel-web citations), 2. Counsel Decision Override (UI controls for legal counsel to manually override automated risk tiers with audit-logged rationale), 3. Multi-Scene Visual Highlighter (Interactive script viewer that highlights cleared vs. flagged terms with color-coded badges directly on the screenplay text)."

## Clarifications

### Session 2026-08-17
- Q: Should a studio counsel status override apply globally to the Canonical Entity across all scenes, or can counsel apply scene-specific overrides? → A: Hierarchical override: Canonical entity override sets the baseline clearance status project-wide, while allowing scene-specific overrides for unique scene contexts.
- Q: When a user clicks an in-script highlighted badge directly on the screenplay text, how should the UI display clearance details? → A: Synchronized drawer: Focuses the entity in the registry table and immediately opens the slide-over Citation & Counsel Review Drawer containing live parallel-web citations and override controls.
- Q: How should the system generate the printable Legal Clearance Binder PDF document? → A: Interactive printable modal: Formatted studio binder view with clean @media print styling, page break rules, and immediate browser "Print to PDF" triggering + structured JSON export.

### Session 2026-08-18
- Q: How should the system handle automated risk re-evaluation when a canonical entity already has an active counsel override? → A: Preserve the counsel override as the authoritative effective status, while refreshing the background research citations and diagnostic baseline.
- Q: How should the UI and clearance binder distinguish research evidence between live cloud search and synthetic demo/test fixtures? → A: Display 'Demo Fixture Research Evidence (Synthetic Dataset)' with an amber indicator in DEMO/TEST mode, and 'Live Parallel-Web Grounded Research Citations' with a cyan indicator in CLOUD mode.
- Q: How should the Counsel Decision Override form handle attorney identity and title inputs? → A: Initialize counsel name and role fields completely empty with descriptive placeholders, enforcing required non-empty entry before enabling submission.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Downloadable Auditable Legal Clearance Binder (Priority: P1)

As a studio clearance supervisor, production attorney, or insurance underwriter (E&O), I want to export and download a comprehensive, timestamped Legal Clearance Binder in both structured JSON and formatted printable/PDF formats with transparent evidence provenance attribution, so that the production has a complete, cryptographically verified audit record of all scene occurrences, risk flags, grounded research citations (clearly identified as live search or demo fixtures), and replacement cards for distributor and insurer delivery.

**Why this priority**: Distribution agreements and Errors & Omissions (E&O) insurance policies strictly require auditable proof of due diligence before theatrical or streaming release.

**Independent Test**: Trigger a clearance binder export on a multi-scene project. Verify that the system compiles a complete document containing metadata, scene breakdowns, entity statuses, grounded research URLs with mode-aware provenance attribution, counsel overrides, and a SHA-256 audit signature, providing immediate download in JSON and formatted printable summary.

**Acceptance Scenarios**:

1. **Given** a clearance project with parsed scenes, entities, and assessments, **When** the user triggers "Export Clearance Binder", **Then** the system compiles an auditable binder containing project metadata, scene-by-scene occurrence logs, canonical risk matrices, mode-aware citation provenance, and remediation replacement cards.
2. **Given** a generated clearance binder, **When** exported, **Then** the document includes an immutable timestamp, generation metadata, and a cryptographic SHA-256 audit signature verifying document integrity.
3. **Given** an exported binder in the UI, **When** the user chooses an export format, **Then** the user can download the machine-readable `.json` payload or view and print the formatted clearance binder summary with `@media print` styling.

---

### User Story 2 - Studio Legal Counsel Decision Override with Audit Logging & Anti-Overwrite Invariant (Priority: P2)

As a production attorney or senior studio counsel, I want to manually override any automated clearance risk tier (e.g., changing `ACTION REQUIRED` to `REVIEW RECOMMENDED` or `NO ISSUE SURFACED` based on studio rights acquisition, fair use analysis, or product placement agreements) entering my authentic attorney identity and legal rationale into unpopulated fields, and guarantee that subsequent automated re-evaluations never overwrite my authoritative determination.

**Why this priority**: AI tools provide issue-spotting and risk assessment, but final legal risk tolerance rests with human production counsel. Tracking human override rationale and preventing automated regression is essential for legal defensibility.

**Independent Test**: Select an entity marked `ACTION REQUIRED` (e.g., a branded sports car), click "Counsel Review", verify input fields are unpopulated, input counsel name ("Jane Doe, Esq."), title ("Senior Production Legal Counsel"), select `NO ISSUE SURFACED`, input the legal rationale ("Secured paid product placement agreement #PP-2026-881"), and submit. Next, re-run automated clearance evaluation on the project and verify that the entity status remains `NO ISSUE SURFACED` (override preserved) while background citations update.

**Acceptance Scenarios**:

1. **Given** an entity assessment in the registry or citation view, **When** authorized counsel opens the override control, **Then** the identity input fields start unpopulated, and the user can select an override status (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`) with mandatory non-empty counsel name and legal rationale.
2. **Given** a submitted override, **When** saved, **Then** the system updates the entity's effective clearance status, records the previous status, counsel identifier, timestamp, and rationale in Firestore, and broadcasts an `OVERRIDE_RECORDED` event to the observable timeline.
3. **Given** an overridden entity, **When** subsequent automated clearance evaluation runs, **Then** the system refreshes research citations and diagnostic scores in the background but preserves the counsel override as the authoritative `overallClearanceStatus`.
4. **Given** an overridden entity, **When** viewed in the registry or clearance binder, **Then** the UI clearly indicates the override badge with a tooltip displaying counsel rationale and override timestamp.

---

### User Story 3 - Multi-Scene In-Script Visual Highlighter (Priority: P3)

As a script supervisor, director, or clearance coordinator, I want an interactive screenplay viewer that highlights entity mentions with color-coded badges directly within the dialogue and action lines across all scenes, so that production teams can immediately see where cleared and flagged terms appear in the context of the script.

**Why this priority**: Reading raw data tables disconnects clearance risks from dramatic context. In-line visual script highlighting allows filmmakers to immediately pinpoint where flagged items occur on page.

**Independent Test**: Navigate to the Script Viewer, select a scene containing multiple entities (e.g., Coca-Cola, Rolex, Porsche). Verify that each entity mention within the action and dialogue text is rendered with an inline, color-coded badge corresponding to its clearance risk tier (Green for Cleared, Amber for Review, Red for Action Required, Gray for Insufficient Evidence), and clicking a badge opens the citation and override drawer.

**Acceptance Scenarios**:

1. **Given** a parsed screenplay scene, **When** rendered in the Script Viewer, **Then** all identified entity occurrences within dialogue blocks and action paragraphs are highlighted with distinct, accessible color-coded badges matching their risk status:
   - Green (`#34d399`): `NO ISSUE SURFACED`
   - Amber (`#fbbf24`): `REVIEW RECOMMENDED`
   - Red (`#f87171`): `ACTION REQUIRED`
   - Gray (`#94a3b8`): `INSUFFICIENT EVIDENCE`
2. **Given** an inline highlighted term, **When** clicked by the user, **Then** the workspace focuses that entity in the registry table and opens the Citation & Counsel Review Drawer.
3. **Given** a scene with multiple entities in a single line, **When** rendered, **Then** each distinct entity mention is individually highlighted and clickable without text overlap or formatting disruption.

---

### Edge Cases

- **Automated Re-Evaluation Overrides**: When batch re-evaluation runs, all entities with `isOverridden === true` retain their manual clearance status unconditionally.
- **Evidence Provenance in Demo vs Cloud**: Displaying "Demo Fixture Research Evidence (Synthetic Dataset)" in DEMO/TEST mode, and "Live Parallel-Web Grounded Research Citations" in CLOUD mode.
- **Overriding Entities with Generated Replacements**: When counsel clears an entity that already had a generated replacement card, the system retains the replacement in the catalog while marking the primary canonical item cleared with override rationale.
- **Multiple Overrides on the Same Entity**: Maintaining a full chronological audit history of overrides rather than overwriting past legal rationales.
- **Script Text with Overlapping Substrings**: Ensuring highlighter regex handles case variations and word boundaries without corrupting adjacent punctuation or dialogue tags.
- **Empty or Whitespace-Only Override Fields**: Rejecting override submissions without non-empty counsel name and legal rationale.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST compile a consolidated Legal Clearance Binder containing project metadata, scene breakdowns, canonical entity registry, risk evaluations, research citations, replacement catalogs, and counsel override logs.
- **FR-002**: System MUST compute a SHA-256 cryptographic audit signature over the normalized binder JSON data and include the signature in the export payload.
- **FR-003**: System MUST provide a downloadable `.json` file export of the complete Legal Clearance Binder.
- **FR-004**: System MUST provide a printable and formatted HTML/PDF binder preview modal with print styling (`@media print`) and section navigation.
- **FR-005**: System MUST provide a Counsel Override endpoint (`POST /api/projects/:id/entities/:entityId/override`) and UI control allowing legal counsel to manually modify an entity's clearance status.
- **FR-006**: System MUST require a non-empty `overrideRationale` and `counselName` when an override is submitted.
- **FR-007**: System MUST record all counsel overrides in an immutable `overrides` subcollection in Firestore with previous status, new status, rationale, counsel identity, and timestamp.
- **FR-008**: System MUST emit an `OVERRIDE_RECORDED` event on the Server-Sent Events (SSE) stream when an override is executed.
- **FR-009**: System MUST render inline visual highlights for entity occurrences directly inside screenplay dialogue and action lines in `ScriptViewer`.
- **FR-010**: System MUST color-code script highlights based on effective clearance risk status (Green = `NO_ISSUE_SURFACED`, Amber = `REVIEW_RECOMMENDED`, Red = `ACTION_REQUIRED`, Gray = `INSUFFICIENT_EVIDENCE`).
- **FR-011**: System MUST make inline highlighted entities clickable, opening the Citation and Counsel Review Drawer.
- **FR-012**: System MUST display an "Overridden by Counsel" badge with tooltip rationale in both the Entity Registry and the Clearance Binder export.
- **FR-013**: System MUST preserve active counsel overrides (`isOverridden === true`) during automated risk re-evaluation, keeping the counsel's determination as the `overallClearanceStatus` while updating underlying research citations and diagnostic assessments.
- **FR-014**: System MUST visibly attribute research evidence based on execution mode, labeling evidence as "Demo Fixture Research Evidence (Synthetic Dataset)" in DEMO/TEST modes and "Live Parallel-Web Grounded Research Citations" in CLOUD mode.
- **FR-015**: System MUST initialize all counsel override identity input fields unpopulated (without pre-filled fictional identities) and enforce non-empty entry of counsel name and legal rationale before submission.

---

## Key Entities

- **Clearance Binder Export**: Consolidated legal package. Attributes: `id`, `projectId`, `title`, `productionCompany`, `scriptVersion`, `exportedAt`, `auditSignature`, `scenesCount`, `entitiesCount`, `overridesCount`, `summaryMetrics`, `scenes`, `canonicalEntities`, `replacementCatalog`, `overridesHistory`.
- **Counsel Override**: Human legal decision log. Attributes: `id`, `canonicalEntityId`, `previousStatus`, `overrideStatus`, `rationale`, `counselName`, `counselRole`, `timestamp`.
- **Script Occurrence Highlight**: Tokenized segment within a scene. Attributes: `occurrenceId`, `canonicalEntityId`, `term`, `category`, `riskStatus`, `startIndex`, `endIndex`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Legal Clearance Binder generation and download packaging completes in under 3 seconds for a 100-page screenplay.
- **SC-002**: 100% of counsel overrides are recorded with immutable audit timestamps, unpopulated authentic counsel inputs, and mandatory legal rationales.
- **SC-003**: 100% of overridden entities preserve their human clearance status across subsequent automated batch re-evaluations without status regression.
- **SC-004**: 100% of research evidence cards and binder exports accurately reflect their execution mode provenance (Live vs Demo Fixture).
- **SC-005**: 100% compliance with E&O audit standards: SHA-256 signature changes if any exported value or override rationale is tampered with.

---

## Assumptions

- Counsel overrides are performed by authorized production personnel (future iterations can add RBAC roles).
- Screenplay highlights are derived dynamically from recognized entity occurrence text spans within the current scene.
- Print stylesheets allow standard browser PDF generation ("Save as PDF") from the clearance binder modal.
