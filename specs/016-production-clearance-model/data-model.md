# Data Model: Production Clearance Operating Model (Phase 8)

**Feature**: `specs/016-production-clearance-model` (Phase 8 Focus)  
**Date**: 2026-08-19  
**Status**: Completed  

---

## 1. Replacement Attempt & Self-Clearance Data Models

### `ReplacementAttemptRecord`
Captures every individual candidate generation and search grounding attempt within the $\le 3$ iteration loop:

```typescript
export interface ReplacementAttemptRecord {
  attemptNumber: number;          // 1, 2, or 3
  candidateName: string;
  designBrief: string;
  eraAesthetic: string;
  clearanceStatus: ClearanceStatus;  // 'NO_ISSUE_SURFACED' | 'ACTION_REQUIRED' | 'REVIEW_RECOMMENDED' | 'INSUFFICIENT_EVIDENCE'
  collisionRationale?: string;
  negativeConstraintsApplied?: string[];
  citations: ClearanceCitation[];
  provenance: ProvenanceType;     // 'PARALLEL_LIVE' | 'FALLBACK_FIXTURE' | 'LOCAL_MOCK'
  timestamp: string;
}
```

### `ReplacementCardData` (Updated for Live Self-Clearance)
```typescript
export interface ReplacementCardData {
  id: string;
  projectId: string;
  canonicalEntityId: string;
  targetEntityName: string;
  fictionalBrandName: string;
  designBrief: string;
  eraAesthetic: string;
  artworkImageUrl: string;
  nonInfringementRationale: string;
  clearanceStatus: ClearanceStatus;
  selfClearanceResult: 'ACCEPTED' | 'ESCALATED_TO_COUNSEL';
  totalAttempts: number;
  attemptHistory: ReplacementAttemptRecord[];
  citations: ClearanceCitation[];
  provenance: ProvenanceType;
  status: 'APPROVED' | 'PROPOSED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. 4-Event SSE Stream Specification

| SSE Event Name | Event Payload Key Fields | Trigger Point |
|:---|:---|:---|
| `REPLACEMENT_ATTEMPT` | `canonicalEntityId`, `candidateName`, `eraAesthetic`, `attemptNumber` | Generated new candidate from Gemini model. |
| `REPLACEMENT_RESEARCH_STARTED` | `canonicalEntityId`, `candidateName`, `attemptNumber` | Dispatched Parallel Search query for trademark grounding. |
| `REPLACEMENT_REJECTED` | `canonicalEntityId`, `candidateName`, `attemptNumber`, `rejectionStatus`, `collisionRationale` | Conflict or trademark collision detected; loop continues with added negative constraints. |
| `REPLACEMENT_ACCEPTED` | `canonicalEntityId`, `acceptedName`, `attemptNumber`, `totalAttempts`, `clearanceStatus` | Zero conflicts surfaced; loop accepts candidate and initiates artwork generation. |
