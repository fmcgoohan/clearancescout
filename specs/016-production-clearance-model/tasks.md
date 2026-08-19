# Tasks: Production Clearance Operating Model (Phases 1, 2, 3, 4, 5, 6 & 7)

**Feature**: `specs/016-production-clearance-model` | **Branch**: `016-production-clearance-model`  
**Input**: Plan from [`specs/016-production-clearance-model/plan.md`](plan.md), Spec from [`specs/016-production-clearance-model/spec.md`](spec.md)  
**Scope**: Phase 1 (Completed), Phase 2 (Completed), Phase 3 (Completed), Phase 4 (Completed), Phase 5 (Completed), Phase 6 (Completed) & Phase 7 (Active Target). Phases 8 through 10 are deliberately excluded from this task list.

---

## Phase 1: Setup (Phase 1 Shared Infrastructure - Completed)

**Purpose**: Extend Project repository data structures with `projectType` and list query method.

- [X] T001 [P] Extend `ProjectData` schema and methods in `server/repositories/ProjectRepo.ts` with `projectType` (`'Movie' | 'TV Show' | 'Commercial'`, default `'Movie'`) and implement `listProjects()`

---

## Phase 2: Foundational (Phase 1 Prerequisites - Completed)

**Purpose**: Implement project listing endpoint and type validation.

- [X] T002 [P] Implement `GET /api/projects` endpoint and update `POST /api/projects` in `server/api/projectRoutes.ts` to validate and return `projectType` and clearance summaries

---

## Phase 3: User Story 1 - Project Type & Production Projects UX (Priority: P1 - Completed) 🎯 MVP

**Goal**: Enable creating projects of type `Movie`, `TV Show`, and `Commercial`, listing projects, and displaying project type and clearance summary in the workspace header.

- [X] T003 [P] [US1] Contract test for project creation with type (`Movie`, `TV Show`, `Commercial`) and project listing in `tests/contract/test_project_types.test.ts`
- [X] T004 [P] [US1] Create project selector and creation modal in `src/components/ProjectListModal.tsx` allowing project switching and new production creation
- [X] T005 [US1] Update `src/App.tsx` to integrate `ProjectListModal`, display `projectType` badge in header, and render landing clearance summary

---

## Phase 4: Polish & Integration (Phase 1 Polish - Completed)

**Purpose**: Phase 1 integration testing, quickstart validation, and build verification.

- [X] T006 [P] Implement end-to-end integration test in `tests/integration/production_projects_workflow.test.ts` verifying project type creation, project list retrieval, switching, and landing workspace summary
- [X] T007 Run quickstart validation scenarios defined in `specs/016-production-clearance-model/quickstart.md`
- [X] T008 Verify production build (`tsc && vite build`) and full Vitest test suite (`npm test`) across all test suites with 0 regressions

---

## Phase 5: Phase 2 Setup (Occurrence Data Structures - Completed)

**Purpose**: Extend `SceneEntityOccurrenceData` with evaluation metrics and roll-up methods.

- [X] T009 [P] Extend `SceneEntityOccurrenceData` with evaluation fields (`clearanceStatus`, `riskScore`, `riskRationale`, `citations`, `contextFlags`, `evaluatedAt`) and implement `updateOccurrenceEvaluation` and `computeDerivedCanonicalStatus` in `server/repositories/EntityRepo.ts`

---

## Phase 6: Phase 2 Foundational (Occurrence Evaluator Engine - Completed)

**Purpose**: Implement occurrence-level evaluation workflow with scene context analysis and canonical roll-up calculation.

- [X] T010 [P] Implement `evaluateOccurrenceClearance` and update `evaluateEntityClearance` in `server/workflows/clearanceEvaluator.ts` to evaluate scene context and deterministically update canonical roll-up status

---

## Phase 7: User Story 2 - Occurrence-Level Evaluation as Fundamental Unit (Priority: P2 - Completed) 🎯 Phase 2 Target

**Goal**: Evaluate clearance risk per scene occurrence using specific scene action context rather than solely evaluating abstract global entities, and derive canonical entity status from occurrences.

- [X] T011 [P] [US2] Contract test for occurrence evaluation and derived canonical status roll-up in `tests/contract/test_occurrence_evaluation.test.ts`
- [X] T012 [P] [US2] Implement `POST /api/projects/:id/occurrences/:occurrenceId/evaluate` and `GET /api/projects/:id/entities/:entityId/occurrences` in `server/api/clearanceRoutes.ts`
- [X] T013 [US2] Update scene occurrence rendering in `src/pages/WorkspacePage.tsx` and `src/components/EntityDetailModal.tsx` to display occurrence-level clearance badges and scene context details

