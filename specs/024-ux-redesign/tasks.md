# Implementation Tasks: Feature 024 ClearanceScout UX Redesign

**Branch**: `024-ux-redesign` | **Date**: 2026-08-23 | **Spec**: [`spec.md`](spec.md) | **Plan**: [`plan.md`](plan.md)

---

## Workstream 1: Terminology & Navigation Architecture

- [ ] **Task 1.1: Standardize UI Domain Terminology**
  - **User Outcome**: Primary controls and badges use intuitive production terminology ("Research", "Clearance Items", "Screenplay Intake & Clearance", "Blocking Occurrences") instead of specialist/developer terms ("Ground", "Canonical Entity Registry").
  - **Components Affected**: `src/components/EntityRegistryTable.tsx`, `src/components/StatusBadge.tsx`, `src/App.tsx`, `src/pages/WorkspacePage.tsx`.
  - **Accessibility**: All renamed controls retain explicit screen-reader accessible names (`aria-label`).
  - **Responsive**: Shortened button text prevents horizontal wrapping on small screens.
  - **Data/Count Dependencies**: None.
  - **Test Cases**: `tests/contract/test_rendered_sample_load_ui.test.ts`, `src/tests/EntityRegistryTable.test.tsx`.
  - **Definition of Done**: Searching `src/` for standalone `"Ground"` or `"Canonical Entity Registry"` in primary UI text yields 0 matches; all tests pass.

- [ ] **Task 1.2: Delineate Navigation Boundaries & Operational Views**
  - **User Outcome**: Operators easily understand the purpose of Clearance Items, Department Tasks, Operations Dashboard, Observable Timeline, and Clearance Binder via explicit subheadings, tooltips, and first-use guidance.
  - **Components Affected**: `src/App.tsx`, `src/components/NavigationHeader.tsx` (or command bar), `src/components/Tooltip.tsx`.
  - **Accessibility**: Navigation items use semantic `<nav>` and `<button>` elements with keyboard focus indicators.
  - **Responsive**: Secondary navigation items collapse into a "More Tools" dropdown menu below 1199px.
  - **Data/Count Dependencies**: None.
  - **Test Cases**: `src/tests/CommandBar.test.tsx`.
  - **Definition of Done**: Visual tooltips and sub-titles describe each operational surface; unit tests pass.

---

## Workstream 2: Header, Command Bar & Contextual Recommended Action Card

- [ ] **Task 2.1: Redesign Command Bar Header & Subordinate Secondary Tools**
  - **User Outcome**: Header prominently features Project Identity and Project Summary while subordinating secondary utilities (Access Token, Execution Mode, Live Quota, Export, Timeline) to an overflow menu or secondary bar.
  - **Components Affected**: `src/App.tsx`, `src/components/CommandBar.tsx`.
  - **Accessibility**: Single primary button page-wide, aria-haspopup on overflow menu, Esc key dismissal.
  - **Responsive**: Toolbar wraps cleanly below 900px without horizontal scrollbars.
  - **Data/Count Dependencies**: Live Quota meter reads from `useWorkspaceContext`.
  - **Test Cases**: `src/tests/CommandBar.test.tsx`, `tests/live_design_system_validation.js`.
  - **Definition of Done**: Header visual weight prioritizes project identity and summary; `npm test` passes.

- [ ] **Task 2.2: Implement Contextual Recommended Next Action Card**
  - **User Outcome**: Operators see a prominent recommendation card answering *"What do I do next?"* with the highest-priority unresolved blocker and a 1-click resolution button.
  - **Components Affected**: `src/components/RecommendedActionCard.tsx`, `src/pages/WorkspacePage.tsx`, `src/utils/recommendationEngine.ts`.
  - **Accessibility**: Card uses `role="region"` with `aria-label="Recommended Action"`, high-contrast text.
  - **Responsive**: Card scales fluidly across desktop, tablet, and mobile breakpoints.
  - **Data/Count Dependencies**: Calculates top entity with `ACTION_REQUIRED` / `BLOCKS_SHOOTING` from `ProjectState`.
  - **Test Cases**: `src/tests/RecommendedActionCard.test.tsx`.
  - **Definition of Done**: Card renders near Readiness Band, updates state dynamically, and opens resolution dialog when clicked.

