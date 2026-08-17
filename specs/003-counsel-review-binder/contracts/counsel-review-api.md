# API Contracts: Clearance Binder Export & Studio Counsel Review Module

**Feature**: `specs/003-counsel-review-binder` | **Date**: 2026-08-17

---

## 1. Counsel Override Endpoint

### `POST /api/projects/:id/entities/:entityId/override`
Applies a manual legal counsel override to an entity's clearance status with mandatory rationale.

#### Request Body
```json
{
  "overrideStatus": "NO_ISSUE_SURFACED",
  "rationale": "Product placement license executed under contract #PP-2026-881 with studio.",
  "counselName": "Morgan Vance, Esq.",
  "counselRole": "Senior Production Counsel",
  "sceneId": "optional-scene-id"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "override": {
    "id": "ovr-982341",
    "projectId": "proj-123",
    "canonicalEntityId": "ent-coca-cola",
    "previousStatus": "ACTION_REQUIRED",
    "overrideStatus": "NO_ISSUE_SURFACED",
    "rationale": "Product placement license executed under contract #PP-2026-881 with studio.",
    "counselName": "Morgan Vance, Esq.",
    "counselRole": "Senior Production Counsel",
    "timestamp": "2026-08-17T18:00:00.000Z"
  },
  "entity": {
    "id": "ent-coca-cola",
    "canonicalName": "Coca-Cola",
    "effectiveClearanceStatus": "NO_ISSUE_SURFACED",
    "isOverridden": true
  }
}
```

---

## 2. Override History Endpoint

### `GET /api/projects/:id/entities/:entityId/overrides`
Retrieves chronological audit history of legal overrides for an entity.

#### Response (200 OK)
```json
{
  "canonicalEntityId": "ent-coca-cola",
  "overrides": [
    {
      "id": "ovr-982341",
      "previousStatus": "ACTION_REQUIRED",
      "overrideStatus": "NO_ISSUE_SURFACED",
      "rationale": "Product placement license executed under contract #PP-2026-881 with studio.",
      "counselName": "Morgan Vance, Esq.",
      "timestamp": "2026-08-17T18:00:00.000Z"
    }
  ]
}
```

---

## 3. Clearance Binder Export Endpoint

### `GET /api/projects/:id/binder/export`
Compiles, signs (SHA-256), and delivers the consolidated Legal Clearance Binder.

#### Response (200 OK)
```json
{
  "id": "binder-exp-7712",
  "projectId": "proj-123",
  "title": "Cyberpunk Odyssey",
  "productionCompany": "Spectacle Pictures",
  "scriptVersion": "v1.0-ShootingDraft",
  "exportedAt": "2026-08-17T18:15:00.000Z",
  "auditSignature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "disclaimer": "ClearanceScout provides entertainment research issue-spotting and workflow tracking. It does not render formal legal advice or guarantees.",
  "summaryMetrics": {
    "totalScenes": 5,
    "totalEntities": 12,
    "clearedCount": 9,
    "reviewCount": 2,
    "actionRequiredCount": 1,
    "overridesCount": 2,
    "replacementsCount": 1
  },
  "scenes": [],
  "canonicalEntities": [],
  "replacementCatalog": [],
  "overridesHistory": []
}
```
