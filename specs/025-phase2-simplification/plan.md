# Implementation Plan: Phase 2 Workflow & Terminology Simplification

**Feature Branch**: `025-phase2-simplification`  
**Version**: `v0.25.0`  
**Target Architecture**: Shipped React / TypeScript / Vite Application (`src/`)  
**Visual Oracle Reference**: `mockup-v3.html` (repo root) per Constitution Article 9  

---

## Technical Architecture & Design System Integration

### 1. Header Bar Offloading (`src/components/CommandBar.tsx` & `SettingsPopover.tsx`)
- **Current State**: The header bar renders 8+ competing controls: project select, section buttons, demo token button, execution mode badge, quota counter, export shortcut, timeline button, readiness badge.
- **Simplified Architecture**:
  - **Main Header Bar**: `Logo & Title` + `Project Switcher` + `Section Navigation Tabs` (`Overview`, `Screenplay`, `Clearance Items`, `Tasks`) + `Readiness Badge` + `Settings Menu Trigger` (`"Settings"` button with `SettingsIcon` SVG).
  - **Settings Popover Component (`src/components/SettingsPopover.tsx`)**: An accessible popover or lightweight dropdown dialog housing:
    - Demo Access Token configuration button
    - Execution Mode pill indicator (`CLOUD_MODE` / `DEMO_MODE`)
    - Live Research Quota counter
    - Activity & Event Log viewer trigger

### 2. Contextual Primary Recommendation Card (`src/components/RecommendedActionCard.tsx` & `src/pages/WorkspacePage.tsx`)
- **Deterministic Priority Cascade**:
  1. `!hasScreenplay` -> Label: `"Add Screenplay"`, Target: open Screenplay Intake Modal.
  2. `blockersCount > 0` -> Label: `"Review 2 Clearance Blockers"` (or X blockers), Target: switch to `Clearance Items` tab with `Action Required` filter active.
  3. `reviewsCount > 0` -> Label: `"Review 5 Recommended Items"` (or Y reviews), Target: switch to `Clearance Items` tab with `Review Recommended` filter active.
  4. `departmentTasksCount > 0` -> Label: `"View 7 Department Tasks"` (or Z tasks), Target: switch to `Tasks` tab.
  5. `ready` -> Label: `"Export Clearance Binder"`, Target: open Binder Export drawer.
- **UI Layout**: Prominent hero banner at top of Overview section, single primary button, explanatory rationale badge.

### 3. Terminology & Status Vocabulary Convergence
- **Primary Label Mappings**:
  - `src/pages/WorkspacePage.tsx`, `src/components/CommandBar.tsx`:
    - `"Multi-Format Script Ingestion & 5-Category Resolution"` -> `"Screenplay Intake"`
    - `"Canonical Entity Registry"` -> `"Clearance Items"`
    - `"Observable Timeline"` -> `"Activity"`
    - `"Live Convergence Verification"` -> `"Clearance Readiness & Verification"`
  - `src/components/EntityRegistryTable.tsx`:
    - Button label `"Ground"` / `"Grounding"` -> `"Research"` (or `"Run Clearance Check"`)
    - Existing evidence button -> `"Review Evidence"`
  - Standardized status labels: `Cleared`, `Insufficient evidence`, `Review recommended`, `Action required`.

### 4. Workspace Section Navigation (`src/pages/WorkspacePage.tsx`)
- **State**: `activeTab: 'overview' | 'screenplay' | 'clearance' | 'tasks'`
- **Tab Rendering**:
  - **`Overview`**: Shooting Readiness Hero + Recommended Action Card + Top Blockers Summary.
  - **`Screenplay`**: Screenplay Intake Trigger + Script Viewer + Scene Navigator + Occurrence highlighter.
  - **`Clearance Items`**: Scan-first Clearance Items Table + Category Filters + Research & Replacement actions.
  - **`Tasks`**: Department Task Center + Operations Dashboard.
- **Accessibility**: ARIA `tablist`/`tab`/`tabpanel` markup with ArrowLeft/ArrowRight key handling.

### 5. Cross-Panel Focus Resolver, Onboarding Keying & Snapshot Hydration Boundary (`src/hooks/useModalFocus.ts`, `src/components/CitationDrawer.tsx`, `src/pages/WorkspacePage.tsx`, `src/App.tsx`)
- **Cross-Panel Focus Resolver**:
  - `useModalFocus` updated to support `resolveReturnTarget?: () => HTMLElement | null` callback during unmount cleanup.
  - Mount-detection mechanism ensures focus restoration executes cleanly even when targets mount asynchronously during panel transitions.
  - `CitationDrawer` provides a dynamic focus resolver evaluating available target elements in priority order:
    1. `button[data-entity-id="ent-..."]` or `button[aria-label*="Research ..."]` (now mounted in `Clearance Items` panel);
    2. `[data-entity-row="ent-..."]` (the Nocturne row container);
    3. `#tab-clearance` (the Clearance Items tab button).
  - Guarantees focus does NOT drift to header controls like "Switch Project".
- **Project-Scoped Onboarding Keying**:
  - `OnboardingBanner` keys dismissal per project ID: `clearancescout:onboarding:v1:<project-id>`.
  - `App.tsx` persists active project selection across page reloads in `clearancescout_active_project_id`.