---

## Phase 8: Phase 2 Polish & Cross-Cutting Concerns (Completed)

**Purpose**: End-to-end multi-scene integration test, quickstart validation, and full regression test.

- [X] T014 [P] Implement end-to-end integration test in `tests/integration/occurrence_clearance_workflow.test.ts` verifying multi-scene occurrence isolation, differential risk scores, canonical roll-up, and 003 override preservation
- [X] T015 Run quickstart validation scenarios defined in `specs/016-production-clearance-model/quickstart.md`
- [X] T016 Verify production build (`tsc && vite build`) and full Vitest test suite (`npm test`) across all test suites with 0 regressions

---

## Phase 9: Phase 3 Setup (Entity Resolution & Hierarchy Repositories - Completed)

**Purpose**: Extend `CanonicalEntityData` schema with aliases, hierarchy relations, and merge methods in repository layer.

- [X] T017 [P] Extend `CanonicalEntityData` schema in `server/repositories/EntityRepo.ts` with `aliases?: string[]`, `parentEntityId?: string`, `parentEntityName?: string`, and `relationshipType?: EntityRelationshipType`, and implement repository methods `addAlias`, `removeAlias`, `setEntityRelationship`, and `mergeEntities(projectId, targetId, sourceId)`

---

## Phase 10: Phase 3 Foundational (Multi-Stage Entity Resolution Engine - Completed)

**Purpose**: Implement deterministic multi-stage entity resolution algorithm and integrate with script parser ingestion workflow.

- [X] T018 [P] Implement `EntityResolutionEngine` in `server/workflows/entityResolutionEngine.ts` providing deterministic multi-stage mention resolution (`EXACT_CANONICAL`, `ALIAS_MATCH`, `NORMALIZED_EQUIVALENCE`, `HIERARCHY_PARENT_MATCH`)
- [X] T019 [P] Integrate `EntityResolutionEngine` into `CanonicalRegistryWorkflow.ts` in `server/workflows/canonicalRegistryWorkflow.ts` to deduplicate entity mentions and map aliases during script parsing

---

## Phase 11: User Story 3 - Upgraded Entity Resolution, Aliases & Hierarchy (Priority: P3 - Completed) 🎯 Phase 3 Target

**Goal**: Support alias management, parent brand / product relationships, candidate mention resolution, and transactional entity merging.

- [X] T020 [P] [US3] Contract tests for alias management, entity resolution, hierarchy configuration, and entity merging in `tests/contract/test_entity_resolution.test.ts`
- [X] T021 [P] [US3] Implement `POST /api/projects/:id/entities/:entityId/aliases`, `DELETE /api/projects/:id/entities/:entityId/aliases/:alias`, `POST /api/projects/:id/entities/resolve`, `PATCH /api/projects/:id/entities/:entityId/relationship`, and `POST /api/projects/:id/entities/merge` in `server/api/entityMutationRoutes.ts`
- [X] T022 [US3] Update `src/components/ItemEditModal.tsx` to add alias management and parent brand / relationship selection
- [X] T023 [US3] Update `src/components/EntityRegistryTable.tsx` and `src/components/EntityDetailModal.tsx` to display aliases, parent brand badges, and entity merge action

---

## Phase 12: Phase 3 Polish & Cross-Cutting Concerns (Completed)

**Purpose**: End-to-end integration testing, quickstart validation, and full regression verification.

- [X] T024 [P] Implement end-to-end integration test in `tests/integration/entity_resolution_workflow.test.ts` verifying multi-scene alias deduplication, parent-child relationship inheritance, and occurrence re-linking upon merge
- [X] T025 Run quickstart validation scenarios defined in `specs/016-production-clearance-model/quickstart.md`
- [X] T026 Verify production build (`tsc && vite build`) and full Vitest test suite (`npm test`) across all test suites with 0 regressions

---

## Phase 13: Phase 4 Setup (Rights & Restrictions Repository - Completed)

**Purpose**: Create `RightsRecordData` domain models and `RightsRepo` for contractual rights persistence, occurrence linking, and coverage evaluation.

- [X] T027 [P] Create `RightsRecordData` schema, enums (`GrantType`, `TerritoryType`, `MediaWindowType`, `RightsStatus`), and `RightsRepo` in `server/repositories/RightsRepo.ts` with CRUD methods, occurrence linking, and `evaluateRightsCoverage(projectId, canonicalEntityId, occurrenceId, queryDate)`

---

## Phase 14: Phase 4 Foundational (Evaluator Integration & REST Endpoints - Completed)

