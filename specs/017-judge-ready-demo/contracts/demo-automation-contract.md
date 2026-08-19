# API Contract: Feature 017 Judge-Ready Demo Automation

**Feature**: `017-judge-ready-demo`  
**Created**: 2026-08-19

---

## 1. Demo Script Ingestion & Auto-Evaluation Endpoint

### `POST /api/projects/:id/script/demo`

Ingests the bundled *"The Neon Horizon"* screenplay into the specified project and, in `DEMO_MODE`, automatically executes deterministic fixture-backed clearance evaluation across all extracted entities, attaches sample rights and placeholder records, and computes initial scene readiness.

#### Headers
- `Content-Type: application/json`
- `Authorization: Bearer <demo_token>` *(Optional in DEMO_MODE)*

#### Request Body
```json
{
  "autoEvaluate": true,
  "includeSampleRights": true,
  "includeSamplePlaceholders": true
}
```

#### Success Response: `200 OK`
```json
{
  "projectId": "proj-12345",
  "projectTitle": "The Neon Horizon",
  "projectType": "Movie",
  "scenesCount": 3,
  "entitiesCount": 7,
  "evaluationsCount": 7,
  "activeRightsCount": 1,
  "activePlaceholdersCount": 1,
  "openActionsCount": 1,
  "readinessSummary": {
    "overallReadinessPercentage": 85,
    "finalClearScenesCount": 2,
    "workingClearScenesCount": 1,
    "redScenesCount": 0
  },
  "provenance": "DEMO_FIXTURE",
  "message": "Demo screenplay ingested and evaluated successfully with DEMO_FIXTURE provenance."
}
```

---

## 2. Updated Project Initial State Contract

When a project is created or initialized, the default title is:
- `"ClearanceScout Production Clearance Workspace"` (rebranded from `"ClearanceScout MVP Workspace"`).
