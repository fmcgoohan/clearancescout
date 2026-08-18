# Implementation Plan: Manual Clearance Item Correction

**Feature Branch**: `006-manual-item-correction`  
**Date**: 2026-08-18  
**Status**: Planned  

---

## 1. Executive Summary & Architectural Context

Feature 006 empowers clearance coordinators to manually add, edit, or remove clearance items before or after research runs. User-edited values become the immediate source of truth across the entire platform. Modifying an entity's name or category invalidates prior automated risk assessments and citations while strictly preserving signed counsel overrides. Deletions cleanly remove entities from registries and compiled binders. Real-time actions stream `ITEM_ADDED`, `ITEM_EDITED`, and `ITEM_REMOVED` events over the observable action timeline SSE channel.

---

## 2. Constitution Alignment & Verification

| Principle | Status | Implementation Strategy |
|:---|:---:|:---|
| **I. Agent Framework & Models** | **PASS** | `gemini-3.6-flash` and Imagen 3 receive corrected entity names as updated prompt inputs. |
| **II. Live Grounding** | **PASS** | Research evaluations query the Parallel Search API using user-corrected names and categories. |
| **III. Architecture & Code Isolation** | **PASS** | Backend mutation routes in `server/api/entityMutationRoutes.ts` or `server/api/projectRoutes.ts`; repositories in `server/repositories/EntityRepo.ts`; UI in `src/components/ItemEditModal.tsx` and `src/components/EntityRegistryTable.tsx`. |
| **IV. Clearance Invariant & Invalidation** | **PASS** | Changing name or category invalidates automated assessments while preserving counsel overrides. Standard 4 clearance statuses maintained. |
| **V. Execution Modes** | **PASS** | All modes (`TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE`) support item corrections without mode drift. |
| **Observable Action Timeline** | **PASS** | Emits `ITEM_ADDED`, `ITEM_EDITED`, and `ITEM_REMOVED` SSE events without leaking chain-of-thought. |

---

## 3. Project Structure & Code Touchpoints

### Backend (`server/`)
- `server/repositories/EntityRepo.ts`: Add `updateCanonicalEntity`, `deleteCanonicalEntity`, `getEntityById`, `deleteOccurrencesByEntity`.
- `server/api/entityMutationRoutes.ts` (or `server/api/projectRoutes.ts`): Add `POST /api/projects/:id/entities`, `PATCH /api/projects/:id/entities/:entityId`, `DELETE /api/projects/:id/entities/:entityId`.
- `server/events/timelineEmitter.ts`: Support `ITEM_ADDED`, `ITEM_EDITED`, `ITEM_REMOVED` event types.

### Frontend (`src/`)
- `src/components/ItemEditModal.tsx`: New modal component for adding/editing clearance items.
- `src/components/EntityRegistryTable.tsx`: Add "Add Item", "Edit", and "Delete" buttons and wiring.
- `src/pages/WorkspacePage.tsx`: Wire mutation callbacks and workspace refresh.
- `src/components/TimelineDrawer.tsx`: Render `ITEM_ADDED`, `ITEM_EDITED`, `ITEM_REMOVED` events with appropriate badges.

### Tests (`tests/`)
- `tests/contract/test_item_mutation_api.test.ts`: Contract test for entity add, edit, and delete endpoints.
- `tests/integration/item_correction_workflow.test.ts`: End-to-end integration test for manual edit -> invalidation -> research against corrected name -> binder export.

---

## 4. Implementation Phases

1. **Phase 1: Setup & Data Access Layer**: Extend `EntityRepo` with mutation and deletion methods; update `timelineEmitter` with new event types.
2. **Phase 2: REST API Endpoints**: Implement `POST`, `PATCH`, `DELETE` routes with input validation and assessment invalidation.
3. **Phase 3: Frontend UI Components**: Create `ItemEditModal.tsx` and integrate edit/add/delete actions into `EntityRegistryTable.tsx` and `TimelineDrawer.tsx`.
4. **Phase 4: Verification & Regression Testing**: Run contract, unit, and integration test suites, ensuring 100% pass rate.
