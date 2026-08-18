# UI Component Contract: Multi-Item Clearance Research Progress & Concurrency Control

**Feature**: `specs/011-multi-item-research-progress` | **Date**: 2026-08-18

---

## 1. `EntityRegistryTableProps` Extension

```typescript
export interface EntityRegistryTableProps {
  entities: CanonicalEntity[];
  scenes?: SceneFilterOption[];
  selectedSceneId?: string | null;
  onEvaluateClearance: (entityId: string) => void;
  onEvaluateBatch?: (entityIds: string[]) => void;
  batchProgress?: BatchResearchProgress;
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

## 2. Worker Pool Interface & Signature

```typescript
export async function runBatchClearancePool(
  entityIds: string[],
  concurrencyLimit: number, // 2
  evaluateSingle: (entityId: string) => Promise<void>,
  onItemProgress: (entityId: string, status: BatchItemStatus, error?: string) => void
): Promise<{ completedCount: number; failedCount: number }>;
```
