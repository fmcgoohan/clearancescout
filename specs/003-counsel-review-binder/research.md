# Technical Research & Decisions: Clearance Binder Export & Studio Counsel Review Module

**Feature**: `specs/003-counsel-review-binder` | **Date**: 2026-08-18

---

## 1. Actual Result Evidence Provenance & Fail-Visible Fallbacks

### Decision
Track and return an explicit `ProvenanceType` on every search result:
- `PARALLEL_LIVE`: Live Parallel Search API executed successfully in `CLOUD_MODE` and returned grounded citations.
- `DEMO_FIXTURE`: Synthetically generated deterministic benchmark fixtures in `DEMO_MODE` or `TEST_MODE`.
- `FALLBACK_FIXTURE`: `CLOUD_MODE` was active but Parallel Search API was unavailable, missing keys, or failed, falling back to local fixtures with a prominent fail-visible warning.

### Rationale
Labels in the UI, timeline SSE events, citations, and export binders must derive directly from the actual search result provenance rather than merely inferring from the client's execution mode flag. Synthetic or fallback evidence must never be represented as "Live Parallel-Web Grounded Research".

---

## 2. Hierarchical Effective Status Resolver

### Decision
Implement a pure deterministic resolver function `resolveEffectiveClearanceStatus`:

$$\text{Effective Status} = \text{Scene Override} \;\;??\;\; \text{Canonical Entity Override} \;\;??\;\; \text{Automated Risk Evaluation}$$

```typescript
export function resolveEffectiveClearanceStatus(
  entity: CanonicalEntityData,
  overrides: CounselOverrideData[],
  sceneId?: string
): ClearanceStatus {
  if (sceneId) {
    const sceneOverride = overrides.find(
      (o) => o.canonicalEntityId === entity.id && o.sceneId === sceneId
    );
    if (sceneOverride) return sceneOverride.overrideStatus;
  }

  if (entity.isOverridden && entity.latestOverride) {
    return entity.latestOverride.overrideStatus;
  }

  return entity.overallClearanceStatus;
}
```

### Rationale
Screenplays often feature an entity that is broadly acceptable but flagged in a specific scene (e.g. defamation in a fight scene), or vice versa. Supporting both canonical project baseline overrides and scene-specific overrides provides production legal teams with granular control without introducing state incoherence.

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
