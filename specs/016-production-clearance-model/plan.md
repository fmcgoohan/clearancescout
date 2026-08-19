# Implementation Plan: Production Clearance Operating Model (Phase 3 - Upgraded Entity Resolution & Material Equivalence)

**Branch**: `016-production-clearance-model` | **Date**: 2026-08-19 | **Status**: Plan Complete (Phase 3 Focus)  
**Specification**: [`specs/016-production-clearance-model/spec.md`](spec.md)

---

## 1. Summary of Feature & Phase 3 Scope

Phase 3 upgrades the clearance operating model with **robust multi-surface entity resolution, alias management, brand/product hierarchies, and material equivalence reuse**.

### Core Objectives (Phase 3 Only):
1. **Alias Tracking & Multi-Surface Form Recognition (`FR-004`, `US3`)**:
   - Canonical entities store `aliases: string[]`.
   - Normalization and matching engine recognizes varied references (e.g. *"Coke"*, *"Coca-Cola Classic"*, *"Coke Zero"*) mapping to the authoritative canonical entity.
2. **Brand / Product Hierarchy Modeling (`FR-004`, `US3`)**:
   - Entities support parent-child relationships (`parentEntityId`, `parentEntityName`, `relationshipType`: `'BRAND_PRODUCT' | 'SUBSIDIARY' | 'PARENT_COMPANY' | 'PRODUCT_LINE' | 'VARIATION'`).
   - Child products inherit corporate ownership context while maintaining occurrence-specific risk tracking.
3. **Deterministic Multi-Stage Entity Resolution Engine (`FR-004`, `US3`)**:
   - Automated script parser and ingestion pipelines query `EntityResolutionEngine`:
     - Stage 1: Exact Canonical Name Match (confidence 1.0)
     - Stage 2: Exact Alias Match (confidence 0.95)
     - Stage 3: Normalized Lexical Equivalence (confidence 0.90)
     - Stage 4: Parent Brand Prefix / Product Line Match (confidence 0.85)
4. **Entity Merging & Material Equivalence Reuse (`FR-004`, `US3`)**:
   - Transactional merge operation combines duplicate entities, transfers all scene occurrences, aggregates aliases, deletes the duplicate record, and recomputes the derived canonical status.
5. **Preserve Invariants (003–015 & Phases 1–2)**:
   - 100% preservation of project types, occurrence-level evaluations, derived roll-up statuses, signed counsel overrides, SSE timelines, offline fixtures, and responsive UI.
6. **Strict Scope Boundary**:
   - Phases 4 through 10 (rights domain objects, scene readiness state machine, actions queue, placeholders, etc.) remain strictly unbuilt until Phase 3 is implemented and converged.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | Script parser and disambiguation utilize Gemini 3.6 Flash and deterministic resolution rules. |
| **II. Live Grounding & Research Tooling** | **PASS** | Grounding search citations retained; parent brand hierarchy avoids duplicate trademark queries. |
| **III. Architecture & Cloud Persistence** | **PASS** | Extended canonical entity schemas and alias arrays persisted atomically in Firestore via `EntityRepo.ts`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Direct fulfillment of *"Clear once, recognize everywhere, reassess when context changes"*. |
| **V. Multi-Tier Execution Modes** | **PASS** | Mode-locked execution (`TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE`) fully preserved. |
| **Observable Action Timeline** | **PASS** | Emits `STATE_TRANSITION` events upon alias matching, relationship configuration, and entity merging without CoT leakage. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/016-production-clearance-model/research.md`](research.md))
- **Phase 1: Data Model & Schema** ([`specs/016-production-clearance-model/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/016-production-clearance-model/contracts/entity-resolution-contract.md`](contracts/entity-resolution-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/016-production-clearance-model/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/repositories/EntityRepo.ts`:
  - Extend `CanonicalEntityData` with `aliases?: string[]`, `parentEntityId?: string`, `parentEntityName?: string`, `relationshipType?: EntityRelationshipType`.
  - Add repository methods: `addAlias`, `removeAlias`, `setEntityRelationship`, `mergeEntities(projectId, targetId, sourceId)`.
- `server/workflows/entityResolutionEngine.ts`:
  - Implement deterministic multi-stage entity resolution algorithm (`resolveEntityMention`).
- `server/workflows/canonicalRegistryWorkflow.ts`:
  - Integrate `entityResolutionEngine` into `processScriptUpload` to resolve entity mentions against existing canonical names and aliases.
- `server/api/entityMutationRoutes.ts` / `server/api/clearanceRoutes.ts`:
  - Add endpoints: `POST /entities/:entityId/aliases`, `DELETE /entities/:entityId/aliases/:alias`, `POST /entities/resolve`, `PATCH /entities/:entityId/relationship`, `POST /entities/merge`.
- `src/components/ItemEditModal.tsx` & `src/components/EntityDetailModal.tsx`:
  - Display and edit entity aliases, parent brand relationships, and surface mention provenance badges.
- `tests/contract/test_entity_resolution.test.ts`:
  - Contract test for alias management, multi-stage mention resolution, hierarchy linking, and entity merging.
- `tests/integration/entity_resolution_workflow.test.ts`:
  - End-to-end integration test verifying multi-scene alias deduplication, parent-child relationship inheritance, and occurrence re-linking upon merge.
