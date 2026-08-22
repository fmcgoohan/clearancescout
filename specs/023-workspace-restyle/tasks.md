# Tasks Breakdown: Feature 023 Workspace Restyle

**Feature Branch**: `023-workspace-restyle`  
**Feature Specification**: [`spec.md`](spec.md)  
**Implementation Plan**: [`plan.md`](plan.md)  
**Visual Oracle Reference**: [`mockup-v3.html`](../../mockup-v3.html) (repo root)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish core design system tokens, typography loading, and static gate scripts matching `mockup-v3.html`.

- [ ] T001 Configure CSS theme custom properties (`--bg`, `--panel`, `--panel2`, `--border`, `--border-soft`, `--text`, `--muted`, `--faint`, `--accent`, `--ok`, `--warn`, `--crit`, `--mono`, `--font-sans`) and keyframes (`rise`, `pop`, `pulse`) matching `mockup-v3.html` in `src/index.css`
- [ ] T002 [P] Configure font loading (`Archivo` variable sans and `IBM Plex Mono`) in `index.html`
- [ ] T003 [P] Update static gate script to scan `src/**/*.tsx` and `src/**/*.css` for zero emojis, tokenized hex, monospace confinement, infinite animations, reduced motion, and safe HTML entities in `scripts/spec-check.sh`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared UI primitives and components required by all user stories before surface restyling begins.

- [ ] T004 Create unified stroke SVG icon component (`<Icon name="..." />` with stroke-width 1.8) in `src/components/icons/Icon.tsx`
- [ ] T005 Create shared Modal primitive component and hook (`useModalFocus`) supporting body scroll lock (`document.body.style.overflow = 'hidden'`), Escape key dismissal, and backdrop click handling in `src/components/Modal.tsx` and `src/hooks/useModalFocus.js`
- [ ] T006 Create shared status badge component (`<StatusBadge />`) pairing HSL status color with explicit text labels (`CLEARED`, `REVIEW RECOMMENDED`, `ACTION REQUIRED`) in `src/components/StatusBadge.tsx`

---

## Phase 3: User Story 1 - One-Touch Command Bar & Quota Visibility (Priority: P1) 🎯 MVP

**Goal**: Collapse multi-row header into a single unified command bar with project switcher, live tabular-figure quota meter, and a single primary open-tasks button.

**Independent Test**: Verify command bar contains exactly one `.btn-primary` page-wide, quota numbers use tabular figures (`tabular-nums`), and flex layout wraps cleanly at 900px width without horizontal scroll.

- [ ] T007 [US1] Implement unified single-row Header Command Bar with project switcher, live quota meter (`tabular-nums`), and single primary open-tasks button in `src/App.tsx`
- [ ] T008 [US1] Add responsive flex-wrap CSS styling rules for command bar below 900px viewport width in `src/index.css`
- [ ] T009 [US1] Add unit test verifying command bar primary button count, quota tabular figures display, and open tasks count badge in `src/tests/CommandBar.test.tsx`

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Hero Shooting Readiness & Plain-Language Scene Reasons (Priority: P1)

**Goal**: Elevate Shooting Readiness Index to page hero at display scale with a severity border edge and per-scene cards showing plain-language unblocking reasons.

**Independent Test**: Verify readiness index percentage font size is largest on page (`>= 2.75rem`) and non-cleared scenes render human-readable why-blocked text without raw variable names.

- [ ] T010 [US2] Implement Shooting Readiness Index hero card with display scale percentage (`56px` / `2.75rem`) and high-visibility severity border edge in `src/pages/WorkspacePage.tsx`
- [ ] T011 [US2] Implement per-scene cards displaying plain-language unblocking reasons (`.scene-why-blocked-reason`), INT/EXT location tags, and status chips in `src/pages/WorkspacePage.tsx`
- [ ] T012 [US2] Add plain-language unblocking reason formatting logic in `src/utils/formatters.ts`
- [ ] T013 [US2] Add unit test verifying display scale readiness percentage and plain-language scene reason rendering in `src/tests/ReadinessBand.test.tsx`

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 5: User Story 3 - Monospace Screenplay Panel with Dotted Underline Entities (Priority: P1)

**Goal**: Render screenplay text strictly in a legal monospace zone (`IBM Plex Mono`) with status-colored dotted underlines on detected entity occurrences and 100% source text parity.

**Independent Test**: Verify screenplay panel uses monospace typography, entity matches display status-colored dotted underlines without background fills, and source manuscript text is unmodified.

