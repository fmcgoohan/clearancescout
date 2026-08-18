# Data Model: Manual Clearance Item Correction

**Feature**: `specs/006-manual-item-correction` | **Date**: 2026-08-18

---

## 1. Canonical Entity Model (Enhanced)

```typescript
export type EntityOrigin = 'AUTO_EXTRACTED' | 'USER_EDITED' | 'MANUALLY_ADDED';

export interface CanonicalEntityData {
  id: string;
  projectId: string;
  canonicalName: string;
  entityCategory: EntityCategory;
  description: string;
  overallClearanceStatus: ClearanceStatus;
  origin?: EntityOrigin;
  isOverridden?: boolean;
  latestOverride?: {
    overrideId: string;
    overrideStatus: ClearanceStatus;
    rationale: string;
    counselName: string;
    timestamp: string;
  };
  replacementCard?: any;
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. Request & Response Payloads

### Create Entity Request (`POST /api/projects/:id/entities`)
```typescript
export interface CreateEntityRequest {
  canonicalName: string;
  entityCategory: EntityCategory;
  description?: string;
  sceneId?: string;
  scriptLineNumber?: number;
  usageContext?: string;
}
```

### Update Entity Request (`PATCH /api/projects/:id/entities/:entityId`)
```typescript
export interface UpdateEntityRequest {
  canonicalName?: string;
  entityCategory?: EntityCategory;
  description?: string;
  usageContext?: string;
}
```

---

## 3. Timeline Event Payloads

### `ITEM_ADDED` Event
```typescript
{
  type: 'ITEM_ADDED',
  projectId: string,
  entityId: string,
  canonicalName: string,
  entityCategory: EntityCategory,
  sceneId?: string,
  timestamp: string
}
```

### `ITEM_EDITED` Event
```typescript
{
  type: 'ITEM_EDITED',
  projectId: string,
  entityId: string,
  previousName?: string,
  newName?: string,
  previousCategory?: EntityCategory,
  newCategory?: EntityCategory,
  assessmentInvalidated: boolean,
  timestamp: string
}
```

### `ITEM_REMOVED` Event
```typescript
{
  type: 'ITEM_REMOVED',
  projectId: string,
  entityId: string,
  canonicalName: string,
  entityCategory: EntityCategory,
  timestamp: string
}
```
