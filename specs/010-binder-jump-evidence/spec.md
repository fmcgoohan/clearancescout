# Feature Specification: Binder Jump to Evidence & Timeline Context

**Feature Branch**: `010-binder-jump-evidence`  
**Created**: 2026-08-18  
**Status**: Draft  
**Input**: User description: "Binder Jump to Evidence: from the clearance binder preview, let a coordinator click an entity or replacement and open the matching citation drawer and timeline context. The jump is read-only and must not mutate stored data. Preserve 003 through 009 invariants. Do not add unrelated scope."

---

## User Scenarios & Testing

### User Story 1 - Interactive Evidence & Citation Inspection from Binder Preview (Priority: P1) 🎯 MVP

As a studio legal counsel or clearance coordinator, when reviewing the compiled production clearance binder preview, I want to click on any canonical entity or accepted/escalated fictional replacement and immediately inspect its grounded research citations and legal assessment rationale in a focused drawer so that I can verify source provenance without losing my place or manually searching for the item in the workspace.

**Why this priority**: Fast auditability directly from the production binder preview bridges the gap between executive summary clearance reports and underlying legal evidentiary citations.

**Independent Test**: Open the binder export modal, click on a flagged entity (e.g. `Summit Cola`), and verify that the citation/evidence drawer opens displaying that entity's grounded citations, risk rationale, and provenance badges.

**Acceptance Scenarios**:
1. **Given** the clearance binder preview modal, **When** the user clicks on an entity row or its "🔍 View Evidence" action, **Then** the evidence drawer opens showing the entity's grounded research citations, risk score, and legal rationale.
2. **Given** the clearance binder preview modal, **When** the user clicks on a fictional replacement card or its evidence action, **Then** the evidence drawer opens showing the replacement's design brief, non-infringement rationale, and candidate clearance citations.
3. **Given** the evidence drawer opened from the binder, **When** closed, **Then** the user returns directly to the clearance binder preview at their previous scroll position.

---

### User Story 2 - Observable Action Timeline Context Focus (Priority: P2)

As a studio clearance coordinator or compliance auditor, when inspecting an entity or replacement from the binder preview, I want to view its timeline execution context (research queries, replacement attempts, overrides, and state transitions) in the observable action timeline drawer so that I have a complete chronological audit trail of how the clearance decision was made.

**Why this priority**: Compliance auditors require verifiable event logs tracing AI tool calls, math calculations, and counsel overrides leading to clearance verdicts.

**Independent Test**: Click "📜 View Timeline" on an entity in the binder preview; verify that the timeline drawer opens filtered/focused on events associated with that entity (or highlights matching events) without displaying raw model chain-of-thought.

**Acceptance Scenarios**:
1. **Given** an entity or replacement in the binder preview, **When** the user clicks "📜 View Timeline", **Then** the timeline drawer opens displaying all associated observable events (e.g. `CLEARANCE_EVALUATED`, `REPLACEMENT_ATTEMPT`, `COUNSEL_OVERRIDE_RECORDED`).
2. **Given** timeline events displayed for the jumped entity, **When** rendered, **Then** zero raw model chain-of-thought is logged or displayed (only observable tool calls, queries, math outputs, and verdicts).

---

### User Story 3 - Read-Only Non-Destructive Invariant (Priority: P3)

As a studio legal counsel, I want the binder jump-to-evidence interaction to be strictly read-only and non-destructive so that jumping to citations or timeline events never mutates stored entity records, assessments, counsel overrides, or the binder's SHA-256 cryptographic digest.

**Why this priority**: Evidentiary previewing must never invalidate signed counsel decisions or alter legal binder export hashes.

**Independent Test**: Jump to evidence and timeline for multiple entities from the binder, perform citations reviews, close the drawer, and verify that the binder's SHA-256 digest remains identical and zero mutation requests were made to the server.

**Acceptance Scenarios**:
1. **Given** jump-to-evidence interactions in the binder preview, **When** executed, **Then** zero HTTP mutation requests (POST/PATCH/DELETE) are issued to the backend.
2. **Given** jump-to-evidence interactions in the binder preview, **When** closed, **Then** the binder's SHA-256 digest, signed overrides, and entity records remain 100% unaltered.

