# Feature Specification: Multi-Item Clearance Research Progress & Concurrency Control

**Feature Branch**: `011-multi-item-research-progress`  
**Created**: 2026-08-18  
**Status**: Clarified  
**Input**: User description: "Multi-Item Research Progress: when a coordinator researches several items, show per-item progress, keep a small concurrency limit, and never silently skip completed work. Failures stay fail-visible. Preserve 003 through 010 invariants. Do not add unrelated scope."

---

## Clarifications

### Session 2026-08-18
- Q: Which items are eligible when triggering "Research All Pending"? → A: Research All Pending runs only INSUFFICIENT_EVIDENCE or unresearched items.
- Q: What is the maximum concurrency limit for batch clearance research? → A: Concurrency limit is 2.
- Q: When are results persisted and reflected in the workspace registry table? → A: Each item persists as it finishes and updates the table immediately.
- Q: How are individual item failures handled during batch processing? → A: One item failure does not cancel the batch and stays fail-visible.
- Q: How does batch research interact with signed legal counsel decisions? → A: Counsel overrides are never overwritten.

---

## User Scenarios & Testing

### User Story 1 - Batch Research Execution with Per-Item Progress Tracking (Priority: P1) 🎯 MVP

As a clearance coordinator reviewing a newly ingested screenplay with multiple un-researched entities, I want to click "🔍 Research All Pending" and see explicit per-item progress indicators (`QUEUED`, `RESEARCHING`, `COMPLETED`, `FAILED`) and live incremental table updates as each item completes so that I have immediate clarity on evaluation progress.

**Why this priority**: Coordinators need transparent, granular feedback during multi-item batch research rather than an opaque indeterminate spinner.

**Independent Test**: Ingest a script with 4 unresearched entities, click "🔍 Research All Pending", and verify that each entity row displays real-time badges transitioning from `QUEUED` to `RESEARCHING` to `COMPLETED` while the table updates immediately after each item finishes.

**Acceptance Scenarios**:
1. **Given** a workspace with unresearched entities (or status `INSUFFICIENT_EVIDENCE`), **When** the user clicks "🔍 Research All Pending", **Then** the batch queue initializes targeting only eligible items.
2. **Given** active multi-item research, **When** an individual item finishes evaluation, **Then** its entity row in the registry immediately updates with its resolved clearance status badge and citations without waiting for the rest of the batch.
3. **Given** an active batch, **When** all items complete, **Then** the batch progress banner displays completion metrics (e.g., "4 of 4 items evaluated").

---

### User Story 2 - Strict Concurrency Limiting (Pool Size = 2) & Zero Work Dropping (Priority: P2)

As a studio legal coordinator, I want multi-item research to execute with a strict concurrency limit of 2 parallel item evaluations so that external search APIs are not choked and no completed evaluations or grounded citations are silently lost or skipped.

**Why this priority**: Unbounded concurrency causes rate-limit bursts, browser thread blocking, and dropped responses. Strict pool sizing guarantees reliable persistence.

**Independent Test**: Queue 5 entities for batch research; verify that at most 2 items execute concurrently at any timestamp while remaining items wait in queue, and verify 100% of completed evaluations are persisted to the database.

**Acceptance Scenarios**:
1. **Given** a batch of $N$ entities queued for clearance research, **When** the evaluation queue runs, **Then** no more than 2 items are evaluated concurrently at any moment.
2. **Given** items completing in the evaluation queue, **When** persisted, **Then** zero assessments or citations are dropped, overwritten, or skipped.

---

### User Story 3 - Fail-Visible Error Isolation & Override Protection (Priority: P3)

As a clearance coordinator, when an individual item's research encounters an error or network timeout during a batch evaluation, I want the failure to stay visibly flagged (`INSUFFICIENT_EVIDENCE` / Failed state) on that specific item without aborting the rest of the batch queue, and I want existing counsel overrides to remain 100% untouched.

**Why this priority**: Fault isolation prevents one transient search error from failing an entire screenplay's clearance workflow.

