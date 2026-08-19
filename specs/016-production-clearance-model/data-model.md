# Data Model: Production Clearance Operating Model (Phase 2)

**Feature**: `specs/016-production-clearance-model` | **Date**: 2026-08-19

---

## 1. Scene Entity Occurrence Schema Extension

```typescript
export interface SceneEntityOccurrenceData {
  id: string;
  sceneId: string;
  canonicalEntityId: string;
  scriptLineNumber: number;
  excerptText: string;
  usageContext: string;
  sentimentScore?: number;
  exposureDurationSeconds?: number;
  
  // Phase 2 Occurrence-Level Evaluation Fields
  clearanceStatus?: ClearanceStatus;
  riskScore?: number;
  riskRationale?: string;
  contextFlags?: string[];
  citations?: any[];
  evaluatedAt?: string;
}

export interface CanonicalEntityData {
  id: string;
  projectId: string;
  canonicalName: string;
  entityCategory: EntityCategory;
  description: string;
  overallClearanceStatus: ClearanceStatus; // Deterministically derived from occurrences
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

## 2. Occurrence Evaluation & Canonical Roll-up Lifecycle

```mermaid
flowchart TD
    Script[Script Ingestion] --> Occurrences[Extract Scene Occurrences]
    Occurrences --> ResSearch[Canonical Grounding Search via Parallel Search]
    
    subgraph OccurrenceEvaluation["Occurrence-Level Evaluation (Primary)"]
        ResSearch --> Occ1["Scene 1 Occurrence (Incidental Use) -> NO_ISSUE_SURFACED"]
        ResSearch --> Occ2["Scene 4 Occurrence (Defamatory Context) -> ACTION_REQUIRED"]
    end
    
    subgraph CanonicalRollup["Deterministic Canonical Roll-Up (Derived)"]
        Occ1 --> RollupRule["Severity Max Calculation"]
        Occ2 --> RollupRule
        RollupRule --> DerivedStatus["Canonical Entity Status = ACTION_REQUIRED"]
    end

    subgraph OverrideLayer["Feature 003 Scene Override Layer"]
        CounselOvr["Scene 4 Counsel Sign-Off"] -.->|Overrides Occ 2| Occ2Effective["Scene 4 Effective: NO_ISSUE_SURFACED"]
        Occ2Effective --> DerivedStatus2["Effective Roll-Up: NO_ISSUE_SURFACED"]
    end
```
