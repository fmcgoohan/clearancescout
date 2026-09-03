# Tasks: Honest Ingestion UX, Correctness & Workspace IA

**Branch**: `029-honest-ingestion-ux` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Setup & Contract Tests

- [x] T001 [P] Verify Coors Light 39,078-byte judge PDF fixture and extraction in tests/fixtures/CoorsLight_SpecComm_v.1.pdf
- [x] T002 [P] Contract test for slugline CONTINUOUS preservation and page marker filtering in tests/contract/test_coors_pdf_extraction.test.ts
- [x] T003 [P] Contract test for RETRY_RESEARCH task auto-resolution on entity evaluation in tests/contract/test_stale_task_pruning.test.ts
- [x] T004 [P] Verify Constitution v1.5.0 principles in .specify/memory/constitution.md

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T005 Verify Firestore collections and test mock state isolation for multi-project benchmarks
- [x] T006 Ensure ActionNotificationRepo supports querying tasks by entity and bulk status updates in server/repositories/ActionNotificationRepo.ts
- [x] T007 Define shared TypeScript types for slugline timeOfDay, responsive card layout, and URL query params in src/types/
- [x] T008 [P] Configure CSS utility tokens for compact header and responsive cards in src/index.css

---

## Phase 3: Slice 1 - Release-Blocking Correctness (Priority: P0 / P1)

**Goal**: Prune stale `RETRY_RESEARCH` tasks when entities evaluate (FR-013), preserve `CONTINUOUS`/`SAME`/`DAWN` in sluglines (FR-014), strip PDF page break markers (FR-015), and clarify occurrence vs unique blocker copy (FR-016).

**Independent Test**: Load Neon Horizon -> evaluate -> verify AeroTech has status Cleared and Action Center has 0 open RETRY_RESEARCH tasks for AeroTech; parse Coors PDF -> verify Scene 2 timeOfDay is CONTINUOUS and no `-- 2 of 4 --` page markers appear.

- [x] T009 [US-Correctness] Implement automatic `RETRY_RESEARCH` task resolution in server/workflows/clearanceEvaluator.ts (FR-013)
- [x] T010 [US-Correctness] Implement high-fidelity slugline timeOfDay parser preserving CONTINUOUS, SAME, DAWN, DUSK in server/agents/ScriptParserAgent.ts (FR-014)
- [x] T011 [US-Correctness] Implement page break marker stripping (/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gm and lone numbers) in server/agents/ScriptParserAgent.ts (FR-015)
- [x] T012 [US-Correctness] Update SceneReadinessEngine to group multiple occurrences of the same entity in blocking summaries in server/workflows/sceneReadinessEngine.ts (FR-016)
- [x] T013 [US-Correctness] Update DemoAutomationWorkflow to ensure demo load triggers task synchronization in server/workflows/demoAutomationWorkflow.ts
- [x] T014 [US-Correctness] Run vitest on test_coors_pdf_extraction.test.ts to verify Slice 1 correctness

---

## Phase 4: Slice 2 - Streamlined Header & Workspace IA (Priority: P1)

**Goal**: Compact header <=64px (FR-017), elevate Department Tasks to a full workspace tab (FR-018), persist URL query params (FR-019), and position onboarding guide below the Primary Recommendation Card (FR-020).

**Independent Test**: Resize to 375px -> verify header height <=64px; click "Department Tasks" tab -> verify full page task view and URL has `?tab=tasks`; reload -> verify state persists.

- [x] T015 [US-IA] Refactor App.tsx header to single-row layout (<=64px) with brand, project select, role, alerts, and More menu in src/App.tsx (FR-017)
- [x] T016 [US-IA] Move secondary admin controls, Quota display, and Revision Provenance to SettingsPopover in src/components/SettingsPopover.tsx (FR-017)
- [x] T017 [US-IA] Add first-class "Department Tasks" workspace section tab in src/App.tsx (FR-018)
- [x] T018 [US-IA] Refactor ActionListModal into a dual-mode component (modal or full-page embedded tab) in src/components/ActionListModal.tsx (FR-018)
- [x] T019 [US-IA] Implement URL query parameter synchronization for tab, entity, and task deep-linking in src/App.tsx (FR-019)
- [x] T020 [US-IA] Relocate OnboardingBanner below RecommendedActionCard and auto-hide when scenesCount > 0 in src/App.tsx (FR-020)

---

## Phase 5: Slice 3 - Workflow Language & Canonical Terminology (Priority: P2)

**Goal**: Converged domain copy ("Clearance Items", "Scene Occurrence", "View Evidence", "API Research Quota") and grammatical pluralization (FR-021, FR-022).

**Independent Test**: Inspect Registry table -> verify header says "Clearance Items", occurrence buttons say "1 scene occurrence" / "2 scene occurrences", research buttons say "View Evidence" for evaluated items, and recommendation card says "1 clearance item requires action".

- [x] T021 [US-Lang] Update EntityRegistryTable headers and buttons to canonical domain terminology in src/components/EntityRegistryTable.tsx (FR-021)
- [x] T022 [US-Lang] Replace "1 use" / "{n} uses" with "{n} scene occurrence(s)" in src/components/EntityRegistryTable.tsx (FR-021)
- [x] T023 [US-Lang] Update Action button label to "View Evidence" for evaluated items in src/components/EntityRegistryTable.tsx (FR-021)
- [x] T024 [US-Lang] Fix grammatical singular/plural phrasing in RecommendedActionCard in src/components/RecommendedActionCard.tsx (FR-022)

---

## Phase 6: Slice 4 - Mobile Responsive & Touch Targets (Priority: P1 / P2)

**Goal**: Narrow-screen card layout on viewports <768px (FR-023) and enforce 44px minimum touch targets (FR-024).

**Independent Test**: Load on 375px/390px/420px -> verify items render as stacked cards with no horizontal clipping, and all buttons have bounding boxes >= 44x44 CSS pixels.

- [x] T025 [US-Mobile] Implement responsive card layout for Clearance Items on <768px viewports in src/components/EntityRegistryTable.tsx (FR-023)
- [x] T026 [US-Mobile] Add CSS card styles and media queries in src/index.css (FR-023)
- [x] T027 [US-Mobile] Enforce 44x44px minimum touch targets across header, tabs, buttons, and close controls in src/index.css & src/components/ (FR-024)
- [x] T028 [US-Mobile] Verify zero horizontal body scroll and no clipped action columns across 375, 390, 420 viewports

---

## Phase 7: Polish & Comprehensive Playwright Verification

**Purpose**: End-to-end verification across all 4 slices and regression guarantees

- [x] T029 Update tests/repro_local.js with explicit assertions for Scenarios A–I (AeroTech sync, CONTINUOUS slugline, 375 header <=64px, 44px touch targets)
- [x] T030 Mirror assertions in tests/repro_live.js for live Cloud Run verification
- [x] T031 Run local Playwright verification suite (node tests/repro_local.js) and paste raw stdout
- [x] T032 Verify build with npm run build
