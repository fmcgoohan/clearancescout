# UI Component Contract: Workspace Registry Multi-Dimension Filters

**Feature**: `specs/009-workspace-registry-filters` | **Date**: 2026-08-18

---

## 1. `EntityRegistryTableProps`

```typescript
export interface EntityRegistryTableProps {
  entities: CanonicalEntity[];
  scenes?: {
    id: string;
    sceneNumber: number;
    heading: string;
    occurrences?: { canonicalEntityId: string }[];
  }[];
  selectedSceneId?: string | null;
  onEvaluateClearance: (entityId: string) => void;
  onRetryResearch?: (entityId: string) => void;
  onGenerateReplacement: (entityId: string) => void;
  onOpenCounselReview?: (entityId: string) => void;
  onOpenComparison?: (entityId: string) => void;
  onEditItem?: (entity: CanonicalEntity) => void;
  onDeleteItem?: (entityId: string) => void;
  onAddItem?: () => void;
  isEvaluating: boolean;
}
```

---

## 2. Component Behavior Contract

- **Initial State**:
  - `status`: `'ALL'`
  - `category`: `'ALL'`
  - `sceneId`: `'ALL'`
- **Header Count Badge**:
  - Render `${filteredEntities.length} of ${entities.length} Entities Displayed`.
- **Zero Matches State**:
  - When `entities.length > 0` and `filteredEntities.length === 0`, render:
    - Text: `No entities match the active filters: [Category: {category}] [Status: {status}] [Scene: {scene}]`
    - Button: `🔄 Clear Filters` (resets all filter selectors to `'ALL'`).
- **No Mutations Invariant**:
  - Filter state changes trigger 0 server requests and do not mutate `entities` array.
