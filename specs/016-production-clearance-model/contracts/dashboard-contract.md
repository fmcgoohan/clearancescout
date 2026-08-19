# API Contract: Production Operations Dashboard (Feature 016 Phase 9)

**Feature**: `specs/016-production-clearance-model` (Phase 9 Focus)  
**Date**: 2026-08-19  

---

## 1. Get Production Operations Dashboard

### `GET /api/projects/:id/dashboard`

#### Response (200 OK):
```json
{
  "projectId": "proj-12345",
  "projectTitle": "Neon Horizon",
  "projectType": "Movie",
  "kpis": {
    "totalScenes": 10,
    "finalClearScenes": 6,
    "workingClearScenes": 2,
    "redScenes": 2,
    "readinessPercentage": 70,
    "totalEntities": 15,
    "criticalBlockersCount": 2,
    "activePlaceholdersCount": 2,
    "rightsExpiringSoonCount": 1,
    "pendingActionsCount": 3
  },
  "sceneReadinessDistribution": [
    {
      "sceneId": "scn-001",
      "sceneNumber": 1,
      "heading": "INT. NIGHTCLUB - NIGHT",
      "status": "FINAL_CLEAR",
      "blockerCount": 0,
      "workingCount": 0,
      "totalOccurrences": 2
    },
    {
      "sceneId": "scn-002",
      "sceneNumber": 2,
      "heading": "INT. APARTMENT - DAY",
      "status": "RED",
      "blockerCount": 1,
      "workingCount": 0,
      "totalOccurrences": 1
    }
  ],
  "shootBlockers": [
    {
      "sceneId": "scn-002",
      "sceneNumber": 2,
      "heading": "INT. APARTMENT - DAY",
      "occurrenceId": "occ-999",
      "canonicalEntityId": "ent-888",
      "canonicalName": "Pepsi Can",
      "clearanceStatus": "ACTION_REQUIRED",
      "riskRationale": "Unlicensed proprietary mark in foreground action"
    }
  ],
  "expiringRights": [
    {
      "rightsId": "rgt-777",
      "canonicalEntityId": "ent-666",
      "canonicalName": "Artwork Painting",
      "agreementName": "Gallery Exhibition License",
      "licensor": "Apex Fine Arts",
      "expirationDate": "2026-09-15T00:00:00.000Z",
      "daysRemaining": 27
    }
  ],
  "activePlaceholders": [
    {
      "id": "ph-555",
      "canonicalEntityId": "ent-444",
      "canonicalName": "Nocturne of the Wild",
      "fictionalName": "Echoes of Midnight",
      "assetCategory": "ART_MUSIC",
      "clearanceTier": "TEMP_APPROVED",
      "approvedBy": "Alex Turner"
    }
  ],
  "departmentActionsSummary": {
    "ART_DEPT": 1,
    "LEGAL_COUNSEL": 1,
    "LOCATIONS": 0,
    "PRODUCTION_MGMT": 1
  },
  "recentActivity": [
    {
      "id": "act-1",
      "type": "STATE_TRANSITION",
      "label": "Placeholder Attached: Echoes of Midnight",
      "timestamp": "2026-08-19T17:25:00.000Z"
    }
  ]
}
```
