# Interface Contract: Feature 024 UX Redesign

**Feature**: `024-ux-redesign` | **Spec**: [`spec.md`](../spec.md) | **Plan**: [`plan.md`](../plan.md)

---

## Workspace REST API Contracts

### 1. Contextual Recommended Action Endpoint (`GET /api/projects/:id/recommended-action`)

**Response Payload**:
```json
{
  "recommendedAction": {
    "id": "rec-101",
    "entityId": "ent-001",
    "entityName": "Nocturne of the Wild",
    "urgency": "CRITICAL",
    "message": "2 clearance items require action. Start with Nocturne of the Wild.",
    "rationale": "Blocks Scene 1 (Interior Lab) shoot readiness",
    "actionType": "RESEARCH",
    "actionLabel": "Research Nocturne of the Wild"
  }
}
```

### 2. Ingestion Response Contract (`POST /api/projects/:id/ingest`)

**Request Payload**:
```json
{
  "scriptContent": "...screenplay text...",
  "mode": "REPLACE" // or "MERGE"
}
```

**Response Payload**:
```json
{
  "status": "SUCCESS",
  "summary": {
    "scenesProcessed": 3,
    "entitiesRegistered": 7,
    "departmentTasksCreated": 7,
    "shootingReadinessIndex": 0.57
  },
  "message": "Screenplay replaced successfully - 3 scenes processed - 7 entities registered - 7 department tasks created."
}
```
