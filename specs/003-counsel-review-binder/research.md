# Technical Research & Decisions: Clearance Binder Export & Studio Counsel Review Module

**Feature**: `specs/003-counsel-review-binder` | **Date**: 2026-08-18 (Updated)

---

## 1. Actual Result Evidence Provenance & Mixed Binder Aggregation

### Decision
1. Track and return an explicit `ProvenanceType` on every search result:
   - `PARALLEL_LIVE`: Live Parallel Search API executed successfully in `CLOUD_MODE` and returned grounded citations.
   - `DEMO_FIXTURE`: Synthetically generated deterministic benchmark fixtures in `DEMO_MODE` or `TEST_MODE`.
   - `FALLBACK_FIXTURE`: `CLOUD_MODE` was active but Parallel Search API was unavailable, missing keys, or failed, falling back to local fixtures with a prominent fail-visible warning.
2. In `binderExportWorkflow`, aggregate all citations in `citationsIndex` into a `provenanceSummary`:
   ```typescript
   export interface ProvenanceSummary {
     liveCount: number;
     demoCount: number;
     fallbackCount: number;
     dominantProvenance: 'PARALLEL_LIVE' | 'DEMO_FIXTURE' | 'FALLBACK_FIXTURE' | 'MIXED';
   }
   ```
   If a binder contains both live and fallback/demo citations, `dominantProvenance` is `'MIXED'` with individual counts displayed.

### Rationale
Labels in the UI, timeline SSE events, citations, and export binders must derive directly from the actual search result provenance rather than inferring the entire binder from only the first citation. Synthetic or fallback evidence must never be represented as "Live Parallel-Web Grounded Research".

---

## 2. Scene-Specific Override Isolation & Hierarchical Resolver

### Decision
1. **Isolation Rule**: When an override is submitted with a `sceneId`, it is saved in `OverrideRepo` with that `sceneId`. **`entityRepo.updateCanonicalEntityOverride` is NOT invoked**. The canonical entity retains its baseline `isOverridden: false` and automated `overallClearanceStatus`.
2. **Hierarchical Effective Status Resolver**:
   $$\text{Effective Status} = \text{Scene Override} \;\;??\;\; \text{Canonical Entity Override} \;\;??\;\; \text{Automated Risk Evaluation}$$

```typescript
export function resolveEffectiveClearanceStatus(
  entity: CanonicalEntityData,
  overrides: CounselOverrideData[],
  sceneId?: string
): ClearanceStatus {
  if (sceneId) {
    const sceneOverrides = overrides
      .filter((o) => o.canonicalEntityId === entity.id && o.sceneId === sceneId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (sceneOverrides.length > 0) {
      return sceneOverrides[0].overrideStatus;
    }
  }

  const canonicalOverrides = overrides
    .filter((o) => o.canonicalEntityId === entity.id && !o.sceneId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (canonicalOverrides.length > 0) {
    return canonicalOverrides[0].overrideStatus;
  }

  if (entity.isOverridden && entity.latestOverride) {
    return entity.latestOverride.overrideStatus;
  }

  return entity.overallClearanceStatus;
}
```

### Rationale
A scene-specific legal exception (e.g., clearance for a specific background prop in Scene 1) should not inadvertently mark the entire canonical entity as overridden project-wide, which would prevent other scenes from properly receiving automated evaluations.

---

## 3. SHA-256 Integrity Digest Terminology

### Decision
Rename all API fields, UI labels, spec language, tests, and contracts from `auditSignature` / *"Cryptographic SHA-256 Audit Signature"* to `integrityDigest` / *"SHA-256 Integrity Digest"*.

### Rationale
An unkeyed SHA-256 hash verifies data integrity against accidental modification or transport corruption, but does not provide non-repudiation or asymmetric cryptographic signing (PKI). Using accurate terminology avoids misleading legal counsel and insurers about the nature of the verification.

---

## 4. Preserved Anti-Overwrite & Unpopulated Counsel Input Invariants

### Invariants
1. **Anti-Overwrite Protection**: When `clearanceEvaluator.evaluateEntityClearance` or `entityRepo.updateCanonicalEntityStatus` runs, any entity with `isOverridden === true` preserves its manual legal status as authoritative while refreshing background citations and diagnostic scores.
2. **Unpopulated Counsel Inputs**: Counsel override form fields initialize empty with descriptive placeholders (`placeholder="e.g. Jane Doe, Esq."`), requiring authentic human entry before submission is enabled.

---

## 5. In-Script Badge Scene Status Resolution & SceneId Click Propagation

### Decision
1. `ScriptViewer.tsx` calculates in-script badge styling and colors using `resolveEffectiveClearanceStatus(matchedEntity, overrides, scene.id)`.
2. When a badge is clicked in `ScriptViewer`, it emits `onEntityClick(entityId, sceneId)` to pass the active `sceneId` up to `WorkspacePage` and `App`, populating `CitationDrawer`'s `sceneId` prop.
