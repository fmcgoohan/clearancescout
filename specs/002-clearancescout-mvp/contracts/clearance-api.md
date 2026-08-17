# API & Interface Contracts: ClearanceScout MVP API

**Feature**: `specs/002-clearancescout-mvp`  
**Date**: 2026-08-17  
**Protocol**: REST (JSON) over HTTPS + Server-Sent Events (SSE)

---

## 1. Create Project Workspace

- **Endpoint**: `POST /api/projects`
- **Description**: Initializes a new ClearanceScout production clearance workspace.

### Request Payload
```json
{
  "title": "Neon Horizon",
  "productionCompany": "Apex Pictures",
  "scriptVersion": "v1.0-Draft",
  "executionMode": "DEMO_MODE"
}
```

### Response Payload (`201 Created`)
```json
{
  "id": "proj-a19283f4",
  "title": "Neon Horizon",
  "productionCompany": "Apex Pictures",
  "scriptVersion": "v1.0-Draft",
  "executionMode": "DEMO_MODE",
  "createdAt": "2026-08-17T19:00:00Z",
  "updatedAt": "2026-08-17T19:00:00Z"
}
```

---

## 2. Multi-Format Script Ingestion & 5-Category Parsing

- **Endpoint**: `POST /api/projects/:id/script`
- **Content-Type**: `multipart/form-data` or `application/json`
- **Description**: Ingests Plaintext (`.txt`), Fountain (`.fountain`), or Screenplay PDF (`.pdf`), extracting scenes and resolving canonical entities across all 5 categories.

### Request Payload (`application/json`)
```json
{
  "scriptText": "INT. DINER - NIGHT\nALEX drinks a Coke while looking at JORDAN.",
  "format": "FOUNTAIN"
}
```

### Response Payload (`200 OK`)
```json
{
  "projectId": "proj-a19283f4",
  "scenesParsed": 12,
  "canonicalEntitiesExtracted": 5,
  "entities": [
    {
      "id": "ent-coca-cola",
      "canonicalName": "Coca-Cola",
      "category": "BRAND",
      "description": "Soft drink brand",
      "overallClearanceStatus": "INSUFFICIENT_EVIDENCE"
    }
  ]
}
```

---

## 3. Live Trademark Grounding & Contextual Risk Evaluation

- **Endpoint**: `POST /api/projects/:id/clearance/evaluate`
- **Description**: Runs live trademark search via `@parallel-web/sdk` tools, calculates deterministic context metrics, and synthesizes 4-status clearance verdict.

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
      "id": "asm-991201",
      "canonicalEntityId": "ent-coca-cola",
      "sceneId": "scene-1",
      "riskStatus": "ACTION_REQUIRED",
      "riskScore": 85,
      "legalRationale": "High risk: depiction in high-speed scene with defamatory dialogue requires clearance release.",
      "contextFlags": ["DEFAMATION_RISK", "UNAUTHORIZED_USAGE"],
      "citations": [
        {
          "id": "cit-8812",
          "sourceUrl": "https://uspto.gov/trademarks/coca-cola",
          "query": "Coca-Cola registered trademark owner",
          "retrievedAt": "2026-08-17T19:01:00Z",
          "excerptSnippet": "Active registered trademark owned by The Coca-Cola Company.",
          "registrationStatus": "REGISTERED_ACTIVE",
          "corporateOwner": "The Coca-Cola Company"
        }
      ],
      "disclaimer": "ClearanceScout provides workflow issue-spotting and clearance risk categorization. It does not render formal legal advice."
    }
  ]
}
```

---

## 4. Remediation & Visual Concept Card Generation

- **Endpoint**: `POST /api/projects/:id/replacements/generate`
- **Description**: Generates creative era-appropriate replacement brand names and Imagen 3 visual packaging cards.

### Request Payload
```json
{
  "canonicalEntityId": "ent-coca-cola",
  "eraAesthetic": "Modern Cinematic"
}
```

### Response Payload (`200 OK`)
```json
{
  "id": "rep-7721-summit",
  "canonicalEntityId": "ent-coca-cola",
  "fictionalBrandName": "Summit Cola",
  "designBrief": "Crimson aluminum beverage can with bold silver serif typography.",
  "eraAesthetic": "Modern Cinematic",
  "artworkImageUrl": "data:image/svg+xml;utf8,...",
  "nonInfringementRationale": "Summit Cola is visually, phonetically, and conceptually distinct from registered trademarks in Class 032.",
  "status": "PROPOSED"
}
```

---

## 5. Observable Action Timeline Stream (SSE)

- **Endpoint**: `GET /api/projects/:id/timeline/stream`
- **Accept**: `text/event-stream`
- **Description**: Server-Sent Events stream emitting real-time agent execution events with raw model chain-of-thought sanitized.

### Event Format
```text
event: timeline_event
data: {
  "id": "evt-3312",
  "projectId": "proj-a19283f4",
  "eventType": "TOOL_CALL",
  "label": "Parallel-Web Trademark Query",
  "payload": {
    "query": "Coca-Cola trademark status",
    "status": "COMPLETED"
  },
  "timestamp": "2026-08-17T19:02:00Z"
}
```

---

## 6. Project Clearance Binder Export

- **Endpoint**: `GET /api/projects/:id/binder/export`
- **Description**: Compiles and exports the complete auditable project clearance binder.

### Response Payload (`200 OK`)
```json
{
  "exportId": "bnd-9901-exp",
  "projectId": "proj-a19283f4",
  "projectSummary": {
    "title": "Neon Horizon",
    "productionCompany": "Apex Pictures",
    "scriptVersion": "v1.0-Draft",
    "totalScenes": 12,
    "totalEntities": 5,
    "clearedCount": 3,
    "actionRequiredCount": 2
  },
  "scenes": [...],
  "canonicalEntities": [...],
  "citationsIndex": [...],
  "replacementCatalog": [...],
  "exportedAt": "2026-08-17T19:05:00Z",
  "auditSignature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "disclaimer": "ClearanceScout provides workflow issue-spotting and clearance risk categorization. It does not render formal legal advice."
}
```
