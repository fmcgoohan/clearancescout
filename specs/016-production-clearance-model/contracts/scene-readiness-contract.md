# API Contract: Scene Readiness State Machine (Feature 016 Phase 5)

**Feature**: `specs/016-production-clearance-model` (Phase 5 Focus)  
**Date**: 2026-08-19  

---

## 1. Get Project Scene Readiness Summary

### `GET /api/projects/:id/scenes/readiness`

#### Response (200 OK):
```json
{
  "projectId": "proj-12345",
  "totalScenes": 12,
  "redScenesCount": 2,
  "workingClearScenesCount": 4,
  "finalClearScenesCount": 6,
  "overallReadinessPercentage": 83.3,
  "scenes": [
    {
      "sceneId": "scene-1",
      "sceneNumber": 1,
      "heading": "INT. PENTHOUSE WORKSPACE - NIGHT",
      "status": "FINAL_CLEAR",
      "blockersCount": 0,
      "workingClearCount": 0,
      "finalClearCount": 2,
      "totalOccurrences": 2,
      "summaryText": "All 2 occurrences in Scene 1 are fully cleared.",
      "evaluatedAt": "2026-08-19T16:20:00.000Z"
    },
    {
      "sceneId": "scene-4",
      "sceneNumber": 4,
      "heading": "INT. NIGHTCLUB - NIGHT",
      "status": "RED",
      "blockersCount": 1,
      "workingClearCount": 0,
      "finalClearCount": 0,
      "totalOccurrences": 1,
      "summaryText": "1 clearance blocker prevents shooting Scene 4.",
      "blockingRationale": "Uncleared copyrighted song 'Nocturne of the Wild' (ACTION_REQUIRED).",
      "evaluatedAt": "2026-08-19T16:20:00.000Z"
    }
  ],
  "evaluatedAt": "2026-08-19T16:20:00.000Z"
}
```

---

## 2. Get Single Scene Readiness Details

### `GET /api/projects/:id/scenes/:sceneId/readiness`

#### Response (200 OK):
```json
{
  "sceneId": "scene-4",
  "sceneNumber": 4,
  "heading": "INT. NIGHTCLUB - NIGHT",
  "status": "RED",
  "blockersCount": 1,
  "workingClearCount": 0,
  "finalClearCount": 0,
  "totalOccurrences": 1,
  "itemsBreakdown": [
    {
      "occurrenceId": "occ-987",
      "canonicalEntityId": "ent-111",
      "canonicalName": "Nocturne of the Wild",
      "clearanceStatus": "ACTION_REQUIRED",
      "effectiveStatus": "ACTION_REQUIRED",
      "rightsStatus": "NONE",
      "hasReplacementCard": false,
      "hasSignedOverride": false,
      "readinessTier": "BLOCKER",
      "rationale": "Synchronization license required."
    }
  ],
  "summaryText": "1 clearance blocker prevents shooting Scene 4.",
  "blockingRationale": "Uncleared copyrighted song 'Nocturne of the Wild' (ACTION_REQUIRED).",
  "evaluatedAt": "2026-08-19T16:20:00.000Z"
}
```

---

## 3. Evaluate Scene Readiness (On-Demand)

### `POST /api/projects/:id/scenes/:sceneId/readiness/evaluate`

#### Response (200 OK):
```json
{
  "sceneId": "scene-4",
  "sceneNumber": 4,
  "heading": "INT. NIGHTCLUB - NIGHT",
  "status": "WORKING_CLEAR",
  "blockersCount": 0,
  "workingClearCount": 1,
  "finalClearCount": 0,
  "totalOccurrences": 1,
  "summaryText": "Scene 4 is Working Clear with 1 active replacement placeholder.",
  "evaluatedAt": "2026-08-19T16:22:00.000Z"
}
```

---

## 4. Batch Evaluate All Scenes Readiness

### `POST /api/projects/:id/scenes/readiness/evaluate-all`

#### Response (200 OK):
```json
{
  "projectId": "proj-12345",
  "scenesEvaluated": 12,
  "redScenesCount": 1,
  "workingClearScenesCount": 3,
  "finalClearScenesCount": 8,
  "evaluatedAt": "2026-08-19T16:25:00.000Z"
}
```
