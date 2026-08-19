# Quickstart: Production Clearance Operating Model (Phase 6 Validation)

**Feature**: `specs/016-production-clearance-model` (Phase 6 Focus)  
**Date**: 2026-08-19  

---

## Scenario 1: Screenplay Ingestion Generates Department-Routed Action Items

### Steps:
1. Create a project `POST /api/projects`.
2. Ingest screenplay containing Scene 1 with `GRAPHIC_PROP` ("Titan Hazard Placard") and `ART_MUSIC` ("Nocturne of the Wild").
3. Trigger action sync `POST /api/projects/$PROJECT_ID/actions/sync` or evaluate clearance.
4. Query actions `GET /api/projects/$PROJECT_ID/actions`.
5. Verify:
   - Art Dept action item is generated (`actionType: 'ART_DEPT_REPLACEMENT'`, `targetDepartment: 'ART_DEPT'`).
   - Legal Counsel action item is generated (`actionType: 'LEGAL_COUNSEL_RELEASE'`, `targetDepartment: 'LEGAL_COUNSEL'`).

---

## Scenario 2: Scene `RED` State Generates Production Management Alert

### Steps:
1. Evaluate scene readiness for Scene 1 (`POST /api/projects/$PROJECT_ID/scenes/$SCENE_ID/readiness/evaluate`).
2. Verify Scene 1 status is `RED`.
3. Query notifications `GET /api/projects/$PROJECT_ID/notifications`.
4. Verify critical alert notification is generated with `targetDepartment: 'PRODUCTION_MGMT'` and `severity: 'CRITICAL'`.

---

## Scenario 3: Attaching Fictional Replacement Card Auto-Resolves Art Department Action

### Steps:
1. Attach replacement card to the graphic prop (`POST /api/projects/$PROJECT_ID/replacements`).
2. Query actions `GET /api/projects/$PROJECT_ID/actions?department=ART_DEPT`.
3. Verify the Art Department action status is automatically updated to **`RESOLVED`** with `resolutionTrigger: 'REPLACEMENT_CARD_ATTACHED'`.

---

## Scenario 4: Legal Counsel Signed Override Auto-Resolves Legal Action and Scene Blocker

### Steps:
1. Submit signed counsel override for the music track (`POST /api/projects/$PROJECT_ID/overrides`).
2. Query actions `GET /api/projects/$PROJECT_ID/actions?department=LEGAL_COUNSEL`.
3. Verify Legal action status transitions to **`RESOLVED`**.
4. Re-evaluate Scene 1 readiness $\to$ Scene transitions to `FINAL_CLEAR` and production review actions are resolved.