**Purpose**: Integrate rights coverage evaluation into `clearanceEvaluator.ts` and implement rights REST API endpoints.

- [X] T028 [P] Integrate `rightsRepo.evaluateRightsCoverage` into `evaluateOccurrenceClearance` and `evaluateEntityClearance` in `server/workflows/clearanceEvaluator.ts` to factor active licenses into risk scoring and flag covenants in `contextFlags`
- [X] T029 [P] Implement Express router in `server/api/rightsRoutes.ts` (`POST /projects/:id/rights`, `GET /projects/:id/rights`, `GET /projects/:id/entities/:entityId/rights`, `GET /projects/:id/rights/:rightsId`, `PATCH /projects/:id/rights/:rightsId`, `DELETE /projects/:id/rights/:rightsId`) and mount router in `server/index.ts`

**Checkpoint**: Rights repository and API ready - UI integration and test suites can proceed in parallel.

---

## Phase 15: User Story 4 - Rights & Restrictions as First-Class Domain Objects (Priority: P4 - Completed) 🎯 Phase 4 Target

**Goal**: Record and query contractual rights, licensed territories, media windows, expiration dates, and covenants linked to entities and occurrences.

- [X] T030 [P] [US4] Contract tests for rights creation, entity/occurrence linking, listing, update, delete, and coverage queries in `tests/contract/test_rights_management.test.ts`
- [X] T031 [P] [US4] Create `src/components/RightsModal.tsx` for creating, viewing, and editing rights licenses, territorial grants, media windows, and contractual covenants
- [X] T032 [US4] Update `src/components/EntityRegistryTable.tsx`, `src/components/EntityDetailModal.tsx`, and `src/pages/WorkspacePage.tsx` to render rights badges and trigger `RightsModal`

---

## Phase 16: Phase 4 Polish & Cross-Cutting Concerns (Completed)

**Purpose**: End-to-end integration testing, quickstart validation, and full regression verification.

- [X] T033 [P] Implement end-to-end integration test in `tests/integration/rights_clearance_workflow.test.ts` verifying that attaching an active license clears clearance risk, enforces covenants in `contextFlags`, and detects expired licenses
- [X] T034 Run quickstart validation scenarios defined in `specs/016-production-clearance-model/quickstart.md`
- [X] T035 Verify production build (`tsc && vite build`) and full Vitest test suite (`npm test`) across all test suites with 0 regressions

---

## Phase 17: Phase 5 Setup (Scene Readiness Models & SceneRepo Extensions - Completed)

**Purpose**: Extend `SceneData` schema and `SceneRepo` with readiness fields and update methods.

- [X] T036 [P] Extend `SceneData` schema in `server/repositories/SceneRepo.ts` with `readinessStatus` (`'RED' | 'WORKING_CLEAR' | 'FINAL_CLEAR'`), `readinessEvaluatedAt`, `readinessDetails`, and add `updateSceneReadiness(projectId, sceneId, assessment)` and `getSceneReadiness(projectId, sceneId)`

---

## Phase 18: Phase 5 Foundational (Deterministic State Machine Engine & API Endpoints - Completed)

**Purpose**: Implement deterministic scene readiness evaluation and REST endpoints.

- [X] T037 [P] Implement `server/workflows/sceneReadinessEngine.ts` with `evaluateSceneReadiness(projectId, sceneId)` and `evaluateAllScenesReadiness(projectId)` computing `RED`, `WORKING CLEAR`, and `FINAL CLEAR` deterministically across occurrences, counsel overrides, rights coverage, and replacement cards
- [X] T038 [P] Implement Express router in `server/api/sceneRoutes.ts` (`GET /projects/:id/scenes/readiness`, `GET /projects/:id/scenes/:sceneId/readiness`, `POST /projects/:id/scenes/:sceneId/readiness/evaluate`, `POST /projects/:id/scenes/readiness/evaluate-all`) and mount in `server/index.ts`

**Checkpoint**: Scene readiness engine and API ready - UI integration and test suites can proceed in parallel.

---

## Phase 19: User Story 5 - Deterministic Scene Readiness State Machine (Priority: P5 - Completed) 🎯 Phase 5 Target

**Goal**: Evaluate each scene to determine shooting readiness (`RED`, `WORKING CLEAR`, or `FINAL CLEAR`) derived from occurrence verdicts, contractual rights, and replacement cards.