- [ ] T014 [US3] Configure screenplay manuscript panel (`.script`) with monospace typography (`IBM Plex Mono`) and 100% source content parity in `src/components/ScriptViewer.tsx`
- [ ] T015 [US3] Implement status-colored dotted underlines (`text-decoration: underline dotted var(--status-color)`) with zero background color fills on detected entity occurrences in `src/components/ScriptViewer.tsx`
- [ ] T016 [US3] Add single highlight legend for dotted underline status colors above screenplay panel in `src/components/ScriptViewer.tsx`
- [ ] T017 [US3] Add unit test verifying screenplay monospace styling, dotted underline highlighting, and source script parity in `src/tests/ScriptViewer.test.tsx`

**Checkpoint**: User Stories 1, 2, and 3 work independently.

---

## Phase 6: User Story 4 - Scan-First Entity Registry Table (Priority: P1)

**Goal**: Streamline entity registry table with bold entity names, category sub-lines, chip-plus-word status badges, and right-aligned domain-meaning action buttons.

**Independent Test**: Verify entity table presents bold titles with sub-line categories, chip-plus-word status badges, domain action buttons (*"2 uses"*, *"Ground"*), and zero emojis or monospace fonts in table chrome.

- [ ] T018 [US4] Restyle Entity Registry Table with bold entity title, muted category sub-line, chip-plus-word status badges, and right-aligned domain-meaning action buttons in `src/components/EntityRegistryTable.tsx`
- [ ] T019 [US4] Enforce variable sans typography (`Archivo`) and zero emoji literals in registry table chrome in `src/components/EntityRegistryTable.tsx`
- [ ] T020 [US4] Add unit test verifying bold entity title formatting, sub-line categories, chip status badges, and action buttons in `src/tests/EntityRegistryTable.test.tsx`

**Checkpoint**: User Stories 1 through 4 work independently.

---

## Phase 7: User Story 5 - Operations Dashboard & Department Task Center Modals (Priority: P2)

**Goal**: Deliver Operations Dashboard modal with 5 KPI tiles and row-level triage actions alongside Department Task Center modal with department tabs and layout-stable in-place task resolution.

**Independent Test**: Verify Operations Dashboard renders 5 KPI tiles, triage rows carry direct resolve buttons, Department Task Center supports in-place resolve transitions without layout shift, and all modals lock body scroll and dismiss on Escape or backdrop click.

- [ ] T021 [US5] Migrate Operations Dashboard Modal onto shared `<Modal />` primitive and render 5 KPI tiles plus row-level triage action buttons in `src/components/ProductionDashboardModal.tsx`
- [ ] T022 [US5] Migrate Department Task Center Modal onto shared `<Modal />` primitive, adding department tabs, open counts, severity-striped cards, and in-place resolve transitions without layout shift in `src/components/ActionListModal.tsx`
- [ ] T023 [US5] Add unit test verifying 5 KPI tiles, row-level triage actions, department tabs, and layout-stable task resolution in `src/tests/Modals.test.tsx`

**Checkpoint**: All 5 user stories are complete and independently testable.

---

## Phase 8: Polish & Cross-Cutting Verification

**Purpose**: E2E browser assertions, static compliance gate validation, full test suite execution, and design log recording.

- [ ] T024 [P] Update Playwright E2E browser validation script to assert modal body scroll lock (`document.body.style.overflow === 'hidden'`), Escape key and backdrop dismissal, and layout-stable task resolve transitions in `tests/live_design_system_validation.js`
- [ ] T025 Execute `./scripts/spec-check.sh` static gate and fix any remaining emoji literals, hex color strings outside `src/index.css`, or character encoding issues across `src/`
- [ ] T026 Run complete unit test suite (`npm test`) and production build (`npm run build`) to verify clean compilation and zero test failures
- [ ] T027 Log design updates, visual conformance verification against `mockup-v3.html`, and test evidence in `DESIGN_LOG.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user story implementations
- **User Stories (Phases 3–7)**: Depend on Foundational phase completion (Phases 3 through 6 are P1; Phase 7 is P2)
- **Polish (Phase 8)**: Depends on all user story phases being complete

### Parallel Execution Opportunities
- Tasks T002, T003 in Setup can run in parallel
- Tasks T004, T005, T006 in Foundational can run in parallel
- After Phase 2 completes, user story implementations (Phases 3 through 7) can proceed incrementally or in parallel
- Task T024 (Playwright script) in Polish can run in parallel with T025/T026
