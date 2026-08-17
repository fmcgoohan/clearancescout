# Data Model: Clearance Binder Export & Studio Counsel Review Module

**Feature**: `specs/003-counsel-review-binder` | **Date**: 2026-08-18 (Updated)

---

## 1. Entity Definitions

### `ProvenanceType`
```typescript
export type ProvenanceType = 'PARALLEL_LIVE' | 'DEMO_FIXTURE' | 'FALLBACK_FIXTURE';
```

### `ProvenanceSummary`
```typescript
export interface ProvenanceSummary {
  liveCount: number;
  demoCount: number;
  fallbackCount: number;
  dominantProvenance: 'PARALLEL_LIVE' | 'DEMO_FIXTURE' | 'FALLBACK_FIXTURE' | 'MIXED';
}
```

### `CounselOverride`
Persisted in Firestore under `projects/{projectId}/overrides/{overrideId}`:

```typescript
export interface CounselOverrideData {
  id: string;
  projectId: string;
  canonicalEntityId: string;
  sceneId?: string; // Optional scene scope (undefined = project-wide canonical override)
  previousStatus: ClearanceStatus;
  overrideStatus: ClearanceStatus;
  rationale: string;
  counselName: string;
  counselRole: string;
  timestamp: string;
}
```

### `CanonicalEntityData` (Enhanced)
Persisted in Firestore under `projects/{projectId}/entities/{entityId}`:

```typescript
export interface CanonicalEntityData {
  id: string;
  projectId: string;
  canonicalName: string;
  entityCategory: EntityCategory;
  description: string;
  overallClearanceStatus: ClearanceStatus;
  isOverridden?: boolean; // Set to true ONLY for project-wide canonical overrides
  latestOverride?: {
    overrideId: string;
    overrideStatus: ClearanceStatus;
    rationale: string;
    counselName: string;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### `ClearanceBinderExport`
Exported bundle and persisted in `projects/{projectId}/binder_exports/{exportId}`:

```typescript
export interface ClearanceBinderExport {
  id: string;
  projectId: string;
  projectSummary: {
    title: string;
    productionCompany: string;
    scriptVersion: string;
    totalScenes: number;
    totalEntities: number;
    clearedCount: number;
    actionRequiredCount: number;
    reviewRecommendedCount: number;
    overridesCount: number;
  };
  provenanceSummary: ProvenanceSummary;
  scenes: SceneBreakdownItem[];
  canonicalEntities: CanonicalEntityData[];
  citationsIndex: Array<CitationItem & { provenance?: ProvenanceType }>;
  replacementCatalog: ReplacementCardData[];
  overridesHistory: CounselOverrideData[];
  exportedAt: string;
  integrityDigest: string; // SHA-256 integrity digest of canonical payload
  disclaimer: string;
}
```

---

## 2. Hierarchical Resolution Model

```
                    ┌─────────────────────────┐
                    │  Scene-Specific Override│
                    │      (if sceneId match) │
                    └───────────┬─────────────┘
                                │ (not found)
                                ▼
                    ┌─────────────────────────┐
                    │ Canonical Entity Override│
                    │  (isOverridden === true)│
                    └───────────┬─────────────┘
                                │ (not overridden)
                                ▼
                    ┌─────────────────────────┐
                    │ Automated Assessment    │
                    │ Baseline Verdict        │
                    └─────────────────────────┘
```
