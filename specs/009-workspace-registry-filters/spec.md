# Feature Specification: Workspace Registry Multi-Dimension Filters

**Feature Branch**: `009-workspace-registry-filters`  
**Created**: 2026-08-18  
**Status**: Draft  
**Input**: User description: "Workspace Registry Filters: let a coordinator filter the entity registry by clearance status, category, and scene without changing stored data. Empty results show a clear empty state. Preserve 003 through 008 invariants. Do not add unrelated scope."

---

## User Scenarios & Testing

### User Story 1 - Multi-Dimension Entity Registry Filtering (Priority: P1) 🎯 MVP

As a studio clearance coordinator, when managing dozens of extracted and manual items in a screenplay, I want to filter the entity registry simultaneously by Clearance Status, Entity Category, and Scene so that I can focus directly on actionable risks (e.g., all `ACTION_REQUIRED` items in `Scene 2` or all `ART_MUSIC` items) without clutter or manual scrolling.

**Why this priority**: Fast, multi-dimensional filtering is the central day-to-day navigation tool for clearance coordinators prioritizing items requiring replacements, releases, or counsel reviews.

**Independent Test**: Ingest a multi-scene script, toggle status filter to `ACTION_REQUIRED`, category filter to `BRAND`, and scene filter to `Scene 1`; verify that the registry table updates immediately to display only matching entities, and shows `X of Y Entities Displayed`.

**Acceptance Scenarios**:
1. **Given** the entity registry table, **When** the user selects a Clearance Status filter (e.g., `ACTION_REQUIRED`), **Then** only entities matching that status are displayed.
2. **Given** the entity registry table, **When** the user selects an Entity Category filter (e.g., `BRAND`), **Then** only entities matching that category are displayed.
3. **Given** the entity registry table, **When** the user selects a Scene filter (e.g., `Scene 1`), **Then** only entities that occur in that scene are displayed.
4. **Given** multiple active filters (e.g., `BRAND` + `REVIEW_RECOMMENDED` + `Scene 2`), **When** applied, **Then** only entities matching all active filter dimensions are displayed (logical AND).

---

### User Story 2 - Empty Filter State & Quick Reset (Priority: P2)

As a studio clearance coordinator, when my active filter combination produces zero matching entities, I want to see a clear empty state explaining which filters are active and a one-click "Reset Filters" action so that I never get stuck with an empty table.

**Why this priority**: Prevents user confusion between an empty registry vs. a restrictive filter combination and provides instant recovery.

**Independent Test**: Apply a filter combination with 0 matches (e.g., `ART_MUSIC` + `NO_ISSUE_SURFACED` in `Scene 3`), verify that the descriptive empty state appears with the active filter parameters, click "Reset Filters", and verify that all entities reappear.

**Acceptance Scenarios**:
1. **Given** an active filter combination with 0 matches, **When** rendered, **Then** the table displays an empty state message indicating the active filter criteria (e.g., "No entities match the selected filters: Category: ART_MUSIC, Status: NO_ISSUE_SURFACED, Scene: Scene 3").
2. **Given** the empty filter state, **When** the user clicks "Clear Filters" / "Reset All Filters", **Then** all filter selectors reset to `ALL` and all project entities are displayed.

---

### User Story 3 - Read-Only Non-Destructive Filtering Invariant (Priority: P3)

As a studio legal counsel and compliance auditor, I want filtering to be strictly non-destructive and read-only so that filtering the registry never modifies stored canonical entities, scene occurrence mappings, or signed legal counsel overrides.

**Why this priority**: Legal and clearance integrity requires that filtering is purely a client-side view presentation transformation that never mutates server state.

**Independent Test**: Filter the registry by various combinations, perform counsel review, export the clearance binder, and verify that the exported binder contains all project entities and retains full SHA-256 cryptographic digest integrity regardless of active UI filter state.

**Acceptance Scenarios**:
1. **Given** active filters in the UI workspace, **When** filtering items, **Then** zero HTTP mutation requests (POST/PATCH/DELETE) are sent to the backend.
2. **Given** active filters in the UI workspace, **When** exporting the clearance binder, **Then** the binder includes all canonical project entities and scenes in full without filter truncation.

---

### Edge Cases

- **Scene Selection Sync**: Selecting a scene in the `ScriptViewer` component automatically updates or pre-selects the Scene filter in the `EntityRegistryTable` (or allows quick isolation to that scene).
- **All Filters Reset**: Setting Status to `ALL`, Category to `ALL`, and Scene to `ALL` displays all entities without any filtering.
- **Empty Project**: In an unparsed project with 0 entities, the empty state displays "No canonical entities registered. Parse a script or click '➕ Add Item' to populate the registry." (not the filtered empty state).

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST allow filtering the canonical entity registry by Clearance Status (`ALL`, `NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`, `INSUFFICIENT_EVIDENCE`).
- **FR-002**: The system MUST allow filtering the canonical entity registry by Entity Category (`ALL`, `BRAND`, `ART_MUSIC`, `PUBLIC_FIGURE`, `PROPRIETARY_LOCATION`, `GRAPHIC_PROP`).
- **FR-003**: The system MUST allow filtering the canonical entity registry by Scene (`ALL SCENES` or specific scenes extracted from the screenplay).
- **FR-004**: When multiple filters are active, the system MUST compute the intersection (logical AND) across all selected filter dimensions.
- **FR-005**: The system MUST display an informative count badge showing the number of filtered entities vs. total entities (e.g. `X of Y Entities Displayed`).
- **FR-006**: When no entities match the selected filter combination, the system MUST display a clear empty state naming the active filter parameters and providing a "Clear Filters" button.
- **FR-007**: Filtering MUST be strictly non-destructive and read-only, executing entirely on client state without mutating stored entities, occurrences, assessments, or counsel overrides.
- **FR-008**: Exporting the clearance binder MUST always include all project entities regardless of the client-side active filter selection.
- **FR-009**: The system MUST preserve all 003 invariants (scene-specific counsel override isolation, hierarchical status resolution, and SHA-256 binder integrity digests).
- **FR-010**: The system MUST preserve all 004 invariants (autonomous candidate self-clearance loop ceiling $\le 3$, negative constraints, and 4-event SSE timeline).
- **FR-011**: The system MUST preserve all 005 invariants (bundled fictional demo screenplay, secret-masked health API, fail-visible `CLOUD_MODE`).
- **FR-012**: The system MUST preserve all 006 invariants (manual clearance item addition, editing with assessment invalidation, and clean deletion).
- **FR-013**: The system MUST preserve all 007 invariants (single-item failed research retry with eligibility gating and sibling isolation).
- **FR-014**: The system MUST preserve all 008 invariants (side-by-side original and replacement comparison modal and binder print view).

### Key Entities

- **Filter State**: `{ status: string; category: string; sceneId: string }` applied dynamically against `CanonicalEntityData[]` and scene occurrence mappings.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Filtering transitions and table re-renders occur in $< 16\text{ms}$ (60 FPS) without server round-trips.
- **SC-002**: 100% of filter combinations (Status $\times$ Category $\times$ Scene) accurately filter the table with 0 incorrect exclusions.
- **SC-003**: 100% of zero-match filter combinations display the descriptive empty state with working "Clear Filters" button.
- **SC-004**: Automated regression test suite maintains 100% pass rate across all existing 001–008 test suites.

---

## Assumptions

- Entity occurrence mappings link canonical entities to scene IDs.
- Coordinators can reset or toggle filters with single-click actions.
- Binder export continues to receive complete project entity data from `GET /api/projects/:id/binder/export`.