- [X] T039 [P] [US5] Contract tests for scene readiness queries, evaluations, and state transitions in `tests/contract/test_scene_readiness.test.ts`
- [X] T040 [P] [US5] Update `src/components/ScriptViewer.tsx` to render scene readiness badges (`🔴 RED`, `🟡 WORKING CLEAR`, `🟢 FINAL CLEAR`) on scene headers with breakdown popover/tooltips
- [X] T041 [US5] Update `src/pages/WorkspacePage.tsx` to render a top-level Scene Readiness summary banner (`Final Clear`, `Working Clear`, `Red` counts) and refresh scene readiness on occurrence/rights/override changes

---

## Phase 20: Phase 5 Polish & Cross-Cutting Concerns (Completed)

**Purpose**: End-to-end integration testing, quickstart validation, and full regression verification.

- [X] T042 [P] Implement end-to-end integration test in `tests/integration/scene_readiness_workflow.test.ts` verifying full multi-scene script ingestion, initial `RED` blocking, replacement card transition to `WORKING CLEAR`, signed override transition to `FINAL CLEAR`, and clean scene automatic `FINAL CLEAR`
- [X] T043 Run quickstart validation scenarios defined in `specs/016-production-clearance-model/quickstart.md`
- [X] T044 Verify production build (`tsc && vite build`) and full Vitest test suite (`npm test`) across all test suites with 0 regressions

---

## Phase 21: Phase 6 Setup (Action & Notification Repository - Completed)

**Purpose**: Create `ClearanceActionItem`, `ClearanceNotification` schemas and `ActionNotificationRepo` for persistence and auto-resolution.

- [X] T045 [P] Create `ClearanceActionItem`, `ClearanceNotification` domain models, enums (`ClearanceActionType`, `DepartmentTarget`, `ActionPriority`, `ActionStatus`), and `ActionNotificationRepo` in `server/repositories/ActionNotificationRepo.ts` with CRUD, department filtering, and auto-resolution methods

---

## Phase 22: Phase 6 Foundational (Automated Action Dispatcher & REST Endpoints - Completed)

**Purpose**: Implement automated department action routing, auto-resolution triggers, and REST endpoints.

- [X] T046 [P] Implement `server/workflows/actionDispatcher.ts` with automated department routing (`ART_DEPT`, `LEGAL_COUNSEL`, `LOCATIONS`, `PRODUCTION_MGMT`), state transition event listeners, and auto-resolution triggers
- [X] T047 [P] Implement Express router in `server/api/actionRoutes.ts` (`GET /projects/:id/actions`, `PATCH /projects/:id/actions/:actionId`, `GET /projects/:id/notifications`, `PATCH /projects/:id/notifications/:notifId/read`, `POST /projects/:id/actions/sync`) and mount in `server/index.ts`

**Checkpoint**: Action dispatcher and API ready - UI integration and test suites can proceed in parallel.

---

## Phase 23: User Story 6 - Action & Notification Lists Derived from State Transitions (Priority: P6 - Completed) 🎯 Phase 6 Target

**Goal**: Automatically generate department-routed to-do action items and high-priority shoot block alerts upon clearance state transitions, and auto-resolve them upon mitigation.

- [X] T048 [P] [US6] Contract tests for action dispatch, department filtering, status updates, and auto-resolution in `tests/contract/test_action_notifications.test.ts`
- [X] T049 [P] [US6] Create `src/components/ActionListModal.tsx` allowing department-filtered viewing (`Art Dept`, `Legal`, `Locations`, `Production Management`), status updates, and manual resolution
- [X] T050 [US6] Update `src/pages/WorkspacePage.tsx` to render an `📋 Actions (${count})` header trigger with active blocker badge and wire up action list modal and auto-refresh

---

## Phase 24: Phase 6 Polish & Cross-Cutting Concerns (Completed)

**Purpose**: End-to-end integration testing, quickstart validation, and full regression verification.

- [X] T051 [P] Implement end-to-end integration test in `tests/integration/action_workflow.test.ts` verifying script ingestion action generation, scene `RED` alert broadcasting, and multi-department auto-resolution
- [X] T052 Run quickstart validation scenarios defined in `specs/016-production-clearance-model/quickstart.md`
- [X] T053 Verify production build (`tsc && vite build`) and full Vitest test suite (`npm test`) across all test suites with 0 regressions

---

## Phase 25: Phase 7 Setup (Placeholder Data Models & PlaceholderRepo)

**Purpose**: Create `ReplacementPlaceholderData` schemas, enums, and `PlaceholderRepo` for multi-category placeholder persistence.

- [ ] T054 [P] Create `ReplacementPlaceholderData` domain model, enums (`PlaceholderAssetCategory`, `PlaceholderClearanceTier`), category details map, and `PlaceholderRepo` in `server/repositories/PlaceholderRepo.ts` with CRUD, category filtering, and tier update methods

