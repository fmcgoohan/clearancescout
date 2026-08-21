# Tasks: Feature 021 Release State Integrity and Operator Trust

**Input Documents**:
- Spec: [`specs/021-release-state-integrity/spec.md`](spec.md)
- Plan: [`specs/021-release-state-integrity/plan.md`](plan.md)
- Data Model: [`specs/021-release-state-integrity/data-model.md`](data-model.md)
- Contracts: [`specs/021-release-state-integrity/contracts/`](contracts/)
- Quickstart Guide: [`specs/021-release-state-integrity/quickstart.md`](quickstart.md)

---

## Phase 1: Setup & Foundational Preparation

**Purpose**: Shared type declarations, state machine interfaces, and project snapshot schemas required across all user stories.

- [X] T001 [P] Declare `IngestionState` and `IngestionPhase` lifecycle types in `src/components/ScriptUploadModal.tsx` and `server/workflows/canonicalRegistryWorkflow.ts`
- [X] T002 [P] Define `ProjectWorkspaceSnapshot` schema and single-commit response type in `server/repositories/ProjectRepo.ts` and `src/pages/WorkspacePage.tsx`
- [X] T003 [P] Add `activeInCurrentDraft` and `occurrencesCount` fields to `CanonicalEntityData` in `server/repositories/EntityRepo.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and contract foundations that MUST be in place before story implementations.

- [X] T004 Define atomic snapshot getter method `ProjectRepo.getProjectSnapshot(projectId)` in `server/repositories/ProjectRepo.ts`
- [X] T005 [P] Implement snapshot serializer endpoint `GET /api/projects/:id/snapshot` in `server/api/projectRoutes.ts`
- [X] T006 [P] Add multi-tier token extraction helper for acronym and parenthetical normalization in `server/workflows/entityResolutionEngine.ts`

---

## Phase 3: User Story 1 - Deterministic Ingestion State Machine & Atomic Snapshot Synchronization (Priority: P1) 🎯 MVP

**Goal**: Implement the 7-phase ingestion state machine (`IDLE` → `UPLOADING` → `PARSING` → `EXTRACTING` → `RECONCILING` → `COMPLETE` / `FAILED`), lock duplicate submits, enforce live elapsed progress, and synchronize workspace UI atomically from a single committed snapshot.

**Independent Test**: Ingest `Big-Fish.fountain.txt` and verify sequential state transitions with live elapsed timers, duplicate-click blocking, no intermediate count jumps, and simultaneous single-snapshot UI refresh.

### Tests for User Story 1
- [X] T007 [P] [US1] Contract test for atomic ingestion lifecycle and single snapshot response in `tests/contract/test_chunked_script_ingestion.test.ts`
- [X] T008 [P] [US1] Interaction test for upload button locking, elapsed timer, and snapshot update in `tests/contract/test_script_upload_modal_ui.test.ts`

### Implementation for User Story 1
- [X] T009 [US1] Update `CanonicalRegistryWorkflow.processScriptUpload` to return unified `ProjectWorkspaceSnapshot` in `server/workflows/canonicalRegistryWorkflow.ts`
- [X] T010 [US1] Update `POST /api/projects/:id/script` and `POST /api/projects/:id/script/upload` routes to respond with atomic snapshot in `server/api/projectRoutes.ts`
- [X] T011 [US1] Refactor `ScriptUploadModal.tsx` with explicit 7-phase state machine, honest progress (max 75% before complete), elapsed timer, duplicate submit lock, and `UPLOAD_TIMEOUT_MS = 270000` in `src/components/ScriptUploadModal.tsx`
- [X] T012 [US1] Update `WorkspacePage.tsx` to refresh scenes, entities, summary banner, shooting readiness, and actions concurrently from `snapshot` upon ingestion in `src/pages/WorkspacePage.tsx`

---

## Phase 4: User Story 2 - Interactive Accessible Overlays & Action Drawer Stacking (Priority: P1)

**Goal**: Guarantee visible, high-z-index modal and drawer rendering for "Actions" and "Timeline" with full keyboard navigation and accessible dismissals.

**Independent Test**: Click "Actions" and "Timeline" triggers and verify visible rendering above header (`z-100`) and workspace surfaces (`zIndex: 1400` / `1350`), focus management, and `Escape` key dismissal.

### Tests for User Story 2
- [X] T013 [P] [US2] Interaction test for Actions modal trigger, visibility, backdrop styling, and `Escape` dismiss in `tests/contract/test_action_notifications.test.ts`
- [X] T014 [P] [US2] Interaction test for Timeline drawer trigger, slide-in visibility, focus trap, and close button in `tests/contract/test_timeline_sse.test.ts`

### Implementation for User Story 2
- [X] T015 [US2] Standardize `ActionListModal.tsx` container with `zIndex: 1400`, `position: fixed`, backdrop filter, `role="dialog"`, and `aria-modal="true"` in `src/components/ActionListModal.tsx`
- [X] T016 [US2] Standardize `TimelineDrawer.tsx` container with `zIndex: 1350`, `position: fixed`, high-contrast styling, and keyboard listener in `src/components/TimelineDrawer.tsx`
- [X] T017 [US2] Ensure `ProductionDashboardModal.tsx` and `AccessTokenModal.tsx` match stacking standards (`zIndex: 1400`) in `src/components/ProductionDashboardModal.tsx` and `src/components/AccessTokenModal.tsx`
- [X] T018 [US2] Add keyboard `Escape` handling and focus restoration across modal triggers in `src/pages/WorkspacePage.tsx` and `src/App.tsx`

---

## Phase 5: User Story 3 - Generic Canonical Entity Disambiguation & Alias Normalization (Priority: P1)

**Goal**: Implement multi-tier generic lexical normalization to automatically merge acronyms, punctuation variations, parenthetical forms, and composite mentions (e.g. `Associated Press`, `A.P.`, `AP`, `A.P. (Associated Press)`, `Associated Press / A.P.`).

**Independent Test**: Ingest script mentions of `Associated Press`, `A.P.`, and `Associated Press / A.P.` and assert exactly 1 canonical entity is created with all aliases mapped and authentic surface excerpts preserved.

### Tests for User Story 3
- [X] T019 [P] [US3] Contract tests verifying generic alias merge matrix (`Associated Press`, `A.P.`, `AP`, `A.P. (Associated Press)`, `Associated Press / A.P.`) in `tests/contract/test_entity_resolution.test.ts`

### Implementation for User Story 3
- [X] T020 [US3] Implement parenthetical splitting and compound delimiter extraction (`/`, `|`, `aka`) in `server/workflows/entityResolutionEngine.ts`
- [X] T021 [US3] Implement multi-word acronym generation and dotted-token normalization in `server/workflows/entityResolutionEngine.ts`
- [X] T022 [US3] Update `CanonicalRegistryWorkflow` to register extracted surface aliases onto resolved canonical entities in `server/workflows/canonicalRegistryWorkflow.ts`

---

## Phase 6: User Story 4 - Occurrence-Grounded Current Draft Scoping & Historical Archival (Priority: P1)

**Goal**: Ground all active canonical entities by at least one valid occurrence on a current-draft scene, marking entities from superseded drafts as `NOT_IN_CURRENT_DRAFT` and excluding them from shooting readiness metrics.

**Independent Test**: Upload Draft 1 with Entity A and B, then upload Draft 2 with only Entity B; assert Entity A is archived as `NOT_IN_CURRENT_DRAFT` and shooting readiness calculates only against active Draft 2 items.

### Tests for User Story 4
- [X] T023 [P] [US4] Contract test for draft revision replacement, occurrence grounding, and `NOT_IN_CURRENT_DRAFT` scoping in `tests/contract/test_screenplay_versioning_lifecycle.test.ts`

### Implementation for User Story 4
- [X] T024 [US4] Update `EntityRepo` to compute `activeInCurrentDraft` and filter active registry items by `occurrencesCount > 0` in `server/repositories/EntityRepo.ts`
- [X] T025 [US4] Update `SceneReadinessEngine` to calculate blockers and readiness percentages strictly against active draft entities in `server/workflows/sceneReadinessEngine.ts`
- [X] T026 [US4] Add "Include Historical Revisions" toggle filter in `src/components/CanonicalEntityRegistry.tsx` and `src/pages/WorkspacePage.tsx`

---

## Phase 7: User Story 5 - Passive Timeline Idempotency & Side-Effect Free Observation (Priority: P1)

**Goal**: Ensure GET endpoints, dashboard polls, and SSE stream reconnections are completely side-effect free, eliminating timeline runaway and bounding event growth.

**Independent Test**: Open the workspace with an active SSE stream, simulate 5 minutes of passive polling and tab switches, and assert timeline event count remains strictly constant with 0 synthetic growth.

### Tests for User Story 7
- [X] T027 [P] [US5] Contract test verifying 0 new timeline events during passive GET polling and SSE reconnect cycles in `tests/contract/test_timeline_sse.test.ts`

### Implementation for User Story 7
- [X] T028 [US5] Audit all GET routes (`/api/projects`, `/api/projects/:id/timeline`, `/api/projects/:id/readiness`) to guarantee zero `timelineEmitter.emit` calls in `server/api/projectRoutes.ts` and `server/api/clearanceRoutes.ts`
- [X] T029 [US5] Implement client-side event deduplication by `id` in `useTimelineSSE.ts` (`setEvents(prev => prev.some(e => e.id === evt.id) ? prev : [...prev, evt])`) in `src/hooks/useTimelineSSE.ts`
- [X] T030 [US5] Prevent redundant history re-broadcast on SSE stream connect in `server/events/timelineEmitter.ts`

---

## Phase 8: User Story 6 - Truthful Provenance Labeling & Operational Recovery Guidance (Priority: P2)

**Goal**: Truthfully label screenplay source provenance (`The Neon Horizon (Bundled Fictional Demo)` vs authentic user uploads) and present actionable recovery guidance for operations exceeding 30 seconds.

**Independent Test**: Load the bundled demo screenplay and assert truthful fixture labeling; trigger a simulated delay and assert stage-specific guidance and cancel options appear.

### Tests for User Story 6
- [X] T031 [P] [US6] Contract test for truthful demo fixture labeling in `tests/contract/test_demo_fixture.test.ts`

### Implementation for User Story 6
- [X] T032 [US6] Update `demoAutomationWorkflow.ts` and `fixtureRoutes.ts` to explicitly set `source = 'The Neon Horizon (Bundled Fictional Demo)'` in `server/workflows/demoAutomationWorkflow.ts` and `server/api/fixtureRoutes.ts`
- [X] T033 [US6] Add 30-second duration recovery guidance banner and safe cancel trigger in `src/components/ScriptUploadModal.tsx`
- [X] T034 [US6] Update error alert banners with stage, error code, plain-language description, and single-click retry action in `src/components/ScriptUploadModal.tsx` and `src/pages/WorkspacePage.tsx`

---

## Phase 9: User Story 7 - Secondary Interface Refinement & Streamlined Header Controls (Priority: P3)

**Goal**: Polish application header, consolidate Binder Export into a single unified control, group table row actions, and ensure WCAG AA high-contrast status badges.

**Independent Test**: Verify clean header presentation with prominent project title, unified Binder Export menu, grouped table actions, and accessible contrast across all viewports.

### Implementation for User Story 7
- [X] T035 [US7] Refactor top header bar in `src/App.tsx` with quiet administrative controls, high-contrast project title, and unmistakable production company label in `src/App.tsx`
- [X] T036 [US7] Consolidate redundant binder export buttons into a single "Export Binder" dropdown control in `src/pages/WorkspacePage.tsx` and `src/components/ExportBinderModal.tsx`
- [X] T037 [US7] Group row actions (Edit, Delete, Research, Match, Replace) in `src/components/CanonicalEntityRegistry.tsx`
- [X] T038 [US7] Verify high-contrast text and color status badges with ARIA labels across `src/components/CanonicalEntityRegistry.tsx` and `src/components/SceneBreakdownView.tsx`

---

## Phase 10: Polish & End-to-End Rendered Browser QA Validation

**Purpose**: Execute full end-to-end rendered browser verification sequence and independent test suite.

- [X] T039 Execute full automated regression test suite via `npm test` across all 77 suites in `tests/`
- [X] T040 Execute clean production build validation via `npm run build`
- [X] T041 Execute end-to-end rendered browser verification sequence per `specs/021-release-state-integrity/quickstart.md` (Authenticate → Create project → Verify empty count agreement → Ingest script with progress → Assert atomic snapshot refresh → Trigger Actions & Timeline overlays → Verify alias merging → Verify 5-minute passive timeline stability → Verify historical draft archival)

---

## Dependencies & Execution Order

```mermaid
graph TD
    P1[Phase 1: Setup Types & Schemas] --> P2[Phase 2: Foundational Snapshot API & Tokenizer]
    P2 --> P3[Phase 3: US1 Ingestion State Machine & Atomic Snapshot]
    P2 --> P4[Phase 4: US2 Interactive Accessible Overlays]
    P2 --> P5[Phase 5: US3 Generic Canonical Alias Disambiguation]
    P2 --> P6[Phase 6: US4 Current-Draft Scoping & Archival]
    P2 --> P7[Phase 7: US5 Passive Timeline Idempotency]
    P3 --> P8[Phase 8: US6 Truthful Provenance & Guidance]
    P4 --> P9[Phase 9: US7 Secondary UX & Streamlined Header]
    P3 & P4 & P5 & P6 & P7 & P8 & P9 --> P10[Phase 10: Polish & Rendered Browser QA]
```

### Parallel Execution Opportunities
- **Foundational Phase**: T001, T002, T003 can execute in parallel.
- **Contract Tests**: T007, T008, T013, T014, T019, T023, T027, T031 can execute in parallel.
- **User Stories**: Once Phase 2 completes, US1, US2, US3, US4, and US5 can be developed in parallel across their respective files.

---

## Implementation Strategy (MVP First)

1. **Step 1 (Foundations)**: Deliver T001–T006 to establish snapshot schema and resolution tokenizers.
2. **Step 2 (MVP - US1)**: Complete T007–T012 to guarantee deterministic ingestion state transitions and atomic single-snapshot UI synchronization.
3. **Step 3 (P0 Overlay & Disambiguation Integrity - US2, US3, US4, US5)**: Complete T013–T030 to fix overlay z-index stacking, merge generic aliases (`Associated Press` / `A.P.`), ground active occurrences, and eliminate timeline runaway.
4. **Step 4 (Transparency & Polish - US6, US7)**: Complete T031–T038 for truthful provenance labels, recovery banners, quiet header, and consolidated export controls.
5. **Step 5 (Validation)**: Complete T039–T041 to verify the full suite and browser journey.