---

## Workstream 3: Clearance Item Registry & Responsive Split Pane

- [ ] **Task 3.1: Enhance Clearance Item Registry Table Usability**
  - **User Outcome**: Registry table presents entity names with muted category sub-lines, explicit text labels on primary buttons ("Research", "Compare", "2 uses"), and hides "Research All Pending" when pending count is 0.
  - **Components Affected**: `src/components/EntityRegistryTable.tsx`, `src/components/OccurrenceDrawer.tsx`.
  - **Accessibility**: Table headers use `<th scope="col">`, actions maintain minimum 44px touch targets.
  - **Responsive**: Action column has minimum `180px` width; long entity names wrap cleanly without squishing action controls.
  - **Data/Count Dependencies**: Entity count, pending research count, occurrence count.
  - **Test Cases**: `src/tests/EntityRegistryTable.test.tsx`.
  - **Definition of Done**: Table rendered with scan-first layout, zero clipped text at 1200px and 900px.

- [ ] **Task 3.2: Implement Interactive Split Pane & Mobile Card Layout**
  - **User Outcome**: Medium tablet users can collapse or expand the screenplay panel via a toggle (`[Collapse Script]`), while mobile users see stacked responsive cards for registry items.
  - **Components Affected**: `src/pages/WorkspacePage.tsx`, `src/components/ScriptViewer.tsx`, `src/components/EntityCard.tsx`.
  - **Accessibility**: Panel toggle button has clear `aria-expanded` state; mobile cards use semantic heading structures.
  - **Responsive**: Side-by-side on `>=1200px`, collapsible on `768px-1199px`, stacked cards on `<768px`.
  - **Data/Count Dependencies**: None.
  - **Test Cases**: `tests/live_design_system_validation.js`.
  - **Definition of Done**: Playwright tests verify desktop split view and mobile card view without horizontal scroll.

---

## Workstream 4: Dashboard, Task Center & Clearance Binder Clarification

- [ ] **Task 4.1: Refine Operations Dashboard Modal & KPI Tiles**
  - **User Outcome**: Operations Dashboard renders five KPI tiles (Shooting Readiness Index, Blocking Entities, Unresolved Placeholders, Rights Expiring <90 Days, Open Department Tasks) with row-level resolution paths.
  - **Components Affected**: `src/components/ProductionDashboardModal.tsx`, `src/components/KPITile.tsx`.
  - **Accessibility**: Modal body scroll lock (`overflow: hidden`), Esc key dismissal, focus trapping via `useModalFocus`.
  - **Responsive**: KPI tiles grid adapts from 5 columns on desktop to 2 columns on tablet and 1 column on mobile.
  - **Data/Count Dependencies**: Synchronized counts from `ProjectState`.
  - **Test Cases**: `src/tests/Modals.test.tsx`.
  - **Definition of Done**: Modal opens with focus trapped, displays 5 accurate KPI tiles, body scroll locks.

- [ ] **Task 4.2: Refine Department Task Center & In-Place Resolution**
  - **User Outcome**: Department heads navigate tasks via tabbed department views (Art, Legal, Props, Production) and resolve tasks in-place without layout shift.
  - **Components Affected**: `src/components/ActionListModal.tsx`, `src/components/TaskCard.tsx`.
  - **Accessibility**: Tab list uses `role="tablist"` and `role="tab"`, keyboard arrow key navigation.
  - **Responsive**: Tasks list fits within modal viewport height with internal scrolling (`overflow-y: auto`).
  - **Data/Count Dependencies**: Department task counts update atomically.
  - **Test Cases**: `src/tests/Modals.test.tsx`.
  - **Definition of Done**: In-place resolve button transitions seamlessly to "RESOLVED" badge; task counts update atomically.

- [ ] **Task 4.3: Enhance Clearance Binder Export Deliverable**
  - **User Outcome**: Line producers export official clearance binder with SHA-256 digest, readiness summary, scene breakdown, and recorded rights.
  - **Components Affected**: `src/components/ExportModal.tsx`, `src/utils/binderGenerator.ts`.
  - **Accessibility**: Form controls labeled, download button provides clear focus state.
  - **Responsive**: Export preview formatted cleanly across screen sizes.
  - **Data/Count Dependencies**: Full project state snapshot.
  - **Test Cases**: `tests/contract/test_counsel_review_binder.test.ts`.
  - **Definition of Done**: Export generates binder document with SHA-256 digest; unit tests pass.

