# Quickstart: Production Clearance Operating Model (Phase 9 Validation)

**Feature**: `specs/016-production-clearance-model` (Phase 9 Focus)  
**Date**: 2026-08-19  

---

## Scenario 1: Fetch Consolidated Dashboard for Ingested Multi-Scene Project

### Steps:
1. Ingest screenplay with 3 scenes (Scene 1: clean, Scene 2: blocked brand, Scene 3: music placeholder).
2. Attach 1 music placeholder (`TEMP_APPROVED`) to Scene 3.
3. Attach 1 rights agreement with expiration within 45 days.
4. Execute `GET /api/projects/$PROJECT_ID/dashboard`.
5. Verify response payload contains:
   - `kpis`: Total scenes (3), `redScenes` (1), `workingClearScenes` (1), `finalClearScenes` (1), `readinessPercentage` (50%).
   - `shootBlockers`: Contains the exact Scene 2 blocked item.
   - `expiringRights`: Contains the 45-day expiring agreement.
   - `activePlaceholders`: Contains the music placeholder.
   - `departmentActionsSummary`: Accurate count of open actions per department.

---

## Scenario 2: Blocker Triage and Immediate Mitigation from Dashboard

### Steps:
1. Identify Scene 2 blocker in `shootBlockers`.
2. Apply signed counsel override on Scene 2 blocker.
3. Re-query `GET /api/projects/$PROJECT_ID/dashboard`.
4. Verify:
   - `shootBlockers` is now empty.
   - `redScenes` is 0.
   - `finalClearScenes` increases.
   - `readinessPercentage` upgrades to higher percentage.