**Independent Test**: Trigger a batch where one item fails; verify the failed item displays a fail-visible badge and retry button while the remaining items continue processing to completion, and verify pre-existing counsel overrides are preserved.

**Acceptance Scenarios**:
1. **Given** a batch queue where item $X$ fails, **When** error occurs, **Then** item $X$ transitions to a fail-visible error state with clearance status `INSUFFICIENT_EVIDENCE`.
2. **Given** item $X$ failing in a batch queue, **When** the failure occurs, **Then** subsequent items in the queue continue processing to completion.
3. **Given** entities with pre-existing authoritative counsel overrides, **When** batch research completes, **Then** the signed overrides and rationales remain 100% intact.

---

### Edge Cases

- **No Eligible Items**: If all items already have completed clearance evaluations (statuses other than `INSUFFICIENT_EVIDENCE`), clicking "Research All Pending" displays: "All entities already have completed clearance evaluations."
- **User Filters or Searches During Batch**: Live per-item progress badges remain rendered in filtered views and the top progress bar stays fixed.
- **Single-Item Retry During Active Batch**: Single-item retry buttons are disabled while that specific item is in the active batch queue to prevent race conditions.

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide a "🔍 Research All Pending" action button in the workspace registry toolbar.
- **FR-002**: "Research All Pending" MUST filter and queue ONLY entities with status `INSUFFICIENT_EVIDENCE` or un-evaluated status.
- **FR-003**: The UI MUST display real-time per-item status indicators (`QUEUED`, `RESEARCHING`, `COMPLETED`, `FAILED`) for each entity in an active batch.
- **FR-004**: The UI MUST display an aggregated batch progress banner indicating total items, processed count, active concurrency, and completion percentage.
- **FR-005**: Multi-item research MUST execute with a strict bounded concurrency pool of at most 2 parallel item evaluations.
- **FR-006**: Every completed item evaluation MUST be immediately persisted and updated in the registry table without silently skipping or dropping results.
- **FR-007**: Item evaluation errors MUST be fail-visible: failing items transition to `INSUFFICIENT_EVIDENCE` with an error badge and MUST NOT abort or cancel remaining queued items.
- **FR-008**: Multi-item research MUST preserve all pre-existing authoritative counsel overrides without clearing signed verdicts.
- **FR-009**: The system MUST preserve all 003 invariants (scene-specific counsel override isolation, hierarchical status resolution, and SHA-256 binder integrity digests).
- **FR-010**: The system MUST preserve all 004 invariants (autonomous candidate self-clearance loop ceiling $\le 3$, negative constraints, and 4-event SSE timeline).
- **FR-011**: The system MUST preserve all 005 invariants (bundled fictional demo screenplay, secret-masked health API, fail-visible `CLOUD_MODE`).
- **FR-012**: The system MUST preserve all 006 invariants (manual clearance item addition, editing with assessment invalidation, and clean deletion).
- **FR-013**: The system MUST preserve all 007 invariants (single-item failed research retry with eligibility gating and sibling isolation).
- **FR-014**: The system MUST preserve all 008 invariants (side-by-side original and replacement comparison modal and binder print view).
- **FR-015**: The system MUST preserve all 009 invariants (multi-dimension workspace registry filters across Status, Category, and Scene with empty recovery).
- **FR-016**: The system MUST preserve all 010 invariants (read-only binder jump to evidence citation drawer and observable action timeline context).

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
- **SC-002**: Active parallel research requests never exceed the concurrency limit of 2 items simultaneously.
- **SC-003**: 100% of completed evaluations in a batch are persisted and immediately rendered in the registry table without data loss or silent skips.
- **SC-004**: Single-item evaluation failures do not abort remaining queued items (0% queue collateral drop).
- **SC-005**: Automated regression test suite maintains 100% pass rate across all existing 001–010 test suites.

---

## Assumptions

- Clearance evaluations use the existing `POST /api/projects/:id/clearance/evaluate` endpoint.
- Concurrency limiting is managed cleanly via a client-side queue worker pool with a maximum concurrency of 2.
