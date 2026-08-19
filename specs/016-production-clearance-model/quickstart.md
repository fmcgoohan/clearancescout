# Quickstart: Production Clearance Operating Model (Phase 5 Validation)

**Feature**: `specs/016-production-clearance-model` (Phase 5 Focus)  
**Date**: 2026-08-19  

---

## Scenario 1: Initial Ingestion of an Uncleared Scene Produces `RED` Status

### Steps:
1. Create a project `POST /api/projects`.
2. Ingest screenplay containing Scene 1 with an uncleared brand/music item (`ACTION_REQUIRED`).
3. Query scene readiness `GET /api/projects/$PROJECT_ID/scenes/$SCENE_ID/readiness`.
4. Verify `status` is **`RED`**, `blockersCount: 1`, and `blockingRationale` cites the uncleared asset.

---

## Scenario 2: Attaching a Fictional Replacement Card Transitions Scene to `WORKING CLEAR`

### Steps:
1. From Scenario 1, attach a fictional replacement card to the uncleared item (`POST /api/projects/$PROJECT_ID/replacements`).
2. Trigger scene readiness re-evaluation `POST /api/projects/$PROJECT_ID/scenes/$SCENE_ID/readiness/evaluate`.
3. Verify `status` transitions to **`WORKING_CLEAR`**, `blockersCount: 0`, and `workingClearCount: 1`.

---

## Scenario 3: Legal Counsel Signed Override or Active License Transitions Scene to `FINAL CLEAR`

### Steps:
1. Legal counsel submits a signed override for the item or attaches an active perpetual rights license (`POST /api/projects/$PROJECT_ID/overrides` or `POST /api/projects/$PROJECT_ID/rights`).
2. Trigger scene readiness re-evaluation `POST /api/projects/$PROJECT_ID/scenes/$SCENE_ID/readiness/evaluate`.
3. Verify `status` transitions to **`FINAL_CLEAR`**, `blockersCount: 0`, `workingClearCount: 0`, and `finalClearCount: 1`.

---

## Scenario 4: Clean Scene with No IP Detected Evaluates Directly as `FINAL CLEAR`

### Steps:
1. Ingest a screenplay with Scene 2 containing only generic character dialogue (0 extracted entities).
2. Query scene readiness for Scene 2.
3. Verify `status` is **`FINAL_CLEAR`** with `totalOccurrences: 0`.
