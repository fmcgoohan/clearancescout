# Quickstart: Production Clearance Operating Model (Phase 8 Validation)

**Feature**: `specs/016-production-clearance-model` (Phase 8 Focus)  
**Date**: 2026-08-19  

---

## Scenario 1: Clean Clearance on Attempt 1 (Zero Conflicts)

### Steps:
1. Ingest screenplay with branded item ("Coca-Cola").
2. Trigger replacement generation with era aesthetic:
   `POST /api/projects/$PROJECT_ID/replacements/generate` with `{ canonicalEntityId: "$ENTITY_ID", eraAesthetic: "Modern Minimalist" }`.
3. Candidate generated $\to$ Parallel Search executes $\to$ Evaluates clean (`NO_ISSUE_SURFACED`).
4. Loop terminates immediately with `totalAttempts: 1`, `selfClearanceResult: 'ACCEPTED'`, `status: 'APPROVED'`.

---

## Scenario 2: Collision on Attempt 1, Clean on Attempt 2 (Negative Constraints)

### Steps:
1. Candidate 1 collides with existing brand mark $\to$ `REPLACEMENT_REJECTED` emitted with collision details.
2. Candidate 1 is added to negative constraints for Attempt 2.
3. Candidate 2 generated $\to$ Search executes $\to$ Evaluates clean (`NO_ISSUE_SURFACED`).
4. Loop terminates on Attempt 2 with full 2-attempt citation provenance retained.

---

## Scenario 3: Bounded Escalation at 3 Failed Attempts ($\le 3$ Ceiling)

### Steps:
1. Force 3 consecutive conflicts across attempts 1, 2, and 3.
2. Verify loop strictly terminates at attempt 3.
3. Candidate marked with `selfClearanceResult: 'ESCALATED_TO_COUNSEL'`, `status: 'PROPOSED'`, and high-priority action dispatched to Legal Counsel.
