# Feature Specification: Manual Clearance Item Correction

**Feature Branch**: `006-manual-item-correction`  
**Created**: 2026-08-18  
**Status**: Clarified  
**Input**: User description: "Manual Clearance Item Correction: before research runs, let a clearance coordinator add, edit, or remove extracted clearance items and correct category, name, or scene context. User-edited items become the source of truth for later research and replacement. Preserve existing 003, 004, and 005 invariants. Do not add unrelated scope."

---

## Clarifications

### Session 2026-08-18
- Q: What actions and fields are available for manual item correction prior to research? → A: Coordinators can add, edit, or remove clearance items before research runs. Editable fields are canonical name, clearance category, and scene context.
- Q: How do user edits influence downstream clearance research and replacement generation? → A: User-edited values are the authoritative source of truth for subsequent live research, risk evaluation, replacement generation, and counsel review.
- Q: What happens to previously generated assessments when an entity is edited? → A: Changing name or category invalidates prior automated assessments and citations (prompting re-evaluation) but never mutates existing counsel overrides.
- Q: How are deleted items handled across workspace registries and dossier exports? → A: Removed items are permanently deleted from the active project entity registry and excluded from compiled clearance binders.
- Q: How are manual item corrections reflected on the observable action timeline? → A: The backend emits structured timeline events (`ITEM_ADDED`, `ITEM_EDITED`, `ITEM_REMOVED`) over the SSE stream.

---

## User Scenarios & Testing

### User Story 1 - Edit Extracted Clearance Item Details (Priority: P1) 🎯 MVP

As a studio clearance coordinator, after ingesting a screenplay and extracting candidate clearance mentions, I want to edit an extracted item's canonical name, clearance category, and scene context so that misclassified or partially extracted entities reflect the exact real-world asset prior to conducting research.

**Why this priority**: Automated parsers may occasionally capture partial text (e.g., "Prism Laptop" instead of "AeroTech Prism Laptop") or misclassify category nuances. Enabling coordinators to correct names and categories immediately establishes the ground truth required for accurate live trademark research and downstream replacement generation.

**Independent Test**: Ingest a screenplay, select an extracted item, change its name and category via the edit interface, and verify that all subsequent clearance research evaluations and replacement operations operate strictly against the updated entity details.

**Acceptance Scenarios**:
1. **Given** an automatically extracted clearance item in the entity registry, **When** the coordinator opens the edit dialog, updates the canonical name and/or category (e.g., from `GRAPHIC_PROP` to `BRAND`), and saves changes, **Then** the entity table, script viewer occurrences, and backend data store immediately reflect the updated properties.
2. **Given** an item edited by the coordinator, **When** the coordinator triggers "Research Clearance", **Then** the live research query, external trademark search, and risk assessment are evaluated strictly against the user-edited name and category.
3. **Given** an item edited by the coordinator, **When** the coordinator triggers "Generate Replacement", **Then** the replacement generation engine uses the user-corrected name and category as prompt inputs.
4. **Given** an entity that had a prior automated assessment, **When** the coordinator edits its name or category, **Then** the prior automated assessment is invalidated while any existing legal counsel overrides remain untouched.
5. **Given** a successful edit, **When** changes are saved, **Then** an `ITEM_EDITED` timeline event is emitted to the observable action stream.

---

### User Story 2 - Manually Add New Clearance Item (Priority: P2)

As a studio clearance coordinator, I want to manually add a new clearance item (specifying name, category, scene association, and usage context) that was omitted from the script text or added during production prep, so that all on-set props and unscripted visual elements can be cleared through the standard pipeline.

**Why this priority**: Film productions frequently introduce unscripted props, set dressing, background playback tracks, or product placements that do not appear in the written script text. Coordinators need to track and clear these items within the same unified workspace.

**Independent Test**: In the entity registry, click "Add Clearance Item", fill out name, category, and scene association, save, and verify that the newly created entity appears in the registry and can be researched and cleared.

**Acceptance Scenarios**:
1. **Given** an active project workspace, **When** the coordinator clicks "Add Clearance Item", inputs a canonical name, chooses one of the 5 categories (`BRAND`, `ART_MUSIC`, `PUBLIC_FIGURE`, `PROPRIETARY_LOCATION`, `GRAPHIC_PROP`), selects an associated scene, and provides context notes, **Then** a new canonical entity is created, displayed in the registry, and an `ITEM_ADDED` timeline event is emitted.
2. **Given** a manually created clearance item, **When** the coordinator initiates clearance evaluation, **Then** the system conducts grounded research and produces a risk assessment just like an automatically extracted item.

---

### User Story 3 - Remove Extracted Clearance Item (Priority: P3)

As a studio clearance coordinator, I want to remove false-positive or irrelevant extracted items from the project registry so that the clearance binder and active research queue remain clean and focused only on actual legal risks.

**Why this priority**: Common English words or non-proprietary generic objects (e.g., generic common nouns) may occasionally trigger semantic extraction. Coordinators must be able to delete these items to prevent clutter in the production dossier.

