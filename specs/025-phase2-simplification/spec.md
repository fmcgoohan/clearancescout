# Feature Specification: ClearanceScout Phase 2 Workflow & Terminology Simplification

**Feature Branch**: `025-phase2-simplification`  
**Version**: `v0.25.0-phase2-implemented`  
**Created**: 2026-08-24  
**Updated**: 2026-08-24  
**Status**: Implemented — Pending Final Human Sign-off (Verified on Cloud Run Revision clearancescout-00007-dmw via Commit 8e7ddff)  
**Input**: Two-Phase QA Brief (`docs/phase1-modal-fix-phase2-ux-simplification-brief.md`) & Constitution Articles 13, 14, 16 Proposal  
**Oracle Visual Reference**: `mockup-v3.html` (repo root) per Constitution Article 9  

---

## Objective & Product Outcome

Simplify ClearanceScout into a guided, production-clearance workspace that presents existing functionality as an intuitive workflow without expanding product scope or modifying underlying data models.

An operator entering ClearanceScout MUST be able to immediately answer from the rendered interface:
1. *What project am I in?*
2. *What is its clearance state?*
3. *What requires my attention?*
4. *What should I do next?*
5. *Where is the screenplay, clearance items, and departmental work?*

---

## User Stories & Acceptance Criteria

### User Story 14: Contextual Primary Recommended Next Action (Priority: P1)
**As a** line producer or clearance operator,  
**I want** a single prominent card that highlights the single highest-priority next step based on live project state,  
**So that** I immediately know what to do next without evaluating rows of equal-weight action buttons.

- **AC-14.1**: The workspace MUST render exactly one primary contextual recommendation card driven by a deterministic project-state cascade:
  1. `No Screenplay` -> `"Add Screenplay"` (opens intake modal).
  2. `Blockers > 0` -> `"Review X Clearance Blockers"` (navigates to `Clearance Items` filtered by `Action Required`).
  3. `Blockers == 0 & Reviews > 0` -> `"Review Y Recommended Items"` (navigates to `Clearance Items` filtered by `Review Recommended`).
  4. `Blockers == 0 & Reviews == 0 & Tasks > 0` -> `"View Z Department Tasks"` (navigates to `Tasks` tab).
  5. `Ready` -> `"Export Clearance Binder"` (opens Binder Export drawer).
- **AC-14.2**: Clicking the recommendation's primary action button MUST execute a 1-click jump directly to the target view with appropriate filters applied.
- **AC-14.3**: For verified project state (2 Action Required, 5 Review Recommended, 7 Department Tasks), the primary recommendation MUST display `"Review 2 Clearance Blockers"`.

---

### User Story 15: Production Domain Terminology & Status Vocabulary Convergence (Priority: P1)
**As a** clearance professional,  
**I want** the workspace chrome to use film/TV clearance terminology and consistent status labels,  
**So that** I can navigate the application without deciphering software engineering terms.

- **AC-15.1**: Primary UI chrome MUST replace technical phrases with domain terminology:
  - `"Multi-Format Script Ingestion & 5-Category Resolution"` -> `"Screenplay Intake"`
  - `"Canonical Entity Registry"` -> `"Clearance Items"`
  - `"Ground"` / `"Grounding"` -> `"Research"` or `"Run Clearance Check"`
  - `"Observable Timeline"` -> `"Activity"`
- **AC-15.2**: Status vocabulary across all badges, cards, filters, and reasons MUST converge on four standard domain terms:
  - `Cleared`
  - `Insufficient evidence`
  - `Review recommended`
  - `Action required`
- **AC-15.3**: Technical terms (`canonicalEntityId`, `GROUNDING_ATTEMPT`) MUST be strictly confined to technical tooltips and provenance drawers.

---

### User Story 16: Streamlined Header & Secondary Administrative Settings Menu (Priority: P1)
**As a** clearance operator,  
**I want** a clean, uncluttered header bar with secondary administrative controls housed in a menu,  
**So that** operational diagnostics do not compete with primary workflow controls.

- **AC-16.1**: The top header bar MUST keep immediately visible only:
  1. ClearanceScout logo & Project Switcher dropdown
  2. Primary Section Navigation tabs (`Overview`, `Screenplay`, `Clearance Items`, `Tasks`)
  3. Shooting Readiness Index Badge
  4. Secondary Settings/More Menu Trigger (`"Settings"` button)
