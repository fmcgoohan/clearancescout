# Tasks: ClearanceScout Entertainment Clearance Workspace

**Feature**: `specs/001-clearance-workspace` | **Branch**: `001-clearance-workspace`  
**Input**: Plan from [`specs/001-clearance-workspace/plan.md`](plan.md), Spec from [`specs/001-clearance-workspace/spec.md`](spec.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, directory layout, and core toolchain configuration.

- [x] T001 Create backend `server/` and frontend `src/` directory structures per implementation plan
- [x] T002 Initialize Node/TypeScript Express project with `@google/adk`, `@google/genai`, `@parallel-web/sdk`, and `@google-cloud/firestore` dependencies in `package.json`
- [x] T003 [P] Configure TypeScript, Vite build tool, and Vitest test framework in `tsconfig.json` and `vite.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story work begins.

- [x] T004 [P] Implement environment configuration & Execution Mode resolver (`TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE`) in `server/config.ts`
- [x] T005 [P] Setup Google Cloud Firestore Native client initializer in `server/repositories/firestoreClient.ts`
- [x] T006 [P] Implement Server-Sent Events timeline broadcaster & chain-of-thought privacy sanitizer in `server/events/timelineEmitter.ts`
- [x] T007 [P] Implement Express server entrypoint with API routing and error handling middleware in `server/index.ts`
- [x] T008 [P] Create React single-page application shell and main layout in `src/App.tsx`

**Checkpoint**: Core backend server, Firestore client, and React shell ready. User story implementation can now begin.

---

## Phase 3: User Story 1 - Script Parsing & Canonical Entity Registry (Priority: P1) 🎯 MVP

**Goal**: Parse uploaded screenplays into scenes, extract entity mentions, and map them to project-wide canonical entity IDs ("Clear once, recognize everywhere").

**Independent Test**: Upload a script file containing repeated brand mentions across scenes; verify scenes are parsed, entities extracted, mapped to a single canonical ID, and saved in Firestore.

### Tests for User Story 1

- [x] T009 [P] [US1] Contract test for project creation and script parsing REST endpoints in `tests/contract/test_script_parser.test.ts`

### Implementation for User Story 1

- [x] T010 [P] [US1] Create Project and Scene Firestore repository classes in `server/repositories/ProjectRepo.ts` and `server/repositories/SceneRepo.ts`
- [x] T011 [P] [US1] Create CanonicalEntity and SceneEntityOccurrence repository class in `server/repositories/EntityRepo.ts`
- [x] T012 [P] [US1] Implement script parsing agent using `gemini-3.6-flash` in `server/agents/ScriptParserAgent.ts`
- [x] T013 [US1] Implement canonical entity deduplication workflow ("Clear once, recognize everywhere") in `server/workflows/canonicalRegistryWorkflow.ts` (depends on T010, T011, T012)
- [x] T014 [US1] Implement script upload and entity parsing REST endpoints (`POST /api/projects`, `POST /api/projects/:id/script`) in `server/api/projectRoutes.ts`
- [x] T015 [P] [US1] Implement script viewer and canonical entity registry UI components in `src/components/ScriptViewer.tsx` and `src/components/EntityRegistryTable.tsx`
- [x] T016 [US1] Connect frontend workspace view to project script API endpoints in `src/pages/WorkspacePage.tsx`

**Checkpoint**: User Story 1 complete (MVP). Scripts can be uploaded, parsed, and mapped to canonical entities.

---

## Phase 4: User Story 2 - Trademark Research Grounding & Legal Risk Assessment (Priority: P2)

**Goal**: Ground entity research using live `parallel-web` search SDK tools, evaluate scene context legal risk, assign risk statuses, and display source citations.

**Independent Test**: Trigger clearance evaluation on a canonical entity, verify `parallel-web` citation details and non-legal-advice disclaimer in response payload.

### Tests for User Story 2

- [x] T017 [P] [US2] Contract test for clearance risk evaluation endpoint in `tests/contract/test_clearance_eval.test.ts`

### Implementation for User Story 2

- [x] T018 [P] [US2] Create ClearanceRiskAssessment and Citation repository class in `server/repositories/AssessmentRepo.ts`
- [x] T019 [P] [US2] Implement native ADK search tool wrapping `@parallel-web/sdk` queries in `server/tools/parallelSearchTool.ts`
- [x] T020 [US2] Implement 3-step hybrid deterministic + Gemini 3.6 Flash clearance evaluator in `server/workflows/clearanceEvaluator.ts` (depends on T018, T019)
- [x] T021 [US2] Implement clearance evaluation REST endpoint (`POST /api/projects/:id/clearance/evaluate`) in `server/api/clearanceRoutes.ts`
- [x] T022 [P] [US2] Implement scene risk badge, legal disclaimer, and citation drawer UI components in `src/components/SceneRiskBadge.tsx` and `src/components/CitationDrawer.tsx`
- [x] T023 [US2] Integrate clearance evaluation actions and risk status display into workspace view in `src/pages/WorkspacePage.tsx`

**Checkpoint**: User Stories 1 AND 2 complete. Trademark research grounded with live citations and risk status categorization.

---

## Phase 5: User Story 3 - Replacement Brand & Artwork Concept Card Generation (Priority: P3)

**Goal**: Generate non-infringing fictional replacement brand names and Imagen 3 artwork concept cards for high-risk entities (`ACTION_REQUIRED`).

**Independent Test**: Request replacement brand generation for an entity marked `ACTION_REQUIRED`; verify a fictional name, visual design brief, and image URL are produced.

### Tests for User Story 3

- [x] T024 [P] [US3] Contract test for replacement brand generation endpoint in `tests/contract/test_replacement_gen.test.ts`

### Implementation for User Story 3

- [x] T025 [P] [US3] Create ReplacementConceptCard repository class in `server/repositories/ReplacementRepo.ts`
- [x] T026 [P] [US3] Implement replacement brand name generator agent using `gemini-3.6-flash` in `server/agents/ReplacementAgent.ts`
- [x] T027 [P] [US3] Implement native ADK Imagen 3 artwork generation tool in `server/tools/artworkTool.ts`
- [x] T028 [US3] Implement replacement generation REST endpoint (`POST /api/projects/:id/replacements/generate`) in `server/api/replacementRoutes.ts` (depends on T025, T026, T027)
- [x] T029 [P] [US3] Implement replacement card modal and concept card viewer component in `src/components/ReplacementCardModal.tsx`
- [x] T030 [US3] Integrate replacement card trigger with entity registry table in `src/components/EntityRegistryTable.tsx`

**Checkpoint**: User Stories 1, 2, AND 3 complete. Fictional replacement brands and visual artwork cards can be generated.

---

## Phase 6: User Story 4 - Multi-Tier Execution Modes & Observable Event Timeline (Priority: P4)

**Goal**: Support execution modes (`TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE`), stream live timeline execution events via SSE, and enforce chain-of-thought privacy.

**Independent Test**: Connect to timeline SSE endpoint, trigger clearance evaluation, and verify timeline events stream live without raw chain-of-thought exposure.

### Tests for User Story 4

- [x] T031 [P] [US4] Contract test for SSE timeline stream endpoint in `tests/contract/test_timeline_sse.test.ts`

### Implementation for User Story 4

- [x] T032 [P] [US4] Implement cached response provider for `DEMO_MODE` execution in `server/integrations/cache/demoCacheProvider.ts`
- [x] T033 [US4] Implement SSE timeline streaming endpoint (`GET /api/projects/:id/timeline/stream`) in `server/api/timelineRoutes.ts` (depends on T006)
- [x] T034 [P] [US4] Implement execution mode selector hook and real-time SSE subscriber hook in `src/hooks/useExecutionMode.ts` and `src/hooks/useTimelineSSE.ts`
- [x] T035 [P] [US4] Implement observable event timeline drawer component in `src/components/TimelineDrawer.tsx`
- [x] T036 [US4] Integrate timeline drawer and execution mode selector into main application header in `src/App.tsx`

**Checkpoint**: All user stories complete. Workspace fully interactive with multi-tier execution modes and SSE timeline.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: System integration testing, quickstart validation, and security auditing.

- [x] T037 [P] Implement end-to-end multi-mode integration test suite in `tests/integration/clearance_workflow.test.ts`
- [x] T038 Run quickstart validation scenarios defined in `specs/001-clearance-workspace/quickstart.md`
- [x] T039 Perform privacy audit verifying zero raw model chain-of-thought in logs, responses, or Firestore records
