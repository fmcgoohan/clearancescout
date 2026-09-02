# Tasks: Honest Ingestion UX & Production Creation Flow

**Feature Directory**: `specs/029-honest-ingestion-ux`  
**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/api-contracts.md](./contracts/api-contracts.md)

---

## Phase 1: Setup & Environment

**Purpose**: Initialize feature branch structure and test baseline

- [x] T001 Verify git branch `029-honest-ingestion-ux` and feature directory `specs/029-honest-ingestion-ux`
- [x] T002 [P] Confirm existing tests compile and local dev environment is healthy

---

## Phase 2: Foundational Backend & Ingestion Preview Infrastructure

**Purpose**: Core in-memory extraction and validation endpoints

- [x] T003 Implement in-memory screenplay extraction preview method in `server/services/CanonicalRegistryWorkflow.ts` returning detected scenes, page count, and slugline headings without DB mutation
- [x] T004 Implement `POST /api/projects/:id/script/preview` endpoint in `server/api/projectRoutes.ts` per API contract
- [x] T005 [P] Update `POST /api/projects/:id/script/upload` and `POST /api/projects/:id/script` in `server/api/projectRoutes.ts` to return HTTP 422 `ZERO_SCENES_DETECTED` when extracted scenes count is 0

---

## Phase 3: User Story 1 - Unambiguous Production Creation & Honest Empty State (Priority: P1) 🎯 MVP

**Goal**: Ensure new productions create clean empty workspaces without silent demo data injection.

**Independent Test**: Click "New Production", enter details; verify workspace opens with 0 scenes, 0 items, and 0 tasks.

- [x] T006 [US1] Remove automatic calls to `/script/demo` from `initProject`, `loadProjectDetails`, and project creation in `src/App.tsx`
- [x] T007 [P] [US1] Create dedicated `src/components/NewProjectModal.tsx` with clean creation fields (Title, Studio, Project Type) and accessible dialog controls
- [x] T008 [US1] Add persistent "New Production" button (`data-testid="header-new-production-btn"`) to header in `src/App.tsx` / `src/components/Header.tsx`
- [x] T009 [US1] Update workspace initialization in `src/App.tsx` to display unpopulated state with "No clearance items recorded" and "No clearance blockers recorded" when entityCount is 0

---

## Phase 4: User Story 2 - Honest Screenplay Ingestion Preview & Extraction Validation (Priority: P1)

**Goal**: Provide pre-commit preview of extracted script data and block invalid/empty uploads.

**Independent Test**: Select a corrupt/empty PDF; confirm preview shows 0 scenes, warning banner appears, and "Confirm Ingestion" is disabled.

- [x] T010 [US2] Update `src/components/ScriptUploadModal.tsx` to implement a multi-step flow: File Selection -> Extraction Preview -> Confirmation
- [x] T011 [US2] Connect `ScriptUploadModal.tsx` to `POST /api/projects/:id/script/preview` to fetch and render detected scene counts, sample headings, and warnings
- [x] T012 [US2] Disable the "Confirm Ingestion" button in `ScriptUploadModal.tsx` and render an explicit error banner when `scenesDetected === 0`
- [x] T013 [US2] Handle upload rejection in `ScriptUploadModal.tsx` gracefully, retaining pre-upload state without substituting demo data

---

## Phase 5: User Story 3 - Guided Ingestion Workflow & Single Primary Action per State (Priority: P2)

**Goal**: Ensure exactly one contextual primary action card per workspace state and clean header navigation.

**Independent Test**: Walk through empty -> intake -> review -> export states; verify the primary action card updates deterministically.

- [x] T014 [US3] Update `src/components/RecommendedActionCard.tsx` to compute primary action: "Upload Screenplay" when scenes === 0; "Resolve Clearance Blockers" when blockers > 0; "Export Binder" when all clear
- [x] T015 [P] [US3] Move execution mode pill, quota counter, and serving revision into `src/components/SettingsModal.tsx`
- [x] T016 [US3] Ensure project switcher only switches existing projects and links to the portfolio dashboard

---

## Phase 6: User Story 4 - Preservation of Sample Reference Benchmarks (Priority: P2)

**Goal**: Preserve Neon Horizon and Cyberpunk Odyssey golden benchmarks accessible via explicit user action with sample badges.

**Independent Test**: Open Neon Horizon from portfolio; verify 3/7/11, 33.3%, 2 blocked scenes, labeled with sample badge.

- [x] T017 [US4] Add "Load Sample Production Data" action in empty workspace recommendation card in `src/components/RecommendedActionCard.tsx`
- [x] T018 [US4] Ensure `proj-default` (Neon Horizon 3/7/11, 33.3%, 2 blocked) and `proj-cyberpunk` (100%, 0 blocked) retain sample reference badges and full isolation

---

## Phase 7: Release Validation & Test Automation

**Purpose**: Verify all scenarios A through F via Playwright test suites.

- [x] T019 Update `tests/repro_local.js` to execute and verify Scenarios A through F (New Production header button, honest empty state, bad PDF preview warning/block, explicit sample load, Cyberpunk isolation, notification tombstone)
- [x] T020 Update `tests/repro_live.js` with the matching Scenarios A through F
- [x] T021 Run `npm run build` and local Playwright verification suite `node tests/repro_local.js`

---

## Phase 8: Production PDF Extraction & Brand Entity Recognition (P0)

**Purpose**: Replace naive PDF extraction with `pdf-parse`, validate 4-page compressed screenplay PDF with Coors Light brand, and enforce negative image-only/malformed rejection.

- [x] T022 Create real 4-page compressed screenplay PDF fixture with Coors Light brand (`tests/fixtures/coors_light_4page.pdf`)
- [x] T023 Replace naive BT/Tj extractor in `server/agents/ScriptParserAgent.ts` with `pdf-parse` library, control-code stripping, and add Coors Light brand pattern
- [x] T024 Create negative test fixtures (`tests/fixtures/image_only.pdf`, `tests/fixtures/malformed.pdf`) and verify explicit extraction failure handling
- [x] T025 Add contract test suite `tests/contract/test_coors_pdf_extraction.test.ts`
- [x] T026 Update `tests/repro_local.js` and `tests/repro_live.js` with Scenario G (Coors 4-page PDF extraction, negative image-only/malformed rejection, zero demo substitution, quota preservation, reload persistence)

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: T001–T002 completed.
- **Phase 2 (Backend)**: T003–T005 completed.
- **Phase 3 (User Story 1 - P1 MVP)**: T006–T009 completed.
- **Phase 4 (User Story 2 - P1)**: T010–T013 completed.
- **Phase 5 (User Story 3 - P2)**: T014–T016 completed.
- **Phase 6 (User Story 4 - P2)**: T017–T018 completed.
- **Phase 7 (Validation)**: T019–T021 completed.
- **Phase 8 (Production PDF Extraction P0)**: T022–T026 completed.
