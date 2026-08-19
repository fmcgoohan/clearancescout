# API Contract: Generalized Replacement & Placeholder Management (Feature 016 Phase 7)

**Feature**: `specs/016-production-clearance-model` (Phase 7 Focus)  
**Date**: 2026-08-19  

---

## 1. List Project Placeholders

### `GET /api/projects/:id/placeholders`

#### Query Parameters:
- `category` (optional): `'BRAND' | 'ART_MUSIC' | 'ARTWORK' | 'DIALOGUE' | 'GRAPHIC_PROP'`
- `tier` (optional): `'TEMP_APPROVED' | 'FINAL_CLEARED'`

#### Response (200 OK):
```json
[
  {
    "id": "ph-m1u2s3i4",
    "projectId": "proj-12345",
    "canonicalEntityId": "ent-999",
    "canonicalName": "Nocturne of the Wild",
    "assetCategory": "ART_MUSIC",
    "fictionalName": "Echoes of the Night Sky",
    "description": "Original ambient synth-rock composition",
    "clearanceTier": "TEMP_APPROVED",
    "creativeRationale": "In-house track for production temp track",
    "approvedBy": "Marcus Vance",
    "approvedRole": "Music Supervisor",
    "approvalDate": "2026-08-19T17:00:00.000Z",
    "categoryDetails": {
      "bpm": 110,
      "key": "D Minor",
      "musicalStyle": "Synth-wave Atmospheric Rock"
    },
    "createdAt": "2026-08-19T17:00:00.000Z",
    "updatedAt": "2026-08-19T17:00:00.000Z"
  }
]
```

---

## 2. Create or Attach Placeholder

### `POST /api/projects/:id/placeholders`

#### Request Body:
```json
{
  "canonicalEntityId": "ent-999",
  "assetCategory": "ART_MUSIC",
  "fictionalName": "Echoes of the Night Sky",
  "description": "Original ambient synth-rock composition",
  "clearanceTier": "TEMP_APPROVED",
  "creativeRationale": "In-house track for production temp track",
  "approvedBy": "Marcus Vance",
  "approvedRole": "Music Supervisor",
  "categoryDetails": {
    "bpm": 110,
    "key": "D Minor",
    "musicalStyle": "Synth-wave Atmospheric Rock"
  }
}
```

#### Response (201 Created):
```json
{
  "id": "ph-m1u2s3i4",
  "projectId": "proj-12345",
  "canonicalEntityId": "ent-999",
  "assetCategory": "ART_MUSIC",
  "fictionalName": "Echoes of the Night Sky",
  "clearanceTier": "TEMP_APPROVED",
  "createdAt": "2026-08-19T17:00:00.000Z",
  "updatedAt": "2026-08-19T17:00:00.000Z"
}
```

---

## 3. Update Placeholder Clearance Tier

### `PATCH /api/projects/:id/placeholders/:placeholderId/tier`

#### Request Body:
```json
{
  "clearanceTier": "FINAL_CLEARED",
  "approvedBy": "Jane Sterling, Production Counsel",
  "approvedRole": "Lead Production Counsel"
}
```

#### Response (200 OK):
```json
{
  "id": "ph-m1u2s3i4",
  "clearanceTier": "FINAL_CLEARED",
  "approvedBy": "Jane Sterling, Production Counsel",
  "approvalDate": "2026-08-19T17:05:00.000Z",
  "updatedAt": "2026-08-19T17:05:00.000Z"
}
```

---

## 4. Get Placeholder by Entity

### `GET /api/projects/:id/entities/:entityId/placeholder`

#### Response (200 OK):
```json
{
  "id": "ph-m1u2s3i4",
  "canonicalEntityId": "ent-999",
  "assetCategory": "ART_MUSIC",
  "fictionalName": "Echoes of the Night Sky",
  "clearanceTier": "FINAL_CLEARED"
}
```
