# Data Model: Production Clearance Operating Model (Phase 5)

**Feature**: `specs/016-production-clearance-model` (Phase 5 Focus)  
**Date**: 2026-08-19  
**Status**: Completed  

---

## 1. Scene Readiness Data Structures

### `SceneReadinessStatus`
```typescript
export type SceneReadinessStatus = 'RED' | 'WORKING_CLEAR' | 'FINAL_CLEAR';
export type ItemReadinessTier = 'BLOCKER' | 'WORKING_CLEAR' | 'FINAL_CLEAR';
```

### `SceneReadinessAssessment`
```typescript
export interface SceneItemReadinessDetail {
  occurrenceId: string;
  canonicalEntityId: string;
  canonicalName: string;
  clearanceStatus: ClearanceStatus;
  effectiveStatus: ClearanceStatus;
  rightsStatus: 'COVERED' | 'EXPIRED' | 'NONE';
  hasReplacementCard: boolean;
  hasSignedOverride: boolean;
  readinessTier: ItemReadinessTier;
  rationale: string;
}

export interface SceneReadinessAssessment {
  sceneId: string;
  sceneNumber: number;
  heading: string;
  status: SceneReadinessStatus;
  evaluatedAt: string;
  blockersCount: number;
  workingClearCount: number;
  finalClearCount: number;
  totalOccurrences: number;
  itemsBreakdown: SceneItemReadinessDetail[];
  summaryText: string;
  blockingRationale?: string;
}
```

---

## 2. Extended `SceneData` Entity

Stored in Firestore at `projects/{projectId}/scenes/{sceneId}`.

```typescript
export interface SceneData {
  id: string;
  projectId: string;
  sceneNumber: number;
  heading: string;
  locationType: 'INT' | 'EXT' | 'INT/EXT';
  timeOfDay: 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN' | 'OTHER';
  rawText: string;
  characterActionSummary: string;
  
  // Phase 5 Scene Readiness Extensions
  readinessStatus?: SceneReadinessStatus;
  readinessEvaluatedAt?: string;
  readinessDetails?: SceneReadinessAssessment;

  createdAt: string;
  updatedAt: string;
}
```

---

## 3. Project-Level Summary Model

### `ProjectReadinessSummary`
```typescript
export interface ProjectReadinessSummary {
  projectId: string;
  totalScenes: number;
  redScenesCount: number;
  workingClearScenesCount: number;
  finalClearScenesCount: number;
  overallReadinessPercentage: number;
  scenes: SceneReadinessAssessment[];
  evaluatedAt: string;
}
```