---

## Phase 26: Phase 7 Foundational (Scene Readiness Integration & REST Endpoints)

**Purpose**: Integrate placeholders with scene readiness state machine and implement REST endpoints.

- [ ] T055 [P] Update `server/workflows/sceneReadinessEngine.ts` to evaluate `TEMP_APPROVED` placeholders (yielding `WORKING CLEAR`) and `FINAL_CLEARED` placeholders (yielding `FINAL CLEAR`)
- [ ] T056 [P] Implement Express router in `server/api/placeholderRoutes.ts` (`GET /projects/:id/placeholders`, `GET /projects/:id/entities/:entityId/placeholder`, `POST /projects/:id/placeholders`, `PATCH /projects/:id/placeholders/:placeholderId/tier`, `DELETE /projects/:id/placeholders/:placeholderId`) and mount in `server/index.ts`

**Checkpoint**: Placeholder engine and API ready - UI integration and test suites can proceed in parallel.

---

## Phase 27: User Story 7 - Generalized Replacement & Placeholder Management (Priority: P7) 🎯 Phase 7 Target

**Goal**: Manage fictional replacements and temporary production placeholders across brands, music, artwork, dialogue, and props, distinguishing between `TEMP_APPROVED` and `FINAL_CLEARED` tiers.

**Independent Test**: Attach music/dialogue/artwork placeholder with `TEMP_APPROVED`; verify scene is `WORKING CLEAR`. Promote placeholder to `FINAL_CLEARED`; verify scene upgrades to `FINAL CLEAR`.

### Tests for User Story 7

- [ ] T057 [P] [US7] Contract tests for placeholder CRUD, category-specific payload retention, tier transitions, and scene readiness impact in `tests/contract/test_placeholder_management.test.ts`

### Implementation for User Story 7

- [ ] T058 [P] [US7] Create `src/components/PlaceholderManagerModal.tsx` allowing users to configure domain-specific replacement assets (Music BPM/key, Dialogue alternatives, Artwork prompt/specs, Prop details) and promote/demote clearance tiers (`TEMP_APPROVED` $\leftrightarrow$ `FINAL_CLEARED`)
- [ ] T059 [US7] Update `src/components/EntityRegistryTable.tsx` and `src/components/EntityDetailModal.tsx` to display placeholder badges (`TEMP APPROVED`, `FINAL CLEARED`) and wire up `PlaceholderManagerModal`

**Checkpoint**: Phase 7 core functionality complete. Generalized placeholders operate across all 5 asset categories.

---

## Phase 28: Phase 7 Polish & Cross-Cutting Concerns

**Purpose**: End-to-end integration testing, quickstart validation, and full regression verification.

- [ ] T060 [P] Implement end-to-end integration test in `tests/integration/placeholder_clearance_workflow.test.ts` verifying brand, music, artwork, dialogue, and prop placeholders across script ingestion, on-set `TEMP_APPROVED` shooting, and legal `FINAL_CLEARED` delivery
- [ ] T061 Run quickstart validation scenarios defined in `specs/016-production-clearance-model/quickstart.md`
- [ ] T062 Verify production build (`tsc && vite build`) and full Vitest test suite (`npm test`) across all test suites with 0 regressions

---

## Dependencies & Execution Order

```mermaid
graph TD
    Phases1to6[Phases 1-6 Complete T001-T053] --> Phase25[Phase 25: PlaceholderRepo.ts T054]
    Phase25 --> Phase26_Engine[Phase 26: sceneReadinessEngine.ts T055]
    Phase25 --> Phase26_Routes[Phase 26: placeholderRoutes.ts T056]
    Phase26_Engine --> US7_Tests[T057: Contract Tests]
    Phase26_Routes --> US7_Tests
    Phase26_Routes --> US7_UI_Modal[T058: PlaceholderManagerModal.tsx]
    US7_UI_Modal --> US7_UI_Registry[T059: EntityRegistryTable & DetailModal]
    US7_Tests --> Phase28[Phase 28: Polish & Integration]
    US7_UI_Registry --> Phase28
```

---

## Parallel Execution Examples

### User Story 7
- `T055` (`sceneReadinessEngine.ts`) can run in parallel with `T056` (`server/api/placeholderRoutes.ts`).
- `T057` (`tests/contract/test_placeholder_management.test.ts`) can run in parallel with `T058` (`src/components/PlaceholderManagerModal.tsx`).

### Polish Phase
- `T060` (integration test in `tests/integration/placeholder_clearance_workflow.test.ts`) can run in parallel with `T061` (`quickstart.md`).
