# API Contract: Clearance Binder Export & Studio Counsel Review Module

**Feature**: `specs/003-counsel-review-binder` | **Date**: 2026-08-18

---

## 1. Counsel Override Endpoint

### `POST /api/projects/:id/entities/:entityId/override`

Records an authoritative legal decision override from studio production counsel.

#### Request Body
```json
{
  "overrideStatus": "NO_ISSUE_SURFACED",
  "sceneId": "scene-1",
  "rationale": "Direct paid product placement contract executed under #PP-2026-WB.",
  "counselName": "Jane Doe, Esq.",
  "counselRole": "Senior Vice President, Production Legal"
}
```

- `overrideStatus` (string, required): `'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED'`
- `sceneId` (string, optional): Specific scene scope. If omitted, applies to the canonical entity project-wide.
- `rationale` (string, required): Non-empty justification text.
- `counselName` (string, required): Non-empty attorney name.
- `counselRole` (string, optional): Defaults to `'Studio Production Counsel'`.

#### Response `200 OK`
```json
{
  "success": true,
  "override": {
    "id": "ovr-8a7f12bc",
    "projectId": "proj-123",
    "canonicalEntityId": "ent-abc",
    "sceneId": "scene-1",
    "previousStatus": "ACTION_REQUIRED",
    "overrideStatus": "NO_ISSUE_SURFACED",
    "rationale": "Direct paid product placement contract executed under #PP-2026-WB.",
    "counselName": "Jane Doe, Esq.",
    "counselRole": "Senior Vice President, Production Legal",
    "timestamp": "2026-08-18T10:15:30.000Z"
  },
  "entity": {
    "id": "ent-abc",
    "isOverridden": true,
    "overallClearanceStatus": "NO_ISSUE_SURFACED"
  }
}
```

---

## 2. Override Audit Trail Endpoint

### `GET /api/projects/:id/entities/:entityId/overrides`

Returns chronological list of all overrides recorded for an entity.

#### Response `200 OK`
```json
{
  "projectId": "proj-123",
  "canonicalEntityId": "ent-abc",
  "overrides": [
    {
      "id": "ovr-8a7f12bc",
      "overrideStatus": "NO_ISSUE_SURFACED",
      "sceneId": "scene-1",
      "rationale": "Direct paid product placement contract executed under #PP-2026-WB.",
      "counselName": "Jane Doe, Esq.",
      "counselRole": "Senior Vice President, Production Legal",
      "timestamp": "2026-08-18T10:15:30.000Z"
    }
  ]
}
```

---

## 3. Clearance Binder Export Endpoint

### `GET /api/projects/:id/binder/export`

Compiles and signs the complete project clearance binder.

#### Response `200 OK`
```json
{
  "id": "bnd-f12a34b5",
  "projectId": "proj-123",
  "projectSummary": {
    "title": "Neon Horizon",
    "productionCompany": "Warner Bros. Discovery",
    "scriptVersion": "v2.0",
    "totalScenes": 3,
    "totalEntities": 6,
    "clearedCount": 4,
    "actionRequiredCount": 1,
    "reviewRecommendedCount": 1,
    "overridesCount": 1
  },
  "scenes": [],
  "canonicalEntities": [],
  "citationsIndex": [
    {
      "id": "cit-1",
      "provenance": "PARALLEL_LIVE",
      "sourceUrl": "https://tsdr.uspto.gov/case/882341",
      "corporateOwner": "The Coca-Cola Company",
      "registrationStatus": "ACTIVE_REGISTERED"
    }
  ],
  "replacementCatalog": [],
  "overridesHistory": [],
  "exportedAt": "2026-08-18T10:20:00.000Z",
  "integrityDigest": "a3f5b7890123456789abcdef0123456789abcdef0123456789abcdef01234567",
  "disclaimer": "ClearanceScout provides research issue-spotting and clearance workflow management. It does NOT render formal legal advice."
}
```
