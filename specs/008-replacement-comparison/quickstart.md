# Quickstart Validation Guide: Side-by-Side Original and Replacement Comparison

**Feature**: `specs/008-replacement-comparison` | **Date**: 2026-08-18

---

## Scenario 1: Inspecting Side-by-Side Comparison for Cleared Replacement

1. Create a project and ingest the bundled demo screenplay:
   ```bash
   curl -X POST http://localhost:8080/api/projects \
     -H "Content-Type: application/json" \
     -d '{"title":"Comparison Demo","productionCompany":"Entrant Studio","executionMode":"DEMO_MODE"}'
   ```
2. Evaluate clearance on a high-risk entity (`Coca-Cola` / `Summit Cola`):
   ```bash
   curl -X POST http://localhost:8080/api/projects/<PROJECT_ID>/clearance/evaluate \
     -H "Content-Type: application/json" \
     -d '{"canonicalEntityIds":["<ENTITY_ID>"]}'
   ```
3. Generate a fictional replacement asset:
   ```bash
   curl -X POST http://localhost:8080/api/projects/<PROJECT_ID>/entities/<ENTITY_ID>/replacement
   ```
4. Query the comparison endpoint:
   ```bash
   curl http://localhost:8080/api/projects/<PROJECT_ID>/entities/<ENTITY_ID>/comparison
   ```
5. Verify response contains:
   - `original`: canonicalName, entityCategory, overallClearanceStatus, riskScore, legalRationale, citations.
   - `replacement`: replacementName, entityCategory, clearanceStatus, visualStyle, cardImageSvg, citations.
   - `attemptHistory`: sequential candidate evaluation breakdown.

---

## Scenario 2: Gated Availability (No Replacement Card)

1. Query comparison for an entity without a replacement card:
   ```bash
   curl http://localhost:8080/api/projects/<PROJECT_ID>/entities/<UNREPLACED_ENTITY_ID>/comparison
   ```
2. Expected response:
   - `400 Bad Request` with message: `"Entity does not have an attached replacement card. Comparison is available only when a replacement card exists."`
