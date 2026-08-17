# Tasks: Clearance Binder Export & Studio Counsel Review Module

**Feature**: `specs/003-counsel-review-binder` | **Branch**: `003-counsel-review-binder`  
**Input**: Plan from [`specs/003-counsel-review-binder/plan.md`](plan.md), Spec from [`specs/003-counsel-review-binder/spec.md`](spec.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project configuration, event broadcasting, and environment setup.

- [ ] T001 Verify project structure and test paths for counsel review in `vite.config.ts` and `tsconfig.json`
- [ ] T002 Ensure event emitter supports `OVERRIDE_RECORDED` event type in `server/events/timelineEmitter.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data models, anti-overwrite invariants, and repositories required before user story implementation.

- [ ] T003 [P] Implement `CounselOverride` model with optional `sceneId` and `OverrideRepo` in `server/repositories/OverrideRepo.ts`
- [ ] T004 [P] Update `CanonicalEntity` schema with `isOverridden` and protect overridden entities from automated status overwrite in `server/repositories/EntityRepo.ts`
- [ ] T005 [P] Update `ClearanceBinder` schema to use `integrityDigest` (SHA-256) and record actual search result `provenance` in `server/repositories/BinderRepo.ts`

**Checkpoint**: Foundation ready - user story implementation can begin in parallel.

---

## Phase 3: User Story 1 - Downloadable Auditable Legal Clearance Binder with Integrity Digest (Priority: P1) 🎯 MVP

**Goal**: Generate, download, and verify a complete, timestamped Legal Clearance Binder (JSON & printable PDF format) containing scene breakdowns, risk flags, grounded research citations (accurately attributed as `PARALLEL_LIVE`, `DEMO_FIXTURE`, or `FALLBACK_FIXTURE`), replacement cards, and SHA-256 integrity digests.

**Independent Test**: Trigger clearance binder export in DEMO and CLOUD modes; verify complete payload with SHA-256 `integrityDigest`, download JSON, and preview printable layout with actual result provenance indicators.

### Tests for User Story 1

- [ ] T006 [P] [US1] Contract test for binder export with `integrityDigest` in `tests/contract/test_binder_export.test.ts`

### Implementation for User Story 1

- [ ] T007 [US1] Update `BinderExportWorkflow` to aggregate project summary, actual result provenance, and SHA-256 `integrityDigest` in `server/workflows/binderExportWorkflow.ts`
- [ ] T008 [US1] Update binder REST endpoints in `server/api/binderRoutes.ts`
- [ ] T009 [P] [US1] Enhance `BinderExportModal` with `@media print` styling, actual provenance badges, and SHA-256 `integrityDigest` display in `src/components/BinderExportModal.tsx`

**Checkpoint**: User Story 1 complete. Clearance binder export, SHA-256 integrity digest, and print-ready layout operational.

---

## Phase 4: User Story 2 - Studio Legal Counsel Decision Override with Hierarchical Scoping & Anti-Overwrite Invariant (Priority: P2)

**Goal**: Provide REST endpoints and UI controls allowing authorized studio legal counsel to override automated risk tiers project-wide or for specific scene occurrences with authentic (unpopulated) counsel identity entry and mandatory legal rationales, guaranteeing that subsequent automated batch re-evaluations never overwrite active human legal decisions.

**Independent Test**: Submit a counsel override for an entity with non-empty counsel name and optional scene scope; verify status updates in Firestore, `OVERRIDE_RECORDED` timeline event is emitted; re-run automated clearance evaluation and verify that the override status remains intact.

### Tests for User Story 2

- [ ] T010 [P] [US2] Contract test for hierarchical counsel override endpoints and anti-overwrite invariant in `tests/contract/test_counsel_override.test.ts`

### Implementation for User Story 2

- [ ] T011 [P] [US2] Implement override REST endpoints (`POST /api/projects/:id/entities/:entityId/override` with optional `sceneId` & `GET /api/projects/:id/entities/:entityId/overrides`) in `server/api/clearanceRoutes.ts`
- [ ] T012 [US2] Implement deterministic hierarchical resolver `resolveEffectiveClearanceStatus` (`scene override ?? canonical override ?? automated assessment`) and preserve `overallClearanceStatus` when `isOverridden === true` in `server/workflows/effectiveStatusResolver.ts` and `server/workflows/clearanceEvaluator.ts`
- [ ] T013 [US2] Add Counsel Override form with unpopulated fields, optional scene scope selector, and actual provenance headers (`PARALLEL_LIVE`, `DEMO_FIXTURE`, `FALLBACK_FIXTURE`) in `src/components/CitationDrawer.tsx`
- [ ] T014 [P] [US2] Update `EntityRegistryTable.tsx` to render "Overridden by Counsel" badges with rationale tooltips

**Checkpoint**: User Stories 1 AND 2 complete. Authoritative human legal decision overrides, hierarchical scoping, anti-overwrite protection, and audit history fully operational.

---

## Phase 5: User Story 3 - Multi-Scene In-Script Visual Highlighter (Priority: P3)

**Goal**: Highlight entity occurrences directly within screenplay dialogue and action lines using color-coded badges matching their effective hierarchical clearance status, with one-click opening of citation and counsel review drawers.

**Independent Test**: Load a parsed screenplay scene; verify all entity mentions are highlighted with color-coded badges matching effective hierarchical status (`scene override ?? canonical override ?? automated assessment`), and clicking an in-script badge opens the citation drawer.

### Tests for User Story 3

- [ ] T015 [P] [US3] Component test for script highlighting and badge clicks in `tests/contract/test_script_highlighter.test.ts`

### Implementation for User Story 3

- [ ] T016 [P] [US3] Implement dynamic regex tokenization and badge rendering with hierarchical status resolution in `src/components/ScriptViewer.tsx`
- [ ] T017 [US3] Connect script highlight badge click events to open `CitationDrawer` and focus entity in `src/pages/WorkspacePage.tsx` and `src/App.tsx`

**Checkpoint**: All user stories complete. In-script visual highlighting, hierarchical counsel overrides, and auditable binder exports unified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end integration testing, quickstart scenario validation, and production build verification.

- [ ] T018 [P] Implement end-to-end integration test verifying hierarchical scene override resolution and integrity digest verification in `tests/integration/counsel_review_workflow.test.ts`
- [ ] T019 Run quickstart validation scenarios defined in `specs/003-counsel-review-binder/quickstart.md`
- [ ] T020 Verify production build (`tsc && vite build`) and Vitest test suite (`npm test`)

---

## Dependencies & Execution Order

```mermaid
graph TD
    Phase1[Phase 1: Setup] --> Phase2[Phase 2: Foundational]
    Phase2 --> US1[Phase 3: US1 Downloadable Clearance Binder with Integrity Digest MVP]
    Phase2 --> US2[Phase 4: US2 Hierarchical Counsel Decision Override & Anti-Overwrite]
    Phase2 --> US3[Phase 5: US3 Multi-Scene In-Script Visual Highlighter]
    US1 --> Polish[Phase 6: Polish & Integration]
    US2 --> Polish
    US3 --> Polish
```
