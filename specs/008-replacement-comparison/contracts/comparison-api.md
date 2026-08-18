# API Contract: Side-by-Side Original and Replacement Comparison

**Feature**: `specs/008-replacement-comparison` | **Date**: 2026-08-18

---

## 1. `GET /api/projects/:id/entities/:entityId/comparison`

Returns the compound comparison view model for an entity and its generated replacement card.

### Request
```http
GET /api/projects/proj-12345/entities/ent-67890/comparison HTTP/1.1
Host: localhost:8080
Accept: application/json
```

### Response `200 OK`
```json
{
  "projectId": "proj-12345",
  "original": {
    "id": "ent-67890",
    "canonicalName": "Coca-Cola",
    "entityCategory": "BRAND",
    "description": "Featured beverage can on desk",
    "overallClearanceStatus": "ACTION_REQUIRED",
    "riskScore": 80,
    "legalRationale": "High brand protection enforcement: Coca-Cola is a famous global mark.",
    "citations": [
      {
        "id": "cit-001",
        "sourceUrl": "https://tsdr.uspto.gov/#caseNumber=71000001",
        "query": "Coca-Cola",
        "retrievedAt": "2026-08-18T10:00:00.000Z",
        "excerptSnippet": "Active registered trademark for beverages.",
        "registrationStatus": "REGISTERED_ACTIVE",
        "corporateOwner": "The Coca-Cola Company",
        "provenance": "DEMO_FIXTURE"
      }
    ],
    "isOverridden": false
  },
  "replacement": {
    "id": "rep-99887",
    "replacementName": "Summit Cola",
    "entityCategory": "BRAND",
    "clearanceStatus": "NO_ISSUE_SURFACED",
    "isEscalated": false,
    "attemptsCount": 1,
    "generationPrompt": "Generate a fictional non-infringing refreshing cola brand card",
    "visualStyle": "Cyberpunk Neon Blue & Silver Can",
    "cardImageSvg": "<svg>...</svg>",
    "citations": [
      {
        "id": "cit-002",
        "sourceUrl": "https://parallel.ai/search?q=Summit+Cola",
        "query": "Summit Cola",
        "retrievedAt": "2026-08-18T10:02:00.000Z",
        "excerptSnippet": "No conflicting active registrations found for Summit Cola.",
        "registrationStatus": "UNKNOWN",
        "provenance": "DEMO_FIXTURE"
      }
    ]
  },
  "attemptHistory": [
    {
      "attemptNumber": 1,
      "candidateName": "Summit Cola",
      "riskStatus": "NO_ISSUE_SURFACED",
      "timestamp": "2026-08-18T10:02:00.000Z"
    }
  ]
}
```

### Error Responses
- `400 Bad Request`:
  ```json
  {
    "error": "Entity ent-67890 does not have an attached replacement card. Comparison is available only when a replacement card exists."
  }
  ```
- `404 Not Found`:
  ```json
  {
    "error": "Entity ent-67890 not found in project proj-12345."
  }
  ```
