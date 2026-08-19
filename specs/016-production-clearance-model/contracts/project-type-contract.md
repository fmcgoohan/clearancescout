# Interface Contract: Production Project Types & Listing (Phase 1)

**Feature**: `specs/016-production-clearance-model` | **Date**: 2026-08-19

---

## 1. Project Endpoints

### `POST /api/projects`
**Request Payload**:
```json
{
  "title": "Neon Horizon",
  "productionCompany": "Apex Entertainment",
  "scriptVersion": "v1.0-ShootingDraft",
  "projectType": "Movie",
  "executionMode": "DEMO_MODE"
}
```
**Response (201 Created)**:
```json
{
  "id": "proj-abc12345",
  "title": "Neon Horizon",
  "productionCompany": "Apex Entertainment",
  "scriptVersion": "v1.0-ShootingDraft",
  "projectType": "Movie",
  "executionMode": "DEMO_MODE",
  "liveQuotaLimit": 25,
  "liveQuotaUsed": 0,
  "liveQuotaRemaining": 25,
  "createdAt": "2026-08-19T14:00:00.000Z",
  "updatedAt": "2026-08-19T14:00:00.000Z"
}
```

---

### `GET /api/projects`
**Response (200 OK)**:
```json
{
  "projects": [
    {
      "id": "proj-abc12345",
      "title": "Neon Horizon",
      "productionCompany": "Apex Entertainment",
      "scriptVersion": "v1.0-ShootingDraft",
      "projectType": "Movie",
      "executionMode": "DEMO_MODE",
      "liveQuotaLimit": 25,
      "liveQuotaUsed": 0,
      "liveQuotaRemaining": 25,
      "entityCount": 12,
      "clearedCount": 8,
      "actionRequiredCount": 3,
      "createdAt": "2026-08-19T14:00:00.000Z",
      "updatedAt": "2026-08-19T14:00:00.000Z"
    }
  ]
}
```
