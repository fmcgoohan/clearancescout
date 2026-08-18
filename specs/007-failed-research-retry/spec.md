# Feature Specification: Failed Research Retry

**Feature Branch**: `007-failed-research-retry`  
**Created**: 2026-08-18  
**Status**: Clarified  
**Input**: User description: "Failed Research Retry: let a coordinator retry a failed or insufficient-evidence research run for one item without duplicating completed work and without fabricating citations. Retry must emit timeline events and remain fail-visible in CLOUD_MODE. Preserve 003 through 006 invariants. Do not add unrelated scope."

---

## Clarifications

### Session 2026-08-18
- Q: What is the granularity and trigger scope of research retries? → A: Retry is per-item only and never re-runs completed sibling items.
- Q: Which entity clearance statuses are eligible for research retries? → A: Retry is allowed only for `INSUFFICIENT_EVIDENCE` or provider-failed research.
- Q: How are errors and missing keys handled during retry in CLOUD_MODE? → A: `CLOUD_MODE` retry failures stay fail-visible and never invent citations or silently use fixtures.
- Q: How does retrying interact with active legal counsel overrides? → A: Retry updates underlying research assessments but never mutates or erases counsel overrides.
- Q: Which observable timeline events must be emitted upon retry execution? → A: Emit `RESEARCH_RETRY_STARTED` plus existing research timeline events (`TOOL_CALL`, `CITATION_ADDED`, `RISK_EVAL`).

---

## User Scenarios & Testing

### User Story 1 - Single-Item Research Retry (Priority: P1) 🎯 MVP

As a studio clearance coordinator, when an entity has a status of `INSUFFICIENT_EVIDENCE` or experienced a research evaluation failure (e.g., due to transient network issues, search provider rate limits, or pre-configured ungrounded entities), I want to trigger a targeted retry for that specific entity so that I can obtain grounded clearance citations without re-running the entire project's research queue.

**Why this priority**: Screenplays often contain dozens of clearance items. If one entity encounters an `INSUFFICIENT_EVIDENCE` verdict or network glitch during initial batch processing, coordinators must be able to re-query that single item efficiently without invalidating, re-executing, or paying API costs for already-cleared entities.

**Independent Test**: Ingest a script, select an entity with `INSUFFICIENT_EVIDENCE` status, click "Retry Research", and verify that a targeted search executes for only that entity, updates its risk status and citations, and leaves all other project entity assessments completely unchanged.

**Acceptance Scenarios**:
1. **Given** an entity with `INSUFFICIENT_EVIDENCE` or ungrounded status in the entity registry, **When** the coordinator clicks "Retry Research" (or "Re-Ground") on that entity row, **Then** the backend executes the clearance research pipeline strictly for that single entity.
2. **Given** an entity whose research retry succeeds, **When** the evaluation completes, **Then** the entity's status transitions to its newly evaluated status (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, or `ACTION_REQUIRED`), retaining authentic research citations.
3. **Given** a multi-entity project where several entities have already been evaluated, **When** a single-item retry is executed, **Then** no other entity records, citations, or replacement cards in the project are touched or re-queried.
4. **Given** an entity with an already-cleared status (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, or `ACTION_REQUIRED`), **When** viewed in the registry table, **Then** the retry action is not shown as a failed-research prompt (retry is gated exclusively to `INSUFFICIENT_EVIDENCE` and failed evaluations).

---

### User Story 2 - Observable Action Timeline for Research Retry (Priority: P2)

As a studio clearance coordinator, when I initiate a research retry on an item, I want real-time visibility into the retry attempt on the observable action timeline drawer so that I can verify live search queries and citation retention without viewing raw internal chain-of-thought.

**Why this priority**: Coordinators need immediate feedback that the retry query is actively dispatching to external search tools and processing real citations.

**Independent Test**: Trigger a research retry and verify that `RESEARCH_RETRY_STARTED`, `TOOL_CALL`, `CITATION_ADDED`, and `RISK_EVAL` events stream into the slide-out timeline drawer with appropriate badges in real time.

**Acceptance Scenarios**:
1. **Given** an active workspace with an open SSE connection, **When** a research retry is triggered, **Then** a `RESEARCH_RETRY_STARTED` event is emitted containing the entity ID, canonical name, and retry timestamp.
2. **Given** a retry in progress, **When** search results and risk determinations resolve, **Then** standard `TOOL_CALL`, `CITATION_ADDED`, and `RISK_EVAL` events are emitted and displayed in the timeline drawer.

---

### User Story 3 - Fail-Visible Cloud Mode & Anti-Fabrication Invariant (Priority: P3)

As a studio legal counsel and compliance auditor, when a research retry executes in `CLOUD_MODE` and external search provider credentials are missing or the API encounters an outage, I want the system to fail visibly and retain `INSUFFICIENT_EVIDENCE` without inventing synthetic citations or falling back to silent fixtures.

