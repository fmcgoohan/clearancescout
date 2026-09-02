# Tasks: Phase 5 - Judge-Ready Final Wrap & Submission Packaging

**Branch**: `028-phase5-judge-ready` | **Date**: 2026-09-01 | **Spec**: [`specs/028-phase5-judge-ready/spec.md`](./spec.md) | **Plan**: [`specs/028-phase5-judge-ready/plan.md`](./plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify repository dependencies, test fixtures, and environment readiness.

- [x] T001 Verify active branch `028-phase5-judge-ready` and dependencies in `package.json`
- [x] T002 [P] Verify deterministic demo test fixtures for Neon Horizon and Cyberpunk Odyssey in `fixtures/two_project_fixture.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core authentication and API plumbing required across all user journeys.

- [x] T003 Verify server authentication middleware in `server/middleware/auth.ts` for token `judge-pass-2026`
- [x] T004 [P] Verify client auth header injection and localStorage persistence in `src/utils/apiClient.ts`

---

## Phase 3: User Story 1 - Flawless Judge Demo Walkthrough & Token Authentication (Priority: P1) 🎯 MVP

**Goal**: Seamless evaluation experience for judges: token entry, two-project isolation, zero-hybrid switching, and notification deep-linking.

**Independent Test**: Load application, enter `judge-pass-2026` via Settings, navigate to Portfolio, open `Cyberpunk Odyssey` (100% readiness), return to `The Neon Horizon` (33.3% readiness / 2 blocked / 3/7/11), and deep-link from notification to `TASK-101`.

- [x] T005 [P] [US1] Verify baseline metrics for `The Neon Horizon` in `src/App.tsx` and `fixtures/two_project_fixture.json`
- [x] T006 [P] [US1] Verify isolated workspace metrics for `Cyberpunk Odyssey` in `src/App.tsx` and `fixtures/two_project_fixture.json`
- [x] T007 [US1] Verify zero-hybrid switching overlay and state transition machine in `src/App.tsx`
- [x] T008 [US1] Verify notification drawer deep-linking and focus trapping in `src/components/ActionListModal.tsx`
- [x] T009 [US1] Execute and verify local judge walkthrough audit in `tests/repro_local.js`

**Checkpoint**: User Story 1 fully validated and independently testable.

---

## Phase 4: User Story 2 - Independent Proof & Verification of 1,000-Task Virtualization Budgets (Priority: P1)

**Goal**: Automated proof of client-side list virtualization meeting $\le 500$ms render, $\le 30$ DOM nodes, and $\ge 60$ FPS budgets under 1,000 tasks.

**Independent Test**: Run `node tests/local_1000_task_virtualization.js` and assert all performance and DOM clamping metrics pass.

- [x] T010 [P] [US2] Verify virtual task list windowing and DOM clamping logic in `src/components/VirtualTaskList.tsx`
- [x] T011 [US2] Execute and verify 1,000-task virtualization benchmark in `tests/local_1000_task_virtualization.js`

**Checkpoint**: User Story 2 verified with automated, reproducible test output.

---

## Phase 5: User Story 3 - Mobile 375px Filter-Tab Visual Balance & Ergonomics (Priority: P2)

**Goal**: Balanced, proportional tap targets for Portfolio Dashboard filter tabs on 375px viewports with zero horizontal overflow.

**Independent Test**: Load Portfolio Dashboard at 375x667 and 375x812, asserting balanced tab widths, $\ge 8$px spacing, single-line text, and sticky header clearance.

- [x] T012 [P] [US3] Implement balanced, proportional flex tap targets for portfolio filter tabs in `src/components/PortfolioDashboard.tsx` and `src/index.css`
- [x] T013 [US3] Verify single-line project code badges, single-line h2 title, zero horizontal overflow, and sticky header clearance in `tests/repro_local.js`

**Checkpoint**: User Story 3 verified across mobile breakpoints.

---

## Phase 6: User Story 4 - Hackathon Submission Package Compliance & Provenance (Priority: P1)

**Goal**: Full compliance of submission artifacts with hackathon rules before the September 7, 2026 deadline.

**Independent Test**: Verify active Cloud Run URL in `README.md`, ADK/Gemini/Parallel-Search compliance in `PROVENANCE.md`, 3-min video script in `DEMO_SCRIPT.md`, VoiceOver manual verification protocol in `VOICE_OVER_PROTOCOL.md`, Human UX protocol in contracts, and MIT `LICENSE`.

- [x] T014 [P] [US4] Verify and update live Cloud Run service URL and judge access token in `README.md`
- [x] T015 [P] [US4] Verify Google ADK, gemini-3.6-flash, parallel-web, and zero-prohibited-framework compliance in `PROVENANCE.md`
- [x] T016 [P] [US4] Verify 3-minute video presentation script in `DEMO_SCRIPT.md`
- [x] T017 [P] [US4] Create and verify macOS VoiceOver accessibility protocol in `VOICE_OVER_PROTOCOL.md` and `contracts/voiceover_protocol.md`
- [x] T018 [P] [US4] Create and verify 3-goal Human UX workflow protocol in `contracts/human_ux_protocol.md`
- [x] T019 [P] [US4] Verify MIT license text in `LICENSE`

---

## Phase 7: Release Hardening, Provenance & End-to-End Regression Validation

**Purpose**: Provenance display, removal of silent fallbacks, and complete end-to-end regression audit.

- [x] T020 [P] Implement user-visible, copyable Cloud Run serving revision (`K_REVISION`) in Settings menu (`src/components/SettingsPopover.tsx`, `server/api/healthRoutes.ts`, `server/types/healthTypes.ts`)
- [x] T021 [P] Remove all silent `TASK-101` fallbacks from repository read paths and notification handlers (`server/repositories/ActionNotificationRepo.ts`, `src/components/NotificationDrawer.tsx`)
- [x] T022 Extend Playwright test suite (`tests/repro_local.js` and `tests/repro_live.js`) with provenance revision match assertions and full-coverage RC regression checks (3/7/11, isolation, notification focus, binder export, attachments, 375 layout)
- [x] T023 Run complete local build with `npm run build`
- [x] T024 Run full local Playwright verification suite in `tests/repro_local.js`
- [x] T025 Run full 1,000-task virtualization suite in `tests/local_1000_task_virtualization.js`
- [x] T026 Execute single blocking Cloud Run build & deploy, verify 100% traffic on serving revision, and execute live Playwright regression suite in `tests/repro_live.js`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: T001–T002 can start immediately.
- **Phase 2 (Foundational)**: T003–T004 depend on Phase 1; block User Stories.
- **Phase 3 (User Story 1 - P1 MVP)**: T005–T009 depend on Phase 2.
- **Phase 4 (User Story 2 - P1 Scale)**: T010–T011 can run in parallel with US1.
- **Phase 5 (User Story 3 - P2 Mobile)**: T012–T013 can run in parallel with US1/US2.
- **Phase 6 (User Story 4 - P1 Packaging)**: T014–T019 can run in parallel.
- **Phase 7 (Release Validation)**: T020–T026 run after all user story implementations complete.
