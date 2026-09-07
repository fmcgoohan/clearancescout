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

---

## Phase 8: Convergence (Defects 1–5 Remediation)

- [x] T033 [P1-375-Overflow] Fix document 375px overflow at the layout level in src/components/Header.tsx, src/App.tsx, and src/pages/WorkspacePage.tsx (brand identity and primary action visible; secondary actions fold into accessible overflow menu; nav tabs scroll in isolated region; no overflow-x:hidden hack; document.scrollWidth <= clientWidth across 320/375/390/420; 44px targets; focus visible; 200%/400% zoom) (FR-025)
- [x] T034 [P1-Coors-Occurrences] Reconcile Coors Light occurrences (6 occurrences across 3 scenes for 1 canonical item) in server/agents/ScriptParserAgent.ts, src/components/EntityRegistryTable.tsx, src/components/CitationDrawer.tsx, and binder export (tests: 1/1, many/1, many/many, 0) (FR-026)
- [x] T035 [P2-Blocker-Deduplication] Canonical entity blocker de-duplication in server/workflows/sceneReadinessEngine.ts and client readiness views (unique unresolved item = 1 blocker; "appears N times" scene copy; zero double-counting; reconciliation tests) (FR-027)
- [x] T036 [P2-Production-Cards] Accessible production switcher cards in src/components/ProjectListModal.tsx (native button elements with accessible name=title; aria-selected state; Enter/Space support; visible focus ring; focus active production heading after switch; isolation preserved) (FR-028)
- [x] T037 [P3-Zero-Item-Scenes] Explicit zero-item scene review & readiness contract in server/workflows/sceneReadinessEngine.ts, src/types/, and binder export (distinguish PENDING_REVIEW / NO_CANDIDATES_DETECTED from human-confirmed FINAL_CLEAR; unreviewed zero-item scenes not shooting ready) (FR-029)
- [x] T038 [Verification] Run focused unit tests and comprehensive local Playwright suite on localhost:8088 covering 375 layout, Coors 6 across 3, blocker wording, keyboard project cards, and zero-item readiness states
- [x] T039 [P0-Scenario-G-Ingestion-Persistence] Remediate public Scenario G ingestion persistence defect (VERIFIED PASS on canary revision clearancescout-00064-lav using isolated disposable project proj-e425aaf3; Coors Light 1 item / 6 occurrences across 3 scenes persisted and displayed; 0 quota used; zero demo items substituted; survives reload) (FR-030)

---

## Phase 9: Corrective Release (Approved Blockers & Tracks)

- [x] T040 [P1-Task-Scoping] Scope Action Center and Department Task queries strictly to active script draft scenes (excluding superseded tasks) and correct pluralize helper formatting in ActionListModal.tsx to prevent duplicated numerals (render "X of Y Tasks") (FR-031)
- [x] T041 [P1-Zero-Item-Readiness] Implement non-contradictory zero-item scene presentation in WorkspacePage.tsx with explicit neutral PENDING_REVIEW badging and "Pending Review" copy, eliminating false FINAL CLEAR fallthrough (FR-032)
- [x] T042 [P1-Project-Card-A11y] Reconcile native interactive project card semantics in ProjectListModal.tsx by removing invalid role="option" and using aria-current/aria-pressed attributes (FR-028, FR-033)
- [x] T043 [P2-Mobile-Ergonomics] Audit and refine 375px mobile layout reachability in Header.tsx and ActionListModal.tsx (header <=64px, touch targets >=44px, zero horizontal overflow) (FR-034)
- [x] T044 [P2-Project-Identity] Disambiguate identical project titles in ProjectListModal.tsx using unique creation timestamps and project codes without merging or deleting historical records (FR-035)
- [x] T045 [P0-Option-B-Lifecycle] Verify Option B honest-empty lifecycle in InMemoryStore: no auto-seeding on container boot; explicit "Load Sample Production" or authorized demo-load populates 3 scenes / 7 items / 11 tasks baseline (FR-036)
- [x] T046 [Verification-Local] Run focused unit tests and complete local Playwright A–K suite on localhost:8088 (real Chromium) with zero regressions
- [x] T047 [Deploy-Canary] Commit approved pass to 029 branch (SHA a1ba4ed), push to origin, and deploy a NEW Cloud Run canary revision clearancescout-00064-lav with 0% production traffic (leaving 00061-lms at 100%)
- [x] T048 [Verification-Canary] Reconcile canary deployment identity; verify Scenario G on canary using isolated disposable project ID (proj-e425aaf3); verify remaining A–K on canary (ALL PASS); verify View Evidence drawer timing (20.25ms <= 4000ms); STOP for traffic approval

