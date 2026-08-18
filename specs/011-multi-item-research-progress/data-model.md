# Data Model: Multi-Item Clearance Research Progress & Concurrency Control

**Feature**: `specs/011-multi-item-research-progress` | **Date**: 2026-08-18

---

## 1. Batch Item Status

```typescript
export type BatchItemStatus = 'QUEUED' | 'RESEARCHING' | 'COMPLETED' | 'FAILED';

export interface BatchResearchItem {
  entityId: string;
  entityName: string;
  status: BatchItemStatus;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}
```

---

## 2. Batch Research Progress State

```typescript
export interface BatchResearchProgress {
  isActive: boolean;
  total: number;
  completed: number;
  failed: number;
  activeCount: number;
  items: Record<string, BatchResearchItem>;
}
```
