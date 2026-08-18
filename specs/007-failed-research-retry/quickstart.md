# Quickstart Validation Guide: Failed Research Retry

**Feature**: `specs/007-failed-research-retry` | **Date**: 2026-08-18

---

## Scenario 1: Retrying an `INSUFFICIENT_EVIDENCE` Clearance Item

1. Create a project and ingest the bundled demo screenplay:
   ```bash
   curl -X POST http://localhost:8080/api/projects \
     -H "Content-Type: application/json" \
     -d '{"title":"Retry Demo Project","productionCompany":"Entrant Studio","executionMode":"DEMO_MODE"}'
   ```
2. Manually add an ungrounded clearance item:
   ```bash
   curl -X POST http://localhost:8080/api/projects/<PROJECT_ID>/entities \
     -H "Content-Type: application/json" \
     -d '{"canonicalName":"Quantum Matrix Core","entityCategory":"BRAND"}'
   ```
3. Trigger single-item research retry:
   ```bash
   curl -X POST http://localhost:8080/api/projects/<PROJECT_ID>/entities/<ENTITY_ID>/retry-research
   ```
4. Verify response:
   - Status transitions from `INSUFFICIENT_EVIDENCE` to a grounded risk status (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, or `ACTION_REQUIRED`).
   - Sibling entities remain completely untouched.

---

## Scenario 2: Eligibility Validation Check

1. Attempt to retry an entity that already has status `NO_ISSUE_SURFACED` without an `INSUFFICIENT_EVIDENCE` state:
   ```bash
   curl -X POST http://localhost:8080/api/projects/<PROJECT_ID>/entities/<CLEARED_ENTITY_ID>/retry-research
   ```
2. Expected response:
   - `400 Bad Request` with message: `"Entity is already evaluated with status NO_ISSUE_SURFACED. Retry is permitted only for INSUFFICIENT_EVIDENCE or failed research."`

---

## Scenario 3: Real-Time SSE Timeline Verification

1. Connect an SSE client to `GET /api/projects/<PROJECT_ID>/timeline`.
2. Trigger research retry on an `INSUFFICIENT_EVIDENCE` item.
3. Verify event sequence:
   - `RESEARCH_RETRY_STARTED`
   - `TOOL_CALL`
   - `CITATION_ADDED`
   - `RISK_EVAL`
