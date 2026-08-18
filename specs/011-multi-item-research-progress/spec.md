# Feature Specification: Multi-Item Clearance Research Progress & Concurrency Control

**Feature Branch**: `011-multi-item-research-progress`  
**Created**: 2026-08-18  
**Status**: Draft  
**Input**: User description: "Multi-Item Research Progress: when a coordinator researches several items, show per-item progress, keep a small concurrency limit, and never silently skip completed work. Failures stay fail-visible. Preserve 003 through 010 invariants. Do not add unrelated scope."

---

## User Scenarios & Testing

### User Story 1 - Batch Research Execution with Per-Item Progress Tracking (Priority: P1) 🎯 MVP

As a clearance coordinator reviewing a newly ingested screenplay with multiple flagged entities, I want to initiate clearance research across multiple items (or all pending items) and see explicit per-item progress indicators (e.g., Queued, Researching, Completed, Failed) so that I know exactly which items are being evaluated and when results become available.

**Why this priority**: Coordinators need transparent, granular feedback during multi-item batch research rather than an opaque indeterminate spinner.

**Independent Test**: Trigger clearance research on multiple items; verify each entity row reflects its individual state transition from `QUEUED` to `RESEARCHING` to `COMPLETED` with dynamic progress metrics (e.g., "Evaluating item 2 of 5").

**Acceptance Scenarios**:
1. **Given** a screenplay with multiple un-researched entities, **When** the user clicks "🔍 Research All Items" (or triggers a multi-item batch), **Then** a batch progress bar and individual status indicators for each item are displayed.
2. **Given** active multi-item research, **When** an item finishes evaluation, **Then** its entity row in the registry immediately updates with its resolved clearance status badge and grounded citations count without waiting for the entire batch to complete.
3. **Given** multi-item research execution, **When** all items complete, **Then** the batch progress indicator summarizes total completed items and overall completion status.

---

### User Story 2 - Bounded Concurrency & Zero Work Dropping (Priority: P2)

As a studio legal coordinator, I want multi-item research to execute with a controlled concurrency limit (maximum 2 to 3 concurrent item evaluations) so that external search APIs are not choked and no completed evaluations or grounded citations are silently lost or overwritten.

**Why this priority**: Unbounded concurrency causes rate-limit bursts, browser thread blocking, and dropped responses. Controlled pooling guarantees reliable persistence.

**Independent Test**: Queue 6 entities for batch research; verify that at most 2–3 items execute concurrently in the network/event timeline while the remaining items wait in a managed queue, and verify 100% of completed evaluations are persisted to the database.

**Acceptance Scenarios**:
1. **Given** a batch of $N$ entities queued for clearance research, **When** the evaluation queue starts, **Then** no more than 2 items are researched concurrently at any moment.
2. **Given** items completing in the evaluation queue, **When** persisted, **Then** zero assessments or citations are dropped, overwritten, or skipped.

---

### User Story 3 - Fail-Visible Error Isolation (Priority: P3)

As a clearance coordinator, when an individual item's research encounters an error or network timeout during a batch evaluation, I want the failure to stay visibly flagged (`INSUFFICIENT_EVIDENCE` / Failed state) on that specific item without aborting or corrupting the remainder of the batch queue.

**Why this priority**: Fault isolation prevents one transient search error from failing an entire screenplay's clearance workflow.

**Independent Test**: Trigger a batch where one item fails; verify the failed item displays a fail-visible badge and retry button while the remaining items in the queue continue processing and complete successfully.

**Acceptance Scenarios**:
1. **Given** a batch queue where item $X$ fails, **When** error occurs, **Then** item $X$ transitions to a fail-visible error state with clearance status `INSUFFICIENT_EVIDENCE`.
2. **Given** item $X$ failing in a batch queue, **When** the failure occurs, **Then** subsequent items in the queue continue processing to completion.

---

### Edge Cases

- **User Navigates or Filters During Batch Research**: Filtered registry views continue displaying live per-item badges and the global batch progress header remains visible.
- **Empty Batch Trigger**: If all items already have completed evaluations, clicking "Research All" displays a notice: "All entities already have completed clearance evaluations."
- **Signed Override Protection**: Pre-existing signed counsel overrides are never overwritten or cleared during multi-item batch research evaluations.

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide a multi-item research trigger ("🔍 Research All Pending" / batch selection) in the workspace registry toolbar.
- **FR-002**: The UI MUST display real-time per-item progress indicators (`QUEUED`, `RESEARCHING`, `COMPLETED`, `FAILED`) for each entity in an active batch.
- **FR-003**: The UI MUST display an aggregated batch progress banner indicating total items, processed count, active concurrency, and completion percentage.
- **FR-004**: Multi-item research MUST execute with a bounded concurrency pool of at most 2 to 3 concurrent item evaluations.
- **FR-005**: Every completed item evaluation MUST be immediately persisted and reflected in the workspace registry table without silently skipping or dropping results.
- **FR-006**: Item evaluation errors MUST be fail-visible: failing items transition to `INSUFFICIENT_EVIDENCE` with an error badge and do NOT abort remaining queued items.
- **FR-007**: Multi-item research MUST preserve all pre-existing authoritative counsel overrides without clearing signed verdicts.
- **FR-008**: The system MUST preserve all 003 invariants (scene-specific counsel override isolation, hierarchical status resolution, and SHA-256 binder integrity digests).
- **FR-009**: The system MUST preserve all 004 invariants (autonomous candidate self-clearance loop ceiling $\le 3$, negative constraints, and 4-event SSE timeline).
- **FR-010**: The system MUST preserve all 005 invariants (bundled fictional demo screenplay, secret-masked health API, fail-visible `CLOUD_MODE`).
- **FR-011**: The system MUST preserve all 006 invariants (manual clearance item addition, editing with assessment invalidation, and clean deletion).
- **FR-012**: The system MUST preserve all 007 invariants (single-item failed research retry with eligibility gating and sibling isolation).
- **FR-013**: The system MUST preserve all 008 invariants (side-by-side original and replacement comparison modal and binder print view).
- **FR-014**: The system MUST preserve all 009 invariants (multi-dimension workspace registry filters across Status, Category, and Scene with empty recovery).
- **FR-015**: The system MUST preserve all 010 invariants (read-only binder jump to evidence citation drawer and observable action timeline context).

### Key Entities

- **BatchResearchState**:
  ```typescript
  export interface BatchResearchItem {
    entityId: string;
    entityName: string;
    status: 'QUEUED' | 'RESEARCHING' | 'COMPLETED' | 'FAILED';
    error?: string;
  }

  export interface BatchResearchProgress {
    isActive: boolean;
    total: number;
    completed: number;
    failed: number;
    activeCount: number;
    items: Record<string, BatchResearchItem>;
  }
  ```

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of items in a multi-item batch display accurate real-time status transitions (`QUEUED` $\to$ `RESEARCHING` $\to$ `COMPLETED` / `FAILED`).
- **SC-002**: Active parallel research requests never exceed the concurrency limit of 3 items simultaneously.
- **SC-003**: 100% of completed evaluations in a batch are persisted without data loss or silent skips.
- **SC-004**: Single-item evaluation failures do not abort remaining queued items (0% queue collateral drop).
- **SC-005**: Automated regression test suite maintains 100% pass rate across all existing 001–010 test suites.

---

## Assumptions

- Clearance evaluations use the existing `POST /api/projects/:id/clearance/evaluate` endpoint.
- Concurrency limiting is orchestrated cleanly via a client-side promise pool queue with SSE timeline event reflection.