**Independent Test**: Select an unwanted item from the entity registry, click "Delete", confirm removal, and verify that the entity is removed from the registry, script viewer, research queues, and final exported clearance binder.

**Acceptance Scenarios**:
1. **Given** an entity in the project registry, **When** the coordinator deletes the item, **Then** the entity and its occurrences are removed from the workspace and database, and an `ITEM_REMOVED` timeline event is emitted.
2. **Given** an item that has been deleted, **When** a clearance binder is exported, **Then** the deleted item is excluded from the scene breakdown, entity summaries, and SHA-256 integrity digest computation.

---

### Edge Cases

- **Editing After Evaluation**: If an item that has already been evaluated for clearance is edited, previously cached automated assessments and citations are cleared, while counsel overrides remain preserved.
- **Duplicate Name Collisions**: If a coordinator edits or adds an item with a name matching an existing canonical entity in the project, the system validates and merges occurrences or flags duplicate creation cleanly.
- **Empty / Blank Name Validation**: The system MUST prevent saving an item with an empty or whitespace-only name.
- **Category Invariants**: Category selection MUST be strictly restricted to the 5 standard clearance categories (`BRAND`, `ART_MUSIC`, `PUBLIC_FIGURE`, `PROPRIETARY_LOCATION`, `GRAPHIC_PROP`).

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST allow clearance coordinators to edit the canonical name, clearance category, and scene context of any existing clearance item in a project prior to or following research.
- **FR-002**: The system MUST allow clearance coordinators to manually add new clearance items with a designated name, category, scene association, and context notes.
- **FR-003**: The system MUST allow clearance coordinators to delete existing clearance items, removing them permanently from the registry and final clearance binder.
- **FR-004**: User-edited entity properties MUST serve as the authoritative source of truth for subsequent live research, risk evaluation, replacement candidate generation, and counsel override workflows.
- **FR-005**: When an entity's canonical name or category is updated after previous clearance evaluation, the system MUST invalidate prior automated assessments and citations while strictly preserving any existing signed legal counsel overrides without mutation.
- **FR-006**: Deleted clearance items MUST be permanently excluded from subsequent research workflows, replacement generation, and compiled clearance binder exports.
- **FR-007**: The backend MUST emit structured `ITEM_ADDED`, `ITEM_EDITED`, and `ITEM_REMOVED` events to the Server-Sent Events (SSE) observable action timeline.
- **FR-008**: The system MUST enforce strict validation on all manual entity mutations (non-empty name, valid clearance category from the 5 supported categories).
- **FR-009**: The system MUST preserve all existing 003 invariants (scene-specific counsel override isolation, hierarchical effective status resolution, and SHA-256 binder integrity digests).
- **FR-010**: The system MUST preserve all existing 004 invariants (autonomous candidate self-clearance loop with $\le 3$ attempts, negative prompt constraints, counsel escalation, and 4-event SSE timeline taxonomy).
- **FR-011**: The system MUST preserve all existing 005 invariants (1-click bundled fictional demo screenplay, secret-masked health check endpoint, fail-visible `CLOUD_MODE`, and exclusively fictional examples in public documentation).

### Key Entities

- **Canonical Entity (Updated)**: Represents a distinct mark, work, person, location, or graphic prop within a project. Attributes include `id`, `projectId`, `canonicalName`, `entityCategory`, `occurrences` (scene associations, line numbers, usage excerpts), `manualOverrideStatus` (`AUTO_EXTRACTED`, `USER_EDITED`, `MANUALLY_ADDED`), `riskStatus`, `citations`, `replacementCard`, `counselOverrides`, `createdAt`, `updatedAt`.
- **Entity Mutation Request**: Payload defining manual additions or updates (`canonicalName`, `entityCategory`, `sceneId`, `usageContext`, `reason`).
- **Correction Timeline Event**: Observable timeline payloads for `ITEM_ADDED`, `ITEM_EDITED`, and `ITEM_REMOVED`.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Coordinators can edit an extracted item's name or category in under 3 clicks or $< 5\text{ seconds}$ from the registry table.
- **SC-002**: 100% of downstream research evaluations, replacement prompts, and counsel reviews use the user-edited name and category.
- **SC-003**: Invalidation of stale research on entity name/category modification completes synchronously in $< 50\text{ms}$ without altering counsel overrides.
- **SC-004**: Manually added items integrate seamlessly into 100% of workspace views (registry table, script viewer, binder export).
- **SC-005**: Real-time SSE timeline updates for `ITEM_ADDED`, `ITEM_EDITED`, and `ITEM_REMOVED` arrive in $< 100\text{ms}$.
- **SC-006**: Automated regression test suite maintains 100% pass rate across all existing 001–005 test suites.

---

## Assumptions

- Clearance coordinators have editorial authority to correct entity metadata prior to or alongside legal counsel review.
- The 5 clearance categories remain fixed per the project constitution.
- Editing an entity's name does not rewrite the raw original screenplay text file on disk, but updates the semantic clearance registry and inline script annotations.
