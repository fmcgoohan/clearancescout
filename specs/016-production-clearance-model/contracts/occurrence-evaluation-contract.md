# Interface Contract: Occurrence-Level Evaluation (Phase 2)

**Feature**: `specs/016-production-clearance-model` | **Date**: 2026-08-19

---

## 1. Occurrence Evaluation Endpoints

### `POST /api/projects/:id/occurrences/:occurrenceId/evaluate`
Evaluates a specific occurrence using its scene context and canonical research.

**Request Payload**:
```json
{}
```

**Response (200 OK)**:
```json
{
  "occurrenceId": "occ-1234",
  "sceneId": "scene-4",
  "canonicalEntityId": "ent-abcd",
  "clearanceStatus": "ACTION_REQUIRED",
  "riskScore": 90,
  "riskRationale": "High tarnishment risk: Brand is depicted alongside negative context keywords in Scene 4.",
  "contextFlags": ["DEFAMATION_RISK", "UNAUTHORIZED_USAGE"],
  "citations": [
    {
      "sourceUrl": "https://uspto.gov/trademarks/example",
      "corporateOwner": "Global Brand Corp",
      "provenance": "PARALLEL_LIVE"
    }
  ],
  "derivedCanonicalStatus": "ACTION_REQUIRED",
  "evaluatedAt": "2026-08-19T15:00:00.000Z"
}
```

---

### `GET /api/projects/:id/entities/:entityId/occurrences`
Retrieves all occurrences for an entity with their individual clearance verdicts and scene context.

**Response (200 OK)**:
```json
{
  "canonicalEntityId": "ent-abcd",
  "canonicalName": "Apex Brand",
  "derivedOverallStatus": "ACTION_REQUIRED",
  "occurrences": [
    {
      "id": "occ-1",
      "sceneId": "scene-1",
      "scriptLineNumber": 14,
      "excerptText": "Character drinks Apex Brand casually at the table.",
      "usageContext": "Incidental background consumption",
      "clearanceStatus": "NO_ISSUE_SURFACED",
      "riskScore": 15,
      "riskRationale": "Incidental background use; no tarnishment surfaced."
    },
    {
      "id": "occ-2",
      "sceneId": "scene-4",
      "scriptLineNumber": 88,
      "excerptText": "Apex Brand can explodes with toxic fumes causing a disaster.",
      "usageContext": "Weaponized product defect",
      "clearanceStatus": "ACTION_REQUIRED",
      "riskScore": 90,
      "riskRationale": "Tarnishment and product defect depiction creates acute disparagement liability."
    }
  ]
}
```
