# Data Model: Side-by-Side Original and Replacement Comparison

**Feature**: `specs/008-replacement-comparison` | **Date**: 2026-08-18

---

## 1. Comparison View Model (`ComparisonViewModel`)

Compound interface returned by `GET /api/projects/:id/entities/:entityId/comparison` and consumed by UI modals and binder exports.

```typescript
export interface OriginalEntitySummary {
  id: string;
  canonicalName: string;
  entityCategory: string;
  description: string;
  overallClearanceStatus: ClearanceStatus;
  riskScore: number;
  legalRationale: string;
  citations: ClearanceCitation[];
  isOverridden?: boolean;
  latestOverride?: {
    overrideStatus: ClearanceStatus;
    rationale: string;
    counselName: string;
    timestamp: string;
  };
}

export interface ReplacementSummary {
  id: string;
  replacementName: string;
  entityCategory: string;
  clearanceStatus: ClearanceStatus;
  isEscalated: boolean;
  attemptsCount: number;
  generationPrompt: string;
  visualStyle: string;
  cardImageSvg?: string;
  citations: ClearanceCitation[];
}

export interface CandidateAttemptSummary {
  attemptNumber: number;
  candidateName: string;
  riskStatus: ClearanceStatus;
  rejectionRationale?: string;
  negativeConstraintsApplied?: string[];
  timestamp: string;
}

export interface ComparisonViewModel {
  projectId: string;
  original: OriginalEntitySummary;
  replacement: ReplacementSummary;
  attemptHistory: CandidateAttemptSummary[];
}
```
