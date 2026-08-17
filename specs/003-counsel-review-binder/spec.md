# Feature Specification: Clearance Binder Export & Studio Counsel Review Module

**Feature Directory**: `specs/003-counsel-review-binder`  
**Created**: 2026-08-17  
**Updated**: 2026-08-18  
**Status**: Specified & Clarified  
**Input**: User description: "Converge 003 only. Do not add scope. A scene-specific override must never mutate canonical entity override state; add tests for a scene override with no prior canonical override and prove other scenes retain the automated/canonical status. Propagate sceneId from ScriptViewer entity clicks through WorkspacePage/App into CitationDrawer. Make ScriptViewer badges use resolved scene-specific effective status rather than CanonicalEntity.overallClearanceStatus. Finally, make binder-level provenance accurately represent mixed live/fallback/demo evidence instead of inferring the whole binder from the first citation."

## Clarifications

### Session 2026-08-17
- Q: Should a studio counsel status override apply globally to the Canonical Entity across all scenes, or can counsel apply scene-specific overrides? → A: Hierarchical override: Canonical entity override sets the baseline clearance status project-wide, while allowing scene-specific overrides for unique scene contexts.
- Q: When a user clicks an in-script highlighted badge directly on the screenplay text, how should the UI display clearance details? → A: Synchronized drawer: Focuses the entity in the registry table and immediately opens the slide-over Citation & Counsel Review Drawer containing research citations and override controls with scene context propagated.
- Q: How should the system generate the printable Legal Clearance Binder PDF document? → A: Interactive printable modal: Formatted studio binder view with clean @media print styling, page break rules, and immediate browser "Print to PDF" triggering + structured JSON export.

### Session 2026-08-18
- Q: How should the system handle automated risk re-evaluation when a canonical entity already has an active counsel override? → A: Preserve the counsel override as the authoritative effective status, while refreshing the background research citations and diagnostic baseline.
- Q: How must evidence provenance be derived and displayed across the system and binder? → A: Derived directly from actual research result provenance (`PARALLEL_LIVE`, `DEMO_FIXTURE`, `FALLBACK_FIXTURE`, or `MIXED` with breakdown counts). Synthetic and fallback evidence must never be labeled "Live Parallel-Web", and fallback behavior must be visibly flagged.
- Q: How should the Counsel Decision Override form handle attorney identity and title inputs? → A: Initialize counsel name and role fields completely empty with descriptive placeholders, enforcing required non-empty entry before enabling submission.
- Q: How does the system resolve clearance status across scenes when overrides exist at multiple levels? → A: Hierarchical effective-status resolver: `scene override ?? canonical entity override ?? automated risk evaluation baseline`. A scene-specific override must never mutate canonical entity override state.
- Q: What terminology should be used for the unkeyed SHA-256 hash in export binders and UI? → A: Use `integrityDigest` and "SHA-256 Integrity Digest" throughout specs, API models, UI displays, and test assertions.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Downloadable Auditable Legal Clearance Binder (Priority: P1)

As a studio clearance supervisor, production attorney, or insurance underwriter (E&O), I want to export and download a comprehensive, timestamped Legal Clearance Binder in both structured JSON and formatted printable/PDF formats with transparent evidence provenance attribution (accurately reflecting mixed live, demo, and fallback evidence) and SHA-256 integrity verification, so that the production has a complete, verifiable audit record of all scene occurrences, risk flags, grounded research citations, and replacement cards for distributor and insurer delivery.

**Why this priority**: Distribution agreements and Errors & Omissions (E&O) insurance policies strictly require auditable proof of due diligence before theatrical or streaming release.

**Independent Test**: Trigger a clearance binder export on a multi-scene project. Verify that the system compiles a complete document containing metadata, scene breakdowns, hierarchical entity statuses, grounded research URLs with actual aggregate result provenance attribution, counsel overrides, and a SHA-256 integrity digest, providing immediate download in JSON and formatted printable summary.

**Acceptance Scenarios**:

1. **Given** a clearance project with parsed scenes, entities, and assessments, **When** the user triggers "Export Clearance Binder", **Then** the system compiles an auditable binder containing project metadata, scene-by-scene occurrence logs, canonical risk matrices, actual aggregate citation provenance breakdowns, and remediation replacement cards.
2. **Given** a generated clearance binder, **When** exported, **Then** the document includes an immutable timestamp, generation metadata, and a SHA-256 integrity digest verifying document payload integrity.
3. **Given** an exported binder in the UI, **When** the user chooses an export format, **Then** the user can download the machine-readable `.json` payload or view and print the formatted clearance binder summary with `@media print` styling displaying the SHA-256 integrity digest and mixed provenance breakdown.

---

### User Story 2 - Studio Legal Counsel Decision Override with Hierarchical Scoping & Anti-Overwrite Invariant (Priority: P2)

As a production attorney or senior studio counsel, I want to manually override any automated clearance risk tier project-wide (canonical entity baseline) or for a specific scene occurrence entering my authentic attorney identity and legal rationale into unpopulated fields, and guarantee that a scene-specific override never mutates canonical entity override state while automated re-evaluations never overwrite human determinations.

