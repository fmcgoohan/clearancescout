# Data Model: Workspace Registry Multi-Dimension Filters

**Feature**: `specs/009-workspace-registry-filters` | **Date**: 2026-08-18

---

## 1. Registry Filter State

```typescript
export interface RegistryFilterState {
  status: 'ALL' | 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE';
  category: 'ALL' | 'BRAND' | 'ART_MUSIC' | 'PUBLIC_FIGURE' | 'PROPRIETARY_LOCATION' | 'GRAPHIC_PROP';
  sceneId: 'ALL' | string;
}

export interface SceneFilterOption {
  id: string;
  sceneNumber: number;
  heading: string;
  entityIds?: string[];
}
```

---

## 2. Logical AND Filter Predicate

An entity `e` passes the multi-dimension filter if and only if:
1. `filter.status === 'ALL' || e.overallClearanceStatus === filter.status`
2. `filter.category === 'ALL' || e.entityCategory === filter.category`
3. `filter.sceneId === 'ALL' || selectedSceneEntityIds.has(e.id)`
