# API Contract: Failed Research Retry

**Feature**: `specs/007-failed-research-retry` | **Date**: 2026-08-18

---

## 1. `POST /api/projects/:id/entities/:entityId/retry-research`

Triggers a single-item research re-evaluation for an entity with `INSUFFICIENT_EVIDENCE` status.

### Request
```http
POST /api/projects/proj-12345/entities/ent-67890/retry-research HTTP/1.1
Host: localhost:8080
Content-Type: application/json
```

### Response `200 OK`
```json
{
  "entity": {
    "id": "ent-67890",
    "projectId": "proj-12345",
    "canonicalName": "AeroTech Prism Laptop",
    "entityCategory": "BRAND",
    "description": "Transparent holographic laptop",
    "overallClearanceStatus": "ACTION_REQUIRED",
    "origin": "AUTO_EXTRACTED",
    "isOverridden": false,
    "createdAt": "2026-08-18T10:00:00.000Z",
    "updatedAt": "2026-08-18T10:05:00.000Z"
  },
  "assessment": {
    "id": "asm-99887",
    "occurrenceId": "occ-11223",
    "canonicalEntityId": "ent-67890",
    "sceneId": "scene-01",
    "riskStatus": "ACTION_REQUIRED",
    "riskScore": 88,
    "legalRationale": "Direct match against registered active trademark.",
    "contextFlags": ["TRADEMARK_EXACT_MATCH"],
    "citations": [
      {
        "id": "cit-001",
        "sourceUrl": "https://tsdr.uspto.gov/#caseNumber=88123456",
        "query": "AeroTech Prism",
        "retrievedAt": "2026-08-18T10:05:00.000Z",
        "excerptSnippet": "Serial #88123456 for AeroTech Prism active trademark.",
        "registrationStatus": "REGISTERED_ACTIVE",
        "corporateOwner": "AeroTech Industries, Inc.",
        "provenance": "DEMO_FIXTURE"
      }
    ],
    "provenance": "DEMO_FIXTURE",
    "evaluatedAt": "2026-08-18T10:05:00.000Z",
    "disclaimer": "ClearanceScout provides workflow issue-spotting and clearance risk categorization. It does NOT render formal legal advice."
  },
  "retriedAt": "2026-08-18T10:05:00.000Z"
}
```

### Error Responses
- `400 Bad Request`:
  ```json
  {
    "error": "Entity is already evaluated with status NO_ISSUE_SURFACED. Retry is permitted only for INSUFFICIENT_EVIDENCE or failed research."
  }
  ```
- `404 Not Found`:
  ```json
  {
    "error": "Entity ent-67890 not found in project proj-12345."
  }
  ```
