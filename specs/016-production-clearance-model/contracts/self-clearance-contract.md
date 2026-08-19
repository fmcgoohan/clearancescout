# API Contract: Evidence-Driven Live Self-Clearance (Feature 016 Phase 8)

**Feature**: `specs/016-production-clearance-model` (Phase 8 Focus)  
**Date**: 2026-08-19  

---

## 1. Generate Cleared Replacement (Iterative Self-Clearance)

### `POST /api/projects/:id/replacements/generate`

#### Request Body:
```json
{
  "canonicalEntityId": "ent-12345",
  "eraAesthetic": "80s Retro Neon"
}
```

#### Response (201 Created - Clean Clearance on Attempt 2):
```json
{
  "id": "rep-abc12345",
  "projectId": "proj-98765",
  "canonicalEntityId": "ent-12345",
  "targetEntityName": "Coca-Cola",
  "fictionalBrandName": "Solaria Spark",
  "designBrief": "Vintage neon red-and-gold glass bottle with solar motif.",
  "eraAesthetic": "80s Retro Neon",
  "artworkImageUrl": "data:image/svg+xml;base64,...",
  "nonInfringementRationale": "No trademark or commercial registrations found for Solaria Spark in beverage classes.",
  "clearanceStatus": "NO_ISSUE_SURFACED",
  "selfClearanceResult": "ACCEPTED",
  "totalAttempts": 2,
  "attemptHistory": [
    {
      "attemptNumber": 1,
      "candidateName": "Radiant Pop",
      "designBrief": "Bright red soda can with sparkle graphics.",
      "eraAesthetic": "80s Retro Neon",
      "clearanceStatus": "ACTION_REQUIRED",
      "collisionRationale": "Trademark conflict detected: active commercial registration found for Radiant Pop.",
      "citations": [
        {
          "id": "cit-001",
          "sourceUrl": "https://uspto.gov/trademarks/radiant-pop",
          "query": "Radiant Pop registered trademark commercial brand status",
          "retrievedAt": "2026-08-19T17:20:00.000Z",
          "excerptSnippet": "Active Class 32 registration for carbonated beverages.",
          "provenance": "PARALLEL_LIVE"
        }
      ],
      "provenance": "PARALLEL_LIVE",
      "timestamp": "2026-08-19T17:20:00.000Z"
    },
    {
      "attemptNumber": 2,
      "candidateName": "Solaria Spark",
      "designBrief": "Vintage neon red-and-gold glass bottle with solar motif.",
      "eraAesthetic": "80s Retro Neon",
      "clearanceStatus": "NO_ISSUE_SURFACED",
      "citations": [
        {
          "id": "cit-002",
          "sourceUrl": "https://parallel.ai/search",
          "query": "Solaria Spark registered trademark commercial brand status",
          "retrievedAt": "2026-08-19T17:20:02.000Z",
          "excerptSnippet": "No conflicting commercial trademark registrations found.",
          "provenance": "PARALLEL_LIVE"
        }
      ],
      "provenance": "PARALLEL_LIVE",
      "timestamp": "2026-08-19T17:20:02.000Z"
    }
  ],
  "citations": [
    {
      "id": "cit-002",
      "sourceUrl": "https://parallel.ai/search",
      "query": "Solaria Spark registered trademark commercial brand status",
      "retrievedAt": "2026-08-19T17:20:02.000Z",
      "excerptSnippet": "No conflicting commercial trademark registrations found.",
      "provenance": "PARALLEL_LIVE"
    }
  ],
  "provenance": "PARALLEL_LIVE",
  "status": "APPROVED",
  "createdAt": "2026-08-19T17:20:03.000Z",
  "updatedAt": "2026-08-19T17:20:03.000Z"
}
```

---

## 2. Server-Sent Events (SSE) Stream

### `GET /api/projects/:id/timeline/stream`

#### Stream Output Sequence:
```text
event: REPLACEMENT_ATTEMPT
data: {"canonicalEntityId":"ent-12345","candidateName":"Radiant Pop","eraAesthetic":"80s Retro Neon","attemptNumber":1}

event: REPLACEMENT_RESEARCH_STARTED
data: {"canonicalEntityId":"ent-12345","candidateName":"Radiant Pop","attemptNumber":1}

event: REPLACEMENT_REJECTED
data: {"canonicalEntityId":"ent-12345","candidateName":"Radiant Pop","attemptNumber":1,"rejectionStatus":"ACTION_REQUIRED","collisionRationale":"Trademark conflict detected: active commercial registration found for Radiant Pop."}

event: REPLACEMENT_ATTEMPT
data: {"canonicalEntityId":"ent-12345","candidateName":"Solaria Spark","eraAesthetic":"80s Retro Neon","attemptNumber":2}

event: REPLACEMENT_RESEARCH_STARTED
data: {"canonicalEntityId":"ent-12345","candidateName":"Solaria Spark","attemptNumber":2}

event: REPLACEMENT_ACCEPTED
data: {"canonicalEntityId":"ent-12345","acceptedName":"Solaria Spark","attemptNumber":2,"totalAttempts":2,"clearanceStatus":"NO_ISSUE_SURFACED"}
```