---

### Edge Cases

- **Entity with No Research Completed**: For an item with status `INSUFFICIENT_EVIDENCE` that has not yet been grounded, clicking view evidence displays a message: "Clearance research has not yet been executed for this item. Click '🔍 Ground' in the workspace registry to research."
- **Replacement Card with Escalation**: For an escalated replacement card, the jumped evidence view displays the full candidate attempt history and the counsel review requirement banner.
- **Binder Modal State Retention**: Opening and closing the evidence drawer does not re-fetch or re-compile the binder dossier unnecessarily.

---

## Requirements

### Functional Requirements

- **FR-001**: The clearance binder preview MUST provide clickable jump actions ("🔍 View Evidence" / "📜 View Timeline") on every canonical entity and replacement item.
- **FR-002**: Clicking "🔍 View Evidence" on a canonical entity MUST open the citation/evidence drawer populated with that entity's grounded research citations, risk score, and legal rationale.
- **FR-003**: Clicking "🔍 View Evidence" on a fictional replacement card MUST open the citation/evidence view populated with the replacement's candidate clearance citations, era aesthetic, and candidate attempt history.
- **FR-004**: Clicking "📜 View Timeline" MUST open the observable action timeline drawer filtered or scrolled to events associated with the target entity or replacement.
- **FR-005**: The timeline drawer MUST display strictly observable execution events (tool calls, search queries, math evaluations, overrides) and MUST NOT display or store raw model chain-of-thought.
- **FR-006**: The jump action MUST be strictly read-only and non-destructive, performing zero modifications to database entities, occurrences, assessments, or counsel overrides.
- **FR-007**: The jump action MUST NOT alter or invalidate the clearance binder's SHA-256 cryptographic integrity digest.
- **FR-008**: The system MUST preserve all 003 invariants (scene-specific counsel override isolation, hierarchical status resolution, and SHA-256 binder integrity digests).
- **FR-009**: The system MUST preserve all 004 invariants (autonomous candidate self-clearance loop ceiling $\le 3$, negative constraints, and 4-event SSE timeline).
- **FR-010**: The system MUST preserve all 005 invariants (bundled fictional demo screenplay, secret-masked health API, fail-visible `CLOUD_MODE`).
- **FR-011**: The system MUST preserve all 006 invariants (manual clearance item addition, editing with assessment invalidation, and clean deletion).
- **FR-012**: The system MUST preserve all 007 invariants (single-item failed research retry with eligibility gating and sibling isolation).
- **FR-013**: The system MUST preserve all 008 invariants (side-by-side original and replacement comparison modal and binder print view).
- **FR-014**: The system MUST preserve all 009 invariants (multi-dimension workspace registry filters across Status, Category, and Scene with empty recovery).

### Key Entities

- **BinderJumpTarget**: `{ entityId: string; mode: 'EVIDENCE' | 'TIMELINE'; entityName: string; replacementCard?: any; citations?: ClearanceCitation[]; assessment?: any }`

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Clicking a jump action in the binder preview transitions to the citation or timeline view in $< 50\text{ms}$.
- **SC-002**: 100% of canonical entities and replacement cards in the binder preview have functional evidence jump triggers.
- **SC-003**: 100% of jumped evidence views accurately render authentic grounded research citations and provenance badges (`PARALLEL_LIVE`, `DEMO_FIXTURE`, `FALLBACK_FIXTURE`).
- **SC-004**: Zero mutation requests are sent to the server during jump-to-evidence navigation; binder SHA-256 digests remain 100% constant.
- **SC-005**: Automated regression test suite maintains 100% pass rate across all existing 001–009 test suites.

---

## Assumptions

- Clearance binder data loaded via `GET /api/projects/:id/binder/export` contains entity IDs, assessments, replacement cards, and citation arrays.
- Timeline events can be filtered or navigated by entity ID in `TimelineDrawer.tsx`.