- **AC-16.2**: Opening the Settings menu MUST render a lightweight popover/modal containing secondary administrative controls:
  - Demo Access Token configuration trigger
  - Execution Mode pill indicator (`CLOUD_MODE` / `DEMO_MODE`)
  - Live Research Quota counter
  - Activity & Event Log viewer trigger
- **AC-16.3**: The Settings menu popover MUST be 100% keyboard accessible (Tab, Space/Enter, Escape to dismiss, focus restoration).

---

### User Story 17: Bounded Workspace Section Navigation (Priority: P1/P2)
**As an** operator,  
**I want** clear section tabs (`Overview`, `Screenplay`, `Clearance Items`, `Tasks`),  
**So that** I can focus on specific workflow areas without endlessly scrolling a single long page.

- **AC-17.1**: The workspace MUST provide four section navigation tabs:
  - **Overview**: Shooting Readiness hero, Contextual Primary Recommendation, Key Blockers summary.
  - **Screenplay**: Screenplay Intake trigger, Monospace Script Viewer, Scene Navigator, Occurrence highlighter.
  - **Clearance Items**: Entity Table, search/filter controls, Research & Replacement actions.
  - **Tasks**: Department Task Center & Operations Dashboard.
- **AC-17.2**: Switching tabs MUST update the displayed workspace view instantly without resetting state or re-fetching synchronized project data.
- **AC-17.3**: Tab navigation MUST implement proper ARIA roles (`role="tablist"`, `role="tab"`, `role="tabpanel"`) and support Left/Right arrow key switching.

---

### User Story 18: Preserved Entity Registry & Re-Verified Cross-Modal Contract (Priority: P0/P1)
**As a** system operator,  
**I want** the scan-first Entity Registry density and all 11 modal dialog behaviors to remain 100% compliant,  
**So that** UX simplification does not cause accessibility or modal focus regressions.

- **AC-18.1**: Entity table rows MUST retain low action density: 1 primary action button, occurrences shortcut, secondary overflow menu (`...`), and `"Showing 7 of 7 entities"`.
- **AC-18.2**: All 11 modal dialogs MUST be re-verified against the modal focus contract (visible above backdrop, background inert, focus trapped, Escape/Cancel dismisses, focus restored).

---

## Article 7 Mandatory Regression Clauses (Codified 2026-08-24)

- **AC-17.4 (Tab Panel Content Switching Guarantee)**: Section navigation tabs (`Overview`, `Screenplay`, `Clearance Items`, `Tasks`) MUST render distinct, verifiable DOM panel content per tab wrapped in valid `role="tabpanel"` containers. Switching tabs MUST NOT leave viewport content unchanged. Automated tests MUST assert tab-specific rendered DOM content (e.g. presence/absence of tab-specific section headings and controls), not merely class names or `aria-selected` attributes.
- **AC-15.4 (Human-Readable Research Drawer Headings)**: Research/dossier drawer headings (`CitationDrawer`) MUST display the human-readable entity display name (e.g., `"Nocturne of the Wild"`). Raw internal entity IDs (e.g., `"ent-ee6ff3e4"`) MUST be strictly confined to secondary metadata tags (`System ID: ent-...`) and MUST NOT appear as primary drawer title headings.
- **AC-3.1 (Systemic Emoji Chrome Sweep & Static Check Enforcement)**: All UI chrome components across the entire `src/` directory MUST be 100% free of raw emoji characters in visible strings and markup, using SVG icon components or plain text per Constitution Article 3. The static check gate (`./scripts/spec-check.sh`) MUST recursively scan all `.ts` and `.tsx` files under `src/` with Unicode-aware regex (`perl -C -ne '/\p{Extended_Pictographic}/'`) and fail with exit code 1 if any raw emojis are detected.
- **AC-18.3 (Cross-Panel Focus Restoration Guarantee)**: 
  - Activating the Overview recommendation ("Review 2 Clearance Blockers" or "Research Nocturne of the Wild") MUST switch section tabs from `Overview` to `Clearance Items` and open the research drawer (`CitationDrawer`).
  - Because the originating trigger button on `Overview` becomes unmounted during the tab transition, closing the drawer MUST restore focus using a mount-detection fallback resolver in this exact priority order:
    1. Nocturne's mounted "Research" button on the active `Clearance Items` panel (e.g. `button[aria-label*="Research Nocturne of the Wild"]`);
    2. The target Nocturne entity row heading or focusable row container (`[data-entity-id="..."]`);
    3. The active "Clearance Items" tab button (`#tab-clearance`).
  - Focus MUST NEVER drift or fall back to unrelated header controls (such as `"Switch Project"`).
  - The focus restoration callback MUST execute cleanly in deployed Cloud Run builds and handle asynchronous mounting timing between drawer removal and Clearance Items target rendering via mount-detection (e.g. MutationObserver or retry microtask) rather than arbitrary fixed delays.
  - Same-panel dialogs and modals (e.g. `DemoTokenModal`, `ScriptUploadModal`, `OperationsDashboardModal`) MUST continue restoring focus to their still-mounted trigger buttons upon dismissal.
  - Department Task Center (`ActionListModal`) focus restoration MUST NOT regress.
  - The visible button text, accessible name, supporting card copy, and filtered destination MUST strictly agree on the target workflow.
