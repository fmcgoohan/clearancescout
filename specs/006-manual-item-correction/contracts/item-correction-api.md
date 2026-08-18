# API Contract: Manual Clearance Item Correction Endpoints

**Feature**: `specs/006-manual-item-correction` | **Date**: 2026-08-18

---

## 1. `POST /api/projects/:id/entities`

Manually adds a new clearance item to a project.

### Request Body
```json
{
  "canonicalName": "Veloce Custom Spoiler",
  "entityCategory": "GRAPHIC_PROP",
  "description": "Aftermarket aerodynamic wing with branded typography",
  "sceneId": "scene-2",
  "usageContext": "Mounted on vehicle exterior during night drive"
}
```

### Response (`201 Created`)
```json
{
  "id": "ent-9a8b7c",
  "projectId": "proj-123",
  "canonicalName": "Veloce Custom Spoiler",
  "entityCategory": "GRAPHIC_PROP",
  "description": "Aftermarket aerodynamic wing with branded typography",
  "overallClearanceStatus": "INSUFFICIENT_EVIDENCE",
  "origin": "MANUALLY_ADDED",
  "isOverridden": false,
  "createdAt": "2026-08-18T15:50:00.000Z",
  "updatedAt": "2026-08-18T15:50:00.000Z"
}
```

---

## 2. `PATCH /api/projects/:id/entities/:entityId`

Updates the canonical name, category, description, or context of an existing clearance item.

### Request Body
```json
{
  "canonicalName": "AeroTech Quantum Laptop",
  "entityCategory": "BRAND",
  "description": "High-performance futuristic laptop used by Alex"
}
```

### Response (`200 OK`)
```json
{
  "id": "ent-4f5e6d",
  "projectId": "proj-123",
  "canonicalName": "AeroTech Quantum Laptop",
  "entityCategory": "BRAND",
  "description": "High-performance futuristic laptop used by Alex",
  "overallClearanceStatus": "INSUFFICIENT_EVIDENCE",
  "origin": "USER_EDITED",
  "isOverridden": false,
  "createdAt": "2026-08-18T15:00:00.000Z",
  "updatedAt": "2026-08-18T15:51:00.000Z"
}
```

---

## 3. `DELETE /api/projects/:id/entities/:entityId`

Permanently removes a clearance item and its scene occurrences.

### Response (`200 OK`)
```json
{
  "deleted": true,
  "entityId": "ent-4f5e6d"
}
```
