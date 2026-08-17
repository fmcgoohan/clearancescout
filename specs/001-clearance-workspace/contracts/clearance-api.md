# API & Interface Contracts: ClearanceScout API

**Feature**: `specs/001-clearance-workspace`  
**Date**: 2026-08-17  
**Protocol**: REST (JSON) over HTTPS + Server-Sent Events (SSE)

---

## 1. Create Project

- **Endpoint**: `POST /api/projects`
- **Description**: Initializes a new ClearanceScout project workspace.

### Request Payload
```json
{
  "title": "The Great Heist",
  "productionCompany": "Apex Pictures",
  "scriptVersion": "v1.0-Draft",
  "executionMode": "DEMO_MODE"
}
```

### Response Payload (`201 Created`)
```json
{
  "id": "proj-9012a83f-4e11",
  "title": "The Great Heist",
  "productionCompany": "Apex Pictures",
  "scriptVersion": "v1.0-Draft",
  "executionMode": "DEMO_MODE",
  "createdAt": "2026-08-17T18:30:00Z",
  "updatedAt": "2026-08-17T18:30:00Z"
}
```

---

## 2. Upload & Parse Script

- **Endpoint**: `POST /api/projects/:projectId/script`
- **Content-Type**: `multipart/form-data`
- **Description**: Uploads a screenplay file (PDF/TXT/FDX), parses scenes, and extracts canonical entities.

### Response Payload (`200 OK`)
```json
{
  "projectId": "proj-9012a83f-4e11",
  "scenesParsed": 14,
  "canonicalEntitiesExtracted": 8,
  "entities": [
    {
      "id": "ent-coca-cola",
      "canonicalName": "Coca-Cola",
      "entityCategory": "BRAND",
      "description": "Soft drink brand",
      "overallClearanceStatus": "INSUFFICIENT_EVIDENCE"
    }
  ]
}
```

---

## 3. Execute Clearance Research & Risk Assessment

- **Endpoint**: `POST /api/projects/:projectId/clearance/evaluate`
- **Description**: Triggers live `parallel-web` trademark search grounding and scene context risk evaluation.

### Request Payload
```json
{
  "canonicalEntityIds": ["ent-coca-cola"]
}
```

### Response Payload (`200 OK`)
```json
{
  "assessments": [
    {
      "id": "asm-8812-cc",
      "canonicalEntityId": "ent-coca-cola",
      "sceneId": "scene-3",
      "riskStatus": "ACTION_REQUIRED",
      "riskScore": 85,
      "legalRationale": "Brand used during character dialogue describing product as toxic.",
      "contextFlags": ["DEFAMATION_RISK", "UNAUTHORIZED_USAGE"],
      "citations": [
        {
          "id": "cit-9901",
          "sourceUrl": "https://uspto.gov/trademarks/coca-cola",
          "query": "Coca-Cola registered trademark owner",
          "retrievedAt": "2026-08-17T18:31:00Z",
          "excerptSnippet": "Registered active trademark owned by The Coca-Cola Company.",
          "registrationStatus": "REGISTERED_ACTIVE"
        }
      ],
      "disclaimer": "ClearanceScout provides workflow issue-spotting and does not render legal advice."
    }
  ]
}
```

---

## 4. Generate Replacement Brand Concept Card

- **Endpoint**: `POST /api/projects/:projectId/replacements/generate`
- **Description**: Generates a non-infringing fictional brand replacement name and Imagen 3 visual card.

### Request Payload
```json
{
  "canonicalEntityId": "ent-coca-cola"
}
```

### Response Payload (`200 OK`)
```json
{
  "id": "rep-7721-summit",
  "canonicalEntityId": "ent-coca-cola",
  "fictionalBrandName": "Summit Cola",
  "designBrief": "Red aluminum can with bold white serif font reading Summit Cola.",
  "artworkImageUrl": "https://storage.googleapis.com/clearancescout-assets/replacements/summit-cola.png",
  "nonInfringementRationale": "Summit Cola is visually and phonetically distinct from registered trademarks in IC 032.",
  "status": "PROPOSED"
}
```

---

## 5. Stream Observable Action Timeline (SSE)

- **Endpoint**: `GET /api/projects/:projectId/timeline/stream`
- **Accept**: `text/event-stream`
- **Description**: Real-time Server-Sent Events (SSE) streaming observable execution events. Raw chain-of-thought is strictly omitted.

### Event Format (`event: timeline_event`)
```text
event: timeline_event
data: {
  "id": "evt-1002",
  "projectId": "proj-9012a83f-4e11",
  "eventType": "TOOL_CALL",
  "label": "Parallel Web Trademark Query",
  "payload": {
    "query": "Coca-Cola trademark status",
    "status": "COMPLETED"
  },
  "timestamp": "2026-08-17T18:31:01Z"
}
```
