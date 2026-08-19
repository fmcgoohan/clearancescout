# Quickstart Validation Guide: Production Clearance Operating Model (Phase 2)

**Feature**: `specs/016-production-clearance-model` | **Date**: 2026-08-19

---

## Scenario 1: Multi-Scene Occurrence Evaluation and Canonical Status Roll-up

1. Create a production project:
   ```bash
   curl -X POST http://localhost:3000/api/projects \
     -H "Content-Type: application/json" \
     -d '{"title":"Cyberfall","productionCompany":"Apex","scriptVersion":"v1.0","projectType":"Movie","executionMode":"DEMO_MODE"}'
   ```
2. Ingest script with an entity appearing across Scene 1 (incidental use) and Scene 4 (tarnishing/dangerous context).
3. Trigger occurrence evaluation.
4. Verify:
   - Scene 1 occurrence evaluates to `NO_ISSUE_SURFACED`.
   - Scene 4 occurrence evaluates to `ACTION_REQUIRED`.
   - Canonical entity `overallClearanceStatus` automatically rolls up to `ACTION_REQUIRED`.
5. Apply a scene counsel override on Scene 4 to clear it.
6. Verify:
   - Scene 4 effective status becomes `NO_ISSUE_SURFACED`.
   - Canonical entity effective roll-up status updates to `NO_ISSUE_SURFACED`.
