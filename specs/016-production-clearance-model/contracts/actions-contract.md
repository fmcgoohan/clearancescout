# API Contract: Clearance Action & Notification Lists (Feature 016 Phase 6)

**Feature**: `specs/016-production-clearance-model` (Phase 6 Focus)  
**Date**: 2026-08-19  

---

## 1. List Clearance Action Items

### `GET /api/projects/:id/actions`

#### Query Parameters:
- `department` (optional): `'ART_DEPT' | 'LEGAL_COUNSEL' | 'LOCATIONS' | 'PRODUCTION_MGMT'`
- `status` (optional): `'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'`

#### Response (200 OK):
```json
[
  {
    "id": "act-a1b2c3d4",
    "projectId": "proj-12345",
    "sceneId": "scene-1",
    "sceneNumber": 1,
    "canonicalEntityId": "ent-888",
    "canonicalName": "Titan Industrial Hazard Placard",
    "occurrenceId": "occ-111",
    "actionType": "ART_DEPT_REPLACEMENT",
    "targetDepartment": "ART_DEPT",
    "title": "Create Fictional Prop Graphic: Titan Industrial Hazard Placard",
    "description": "Graphic prop in Scene 1 requires a fictionalized non-infringing prop packaging/warning card.",
    "priority": "HIGH",
    "status": "OPEN",
    "createdAt": "2026-08-19T16:30:00.000Z",
    "updatedAt": "2026-08-19T16:30:00.000Z"
  },
  {
    "id": "act-e5f6g7h8",
    "projectId": "proj-12345",
    "sceneId": "scene-1",
    "sceneNumber": 1,
    "actionType": "PRODUCTION_REVIEW",
    "targetDepartment": "PRODUCTION_MGMT",
    "title": "Scene 1 Shooting Blocker: RED",
    "description": "1 clearance blocker prevents shooting Scene 1: Titan Industrial Hazard Placard.",
    "priority": "CRITICAL",
    "status": "OPEN",
    "createdAt": "2026-08-19T16:30:00.000Z",
    "updatedAt": "2026-08-19T16:30:00.000Z"
  }
]
```

---

## 2. Update Action Item Status

### `PATCH /api/projects/:id/actions/:actionId`

#### Request Body:
```json
{
  "status": "RESOLVED",
  "resolutionTrigger": "MANUAL_COORDINATOR_SIGN_OFF"
}
```

#### Response (200 OK):
```json
{
  "id": "act-a1b2c3d4",
  "status": "RESOLVED",
  "resolutionTrigger": "MANUAL_COORDINATOR_SIGN_OFF",
  "resolvedAt": "2026-08-19T16:35:00.000Z",
  "updatedAt": "2026-08-19T16:35:00.000Z"
}
```

---

## 3. List Notifications

### `GET /api/projects/:id/notifications`

#### Response (200 OK):
```json
[
  {
    "id": "notif-98765432",
    "projectId": "proj-12345",
    "sceneId": "scene-1",
    "sceneNumber": 1,
    "targetDepartment": "PRODUCTION_MGMT",
    "headline": "🚨 Shooting Alert: Scene 1 Blocked (RED)",
    "message": "Clearance blocker detected for Titan Industrial Hazard Placard in Scene 1.",
    "severity": "CRITICAL",
    "isRead": false,
    "createdAt": "2026-08-19T16:30:00.000Z"
  }
]
```

---

## 4. Mark Notification as Read

### `PATCH /api/projects/:id/notifications/:notifId/read`

#### Response (200 OK):
```json
{
  "id": "notif-98765432",
  "isRead": true
}
```

---

## 5. Sync Action Items from Current Project State

### `POST /api/projects/:id/actions/sync`

#### Response (200 OK):
```json
{
  "projectId": "proj-12345",
  "actionsGenerated": 2,
  "actionsResolved": 1,
  "activeOpenActionsCount": 2,
  "syncedAt": "2026-08-19T16:38:00.000Z"
}
```
