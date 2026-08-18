# Quickstart Validation: Replacement Self-Clearance Loop

**Feature**: `specs/004-replacement-clearance-loop`  
**Date**: 2026-08-18  

---

## Overview
This guide describes how to validate the autonomous candidate self-clearance verification loop across single-attempt acceptance, multi-attempt loop rejection/acceptance, and max-attempt escalation scenarios.

---

## Scenario 1: Clean Candidate Acceptance on First Attempt

### Objective
Verify that a generated candidate that passes trademark research (`NO_ISSUE_SURFACED`) is immediately accepted, emits proper SSE events, and displays attached research citations.

### Execution
1. Create a demo project and ingest a script mentioning "Coca-Cola".
2. Send request to generate replacement:
   ```bash
   curl -X POST http://localhost:8088/api/projects/$PROJECT_ID/replacements/generate \
     -H "Content-Type: application/json" \
     -d '{"canonicalEntityId": "'$ENTITY_ID'", "eraAesthetic": "1950s Americana"}'
   ```
3. Verify response:
   - `totalAttempts` is `1`
   - `clearanceStatus` is `'NO_ISSUE_SURFACED'`
   - `selfClearanceResult` is `'ACCEPTED'`
   - `citations` contains at least 1 verified citation
4. Verify timeline events emitted:
   - `REPLACEMENT_ATTEMPT` (attempt 1)
   - `REPLACEMENT_RESEARCH_STARTED` (attempt 1)
   - `REPLACEMENT_ACCEPTED` (attempt 1)

---

## Scenario 2: Multi-Attempt Loop with Negative Constraint Rejection

### Objective
Verify that candidate 1 (which hits a trademark collision) is rejected, emits `REPLACEMENT_REJECTED`, triggers candidate 2 generation avoiding the collision, and accepts candidate 2.

### Execution
1. Trigger generation for an entity configured to simulate a trademark collision on attempt 1.
2. Verify response:
   - `totalAttempts` is `2`
   - `attemptHistory.length` is `2`
   - `attemptHistory[0].clearanceStatus` is `'ACTION_REQUIRED'` with `collisionRationale`
   - `attemptHistory[1].clearanceStatus` is `'NO_ISSUE_SURFACED'`
   - `selfClearanceResult` is `'ACCEPTED'`
3. Verify timeline events emitted in order:
   - `REPLACEMENT_ATTEMPT` (1)
   - `REPLACEMENT_RESEARCH_STARTED` (1)
   - `REPLACEMENT_REJECTED` (1)
   - `REPLACEMENT_ATTEMPT` (2)
   - `REPLACEMENT_RESEARCH_STARTED` (2)
   - `REPLACEMENT_ACCEPTED` (2)

---

## Scenario 3: Bounded 3-Attempt Escalation to Legal Counsel

### Objective
Verify that when all 3 candidate generation attempts return trademark collisions or insufficient evidence, the loop terminates strictly after 3 attempts, presents candidate 3 with collision evidence, and marks status as `ESCALATED_TO_COUNSEL` without inventing any ranking score.

### Execution
1. Trigger generation for an entity category configured to collide on all 3 attempts.
2. Verify response:
   - `totalAttempts` is `3`
   - `attemptHistory.length` is `3`
   - `selfClearanceResult` is `'ESCALATED_TO_COUNSEL'`
   - `clearanceStatus` is `'ACTION_REQUIRED'` or `'INSUFFICIENT_EVIDENCE'`
   - `proposedName` matches `attemptHistory[2].candidateName`
3. Verify timeline events emitted:
   - `REPLACEMENT_REJECTED` for attempts 1, 2, and 3.

---

## Scenario 4: Automated Vitest Test Execution

```bash
# Run contract and integration tests for self-clearance loop
npm test -- tests/contract/test_replacement_gen.test.ts tests/contract/test_era_replacement.test.ts
```
