# Research: Production Clearance Operating Model (Phases 2 & 3)

**Feature**: `specs/016-production-clearance-model` | **Date**: 2026-08-19

---

## 1. Occurrence Context vs. Abstract Entity Risk (Phase 2 - Completed)

### Context
In film and television legal clearance, risk does not attach in the abstract—it attaches to **how an asset is depicted in a specific scene**.
- A car driven normally in Scene 1 poses zero tarnishment (`NO_ISSUE_SURFACED`).
- The same car depicted exploding due to "faulty steering" in Scene 4 creates acute trademark tarnishment and product disparagement liability (`ACTION_REQUIRED`).
- Conflating both into a single global entity status without occurrence tracking forces unnecessary replacements in scenes where the brand was used innocuously.

### Decision
- Make `SceneEntityOccurrenceData` the primary evaluation record.
- Evaluator processes `canonical entity research` + `occurrence excerpt text` + `scene action context`.
- Persist individual risk verdicts on each occurrence record.

---

## 2. Canonical Status Deterministic Roll-Up (Phase 2 - Completed)

### Context
Clearance coordinators still need a top-level summary of each brand or entity across the entire script.

### Decision
- Derive the canonical entity's `overallClearanceStatus` deterministically from its occurrences:
  - Severity ranking:
    1. `ACTION_REQUIRED` (Severity 4 - Red)
    2. `REVIEW_RECOMMENDED` (Severity 3 - Yellow)
    3. `INSUFFICIENT_EVIDENCE` (Severity 2 - Gray)
    4. `NO_ISSUE_SURFACED` (Severity 1 - Green)
- If an entity has multiple occurrences, its canonical status is the maximum severity across its active occurrences.
- If an entity has no occurrences, its status reflects baseline category risk.

---

## 3. Preserving 003 Scene Override Precedence (Phase 2 - Completed)

### Context
Feature 003 established that scene-specific counsel overrides take strict precedence over canonical overrides and baseline evaluations.

### Decision
- The resolution chain for an occurrence is:
  $$\text{Effective Occurrence} = \text{Scene Counsel Override} ?? \text{Occurrence Evaluated Status} ?? \text{Canonical Override} ?? \text{Baseline}$$
- The canonical roll-up evaluates each occurrence's *effective* status, so a signed scene override that clears a scene properly contributes to the project summary.

---

## 4. Upgraded Entity Resolution & Alias Management (Phase 3 - Active Target)

### Context
Screenplays and production notes refer to the same brand, character, song, or landmark using varied surface names, abbreviations, product variations, and informal nicknames (e.g., *"Coke"*, *"Coca-Cola"*, *"Diet Coke"*, *"Coca-Cola Classic"*, or *"911"*, *"Porsche 911"*, *"Porsche Carrera"*).
Without explicit alias tracking and resolution rules:
1. Duplicate canonical entities are created for minor textual variations.
2. Grounding search queries are re-executed repeatedly for identical corporate marks, wasting live research quotas and slowing down script parsing.
3. Clearance counsel sign-offs on a canonical brand fail to reflect on scenes referencing its common alias.

### Decision
- Extend `CanonicalEntityData` with `aliases: string[]`.
- Implement a deterministic multi-stage Entity Resolution Engine:
  1. **Stage 1 (Exact Canonical Match)**: Case-insensitive match against `canonicalName` (Confidence: 1.0, Match Rule: `EXACT_CANONICAL`).
  2. **Stage 2 (Exact Alias Match)**: Case-insensitive match against any entry in `aliases` (Confidence: 0.95, Match Rule: `ALIAS_MATCH`).
  3. **Stage 3 (Normalized Lexical Match)**: Stripped punctuation, normalized whitespace, and common suffix removal (Confidence: 0.90, Match Rule: `NORMALIZED_EQUIVALENCE`).
  4. **Stage 4 (Parent/Product Hierarchy Match)**: Prefix matching against registered parent brands and product lines (Confidence: 0.85, Match Rule: `HIERARCHY_PARENT_MATCH`).

---

## 5. Brand & Product Relationships (Hierarchy) (Phase 3 - Active Target)

### Context
Many cleared items are product lines, sub-brands, or models manufactured by a parent corporate brand (e.g. *Porsche 911* is a product of *Porsche AG*; *Summit Cola Zero* is a variation of *Summit Cola*).
Clearance research on the parent mark (trademark registration, corporate owner, known litigation posture) is directly relevant to child products.

### Decision
- Extend `CanonicalEntityData` with:
  - `parentEntityId?: string`
  - `parentEntityName?: string`
  - `relationshipType?: 'BRAND_PRODUCT' | 'SUBSIDIARY' | 'PARENT_COMPANY' | 'PRODUCT_LINE' | 'VARIATION'`
- When resolving candidate entities or performing clearance evaluation:
  - Child entities can inherit grounding citations and corporate ownership metadata from parent entities while preserving their own occurrence context and scene-specific risks.

---

## 6. Entity Merge & Material Equivalence Reuse Semantics (Phase 3 - Active Target)

### Context
When a clearance coordinator identifies that two distinct entities in the registry actually refer to the same real-world brand or asset (e.g., `Coke` and `Coca-Cola Can` were both extracted from different scenes), they need an atomic, audit-tracked operation to merge them without losing occurrences, research citations, or signed counsel overrides.

### Decision
- Provide a transactional merge workflow: `mergeEntities(projectId, targetCanonicalEntityId, sourceCanonicalEntityId)`:
  1. Transfer all occurrences from source entity to target entity.
  2. Append source entity's `canonicalName` and any existing `aliases` into target entity's `aliases` array (deduplicated).
  3. Transfer or merge citations and replacement cards if applicable.
  4. Delete the source entity record.
  5. Deterministically recompute target entity's derived roll-up status across all combined occurrences.
  6. Emit an observable `STATE_TRANSITION` timeline event detailing the entity merge.