**Why this priority**: Absolute provenance integrity is mandatory. In live production environments, fabricating fake trademark citations or silently masking API failures could expose a film production to catastrophic copyright and trademark liability.

**Independent Test**: In `CLOUD_MODE` without valid search credentials, trigger a research retry; verify that the endpoint returns a clear error or `INSUFFICIENT_EVIDENCE` status with zero fabricated URLs or citations.

**Acceptance Scenarios**:
1. **Given** `CLOUD_MODE` with unreachable search APIs or missing keys, **When** a research retry is triggered, **Then** the operation fails visibly, logs a descriptive diagnostic, returns `INSUFFICIENT_EVIDENCE`, and emits no fabricated citations.
2. **Given** an entity with an existing legal counsel override, **When** a research retry is run on that entity, **Then** the counsel override remains authoritative and is not overwritten by the automated retry verdict.

---

### Edge Cases

- **Retrying an Overridden Entity**: If counsel has previously recorded a signed override on an entity, retrying research refreshes the underlying automated assessment and citations, but the entity's effective clearance status remains governed by the counsel override per 003 hierarchical resolution rules.
- **Concurrent Retries**: Rapidly clicking retry should be guarded with a loading state on the UI button to prevent duplicate concurrent network requests.
- **Provider Outages**: If the search provider is offline during retry, `CLOUD_MODE` visibly maintains `INSUFFICIENT_EVIDENCE` and logs the API error.

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST allow clearance coordinators to trigger a targeted research retry exclusively on an individual clearance item with `INSUFFICIENT_EVIDENCE` or failed research status without re-evaluating or modifying completed sibling entities.
- **FR-002**: The system MUST expose a dedicated single-item retry endpoint (`POST /api/projects/:id/entities/:entityId/retry-research` or single-entity clearance evaluation) that executes grounding research exclusively for the specified entity.
- **FR-003**: The system MUST strictly prohibit the fabrication of simulated search citations, fake trademark serial numbers, or invented URLs during research retries.
- **FR-004**: In `CLOUD_MODE`, any search provider failure, timeout, or missing credential error during a retry MUST fail visibly, returning `INSUFFICIENT_EVIDENCE` with zero silent fallback to demo fixtures.
- **FR-005**: The backend MUST emit a `RESEARCH_RETRY_STARTED` event followed by standard `TOOL_CALL`, `CITATION_ADDED`, and `RISK_EVAL` events over the SSE stream when a retry is initiated.
- **FR-006**: A research retry MUST update the entity's underlying automated assessment, citations, and timestamps, but MUST NOT mutate, override, or erase active legal counsel overrides.
- **FR-007**: The frontend entity registry table MUST surface a dedicated "Retry Research" (or "Re-Ground") action exclusively on entities with `INSUFFICIENT_EVIDENCE` or failed assessment status.
- **FR-008**: The system MUST preserve all existing 003 invariants (scene-specific counsel override isolation, hierarchical status resolution, and SHA-256 binder integrity digests).
- **FR-009**: The system MUST preserve all existing 004 invariants (autonomous candidate self-clearance loop with $\le 3$ attempts, negative prompt constraints, counsel escalation, and 4-event SSE timeline taxonomy).
- **FR-010**: The system MUST preserve all existing 005 invariants (1-click bundled fictional demo screenplay, secret-masked health check endpoint, fail-visible `CLOUD_MODE`, and exclusively fictional examples in public documentation).
- **FR-011**: The system MUST preserve all existing 006 invariants (manual clearance item addition, editing with assessment invalidation, and clean deletion).

### Key Entities

- **Research Retry Request**: Payload specifying the target entity ID to re-evaluate (`entityId`, `projectId`, `timestamp`).
- **Research Retry Timeline Event**: Observable timeline payload for `RESEARCH_RETRY_STARTED` (`entityId`, `canonicalName`, `previousStatus`, `timestamp`).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Single-item research retries complete in $< 1.5\text{ seconds}$ in `DEMO_MODE` and emit real-time SSE events in $< 100\text{ms}$.
- **SC-002**: 0% of completed evaluations on other project entities are re-executed or duplicated during a single-item retry.
- **SC-003**: 100% of retried citations retain authentic provenance badges (`PARALLEL_LIVE`, `DEMO_FIXTURE`, or `FALLBACK_FIXTURE`) with 0 fabricated evidence.
- **SC-004**: In `CLOUD_MODE`, 100% of missing-key or provider-failure retry attempts fail visibly with zero silent mock substitution.
- **SC-005**: Automated regression test suite maintains 100% pass rate across all existing 001–006 test suites.

---

## Assumptions

- Clearance coordinators can retry `INSUFFICIENT_EVIDENCE` entities at any time without disturbing completed project evaluations.
- The underlying Parallel Search API supports discrete single-entity query lookups.
- Counsel overrides remain the supreme legal authority and are never erased by automated retry operations.
