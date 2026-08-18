# Research: Failed Research Retry

**Feature**: `specs/007-failed-research-retry` | **Date**: 2026-08-18

---

## 1. Retry Endpoint Architecture & Sibling Isolation

### Context
In existing ClearanceScout workflows, initial clearance evaluation can run in batch via `POST /api/projects/:id/clearance/evaluate` with an array of `canonicalEntityIds`. However, when individual items fail due to network timeouts, rate limits, or ungrounded statuses, re-running a batch wastes API budget and risks duplicating completed work on sibling items.

### Decision
Implement a dedicated single-item retry endpoint:
`POST /api/projects/:id/entities/:entityId/retry-research`
- Checks that the entity exists and has `overallClearanceStatus === 'INSUFFICIENT_EVIDENCE'` (or has failed evaluation).
- Executes the research evaluation pipeline exclusively for `entityId`.
- Updates the entity record and its associated assessment in `AssessmentRepo`.
- Emits `RESEARCH_RETRY_STARTED` before calling grounding tools.
- Guarantees 0 mutations or queries against sibling entities in the project.

### Alternatives Considered
- *Overloading `POST /api/projects/:id/clearance/evaluate` with a 1-element array*: While possible, a dedicated REST endpoint `POST /projects/:id/entities/:entityId/retry-research` provides clearer semantic separation, strict eligibility validation (rejecting attempts to retry already-cleared items without cause), and automatic emission of the `RESEARCH_RETRY_STARTED` timeline event.

---

## 2. Eligibility Gating & Validation

### Decision
The retry endpoint will validate:
1. Entity exists in the project.
2. Entity's clearance status is currently `INSUFFICIENT_EVIDENCE`.
3. If an entity is already cleared (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`), the retry endpoint returns `400 Bad Request` (`"Entity is already evaluated. Retry is permitted only for INSUFFICIENT_EVIDENCE or failed research."`), preserving the coordinator's audit log integrity unless an item is first edited (which resets status per 006).

---

## 3. Fail-Visible Cloud Mode & Provenance Tracking

### Decision
In `CLOUD_MODE`:
- If `PARALLEL_API_KEY` is missing or the external API call fails, the retry endpoint returns `INSUFFICIENT_EVIDENCE` with an explicit diagnostic message.
- Zero fake citations or mock fallback are used in `CLOUD_MODE`.
- In `DEMO_MODE` / `TEST_MODE`, deterministic grounded fixtures are used and labeled with `DEMO_FIXTURE` provenance.

---

## 4. Counsel Override Preservation Invariant

### Decision
- When an entity has `isOverridden: true`, retrying research re-evaluates and stores the new research citations and assessment details in `AssessmentRepo`, but `entity.overallClearanceStatus` retains the counsel override status (`latestOverride.overrideStatus`).
- The effective status resolution across scenes remains governed by 003 rules ($\text{Effective} = \text{Scene Override} ?? \text{Entity Override} ?? \text{Baseline}$).
