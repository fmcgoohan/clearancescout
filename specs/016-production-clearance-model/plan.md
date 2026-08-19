# Implementation Plan: Production Clearance Operating Model (Phase 7 - Generalized Replacement & Placeholders)

**Branch**: `016-production-clearance-model` | **Date**: 2026-08-19 | **Status**: Plan Complete (Phase 7 Focus)  
**Specification**: [`specs/016-production-clearance-model/spec.md`](spec.md)

---

## 1. Summary of Feature & Phase 7 Scope

Phase 7 generalizes the fictional replacement mechanism (Feature 002) into a comprehensive **Replacement & Placeholder Management System** (`FR-008`, `US7`) supporting all 5 clearance domains:
- **`BRAND`**: Fictional brand names, trademark safety notes, packaging dimensions.
- **`ART_MUSIC`**: Musical key, tempo (BPM), style description, sync license notes.
- **`ARTWORK`**: Visual style, generation prompt, dimensions, image asset URL.
- **`DIALOGUE`**: Alternative scripted lines, legal subtext rationale.
- **`GRAPHIC_PROP`**: Physical specifications, safety clearances, prop placard details.

It establishes an explicit two-tier clearance lifecycle:
- **`TEMP_APPROVED`**: Interim on-set / shooting approval (yields `WORKING CLEAR` in scene readiness engine).
- **`FINAL_CLEARED`**: Unconditional permanent clearance for post-production picture lock & distribution (yields `FINAL CLEAR` in scene readiness engine).

### Core Objectives (Phase 7 Only):
1. **Domain Model (`FR-008`, `US7`)**:
   - Define `PlaceholderAssetCategory`, `PlaceholderClearanceTier` (`'TEMP_APPROVED' | 'FINAL_CLEARED'`), and `ReplacementPlaceholderData` with category-specific details payload.
2. **Repository Layer (`server/repositories/PlaceholderRepo.ts`)**:
   - Manage Firestore collection `projects/{projectId}/placeholders/{placeholderId}`.
   - Support CRUD, tier promotion (`TEMP_APPROVED` $\to$ `FINAL_CLEARED`), and entity lookup.
3. **Integration with Scene Readiness State Machine (`server/workflows/sceneReadinessEngine.ts`)**:
   - `FINAL_CLEARED` placeholder $\to$ elevates occurrence readiness to `FINAL_CLEAR`.
   - `TEMP_APPROVED` placeholder $\to$ provides `WORKING_CLEAR` shooting clearance.
4. **REST API Endpoints (`server/api/placeholderRoutes.ts`)**:
   - `GET /api/projects/:id/placeholders` (filter by category and tier)
   - `GET /api/projects/:id/entities/:entityId/placeholder`
   - `POST /api/projects/:id/placeholders`
   - `PATCH /api/projects/:id/placeholders/:placeholderId/tier`
   - `DELETE /api/projects/:id/placeholders/:placeholderId`
5. **Frontend UI Integration (`src/components/PlaceholderManagerModal.tsx`)**:
   - Modal supporting domain-specific configuration forms (Music BPM/key, Dialogue alternatives, Artwork prompt/style, Prop specs).
   - Instant promotion between `TEMP_APPROVED` and `FINAL_CLEARED` with role sign-off.
   - Wired into `EntityRegistryTable.tsx` and `EntityDetailModal.tsx`.
6. **Strict Scope Boundary**:
   - Phases 8 through 10 (live self-clearance loop, production dashboard, final clearance binder export) remain strictly unbuilt until Phase 7 is implemented and converged.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | Placeholder records and deterministic tier calculations are pure TypeScript logic; image prompts adhere to Imagen standards. |
| **II. Live Grounding & Research Tooling** | **PASS** | Placeholders cite underlying entity research and clearance reasons. |
| **III. Architecture & Cloud Persistence** | **PASS** | Stored in Firestore under `projects/{projectId}/placeholders/{placeholderId}`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Placeholders link to canonical entities, elevating scene readiness deterministically. |
| **V. Multi-Tier Execution Modes** | **PASS** | Operates uniformly in `TEST_MODE`, `DEMO_MODE`, and `CLOUD_MODE`. |
| **Observable Action Timeline** | **PASS** | Emits `STATE_TRANSITION` events upon placeholder creation and tier promotion. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/016-production-clearance-model/research.md`](research.md))
- **Phase 1: Data Model & Schema** ([`specs/016-production-clearance-model/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/016-production-clearance-model/contracts/placeholders-contract.md`](contracts/placeholders-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/016-production-clearance-model/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/repositories/PlaceholderRepo.ts`:
  - New repository managing generalized replacement and placeholder records.
- `server/workflows/sceneReadinessEngine.ts`:
  - Updated to evaluate `TEMP_APPROVED` vs `FINAL_CLEARED` placeholder tiers.
- `server/api/placeholderRoutes.ts`:
  - Express routes for placeholder CRUD and tier promotion.
- `src/components/PlaceholderManagerModal.tsx` & `src/components/EntityRegistryTable.tsx`:
  - UI modal for managing domain-specific replacement assets and clearance tiers.
- `tests/contract/test_placeholder_management.test.ts`:
  - Contract test for category-specific placeholder creation, tier transitions, and scene readiness impact.
- `tests/integration/placeholder_clearance_workflow.test.ts`:
  - Integration test covering brand, music, artwork, dialogue, and prop placeholders.
