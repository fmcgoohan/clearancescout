# Tasks: Feature 023 Workspace Restyle

**Feature**: Workspace Restyle (All Five Surfaces)
**Branch**: `023-workspace-restyle`
**Spec**: [`spec.md`](spec.md) | **Plan**: [`plan.md`](plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Repository audit, token initialization, and design log baseline verification per Constitution v1.1.0.

- [x] T001 Audit `src/` codebase for hardcoded hex colors, raw emoji characters, and un-locked modal scroll handlers
- [x] T002 [P] Verify `DESIGN_LOG.md` append-only structure and Constitution v1.1.0 entry

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core CSS design tokens, SVG icon library, and body scroll locking hook required by all workspace surfaces.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 [P] Define sacred status HSL colors, single brand accent, typography variables, and motion custom properties in `src/index.css`
- [x] T004 [P] Create `useBodyScrollLock.ts` hook in `src/hooks/useBodyScrollLock.ts` supporting nested modal counter and body scroll locking
- [x] T005 [P] Create lightweight inline stroke SVG icon component library in `src/components/icons/Icons.tsx` (`CheckCircleIcon`, `AlertTriangleIcon`, `XCircleIcon`, `HelpCircleIcon`, `FilmIcon`, `FileTextIcon`, `SearchIcon`, `RefreshCwIcon`, `XIcon`, `ChevronRightIcon`, `UploadIcon`, `DownloadIcon`)

**Checkpoint**: Foundation ready - surface restyling can proceed.

---

## Phase 3: User Story 1 - One-Touch Command Bar & Quota Visibility (Priority: P1) 🎯 MVP

**Goal**: Collapse header into a single command bar answering *Where am I?*, *What is my budget?* (live quota meter with tabular figures), and *What do I do next?* (single primary `.btn-primary` button for open tasks).

**Independent Test**: Verify command bar contains exactly one `.btn-primary` button, quota numerals use tabular figures (`font-variant-numeric: tabular-nums`), and header flex layout wraps cleanly at 900px width.

- [x] T006 [P] [US1] Restructure `src/App.tsx` header toolbar into a single flex container command bar (`.header-command-bar`)
- [x] T007 [P] [US1] Apply `font-variant-numeric: tabular-nums` to quota counter numerals in `src/App.tsx`
- [x] T008 [US1] Configure single primary `.btn-primary` button page-wide pointing to open-tasks entry point with live count badge in `src/App.tsx`

**Checkpoint**: User Story 1 complete - command bar is clean, responsive, and quota-transparent.

---

## Phase 4: User Story 2 - Hero Shooting Readiness & Plain-Language Scene Reasons (Priority: P1)

**Goal**: Render Shooting Readiness Index at display scale (`>= 2.75rem`) with severity edge and per-scene cards containing plain-language, producer-focused unblocking reasons.

**Independent Test**: Verify readiness index renders as largest text on page and non-cleared scenes show human-readable reasons (e.g. *"Hazard placard artwork needs rights or replacement"*).

- [x] T009 [P] [US2] Redesign Shooting Readiness Index hero card in `src/pages/WorkspacePage.tsx` with display-scale typography (`font-size: 2.75rem`) and high-visibility severity border edge
- [x] T010 [P] [US2] Update scene breakdown cards in `src/pages/WorkspacePage.tsx` to display standardized status chips, INT/EXT location micro-labels, and plain-language unblocking reasons

**Checkpoint**: User Story 2 complete - shooting readiness and why-blocked reasons take top visual hierarchy.

---

## Phase 5: User Story 3 - Monospace Screenplay Panel with Dotted Underline Entities (Priority: P1)

**Goal**: Present screenplay manuscript text strictly in a legal monospace zone (`Courier Prime`), rendering detected entities with status-colored dotted underlines and zero background fills.

**Independent Test**: Verify script panel uses monospace typography, source manuscript text is 100% preserved, and occurrences use status-colored dotted underlines with a single legend.

- [x] T011 [P] [US3] Enforce `font-family: var(--font-mono)` (`Courier Prime`) on `.fountain-script` container in `src/components/ScriptViewer.tsx`
- [x] T012 [P] [US3] Configure entity occurrence highlighting in `src/components/ScriptViewer.tsx` to use `text-decoration: underline dotted var(--status-color)` with `background-color: transparent`
- [x] T013 [US3] Render single highlight legend explaining underline status colors above screenplay panel in `src/components/ScriptViewer.tsx`

**Checkpoint**: User Story 3 complete - screenplay panel provides legal monospace text fidelity and clean entity highlighting.

---

## Phase 6: User Story 4 - Scan-First Entity Registry Table (Priority: P1)

**Goal**: Format registry table with bold entity names, category muted sub-lines, chip-plus-word status badges, and domain-meaning right-aligned action buttons (*"2 uses"*, *"Ground"*, *"Compare"*).

**Independent Test**: Inspect registry table and verify bold entity title with muted category sub-line context, chip-plus-word status badges, right-aligned domain actions, and zero emoji or monospace text in table chrome.

- [x] T014 [P] [US4] Reformat first column of `src/components/EntityRegistryTable.tsx` with bold entity title (`font-weight: 600`) and category as muted sub-line context (`font-size: 0.75rem`)
- [x] T015 [P] [US4] Standardize clearance status badges in `src/components/EntityRegistryTable.tsx` to chip-plus-word format matching Readiness Band status vocabulary
- [x] T016 [P] [US4] Label right-aligned action buttons in `src/components/EntityRegistryTable.tsx` by domain meaning (*"2 uses"*, *"Ground"*, *"Compare"*) and purge all emojis and monospace fonts from table chrome

**Checkpoint**: User Story 4 complete - entity registry table is optimized for rapid visual scanning by clearance coordinators.

---

## Phase 7: User Story 5 - Operations Dashboard & Department Task Center Modals (Priority: P2)

**Goal**: Deliver Operations Dashboard modal with 5 KPI tiles and row-level triage controls, alongside Department Task Center modal supporting department tabs, severity-striped cards, in-place resolution, and body scroll locking.

**Independent Test**: Open Operations Dashboard or Task Center modal, verify 5 KPI tiles, row-level triage buttons, `document.body.style.overflow = 'hidden'`, and Escape / backdrop / close button dismissal.

- [x] T017 [P] [US5] Redesign `src/components/ProductionDashboardModal.tsx` to feature 5 KPI tiles and row-level triage resolution buttons for blocking occurrences
- [x] T018 [P] [US5] Redesign `src/components/ActionListModal.tsx` with department tabs, open counts, severity-striped cards, and layout-stable in-place task resolution
- [x] T019 [P] [US5] Integrate `useBodyScrollLock` into `useModalFocus.js` and verify body scroll locking (`overflow: hidden`) across all 13 modal overlays

**Checkpoint**: User Story 5 complete - modals deliver high-density intelligence with reliable scroll locking and keyboard dismissal.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Test suite execution, production build validation, live Playwright browser verification, and design log recording.

- [x] T020 [P] Execute complete automated unit and contract test suite `npm test` and verify 100% pass across all 217 tests
- [x] T021 [P] Execute clean production build validation via `npm run build`
- [x] T022 Execute live Playwright browser validation script `tests/live_design_system_validation.js` against local production preview server
- [x] T023 Append final feature completion and verification evidence to `DESIGN_LOG.md` per Constitution v1.1.0 Article 8

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all surface restyling stories.
- **User Stories (Phase 3–7)**: Depend on Foundational phase completion. Can run sequentially or in parallel.
- **Polish (Phase 8)**: Depends on all user stories complete.

---

## Implementation Strategy

### MVP First
1. Complete Phase 1 (Setup) & Phase 2 (Foundational).
2. Complete Phase 3 (US1: Command Bar) & Phase 4 (US2: Hero Readiness).
3. Validate MVP header and readiness band.

### Incremental Delivery
1. Add Phase 5 (US3: Screenplay Panel).
2. Add Phase 6 (US4: Entity Registry Table).
3. Add Phase 7 (US5: Modals & Overlays).
4. Run Phase 8 (Polish & Live Verification).