---

## Phase 10: Fail-Resolution & Bounded P2 Implementation

- [x] T049 [FAIL1-Cyberpunk-Readiness] Remove `projectId === 'proj-cyberpunk'` bypass in `server/workflows/sceneReadinessEngine.ts` and set initial readiness of `scene-cp01` in `server/repositories/ProjectRepo.ts` to `PENDING_REVIEW` with 0% readiness (FR-029, FR-032)
- [x] T050 [FAIL2-Neon-Identity] Initialize empty `proj-default` with title `'Default Production Workspace'` and code `'PRJ-DEFAULT'`, updating title to `'The Neon Horizon'` and code to `'PRJ-NEON-HORIZON'` only upon explicit sample load in `demoAutomationWorkflow.ts` and `src/utils/formatters.ts` (FR-036)
- [x] T051 [P2-Mobile-New-Button] Fix `.mobile-only` CSS suppression in `src/index.css` so `+ New` button renders a clear visible label with >=44px touch targets on mobile viewports (<=768px / 375px) without horizontal overflow (FR-034)
- [x] T052 [P2-Mobile-Tabs-Scroll] Enforce `white-space: nowrap !important` and `flex-shrink: 0 !important` on tab buttons in `src/pages/WorkspacePage.tsx` and `src/index.css` to enable smooth controlled horizontal scrolling without label compression or wrapping (FR-034)
- [x] T053 [Test-Suite-Update] Update Scenario E in `tests/repro_local.js` and `tests/repro_live.js` to assert honest 0% readiness / PENDING_REVIEW / 0 blockers for Cyberpunk, and verify `Default Production Workspace` `[PRJ-DEFAULT]` on initial load before sample load
- [x] T054 [Verification-Local] Run focused unit tests, local Scenario G on disposable project ID, reload from authoritative snapshot, and full local Playwright A–K suite on localhost:8088
- [x] T055 [Deploy-Canary] Commit tested tree to `029-honest-ingestion-ux` (SHA `1b8823a`), push to origin, build image `gcr.io/clearance-scout-2026/clearancescout:1b8823a9681bc7e7c4f4f7d45f3c11ec8cfda001` via Cloud Build `5c6a2819-8af0-4629-9f00-e3af7524e29f`, and deploy NEW Cloud Run canary revision `clearancescout-00066-wed` with 0% production traffic (leaving `clearancescout-00061-lms` at 100%)
- [x] T056 [Verification-Canary] Run isolated disposable Scenario G on canary first (PASS on disposable `proj-ff9fbe65`), verify full A–K live Playwright suite on canary `clearancescout-00066-wed` (ALL PASS A–K: FAIL 1 Cyberpunk 0%/0 blockers verified, FAIL 2 empty workspace identity `[PRJ-DEFAULT]` verified, P2 mobile `+ New` button visible, P2 mobile tabs controlled scroll verified, all viewports 320–1280 0 overflow), and STOP for traffic approval

---

## Phase 11: Pre-Walkthrough Corrective Pass

