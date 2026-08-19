# API Contract: Upgraded Entity Resolution, Aliases & Hierarchy (Phase 3)

**Feature**: `specs/016-production-clearance-model` | **Date**: 2026-08-19

---

## 1. Add Alias to Canonical Entity

- **Endpoint**: `POST /api/projects/:id/entities/:entityId/aliases`
- **Description**: Appends a new alias to a canonical entity for multi-surface recognition.

### Request Body
```json
{
  "alias": "Coke Zero"
}
```

### Response `200 OK`
```json
{
  "success": true,
  "canonicalEntityId": "ent-12345678",
  "canonicalName": "Coca-Cola",
  "aliases": ["Coke", "Coca-Cola Classic", "Coke Zero"],
  "updatedAt": "2026-08-19T15:45:00.000Z"
}
```

---

## 2. Remove Alias from Canonical Entity

- **Endpoint**: `DELETE /api/projects/:id/entities/:entityId/aliases/:alias`
- **Description**: Removes an alias from a canonical entity.

### Response `200 OK`
```json
{
  "success": true,
  "canonicalEntityId": "ent-12345678",
  "aliases": ["Coke", "Coca-Cola Classic"],
  "updatedAt": "2026-08-19T15:45:30.000Z"
}
```

---

## 3. Resolve Entity Mention against Registry

- **Endpoint**: `POST /api/projects/:id/entities/resolve`
- **Description**: Resolves a candidate text mention or category against existing canonical entities and aliases.

### Request Body
```json
{
  "mention": "Coke Zero Sugar",
  "category": "BRAND"
}
```

### Response `200 OK` (Matched Existing Canonical Entity)
```json
{
  "matched": true,
  "canonicalEntityId": "ent-12345678",
  "canonicalName": "Coca-Cola",
  "entityCategory": "BRAND",
  "confidence": 0.95,
  "matchRule": "ALIAS_MATCH",
  "matchedAlias": "Coke Zero",
  "parentEntity": {
    "id": "ent-12345678",
    "name": "The Coca-Cola Company",
    "relationshipType": "PARENT_COMPANY"
  }
}
```

### Response `200 OK` (No Match - Novel Entity)
```json
{
  "matched": false,
  "confidence": 0.0,
  "matchRule": "NONE"
}
```

---

## 4. Set Parent Brand / Product Hierarchy

- **Endpoint**: `PATCH /api/projects/:id/entities/:entityId/relationship`
- **Description**: Configures parent brand, product line, or corporate subsidiary relationship.

### Request Body
```json
{
  "parentEntityId": "ent-porsche-corp",
  "relationshipType": "BRAND_PRODUCT"
}
```

### Response `200 OK`
```json
{
  "id": "ent-911-gt3",
  "canonicalName": "Porsche 911 GT3",
  "parentEntityId": "ent-porsche-corp",
  "parentEntityName": "Porsche AG",
  "relationshipType": "BRAND_PRODUCT",
  "updatedAt": "2026-08-19T15:46:00.000Z"
}
```

---

## 5. Merge Two Canonical Entities

- **Endpoint**: `POST /api/projects/:id/entities/merge`
- **Description**: Merges a duplicate source entity into a primary target entity, transferring occurrences, combining aliases, and recomputing roll-up status.

### Request Body
```json
{
  "targetCanonicalEntityId": "ent-coca-cola",
  "sourceCanonicalEntityId": "ent-coke-can"
}
```

### Response `200 OK`
```json
{
  "success": true,
  "targetEntity": {
    "id": "ent-coca-cola",
    "canonicalName": "Coca-Cola",
    "entityCategory": "BRAND",
    "aliases": ["Coke", "Coke Can"],
    "overallClearanceStatus": "ACTION_REQUIRED"
  },
  "sourceEntityId": "ent-coke-can",
  "transferredOccurrencesCount": 3,
  "combinedAliases": ["Coke", "Coke Can"],
  "derivedCanonicalStatus": "ACTION_REQUIRED",
  "mergedAt": "2026-08-19T15:46:30.000Z"
}
```