---

## Workstream 5: Ingestion Focus, Atomic Synchronization & Live Announcements

- [ ] **Task 5.1: Implement Atomic Ingestion State Pipeline & Rollback**
  - **User Outcome**: Screenplay ingestion (Replace vs Merge) updates scenes, entities, occurrences, tasks, and readiness atomically, or rolls back completely on error without leaving corrupt state.
  - **Components Affected**: `src/context/WorkspaceContext.tsx`, `src/components/ScriptUploadModal.tsx`.
  - **Accessibility**: Progress stages announced via `<div role="status" aria-live="polite">`, suppressing per-second timers. Errors use `role="alert"`.
  - **Responsive**: Modal remains centered and touch-friendly on mobile screens.
  - **Data/Count Dependencies**: Synchronizes all 4 count types atomically.
  - **Test Cases**: `tests/contract/test_chunked_script_ingestion.test.ts`, `tests/contract/test_rendered_sample_load_ui.test.ts`.
  - **Definition of Done**: Replacing script updates all counts in 1 render cycle; error rolls back state; tests pass.

- [ ] **Task 5.2: Durable Completion Confirmation Banner**
  - **User Outcome**: On ingestion completion, a durable confirmation banner announces parsed counts (*"Screenplay replaced successfully - 3 scenes processed - 7 entities registered - 7 department tasks created"*).
  - **Components Affected**: `src/components/ConfirmationBanner.tsx`, `src/pages/WorkspacePage.tsx`.
  - **Accessibility**: Uses `role="status"` with `aria-live="polite"` and `aria-atomic="true"`. Focus is restored to the primary project summary.
  - **Responsive**: Banner scales fluidly across all viewports.
  - **Data/Count Dependencies**: Exact parsed counts from ingestion response.
  - **Test Cases**: `src/tests/ScriptUploadModal.test.tsx`.
  - **Definition of Done**: Banner renders on completion with exact counts, focus restored; unit tests pass.

---

## Workstream 6: Onboarding & Specialist Concept Guidance

- [ ] **Task 6.1: Add Contextual Onboarding & "How Clearance Works" Guidance**
  - **User Outcome**: First-time users see a lightweight 3-step introduction, contextual empty-state copy, and tooltips explaining why a scene is red, insufficient evidence, and rights vs placeholders vs counsel overrides.
  - **Components Affected**: `src/components/OnboardingBanner.tsx`, `src/components/Tooltip.tsx`, `src/pages/WorkspacePage.tsx`.
  - **Accessibility**: Info banner is dismissible via keyboard Esc/button, tooltips accessible via focus/hover (`aria-describedby`).
  - **Responsive**: Guidance banner stacks cleanly on mobile viewports.
  - **Data/Count Dependencies**: Hides when project has active clearance data or when dismissed by user.
  - **Test Cases**: `src/tests/Onboarding.test.tsx`.
  - **Definition of Done**: Guidance banner renders for new projects, dismisses cleanly; tests pass.

---

## Workstream 7: Accessibility, Responsive QA & E2E Validation

- [ ] **Task 7.1: Conduct Full Accessibility & Responsive QA Audit**
  - **User Outcome**: Application satisfies 100% WCAG 2.2 AA standards (keyboard navigation, focus rings, modal scroll lock, live regions, 200% zoom scale, contrast, 0 raw emojis in chrome).
  - **Components Affected**: Entire `src/` directory, `src/index.css`.
  - **Accessibility**: Full keyboard operation, visible focus rings, VoiceOver testing compatibility.
  - **Responsive**: Validated at 1440px, 1024px, 768px, and 375px.
  - **Data/Count Dependencies**: None.
  - **Test Cases**: `scripts/spec-check.sh`, `tests/live_design_system_validation.js`, `npm test`.
  - **Definition of Done**: `scripts/spec-check.sh` passes 5/5 gauntlets; `npm test` passes all 91 test files; Playwright E2E audit passes.
