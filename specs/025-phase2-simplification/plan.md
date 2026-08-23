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

---

## File Modification Plan

1. **`src/components/SettingsPopover.tsx`** (NEW):
   - Popover component for secondary administrative controls offloaded from CommandBar.
2. **`src/components/CommandBar.tsx`**:
   - Streamline header to primary identity, section tabs, readiness badge, and Settings trigger.
3. **`src/components/RecommendedActionCard.tsx`**:
   - Update calculation cascade and 1-click tab jump logic.
4. **`src/pages/WorkspacePage.tsx`**:
   - Add section tab state, render section views, update terminology.
5. **`src/components/EntityRegistryTable.tsx`**:
   - Update `"Ground"` -> `"Research"` label, preserve scan density.
6. **`src/components/icons/Icons.tsx`**:
   - Add `SettingsIcon` SVG if missing.
7. **`tests/` & `scripts/`**:
   - Add unit/integration tests for User Stories 14-18 and verify `spec-check.sh` and Playwright scripts.
