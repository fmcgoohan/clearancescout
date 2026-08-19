# API Contract: Rights & Restrictions Management (Feature 016 Phase 4)

**Feature**: `specs/016-production-clearance-model` (Phase 4 Focus)  
**Date**: 2026-08-19  

---

## 1. Create Rights Record

### `POST /api/projects/:id/rights`

#### Request Body:
```json
{
  "canonicalEntityId": "ent-12345678",
  "occurrenceIds": ["occ-1111", "occ-2222"],
  "licensorName": "Summit Beverages LLC",
  "grantType": "NON_EXCLUSIVE",
  "territory": "WORLDWIDE",
  "territoryDetails": "All countries and territories worldwide",
  "mediaWindow": "ALL_MEDIA_IN_PERPETUITY",
  "effectiveDate": "2026-01-01",
  "expirationDate": null,
  "isPerpetual": true,
  "covenants": ["No negative depiction", "Prominent placement required"],
  "feeAmount": 15000,
  "currency": "USD",
  "documentReferenceUrl": "/contracts/summit_bev_license_2026.pdf",
  "status": "ACTIVE"
}
```

#### Response (201 Created):
```json
{
  "id": "rgt-abcdef12",
  "projectId": "proj-98765432",
  "canonicalEntityId": "ent-12345678",
  "canonicalEntityName": "Summit Cola",
  "occurrenceIds": ["occ-1111", "occ-2222"],
  "licensorName": "Summit Beverages LLC",
  "grantType": "NON_EXCLUSIVE",
  "territory": "WORLDWIDE",
  "mediaWindow": "ALL_MEDIA_IN_PERPETUITY",
  "effectiveDate": "2026-01-01",
  "expirationDate": null,
  "isPerpetual": true,
  "covenants": ["No negative depiction", "Prominent placement required"],
  "feeAmount": 15000,
  "currency": "USD",
  "documentReferenceUrl": "/contracts/summit_bev_license_2026.pdf",
  "status": "ACTIVE",
  "createdAt": "2026-08-19T16:00:00.000Z",
  "updatedAt": "2026-08-19T16:00:00.000Z"
}
```

---

## 2. List Rights Records by Project

### `GET /api/projects/:id/rights`

#### Response (200 OK):
```json
[
  {
    "id": "rgt-abcdef12",
    "projectId": "proj-98765432",
    "canonicalEntityId": "ent-12345678",
    "canonicalEntityName": "Summit Cola",
    "licensorName": "Summit Beverages LLC",
    "grantType": "NON_EXCLUSIVE",
    "territory": "WORLDWIDE",
    "mediaWindow": "ALL_MEDIA_IN_PERPETUITY",
    "isPerpetual": true,
    "status": "ACTIVE",
    "createdAt": "2026-08-19T16:00:00.000Z"
  }
]
```

---

## 3. List Rights Records for an Entity

### `GET /api/projects/:id/entities/:entityId/rights`

#### Response (200 OK):
```json
[
  {
    "id": "rgt-abcdef12",
    "canonicalEntityId": "ent-12345678",
    "licensorName": "Summit Beverages LLC",
    "grantType": "NON_EXCLUSIVE",
    "territory": "WORLDWIDE",
    "mediaWindow": "ALL_MEDIA_IN_PERPETUITY",
    "isPerpetual": true,
    "covenants": ["No negative depiction", "Prominent placement required"],
    "status": "ACTIVE"
  }
]
```

---

## 4. Update Rights Record

### `PATCH /api/projects/:id/rights/:rightsId`

#### Request Body:
```json
{
  "status": "EXPIRED",
  "covenants": ["Archive use only"]
}
```

#### Response (200 OK):
```json
{
  "id": "rgt-abcdef12",
  "status": "EXPIRED",
  "covenants": ["Archive use only"],
  "updatedAt": "2026-08-19T16:05:00.000Z"
}
```

---

## 5. Delete Rights Record

### `DELETE /api/projects/:id/rights/:rightsId`

#### Response (200 OK):
```json
{
  "deleted": true,
  "rightsId": "rgt-abcdef12"
}
```