- [x] T057 [P1-Cyberpunk-Zero-Tasks] Implement explicit task fetch lifecycle state (`idle | loading | loaded | error`) in `src/components/ActionListModal.tsx`: loaded-empty renders "0 of 0 Tasks", zeros per department tab `(0)`, empty state message ("No department tasks have been generated for this production"), route/button to next action (upload), Re-Sync enabled, no indefinite spinner/ellipsis; reset tasks/state on project switch; handle cold `?tab=tasks` (FR-037)
- [x] T058 [P1-Binder-Identity] Align Markdown and JSON export filenames (`Clearance_Binder_${sanitizedTitle}_${id}.md` / `.json`), add Project ID to Markdown header, and clear client-side `binderData` / `preflightData` on project switch in `src/App.tsx` (FR-038)
- [x] T059 [P1-Human-Readable-Scenes] Format human-readable scene references (`Scene ${scene.sceneNumber} — ${scene.heading}`) in `server/workflows/clearanceEvaluator.ts`, `server/workflows/actionDispatcher.ts`, and timeline events instead of raw internal `scene-` UUIDs (FR-039)
- [x] T060 [P1-Filming-vs-Distribution-Copy] Encode statutory distribution vs production filming clearance dual standard ("A synchronization license is required for distribution. This production’s clearance policy requires the license to be secured before filming proceeds.") across music evaluator rationales and department tasks (FR-040)
- [x] T061 [Contract-Tests] Implement focused contract tests in `tests/contract/test_pre_walkthrough_corrections.test.ts` for binder filename/ID alignment, human-readable scene formatting, and dual clearance copy
- [x] T062 [Build-Verification] Verify frontend build (`npm run build`) and execute vitest unit suite (`npx vitest run`)
- [x] T063 [Browser-Validation-Local] Execute targeted Playwright validation on `localhost:8088` (Cyberpunk zero-task state, cold `?tab=tasks`, project switching isolation, Neon Horizon task restoration)
- [x] T064 [Deploy-Canary] Commit coherent patch to `029-honest-ingestion-ux` (SHA `d539788`), push to origin, build image via Cloud Build `8a326a2c-caa7-411d-9271-4ff3a4aa740c`, deploy NEW Cloud Run canary revision `clearancescout-00067-ley` (0% traffic; `clearancescout-00061-lms` remains 100%), verify acceptance checks on canary (ALL PASS), and STOP for operator review

---

## Phase 12: Operating Model Convergence Implementation Tasks