- **AC-18.4 (Project-Scoped Onboarding Persistence Guarantee)**: 
  - Onboarding banner dismissal MUST be persisted using versioned, project-namespaced keys in `localStorage`: `clearancescout:onboarding:v1:<project-id>`.
  - Dismissing the onboarding banner in Project A MUST NOT suppress onboarding when navigating to or creating an unrelated Project B.
  - Active project selection MUST be persisted across page reloads (`clearancescout_active_project_id`).
- **AC-18.5 (Real Rendered Browser Verification Gate)**:
  - Cross-panel focus restoration, modal focus trapping, project-scoped onboarding persistence, and live Cloud Run deployment behavior MUST be validated using a real Chromium browser automation test (`tests/live_keyboard_focus_validation.js`).
  - Vitest / jsdom simulated DOM unit tests MUST be strictly and accurately labeled as Vitest/jsdom simulated tests in test logs and documentation, and MUST NOT be claimed as Playwright or rendered-browser evidence.

---

### User Story 19: Atomic Workspace Snapshot Presentation & Synchronization Boundary (Priority: P0)
**As a** clearance operator,  
**I want** the workspace header summary, screenplay count, clearance items registry, task count, shooting readiness, and recommended next action to render from one atomic, internally consistent project snapshot,  
**So that** I am never presented with contradictory intermediate UI (e.g. "7 entities" in header summary while panels display "0 scenes, 0 items" and recommendation shows "No Screenplay Ingested").

- **AC-19.1**: The workspace MUST enforce a single snapshot-readiness hydration boundary gate (`isHydrating` / `isLoadingWorkspace`):
  1. While a project snapshot is hydrating or switching, the synchronizing loading indicator MUST remain active across dependent workspace views until all collection queries (`scenes`, `entities`, `readiness`, `actions`) resolve and apply atomically.
  2. Contradictory intermediate UI (e.g. rendering `"No Screenplay Ingested"` or empty tables while header displays non-zero summary counts) MUST NOT be exposed to the user.
  3. A legitimately empty, fully hydrated project MUST render the correct empty state (distinguishing "loading/synchronizing" from "loaded and empty").
  4. Automatic background updates MUST NOT replace valid rendered data with a full-page loading screen unless snapshot consistency explicitly requires re-hydration.
  5. Fetch/network errors MUST be caught gracefully with retry triggers without trapping the operator in an infinite loading state.

---

## Verification & Acceptance Gate

Phase 2 implementation will be deemed complete when:
1. `./scripts/spec-check.sh` passes with 0 violations across `src/`.
2. All unit, contract, and integration test suites pass 100% green under Vitest/jsdom.
3. First-time user validation confirms all 8 operator questions are clearly answered from rendered UI alone.
4. Real Playwright Chromium browser validation (`node tests/live_keyboard_focus_validation.js`) passes 100% across both local server (`http://localhost:5173`) AND live Cloud Run deployment URL (`https://clearancescout-n3tcx4jcbq-uc.a.run.app`) across all verification sections:
   - `demo_token_modal_focus_trap_and_escape`
   - `script_upload_modal_focus_trap_and_live_region`
   - `operations_dashboard_modal_focus_trap_and_escape`
   - `department_tasks_action_center_focus_trap_and_escape`
   - `recommended_action_drawer_cross_panel_focus_restoration`
   - `project_scoped_onboarding_persistence_and_isolation`
   - `atomic_workspace_snapshot_hydration_boundary`
   - `live_cloud_run_deployment_verification`



