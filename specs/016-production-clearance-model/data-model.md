# Data Model: Production Clearance Operating Model (Phase 10)

**Feature**: `specs/016-production-clearance-model` (Phase 10 Focus)  
**Date**: 2026-08-19  
**Status**: Completed  

---

## 1. Comprehensive Legal Clearance Binder Data Schema

### `ClearanceBinderData`
Exported by `GET /api/projects/:id/binder` and `POST /api/projects/:id/binder/export`.

```typescript
export interface BinderProjectSummary {
  projectId: string;
  projectType: string; // 'Movie' | 'TV Show' | 'Commercial'
  title: string;
  productionCompany: string;
  scriptVersion: string;
  totalScenes: number;
  finalClearScenes: number;
  workingClearScenes: number;
  redScenes: number;
  overallReadinessPercentage: number;
  totalEntities: number;
  clearedCount: number;
  actionRequiredCount: number;
  reviewRecommendedCount: number;
  activePlaceholdersCount: number;
  activeRightsCount: number;
  openActionsCount: number;
  overridesCount: number;
}

export interface ProvenanceSummary {
  liveCount: number;
  demoCount: number;
  fallbackCount: number;
  dominantProvenance: 'PARALLEL_LIVE' | 'DEMO_FIXTURE' | 'FALLBACK_FIXTURE' | 'MIXED';
}

export interface ClearanceBinderData {
  id: string; // e.g. 'bnd-9f8a7b6c'
  projectId: string;
  projectSummary: BinderProjectSummary;
  provenanceSummary: ProvenanceSummary;
  scenes: Array<{
    id: string;
    sceneNumber: number;
    heading: string;
    locationType: string;
    timeOfDay: string;
    readinessStatus?: string;
    occurrences: Array<{
      id: string;
      canonicalEntityId: string;
      surfaceMention?: string;
      excerptText: string;
      lineNumber?: number;
      clearanceStatus: string;
      effectiveStatus: string;
    }>;
  }>;
  sceneReadinessSchedule: SceneReadinessAssessment[];
  canonicalEntities: CanonicalEntityData[];
  rightsAgreements: RightsRecordData[];
  placeholders: ReplacementPlaceholderData[];
  unresolvedActions: ClearanceActionItem[];
  citationsIndex: ClearanceCitation[];
  replacementCatalog: ReplacementCardData[];
  overridesHistory: CounselOverride[];
  exportedAt: string; // ISO 8601 string
  integrityDigest: string; // SHA-256 hex digest
  disclaimer: string;
}
```