- [x] T065 [Execution-Mode-OptionA] In `src/components/SettingsPopover.tsx` and `src/components/ProjectListModal.tsx`, replace the interactive `<select>` with an authoritative read-only badge (`DEMO_MODE (Authoritative)`) with explanatory copy, removing client-side synthetic mode overrides in `src/App.tsx` (FR-041)
- [x] T066 [Zero-Item-Classification] Implement the 5-state scene readiness classification in `server/workflows/sceneReadinessEngine.ts` and `src/components/SceneReadinessCard.tsx` (`ANALYSIS_PENDING`, `ANALYSIS_FAILED`, `NO_CANDIDATES_SURFACED` -> `PENDING_REVIEW` 0%, `HUMAN_REVIEWED_NO_CONCERN` -> `FINAL_CLEAR`, `FULLY_CLEARED`) (FR-042)
- [x] T067 [Task-Active-Draft-Scope] In `server/repositories/ActionNotificationRepo.ts`, `server/workflows/actionDispatcher.ts`, and `src/components/ActionListModal.tsx`, ensure department tasks are scoped to active draft; display open vs total unique tasks (`"${openCount} open of ${totalCount} Tasks"`); prohibit blanket title-based deduplication (FR-043)
- [x] T068 [Coors-Semantics-Parity] In `server/workflows/sceneReadinessEngine.ts`, verify Registry/Dossier parity for Coors Light (1 item, 6 occurrences across 3 scenes); separate textual appearances from unresolved blockers in Scene 1 (1/1), Scene 2 (1/2, heading `CONTINUOUS`), Scene 3 (1/3); enforce singular/plural grammar (FR-044)
- [x] T069 [Project-Disambiguation-A11y] In `src/components/ProjectListModal.tsx` and `src/components/PortfolioDashboard.tsx`, render native `<button>` cards with stable project ID (`proj-<uuid>`) and timestamp; ensure post-switch focus shifts to `h1#workspace-production-heading` (FR-033, FR-045)
- [x] T070 [Notification-Tombstone-A11y] In `src/components/NotificationDrawer.tsx` and `src/components/ActionListModal.tsx`, verify valid notification (`TASK-101`) scrolls and focuses `h4#task-heading-TASK-101`; orphan notifications render disabled tombstone badges without fallback to `Re-Sync` (FR-027)
- [x] T071 [Contract-Unit-Tests] Create or update unit/contract tests for execution mode read-only representation, 5-state zero-item classification, and draft-scoped tasks in `tests/contract/`
- [x] T072 [Build-Local-Validation] Verify `npm run build`, execute unit tests (`npx vitest run`), and execute full local Playwright verification (`node tests/repro_local.js`) on port 8088
- [x] T073 [Deploy-Canary] Commit tested patch to `029-honest-ingestion-ux`, push to origin, build image, deploy NEW Cloud Run canary (`--no-traffic --tag canary`), and verify canary required checks on canary URL
- [x] T074 [Deploy-Production] Upon canary required checks passing, deploy the exact same commit to production with 100% traffic, replacing `clearancescout-00061-lms`. Reconcile revision, SHA, image, creation time, 100% traffic, Settings, and `GET /api/health`
- [x] T075 [Verification-Public-A-K] Execute full public Playwright A–K audit on `https://clearancescout-n3tcx4jcbq-uc.a.run.app` with demo token via Settings/localStorage (Scenario G on isolated disposable project ID), record per-section PASS/FAIL, and STOP for independent review

---

## Phase 13: Independent Review Defect Corrections (Post-00068 Deploy)

- [x] T076 [Defect1-Tailwind-Removal] Restyle NotificationDrawer.tsx and TaskCommentThread.tsx with native design tokens without Tailwind classes; ensure absolute floating positioning at z-index 1000; Escape closes drawer and restores focus to bell button; bell button toggles open/close; click outside closes drawer (FR-047)
- [x] T077 [Defect2-First-Click-Activation] Add onPointerDown and immediate click handling to Project Switcher chip in App.tsx and Load Sample Production button in RecommendedActionCard.tsx to ensure immediate activation on the very first touch/click without merely shifting focus (FR-048)
- [x] T078 [Defect3-Scene2-Readiness-CTA] Attach sample location permit override specifically to Scene 2 in demoAutomationWorkflow.ts to clear Scene 2 to FINAL CLEAR (0 blockers) while preserving 33.3% readiness and Neon Horizon baseline; update RecommendedActionCard.tsx and WorkspacePage.tsx to align Scene 2 recommendation ("Scene 2 Cleared for Filming", "View Screenplay" CTA, no Nocturne CTA) and scene card summary text (FR-049)
- [x] T079 [Verification-Local] Verify npm run build (clean 10.63kB CSS without Tailwind) and run automated Playwright verification script confirming all 3 defects are resolved on localhost:8088 (FR-047, FR-048, FR-049)
- [x] T080 [Deploy-Canary] Commit tested patch to 029-honest-ingestion-ux (SHA 04a9615), push to origin, build image via Cloud Build 65a4647c-207f-4a9d-9827-4dcb5a910e88, deploy NEW Cloud Run canary revision clearancescout-00071-vam with 0% production traffic, and verify canary required checks on canary URL (ALL PASS)
- [x] T081 [Deploy-Production] Deploy exact tested image to production with 100% traffic, replacing clearancescout-00068-lug with clearancescout-00071-vam (100% traffic)
- [x] T082 [Verification-Serving] Verify public serving revision on clearancescout-n3tcx4jcbq-uc.a.run.app (clearancescout-00071-vam) and present evidence table covering the 3 defects, leaving VoiceOver and human walkthrough PENDING