**Why this priority**: AI tools provide issue-spotting and risk assessment, but final legal risk tolerance rests with human production counsel. Tracking human override rationale and preventing automated regression or unintended project-wide mutation is essential for legal defensibility.

**Independent Test**: Select an entity marked `ACTION REQUIRED` in Scene 1, apply a scene-specific override for Scene 1 to `NO_ISSUE_SURFACED` without a prior canonical override. Verify that the canonical entity remains unmutated (`isOverridden === false`), Scene 1 displays `NO_ISSUE_SURFACED`, and Scene 2 / Scene 3 retain the automated baseline `ACTION_REQUIRED`. Next, apply a project-wide canonical override to `REVIEW_RECOMMENDED`, and verify Scene 1 retains `NO_ISSUE_SURFACED` (scene override takes precedence) while other scenes evaluate to `REVIEW_RECOMMENDED`.

**Acceptance Scenarios**:

1. **Given** an entity assessment in the registry or citation view, **When** authorized counsel opens the override control, **Then** the identity input fields start unpopulated, and the user can select an override status (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`) with optional scene scope, mandatory non-empty counsel name and legal rationale.
2. **Given** a submitted scene-specific override (`sceneId` present), **When** saved, **Then** the system persists the override in `OverrideRepo`, leaves the canonical entity's `isOverridden` and baseline `overallClearanceStatus` unmutated, and broadcasts an `OVERRIDE_RECORDED` event.
3. **Given** an overridden entity, **When** subsequent automated clearance evaluation runs, **Then** the system refreshes research citations and diagnostic scores in the background but preserves the counsel override as the authoritative status.
4. **Given** both canonical and scene-specific overrides on an entity, **When** calculating effective status in a scene, **Then** the system evaluates: `scene override ?? canonical override ?? automated assessment baseline`.

---

### User Story 3 - Multi-Scene In-Script Visual Highlighter with Scene Context Propagation (Priority: P3)

As a script supervisor, director, or clearance coordinator, I want an interactive screenplay viewer that highlights entity mentions with color-coded badges directly within dialogue and action lines using scene-resolved effective clearance status, and propagates the active `sceneId` on badge click into the Citation Drawer, so that production teams can immediately inspect and override clearance in the exact scene context.

**Why this priority**: Reading raw data tables disconnects clearance risks from dramatic context. In-line visual script highlighting with scene-context propagation allows filmmakers to immediately pinpoint and adjust scene-level clearance on page.

**Independent Test**: Load a scene with an entity that has a scene-specific override (e.g. Scene 1 has `NO_ISSUE_SURFACED` while canonical is `ACTION_REQUIRED`). Verify that the badge in Scene 1 renders Green (`NO_ISSUE_SURFACED`), while the badge for the same entity in Scene 2 renders Red (`ACTION_REQUIRED`). Click the badge in Scene 1 and verify `CitationDrawer` opens with `sceneId="scene-1"` populated and scene-specific override controls available.

**Acceptance Scenarios**:

1. **Given** a parsed screenplay scene, **When** rendered in the Script Viewer, **Then** all identified entity occurrences within dialogue blocks and action paragraphs are highlighted with distinct, accessible color-coded badges matching their **resolved scene-specific effective risk status**:
   - Green (`#34d399`): `NO ISSUE SURFACED`
   - Amber (`#fbbf24`): `REVIEW RECOMMENDED`
   - Red (`#f87171`): `ACTION REQUIRED`
   - Gray (`#94a3b8`): `INSUFFICIENT EVIDENCE`
2. **Given** an inline highlighted term in a scene, **When** clicked by the user, **Then** `ScriptViewer` propagates `(entityId, sceneId)` through `WorkspacePage`/`App` into `CitationDrawer`, focusing the entity and setting the scene context.
3. **Given** a scene with multiple entities in a single line, **When** rendered, **Then** each distinct entity mention is individually highlighted and clickable without text overlap or formatting disruption.

---

### Edge Cases

- **Scene Override Without Canonical Override**: When a scene-specific override is recorded on an entity with no canonical override, the canonical entity state remains `isOverridden: false`, and other scenes continue using automated risk evaluation.
- **Mixed Binder Evidence Provenance**: When a project contains citations from multiple sources (e.g. live search for one entity and fallback/demo fixtures for others), the clearance binder export aggregates and displays accurate mixed provenance breakdowns (`liveCount`, `demoCount`, `fallbackCount`), never claiming universal live coverage.
- **Scene Context Propagation**: Clicking an entity badge in Scene 3 passes `sceneId="scene-3"` to `CitationDrawer`, so that submitting an override with "Apply to current scene" checked automatically binds to `scene-3`.
- **Automated Re-Evaluation Overrides**: When batch re-evaluation runs, all canonical and scene-specific overrides are preserved unconditionally.
- **Fail-Visible Fallback Evidence**: If live Parallel search fails in `CLOUD_MODE`, the system flags the evidence provenance explicitly as `FALLBACK_FIXTURE` with a visible warning banner.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST compile a consolidated Legal Clearance Binder containing project metadata, scene breakdowns, canonical entity registry, risk evaluations, research citations, replacement catalogs, and counsel override logs.
- **FR-002**: System MUST compute a SHA-256 integrity digest (`integrityDigest`) over the normalized binder JSON data and include the digest in the export payload.
- **FR-003**: System MUST provide a downloadable `.json` file export of the complete Legal Clearance Binder.
- **FR-004**: System MUST provide a printable and formatted HTML/PDF binder preview modal with print styling (`@media print`), section navigation, and SHA-256 integrity digest display.
- **FR-005**: System MUST provide Counsel Override endpoints (`POST /api/projects/:id/entities/:entityId/override`) supporting project-wide canonical overrides and scene-specific overrides. When `sceneId` is provided, the system MUST NOT mutate canonical entity override state.
- **FR-006**: System MUST require a non-empty `overrideRationale` and `counselName` when an override is submitted.
- **FR-007**: System MUST record all counsel overrides in an immutable `overrides` subcollection in Firestore with previous status, new status, optional `sceneId`, rationale, counsel identity, and timestamp.
- **FR-008**: System MUST emit an `OVERRIDE_RECORDED` event on the Server-Sent Events (SSE) stream when an override is executed.
- **FR-009**: System MUST render inline visual highlights for entity occurrences directly inside screenplay dialogue and action lines in `ScriptViewer` using **resolved scene-specific effective clearance risk status**.
- **FR-010**: System MUST color-code script highlights based on effective clearance risk status (Green = `NO_ISSUE_SURFACED`, Amber = `REVIEW_RECOMMENDED`, Red = `ACTION_REQUIRED`, Gray = `INSUFFICIENT_EVIDENCE`).
- **FR-011**: System MUST make inline highlighted entities clickable, propagating `(entityId, sceneId)` through `WorkspacePage` and `App` to open the Citation and Counsel Review Drawer with active scene context.
- **FR-012**: System MUST display an "Overridden by Counsel" badge with tooltip rationale in both the Entity Registry and the Clearance Binder export.
- **FR-013**: System MUST preserve active counsel overrides during automated risk re-evaluation, keeping the counsel's determination as authoritative while updating underlying research citations and diagnostic assessments.
- **FR-014**: System MUST derive evidence labels and provenance badges directly from actual search result provenance (`PARALLEL_LIVE`, `DEMO_FIXTURE`, or `FALLBACK_FIXTURE`), and accurately aggregate mixed evidence provenance across the clearance binder.
- **FR-015**: System MUST initialize all counsel override identity input fields unpopulated (without pre-filled fictional identities) and enforce non-empty entry of counsel name and legal rationale before submission.
- **FR-016**: System MUST implement a hierarchical effective status resolver: `scene override ?? canonical entity override ?? automated assessment baseline` for evaluating entity clearance in scene viewers, highlight badges, and binder exports.

---

## Key Entities

- **ClearanceBinderExport**: Consolidated legal package. Attributes: `id`, `projectId`, `title`, `productionCompany`, `scriptVersion`, `exportedAt`, `integrityDigest`, `scenesCount`, `entitiesCount`, `overridesCount`, `summaryMetrics`, `provenanceSummary` (`{ liveCount, demoCount, fallbackCount, dominantProvenance }`), `scenes`, `canonicalEntities`, `replacementCatalog`, `overridesHistory`.
- **CounselOverride**: Human legal decision log. Attributes: `id`, `canonicalEntityId`, `sceneId` (optional), `previousStatus`, `overrideStatus`, `rationale`, `counselName`, `counselRole`, `timestamp`.
- **ProvenanceType**: Actual search result provenance status (`'PARALLEL_LIVE' | 'DEMO_FIXTURE' | 'FALLBACK_FIXTURE' | 'MIXED'`).
- **ScriptOccurrenceHighlight**: Tokenized segment within a scene. Attributes: `occurrenceId`, `canonicalEntityId`, `sceneId`, `term`, `category`, `effectiveStatus`, `startIndex`, `endIndex`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Legal Clearance Binder generation and download packaging completes in under 3 seconds for a 100-page screenplay.
- **SC-002**: 100% of counsel overrides are recorded with immutable audit timestamps, unpopulated authentic counsel inputs, and mandatory legal rationales.
- **SC-003**: 100% of overridden entities preserve their human clearance status across subsequent automated batch re-evaluations without status regression.
- **SC-004**: 100% of research evidence items, timeline events, citations, and binder exports reflect their actual search result provenance, with accurate mixed-evidence aggregation across the clearance binder.
- **SC-005**: 100% compliance with E&O integrity verification: `integrityDigest` strictly matches the SHA-256 digest of the exported JSON payload.
- **SC-006**: 100% isolation of scene overrides: a scene-specific override on an entity without a canonical override leaves other scenes and the canonical registry displaying the automated baseline status.

---

## Assumptions

- Counsel overrides are performed by authorized production personnel.
- Screenplay highlights are derived dynamically from recognized entity occurrence text spans within the current scene.
- Print stylesheets allow standard browser PDF generation ("Save as PDF") from the clearance binder modal.
