# Feature Specification: Binder Jump to Evidence & Timeline Context

**Feature Branch**: `010-binder-jump-evidence`  
**Created**: 2026-08-18  
**Status**: Clarified  
**Input**: User description: "Binder Jump to Evidence: from the clearance binder preview, let a coordinator click an entity or replacement and open the matching citation drawer and timeline context. The jump is read-only and must not mutate stored data. Preserve 003 through 009 invariants. Do not add unrelated scope."

---

## Clarifications

### Session 2026-08-18
- Q: What actions are provided on binder preview items for inspecting supporting records? → A: Binder preview items have View Evidence and View Timeline actions.
- Q: What component opens when triggering the View Evidence action? → A: Evidence opens the existing citation drawer for that entity.
- Q: What events are displayed when jumping to the Timeline and what is the visibility constraint? → A: Timeline focuses existing events for that entity and never shows chain-of-thought.
- Q: Does jumping to evidence/timeline alter the exported binder's integrity or database records? → A: The jump is read-only and does not change the binder digest.
- Q: What is displayed if an item has not completed clearance research or lacks citations? → A: Missing citations show an explicit empty evidence state.

---

## User Scenarios & Testing

### User Story 1 - Interactive Evidence & Citation Inspection from Binder Preview (Priority: P1) 🎯 MVP

As a studio legal counsel or clearance coordinator, when reviewing the compiled production clearance binder preview, I want to click "🔍 View Evidence" on any canonical entity or fictional replacement and immediately open the citation drawer for that entity so that I can inspect grounded research sources and legal rationales without losing my place.

**Why this priority**: Fast auditability directly from the production binder preview bridges executive summary clearance reports and underlying legal evidentiary citations.

**Independent Test**: Open the binder export modal, click "🔍 View Evidence" on a flagged entity (e.g. `Summit Cola`), and verify that the citation drawer opens populated with that entity's grounded citations, risk rationale, and provenance badges.

**Acceptance Scenarios**:
1. **Given** the clearance binder preview modal, **When** the user clicks "🔍 View Evidence" on an entity row, **Then** the existing citation drawer opens showing the entity's grounded research citations, risk score, and legal rationale.
2. **Given** the clearance binder preview modal, **When** the user clicks "🔍 View Evidence" on a fictional replacement card, **Then** the citation drawer opens showing the replacement's candidate clearance citations, era aesthetic, and candidate attempt history.
3. **Given** an entity that has not yet completed clearance research or lacks citations, **When** the user clicks "🔍 View Evidence", **Then** the drawer renders an explicit empty evidence state ("No grounded citations recorded for this item. Evaluate clearance in the workspace registry to populate research.").
4. **Given** the citation drawer opened from the binder preview, **When** closed, **Then** the user returns directly to the clearance binder preview at their previous scroll position.

---

### User Story 2 - Observable Action Timeline Context Focus (Priority: P2)

As a studio clearance coordinator or compliance auditor, when inspecting an entity or replacement from the binder preview, I want to click "📜 View Timeline" and view its timeline execution context focused on events for that entity in the timeline drawer without ever displaying raw model chain-of-thought.

**Why this priority**: Compliance auditors require verifiable event logs tracing AI tool calls, math calculations, and counsel overrides leading to clearance verdicts.

**Independent Test**: Click "📜 View Timeline" on an entity in the binder preview; verify that the timeline drawer opens focused on events for that entity without displaying raw model chain-of-thought.

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

- **Missing Citations Empty State**: If an entity has status `INSUFFICIENT_EVIDENCE` or has no research citations, the evidence drawer displays: "No grounded research citations surfaced for this entity. Click '🔍 Ground' in the workspace to evaluate."
- **Replacement Card with Escalation**: For an escalated replacement card, the jumped evidence view displays the full candidate attempt history and the counsel review requirement banner.
- **Binder Modal State Retention**: Opening and closing the evidence drawer does not re-fetch or re-compile the binder dossier unnecessarily.

---

## Requirements

### Functional Requirements

- **FR-001**: The clearance binder preview MUST provide clickable "🔍 View Evidence" and "📜 View Timeline" action buttons for every canonical entity and replacement item.
- **FR-002**: Clicking "🔍 View Evidence" on a canonical entity MUST open the existing citation drawer populated with that entity's grounded research citations, risk score, and legal rationale.
- **FR-003**: Clicking "🔍 View Evidence" on a fictional replacement card MUST open the citation drawer populated with the replacement's candidate clearance citations, era aesthetic, and candidate attempt history.
- **FR-004**: Clicking "🔍 View Evidence" on an item lacking research citations MUST render an explicit empty evidence state explaining that no citations have been surfaced yet.
- **FR-005**: Clicking "📜 View Timeline" MUST open the observable action timeline drawer focused on events associated with the target entity or replacement.
- **FR-006**: The timeline drawer MUST display strictly observable execution events (tool calls, search queries, math evaluations, overrides) and MUST NOT display or store raw model chain-of-thought.
- **FR-007**: The jump action MUST be strictly read-only and non-destructive, performing zero modifications to database entities, occurrences, assessments, or counsel overrides.
- **FR-008**: The jump action MUST NOT alter or invalidate the clearance binder's SHA-256 cryptographic integrity digest.
- **FR-009**: The system MUST preserve all 003 invariants (scene-specific counsel override isolation, hierarchical status resolution, and SHA-256 binder integrity digests).
- **FR-010**: The system MUST preserve all 004 invariants (autonomous candidate self-clearance loop ceiling $\le 3$, negative constraints, and 4-event SSE timeline).
- **FR-011**: The system MUST preserve all 005 invariants (bundled fictional demo screenplay, secret-masked health API, fail-visible `CLOUD_MODE`).
- **FR-012**: The system MUST preserve all 006 invariants (manual clearance item addition, editing with assessment invalidation, and clean deletion).
- **FR-013**: The system MUST preserve all 007 invariants (single-item failed research retry with eligibility gating and sibling isolation).
- **FR-014**: The system MUST preserve all 008 invariants (side-by-side original and replacement comparison modal and binder print view).
- **FR-015**: The system MUST preserve all 009 invariants (multi-dimension workspace registry filters across Status, Category, and Scene with empty recovery).

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
