# Data Model & Schema Specifications: Feature 018 Production Hardening & Live Evidence Integrity

**Feature Branch**: `018-production-hardening`  
**Created**: 2026-08-20  
**Status**: Completed

---

## 1. Occurrence Context Interpretation Model

Represents the structured semantic analysis returned by Gemini 3.6 Flash when evaluating how an entity is depicted in a specific script scene.

```typescript
export interface OccurrenceContextInterpretation {
  prominence: 'HERO_FOREGROUND' | 'BACKGROUND_INCIDENTAL';
  modality: 'VISUAL_PROP' | 'DIALOGUE_MENTION' | 'BOTH';
  tone: 'FAVORABLE' | 'NEUTRAL' | 'DISPARAGING';
  endorsementImplication: boolean;
  safetyHazardDepiction: boolean;
  defamationRisk: boolean;
  extractedContextSnippet?: string;
}
```

### Deterministic Risk Derivation Rules
- If `tone === 'DISPARAGING'` or `defamationRisk === true`: Assign `ACTION_REQUIRED` (Risk Score $\ge 80$).
- If `safetyHazardDepiction === true` and `prominence === 'HERO_FOREGROUND'`: Assign `ACTION_REQUIRED` (Product liability / disparagement risk).
- If `endorsementImplication === true` and entity has registered trademark: Assign `ACTION_REQUIRED` or `REVIEW_RECOMMENDED` based on trademark classification.
- If `prominence === 'BACKGROUND_INCIDENTAL'` and `tone === 'NEUTRAL'` and zero conflicting marks: Eligible for `NO_ISSUE_SURFACED` (incidental background prop use).

---

## 2. Replacement Placeholder Entity Model (Enhanced with Scoping)

Represents an art department replacement asset with granular target scoping.

```typescript
export type PlaceholderScopeType = 'SINGLE_OCCURRENCE' | 'SELECTED_OCCURRENCES' | 'SELECTED_SCENES' | 'PROJECT_WIDE';

export interface ReplacementPlaceholderData {
  id: string;
  projectId: string;
  canonicalEntityId: string;
  canonicalName: string;
  suggestedName: string;
  placeholderTier: 'TEMP_APPROVED' | 'FINAL_CLEARED';
  approvalDate: string;
  visualDescription: string;
  rationale: string;
  scopeType: PlaceholderScopeType;
  occurrenceIds: string[];
  sceneIds: string[];
  isProjectWide: boolean;
}
```

### Scoping Validation & Coverage Rules
- When `scopeType === 'SINGLE_OCCURRENCE'`: `occurrenceIds` must contain exactly 1 occurrence ID.
- When `scopeType === 'SELECTED_SCENES'`: `sceneIds` must contain at least 1 scene ID.
- When `scopeType === 'PROJECT_WIDE'`: `isProjectWide` is set to `true`.
- An occurrence in scene $S$ is covered by placeholder $P$ if and only if:
  - $P$ covers occurrence ID $O$, OR
  - $P$ covers scene ID $S$, OR
  - $P.\text{isProjectWide} === \text{true}$.

---

## 3. Strict Scene Readiness Assessment Model

Represents the deterministic shooting readiness evaluation for a specific screenplay scene.

```typescript
export interface InterimMitigationRecord {
  occurrenceId: string;
  entityName: string;
  basis: 'TEMP_APPROVED_PLACEHOLDER' | 'INTERIM_RIGHTS' | 'COUNSEL_AUTHORIZATION';
  referenceId: string;
  details: string;
}

export interface SceneReadinessAssessment {
  sceneId: string;
  sceneNumber: number;
  header: string;
  status: 'FINAL_CLEAR' | 'WORKING_CLEAR' | 'RED';
  totalOccurrences: number;
  clearedOccurrences: number;
  interimMitigatedOccurrences: number;
  blockingOccurrences: number;
  blockers: string[];
  interimMitigations: InterimMitigationRecord[];
}
```

### Deterministic Readiness Classification
1. **`FINAL_CLEAR`**:
   - Every occurrence in the scene has resolved status `NO_ISSUE_SURFACED` OR has an active `FINAL_CLEARED` placeholder covering it OR has signed `FINAL_CLEAR` counsel approval.
2. **`WORKING_CLEAR`**:
   - The scene is NOT `FINAL_CLEAR`, but EVERY non-cleared occurrence possesses an auditable `InterimMitigationRecord` (`TEMP_APPROVED` placeholder within scope, interim rights agreement, or signed counsel interim authorization).
3. **`RED`**:
   - Any occurrence in the scene remains unmitigated (e.g. `ACTION_REQUIRED`, `INSUFFICIENT_EVIDENCE`, or `REVIEW_RECOMMENDED` without an affirmative interim mitigation).