- **Atomic Workspace Snapshot Hydration Boundary**:
  - `WorkspacePage` enforces a single snapshot hydration gate (`isHydrating WorkspacePage` / `isLoadingWorkspace`).
  - During project switching or initial data fetching, the loading/synchronizing indicator remains active across overview, screenplay, clearance, and tasks sections until `scenes`, `entities`, `readiness`, and `actions` resolve and apply atomically.
  - Prevents rendering contradictory intermediate states (e.g. "7 entities" in header while panels show "0 scenes, 0 items" and recommendation displays "No Screenplay Ingested").

---

## File Modification Plan

1. **`src/components/SettingsPopover.tsx`**:
   - Popover component for secondary administrative controls offloaded from CommandBar.
2. **`src/components/CommandBar.tsx`**:
   - Streamline header to primary identity, section tabs, readiness badge, and Settings trigger.
3. **`src/components/RecommendedActionCard.tsx`**:
   - Update calculation cascade and 1-click tab jump logic.
4. **`src/pages/WorkspacePage.tsx`**:
   - Add section tab state, atomic snapshot hydration boundary (`isLoadingWorkspace`), render section views, update terminology.
5. **`src/components/EntityRegistryTable.tsx`**:
   - Update `"Ground"` -> `"Research"` label, ensure `data-entity-id` is on all primary action buttons, preserve scan density.
6. **`src/components/CitationDrawer.tsx`**:
   - Pass dynamic `resolveReturnTarget` callback to `useModalFocus` for deterministic cross-panel focus restoration.
7. **`src/hooks/useModalFocus.ts`**:
   - Support `resolveReturnTarget` callback in cleanup phase and implement mount-detection focus restoration.
8. **`src/components/OnboardingBanner.tsx`**:
   - Implement namespaced, versioned `localStorage` keying per project ID.
9. **`src/App.tsx`**:
   - Persist and restore `clearancescout_active_project_id` in `localStorage`, synchronize project summary with loaded workspace snapshot.
10. **`src/components/ProjectListModal.tsx`**:
    - Add `data-project-id` attributes to project selection cards.
11. **`tests/` & `scripts/`**:
    - `tests/live_keyboard_focus_validation.js`: Real Playwright Chromium browser validation suite testing local and live Cloud Run deployment.
    - `tests/contract/test_phase2_closure_focus_and_labels.test.tsx`: Vitest/jsdom unit contract tests.

---

## Requirement -> Task -> Test Traceability Matrix

| Requirement / Acceptance Criteria | Implementation Component(s) | Task ID | Automated Test File & Target | Test Type |
|---|---|---|---|---|
| **AC-14.1–14.3** (Recommended Next Action Cascade) | `RecommendedActionCard.tsx`, `WorkspacePage.tsx` | T005, T006 | `tests/live_keyboard_focus_validation.js` [Section 6] | Playwright (Chromium) |
| **AC-15.1–15.4** (Domain Terminology & Human Headings) | `CommandBar.tsx`, `EntityRegistryTable.tsx`, `CitationDrawer.tsx` | T007, T008 | `tests/contract/test_phase2_closure_focus_and_labels.test.tsx` | Vitest / jsdom |
| **AC-16.1–16.3** (Streamlined Header & Settings Popover) | `CommandBar.tsx`, `SettingsPopover.tsx` | T001, T002, T003 | `tests/live_keyboard_focus_validation.js` [Section 2] | Playwright (Chromium) |
| **AC-17.1–17.4** (Section Tab Panel Switching) | `WorkspacePage.tsx`, `CommandBar.tsx` | T004 | `tests/contract/test_phase2_closure_focus_and_labels.test.tsx` | Vitest / jsdom |
| **AC-18.1–18.2** (Entity Scan Density & Modal Contract) | `EntityRegistryTable.tsx`, `useModalFocus.ts` | T009, T010 | `tests/live_keyboard_focus_validation.js` [Sections 2-5] | Playwright (Chromium) |
| **AC-18.3** (Cross-Panel Focus Restoration) | `useModalFocus.ts`, `CitationDrawer.tsx`, `EntityRegistryTable.tsx` | T015, T018 | `tests/live_keyboard_focus_validation.js` [Section 6 & Live Run] | Playwright (Chromium) |
| **AC-18.4** (Project-Scoped Onboarding Isolation) | `OnboardingBanner.tsx`, `App.tsx`, `ProjectListModal.tsx` | T016 | `tests/live_keyboard_focus_validation.js` [Section 7] | Playwright (Chromium) |
| **AC-18.5** (Real Browser Verification Gate) | `live_keyboard_focus_validation.js` | T017, T020 | `tests/live_keyboard_focus_validation.js` | Playwright (Chromium) |
| **AC-19.1** (Atomic Workspace Snapshot Hydration) | `WorkspacePage.tsx`, `App.tsx` | T019 | `tests/live_keyboard_focus_validation.js` [Section 8] | Playwright (Chromium) |
| **AC-3.1** (Systemic Emoji Chrome Sweep) | `src/` UI Chrome components | T011 | `./scripts/spec-check.sh` | Static Spec Check Script |
| **Cloud Run Deployment & Verification** | Cloud Run Service `clearancescout` | T021, T022 | `tests/live_keyboard_focus_validation.js` against Cloud Run | Playwright (Live Production) |


