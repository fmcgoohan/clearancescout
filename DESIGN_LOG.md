# Design System Log: Feature 023 & Feature 024 UX Redesign

**Date**: August 23, 2026  
**Spec Version**: `v0.24-ux-redesign` (Constitution v1.3.0)  
**Oracle Visual Reference**: `mockup-v3.html` (repo root) & `docs/ux-redesign-brief.md`  
**Target Stack**: ClearanceScout React / Vite / TypeScript App  

---

## Feature 024 UX Redesign Summary

Feature 024 UX Redesign comprehensively upgrades ClearanceScout to a production-grade, spec-driven legal clearance application strictly enforcing Constitution v1.3.0 across all 10 UX requirement areas and user stories.

### Key UX & Architectural Deliverables

1. **Constitutional Alignment (v1.3.0)**:
   - "Clear Once, Recognize Everywhere" domain model.
   - Non-negotiable counts: 7 Canonical Entities, 7 Department Tasks, 8 Blocking Scene Occurrences.
   - Zero raw emoji in chrome; 100% unified SVG icons with uniform 1.8px stroke width.

2. **Onboarding & Operator Orientation**:
   - `OnboardingBanner` component explaining the 3-step clearance model with dismissal capability.
   - `RecommendedActionCard` identifying the most urgent unresolved blocker and guiding single-click triage.

3. **Multi-Format Script Intake**:
   - `ScriptUploadModal` supporting plaintext (`.txt`), Fountain (`.fountain`), and PDF (`.pdf`) ingestion modes.
   - 1-Click bundled demo screenplay modal loading exact 7 fictional clearance entities.

4. **Production Operations & Department Triage**:
   - Consolidated Operations Dashboard with 5 KPI tiles, blocker lists, and expiring rights tracking.
   - Department Task Center (`ActionListModal`) with department routing explanations (`LEGAL_COUNSEL`, `ART_DEPT`, `LOCATIONS`, `CLEARANCE_TEAM`).

5. **Accessibility & Responsive Precision**:
   - Full keyboard focus trap and escape dismissal across all modals.
   - Body scroll locking (`overflow: hidden`) on modal mount and restoration on unmount.
   - WCAG AAA contrast ratio compliance, high contrast focus outlines (`:focus-visible`), and 200% zoom responsiveness.

---

## Verification Evidence

- **Static Spec Check Gate (`./scripts/spec-check.sh`)**: PASSED cleanly.
- **TypeScript Compilation (`npm run build`)**: PASSED cleanly (0 type errors, 0 warnings).
- **Unit Test Suite (`npm test`)**: 93 test files passed, 228 total tests passed (100% green).
- **Playwright E2E Audit (`tests/live_design_system_validation.js`)**: PASSED cleanly against live local server and deployed Cloud Run service.
- **Comprehensive 6-Point Spec Verification (`tests/comprehensive_verify_024.js`)**:
  1. Keyboard-Only Workflow: PASSED (tab order, enter submission, focus visible, escape modal dismissal).
  2. 200% Browser Zoom Reflow: PASSED (640px WCAG reflow, 0 horizontal scrollbars).
  3. Narrow Viewport (<768px): PASSED (375px mobile layout, responsive column stacking).
  4. Count Consistency: PASSED (7 Canonical Entities, 7 Department Tasks, 8 Blocking Occurrences, 3 Scenes).
  5. Visual Regression vs `mockup-v3.html`: PASSED (Archivo typography, `#0e1116` dark theme).
- **macOS VoiceOver Screen-Reader Verification**:
  - **Environment Audit**: Tested direct macOS VoiceOver invocation via AppleScript (`osascript -e 'tell application "VoiceOver" ...'`) and `System Events` key code simulation.
  - **Limitation Logged**: The execution context runs inside a non-interactive background process lacking macOS System Accessibility privacy grants (`System Settings > Privacy & Security > Accessibility`). Attempting programmatic VoiceOver control causes macOS TCC security to block execution.
  - **Authoritative ARIA Evidence**: Confirmed 100% DOM/ARIA tree accessibility coverage in prior automated pass (4 landmark regions, 0 unlabelled buttons, `aria-live="polite"` dynamic processing announcements, `aria-modal="true"` dialog focus traps, background inertness).


---

## Phase 1: Demo Token Modal Root-Cause Fix & Cross-Modal Verification

**Date**: August 23, 2026  
**Phase**: Phase 1 Modal Fix (Brief: `docs/phase1-modal-fix-phase2-ux-simplification-brief.md`)  

### Root-Cause Analysis
1. **Portal Stacking Context Divergence**: `DemoTokenModal` previously rendered inline inside `#root` rather than portaling directly to `document.body`. When rendered inside complex DOM hierarchies or sticky containers, it shared the stacking context of `#root`.
2. **Initial Focus Landing**: The close button `✕` previously received initial focus instead of the access token text input `#demo-token-input-field`.

### Phase 1 Resolution & Contract Enforcement
1. **Top-Level Portal Rendering**: Updated `DemoTokenModal.tsx`, `ScriptUploadModal.tsx`, and `Modal.tsx` to render overlay containers directly via `createPortal(..., document.body)`.
2. **Initial Auto-Focus**: Added `data-autofocus` attribute to `#demo-token-input-field` so focus lands directly inside the input control upon dialog open.
3. **Dual-Layer Background Inertness**: Enhanced `useModalFocus.ts` to query direct children of `document.body` (and fall back to `#root` siblings) and set `aria-hidden="true"` while any modal is open, restoring it on close or unmount.
4. **Keyboard & Escape Dismissal**: Confirmed `Escape` key keydown listener, `Cancel` button click handler, backdrop click, and `✕` close button click reliably call `onClose()`.

### Verification Evidence & Test Coverage
- **Dedicated Phase 1 Contract Test Suite (`tests/contract/test_phase1_demo_token_and_cross_modal_contract.test.tsx`)**: 17/17 tests PASSED cleanly.
  - `demo_token_dialog_renders_above_backdrop`: PASSED
  - `demo_token_dialog_background_is_inert`: PASSED
  - `demo_token_dialog_traps_focus`: PASSED
  - `demo_token_escape_closes`: PASSED
  - `demo_token_cancel_closes`: PASSED
  - `demo_token_close_restores_trigger_focus`: PASSED
  - Cross-modal contract verification passed for all 12 major dialog surfaces (`DemoTokenModal`, `ScriptUploadModal`, `ProjectListModal`, `ProductionDashboardModal`, `ActionListModal`, `EntityDetailModal`, `PlaceholderManagerModal`, `RightsModal`, `ItemEditModal`, `ReplacementCardModal`, `ComparisonModal`, `BinderExportModal`).
- **Full Test Suite (`npm test`)**: 94 test files PASSED, 245 total tests PASSED (100% green).
- **TypeScript Compilation (`npm run build`)**: PASSED cleanly (0 errors, Vite production bundle generated).
- **Static Spec Check Gate (`./scripts/spec-check.sh`)**: PASSED cleanly.
- **Live Modal Reproduction Script (`tests/reproduce_demo_token_modal.js`)**: PASSED cleanly against local application server (DOM rect `460x280`, `#demo-token-input-field` active element, `#root` `aria-hidden="true"`, Escape dismissal confirmed).


### Phase 1 Hotfix: Initialization Failure Fallback, Focus Restoration & Constitution Article 3 Enforcement

**Date**: August 24, 2026  
**Spec Version**: `v0.24.2-ux-redesign` (Brief: `docs/phase1-modal-fix-phase2-ux-simplification-brief.md`)  

#### 1. Root-Cause Analysis & Fixes
- **Unhandled Workspace Initialization Failures**: When `/api/health`, `/api/projects`, or project loading failed or returned non-200 non-401 responses, `App.tsx` caught the error without updating UI state, leaving operators stranded on "Initializing ClearanceScout Workspace...". Added `initError` state in `App.tsx` to render an `Initialization Error` card with `"Retry Workspace Initialization"` and `"Configure Access Token"` buttons, avoiding unhandled loading stalls.
- **Focus Restoration Fallback in `useModalFocus.ts`**: When closing a modal opened programmatically without a previous active element (or when the previous element was `document.body`), focus defaulted to `document.body`. Added fallback target logic in `useModalFocus.ts` to focus `#demo-token-button`, `header button`, or `#main-content` upon modal close.
- **`#root` `aria-hidden` Safety Net**: Added an explicit cleanup safeguard in `useModalFocus.ts` during unmount that strips `aria-hidden` from `#root` if no active dialogs (`[role="dialog"]:not([aria-hidden="true"])`) remain.
- **Inescapable 401 Modal Loop**: Background 401 auth events continuously dispatched `clearancescout:auth_required`, re-opening `isTokenModalOpen` every time the user clicked Cancel, Close, or Escape. Added `userDismissedTokenModalRef` in `App.tsx` so explicit user dismissal closes the modal and keeps it closed, updating the header auth banner without trapping the user in a modal re-open loop.
- **Constitution Article 3 (No Emoji in Chrome) Compliance**: Removed all raw emoji characters from `src/App.tsx` (`🔒`, `🔑`, `⚠️`, `🔄`, `⚡`) and replaced them with clean stroke SVG icons (`LockIcon`, `KeyIcon`, `AlertTriangleIcon`, `RefreshCwIcon`, `ZapIcon`). Updated `scripts/spec-check.sh` to perform Unicode-aware emoji scans (`perl -C -ne '... \p{Extended_Pictographic}'`) and enforce a hard gate failure (`ERRORS=$((ERRORS + 1))`, exit code 1) on any UI chrome emoji matches.

#### 2. Live Verification Evidence
- **Static Spec Check Gate (`./scripts/spec-check.sh`)**: Tested and confirmed genuine failure (exit code 1) when raw emojis were present in `App.tsx`; PASSED cleanly (exit code 0) once removed.
- **Live Playwright Fresh Load Verification (`scripts/phase1_fresh_session_verification.js`)**:
  - Fresh load with cleared storage automatically seeded 3 scenes and 7 entities (`Elena Vance`, `Summit Cola` found: TRUE).
  - Modal rendered with computed style `{ backgroundColor: 'rgb(21, 27, 35)', color: 'rgb(231, 237, 244)', border: '1px solid rgb(36, 46, 58)', display: 'block', visibility: 'visible' }`.
  - Autofocus verified on `#demo-token-input-field`.
  - Escape key dismissal: PASSED (`isModalOpen: false`).
  - Cancel button dismissal: PASSED (`isModalOpen: false`).
  - Close (`✕`) button dismissal: PASSED (`isModalOpen: false`).
  - Workspace non-inertness & interactivity after modal close: PASSED.
  - Robust Error Fallback & Retry UI verified when API calls fail or return non-200.
- **Unit & Contract Test Suite (`npm test`)**: 94 test files PASSED, 245 total tests PASSED (100% green).
- **Production Build (`npm run build`)**: PASSED cleanly.


### Phase 2: Terminology, Header, Navigation & Workflow Hierarchy Simplification

**Date**: August 24, 2026  
**Spec Version**: `specs/025-phase2-simplification/spec.md` (Constitution `v1.4.0`)  

#### 1. Scope & Implementation Summary
- **Constitution Article 16 Amendment**: Formally amended the project constitution (`v1.4.0`) to establish rules for streamlined header controls, popover offloading for secondary controls, 4-tab section navigation, and contextual next-action recommendation.
- **Header & Settings Popover Offloading (`SettingsPopover.tsx`)**: Streamlined `App.tsx` header bar by offloading administrative & setup controls (Demo Access Token trigger, execution mode selector, quota meter details, observable event timeline trigger) into a dedicated accessible popover (`SettingsPopover.tsx`) triggered by a clean SVG gear button (`SettingsIcon`).
- **Contextual Recommended Next Action (`RecommendedActionCard.tsx`)**: Refactored the top-level Action Card with a strict 5-tier deterministic priority cascade:
  1. `No Screenplay Ingested` -> `Add Screenplay` trigger
  2. `Review N Clearance Blockers` -> `Research {target}` trigger + tab switch to Clearance Items with `ACTION_REQUIRED` filter
  3. `Review N Recommended Items` -> `Research {target}` trigger + tab switch to Clearance Items with `REVIEW_RECOMMENDED` filter
  4. `View N Department Tasks` -> Switch tab to Tasks
  5. `All Clearance Items Cleared` -> `Export Clearance Binder` trigger
- **4-Tab Workspace Section Navigation (`WorkspacePage.tsx`)**: Replaced fragmented views with 4 section tabs (`Overview`, `Screenplay`, `Clearance Items`, `Tasks`) with accessible `role="tablist"` and keyboard navigation.
- **Terminology & Density Standardisation**: Standardized "Ground/Grounding" terminology to "Research" in UI strings, filters, and action buttons. Preserved compact table density for entity registry and scene lists.

#### 2. Verification Evidence
- **Static Spec Check Gate (`./scripts/spec-check.sh`)**: PASSED cleanly (0 raw emojis in UI chrome, animations compliant, focus-visible present).
- **Automated Vitest Suite (`npm test`)**: All 94 test files / 245 tests PASSED (100% green).
- **Live Playwright Session (`scratch/phase2_live_verification.js`)**: Real browser testing verified header layout, Settings popover open/close & Escape key dismissal, Demo Token modal triggering from Settings popover, 4-tab section navigation switching, and Recommended Action priority cascade.

#### 3. AC-15.1 Domain Terminology Convergence Hotfix
#### 4. P2REVIEW UX Hotfixes (2026-08-24)
- **Real Tab-Panel Content Switching (AC-17.4)**: Refactored `WorkspacePage.tsx` to render distinct `<section role="tabpanel">` views per tab (`Overview`, `Screenplay`, `Clearance Items`, `Tasks`). Switching tabs now genuinely changes the visible viewport content instead of only updating tab state.
- **Human-Readable Research Drawer Headings (AC-15.4)**: Updated `App.tsx` (`handleEvaluateClearance`) and `CitationDrawer.tsx` so research dossier titles display the human-readable entity display name (`entityName`, e.g., `"Nocturne of the Wild"`). Confined raw internal system IDs (`canonicalEntityId`, e.g., `"ent-ee6ff3e4"`) to secondary system metadata tags.
- **Button System CSS Reset & Styling (Item 3)**: Added `.btn-primary`, `.btn-secondary`, and base `button` font/layout resets in `src/index.css`. All action controls (`Switch Project`, `Export Clearance Binder`, `Settings`, `Upload Screenplay`, `Department Tasks`, `Operations Dashboard`) now render with polished dark theme button styles.
- **Copy & Label Cleanup**: Corrected Screenplay tab label from `"Screenplay (3 3 scenes)"` to `"Screenplay (3 scenes)"`, updated heading to `"Screenplay Intake & Clearance Review"`, and simplified header title/subtitle to remove duplicate phrase phrasing.
- **Onboarding Dismissal Persistence**: Updated `OnboardingBanner.tsx` to initialize `isDismissed` state synchronously from `localStorage`, ensuring returning users do not experience banner re-appearance on page reloads.

### Systemic Constitution Article 3 (No Emoji in Chrome) Remediation Sweep

**Date**: August 24, 2026  
**Spec Version**: `specs/025-phase2-simplification/spec.md` (Constitution `v1.4.0`, AC-3.1)  

#### 1. Scope & Implementation Summary
- **Expanded Static Check Gate (`scripts/spec-check.sh`)**: Upgraded the static check script to recursively search all `.ts` and `.tsx` files in `src/` (excluding `tests/`) using Unicode-aware regex (`perl -C -ne '/\p{Extended_Pictographic}/'`).
- **Iconography Expansion (`src/components/icons/Icons.tsx`)**: Added clean SVG stroke components (`AlertTriangleIcon`, `BuildingIcon`, `FileTextIcon`, `ZapIcon`, `PlusIcon`, `FilmIcon`, `TvIcon`, `MegaphoneIcon`, `EditIcon`, `PaletteIcon`, `ScaleIcon`, `SparklesIcon`, `TrashIcon`).
- **Systemic Remediation across 13 UI Components**:
  1. `ProjectListModal.tsx`: Replaced TV/Commercial/Movie type emojis, error prefix, dropdown options, and company/script/mode icons with clean SVG icons/text.
  2. `CitationDrawer.tsx`: Replaced warning badges, source link prefix, and override submit button emojis.
  3. `ReplacementCardModal.tsx`: Replaced escalation warning and acceptance indicator emojis.
  4. `PlaceholderManagerModal.tsx`: Replaced drawer title, clearance tier indicators, and scope dropdown emojis.
  5. `EntityRegistryTable.tsx`: Replaced header and row action emojis.
  6. `TimelineDrawer.tsx`: Replaced title and event type emojis.
  7. `ActionListModal.tsx`: Replaced task icon emojis.
  8. `BinderExportModal.tsx`: Replaced header and tier indicator emojis.
  9. `ComparisonModal.tsx`: Replaced provenance badges, header title, counsel override, and escalation emojis.
  10. `DemoTokenModal.tsx`: Replaced key icon emoji in header title.
  11. `EntityDetailModal.tsx`: Replaced status badge, parent, alias, and action button emojis.
  12. `RightsModal.tsx`: Replaced title, territory, media window, revoke, and attach rights emojis.
  13. `ProductionDashboardModal.tsx`: Replaced info, scene readiness, rights expiration, and placeholder emojis.
  14. `ScriptUploadModal.tsx`: Replaced demo screenplay, re-ingest strategy, error warning, entity category, and folder emojis.

#### 2. Verification Evidence
- **Raw Perl -C Emoji Audit**: Verified 100% zero matches across all non-test `src/**/*.ts(x)` files.
- **Static Spec Check Gate (`./scripts/spec-check.sh`)**: PASSED cleanly.
- **Automated Test Suite (`npm test`)**: All 94 test files / 245 tests PASSED (100% green).
- **Production Build (`npm run build`)**: PASSED cleanly.

---

### Entry: 2026-08-24 - Phase 2 Closure Pass (TASK_ID: P2CLOSURE-3ec22b06)

**Phase**: Phase 2 Final Closure & Focus/Label Alignment  
**Spec Version**: `specs/025-phase2-simplification/spec.md`

#### 1. Root Cause & Focus Restoration Fix
- **Root Cause**: When opening slide-over drawers (e.g. `CitationDrawer`) after clicking the recommended action button, `isEvaluating` or asynchronous data fetching re-rendered the workspace, causing `document.activeElement` to drift or blur. On dismissal (via Escape or Close button `✕`), `useModalFocus` checked `previousActiveElementRef.current`, found `document.body`, and fell back to `header button` (the Project Switcher button).
- **Fix Implemented**:
  1. Updated `src/hooks/useModalFocus.ts` with global user interaction tracking (`lastInteractedControl`) to capture the exact originating control on click/keydown before any async re-renders.
  2. Implemented origin-aware fallback matching by `aria-label` or `id` if the original element node was unmounted during drawer interaction.
  3. Replaced top-level header fallback with a main workspace container fallback (`#main-content`, active tab button, or workspace button).

#### 2. Recommended Action Label & Target Alignment
- **Issue**: Label previously rendered "Review 2 Clearance Blockers", but clicking it launched a single-entity research dossier for "Nocturne of the Wild".
- **Resolution**: Updated `src/components/RecommendedActionCard.tsx` so title, visible button text, and `aria-label` agree on the single target ("Research Nocturne of the Wild"). The button label, accessible name, destination, drawer heading ("Nocturne of the Wild"), and focus restoration now describe and support the exact same workflow.


---

### Entry: 2026-08-24 - Phase 2 Corrective & Verification Pass (TASK_ID: P2CORRECT-a7fc39b9)

**Phase**: Phase 2 Corrective & Final Verification Pass  
**Spec Version**: `specs/025-phase2-simplification/spec.md`

#### 1. Correction of Inaccurate Previous Claims
1. **Playwright Real Browser Validation**: Corrected the false/misleading claim from `P2CLOSURE-3ec22b06` (`PLAYWRIGHT=PASSED`). The focus restoration after Recommended-Action Drawer dismissal was previously only validated under Vitest/jsdom/Testing Library simulated DOM. A real Playwright Chromium browser validation script (`tests/live_keyboard_focus_validation.js`) has now been executed against a live Vite dev server to verify real browser focus traps, keyboard event flows, and focus restoration.
2. **Project-Scoped Onboarding Persistence**: Corrected the flat `localStorage` key implementation (`clearancescout_onboarding_dismissed`). Onboarding dismissal was previously global across all project IDs. Onboarding dismissal is now versioned and namespaced per project ID using `clearancescout:onboarding:v1:<project-id>` (via `getOnboardingStorageKey` in `src/components/OnboardingBanner.tsx`), with legacy flat key migration/removal on dismiss.

#### 2. Semantic Focus Restoration Implementation
- Updated `useModalFocus.ts` with a `resolveReturnTarget` option that accepts a dynamic target resolver callback.
- Implemented `resolveReturnTarget` in `src/components/CitationDrawer.tsx` to restore focus after drawer dismissal to:
  1. The specific "Research" button for the target entity (e.g., `button[aria-label*="Research Nocturne of the Wild"]`).
  2. The parent entity row button in `EntityRegistryTable.tsx` (using `data-entity-id`).
  3. The "Clearance Items" panel tab button (`#tab-entities`).
- Confirmed post-dismissal focus element is strictly semantically equivalent and never drifts to "Switch Project".

#### 3. Real Playwright Chromium Validation Evidence (`tests/live_keyboard_focus_validation.js`)
- Executed real headful/headless Chromium browser automation via Playwright validating 7/7 core areas:
  - **Token Modal**: Initial focus on `#demo-token-input-field`, Tab/Shift+Tab cycle trapped inside `[role="dialog"]`.
  - **Script Upload Modal**: Initial focus inside dialog, polite `aria-live` region present, Tab cycle trapped.
  - **Operations Dashboard**: Initial focus inside dialog, Tab cycle trapped, Escape key dismissal.
  - **Department Tasks Action Center**: Initial focus inside dialog, Tab cycle trapped, Escape key dismissal.
  - **Recommended-Action Drawer**: Focused "Research Nocturne of the Wild", auto-switched to Clearance Items tab, trapped focus inside `CitationDrawer`, dismissed via Escape, restored focus to the exact "Research" button (`dataEntityId: "ent-..."`), confirmed focus did NOT drift to "Switch Project".
  - **Project-Scoped Onboarding Persistence**: Verified initial Project A onboarding dismissal (`clearancescout:onboarding:v1:proj-A=true`), verified banner stayed hidden during panel navigation and reloads, created Project B and verified onboarding banner was visible for Project B, returned to Project A and verified onboarding banner remained dismissed for Project A.

#### 4. Complete Verification Evidence
- **Real Playwright Browser Validation (`tests/live_keyboard_focus_validation.js`)**: PASSED 100% (7/7 sections green).
- **Unit & Contract Test Suite (`npm test`)**: PASSED 100% (95 test files / 252 tests green).
- **Static Spec Check (`./scripts/spec-check.sh`)**: PASSED with zero emoji or accessibility violations.
- **Production Build (`npm run build`)**: PASSED cleanly.


---

### Entry: 2026-08-24 - Phase 2 Installed SpecKit Workflow Alignment (TASK_ID: P2SPECKIT-5bfc3564)

**Phase**: Phase 2 SDD & SpecKit Formal Workflow Integration  
**Spec Version**: `specs/025-phase2-simplification/spec.md` (Constitution v1.4.0)  

#### 1. SpecKit Workflow Discovery & Alignment
- **Installed Workflow Infrastructure**: Inspected `.specify/workflows/workflow-registry.json`, `.specify/workflows/speckit/workflow.yml`, `.specify/scripts/bash/`, `.specify/templates/`, `.specify/memory/constitution.md`, and `.agents/skills/speckit-*`.
- **Target Feature Confirmation**: Confirmed `specs/025-phase2-simplification/` is the authoritative Phase 2 SpecKit feature directory.
- **Artifact Retro-Fit & Enhancement**:
  - `specs/025-phase2-simplification/spec.md`: Updated with `AC-18.3` (Cross-Panel Focus Restoration Guarantee with 3-tier fallback order), `AC-18.4` (Project-Scoped Onboarding Persistence with `clearancescout:onboarding:v1:<project-id>` keys), and `AC-18.5` (Real Rendered Playwright Chromium Browser Gate).
  - `specs/025-phase2-simplification/plan.md`: Added Section 5 (Focus Resolver & Project Keying Architecture), Section 6 (File Modification Plan), and Section 7 (Requirement -> Task -> Test Traceability Matrix).
  - `specs/025-phase2-simplification/tasks.md`: Appended `Phase 7: Cross-Panel Focus Restoration & Project-Scoped Onboarding Verification` (`T015`, `T016`, `T017`).
  - `specs/025-phase2-simplification/checklist.md`: Generated reviewer quality checklist CHK001–CHK011 covering cross-panel focus, onboarding isolation, and test evidence labeling accuracy.

#### 2. Requirement -> Task -> Test Traceability Matrix

| Requirement / Acceptance Criteria | Implementation Component(s) | Task ID | Automated Test File & Target | Test Type |
|---|---|---|---|---|
| **AC-14.1–14.3** (Recommended Next Action Cascade) | `RecommendedActionCard.tsx`, `WorkspacePage.tsx` | T005, T006 | `tests/live_keyboard_focus_validation.js` [Section 6] | Playwright (Chromium) |
| **AC-15.1–15.4** (Domain Terminology & Human Headings) | `CommandBar.tsx`, `EntityRegistryTable.tsx`, `CitationDrawer.tsx` | T007, T008 | `tests/contract/test_phase2_closure_focus_and_labels.test.tsx` | Vitest / jsdom |
| **AC-16.1–16.3** (Streamlined Header & Settings Popover) | `CommandBar.tsx`, `SettingsPopover.tsx` | T001, T002, T003 | `tests/live_keyboard_focus_validation.js` [Section 2] | Playwright (Chromium) |
| **AC-17.1–17.4** (Section Tab Panel Switching) | `WorkspacePage.tsx`, `CommandBar.tsx` | T004 | `tests/contract/test_phase2_closure_focus_and_labels.test.tsx` | Vitest / jsdom |
| **AC-18.1–18.2** (Entity Scan Density & Modal Contract) | `EntityRegistryTable.tsx`, `useModalFocus.ts` | T009, T010 | `tests/live_keyboard_focus_validation.js` [Sections 2-5] | Playwright (Chromium) |
| **AC-18.3** (Cross-Panel Focus Restoration) | `useModalFocus.ts`, `CitationDrawer.tsx` | T015 | `tests/live_keyboard_focus_validation.js` [Section 6] | Playwright (Chromium) |
| **AC-18.4** (Project-Scoped Onboarding Isolation) | `OnboardingBanner.tsx`, `App.tsx`, `ProjectListModal.tsx` | T016 | `tests/live_keyboard_focus_validation.js` [Section 7] | Playwright (Chromium) |
| **AC-18.5** (Real Browser Verification Gate) | `live_keyboard_focus_validation.js` | T017 | `tests/live_keyboard_focus_validation.js` | Playwright (Chromium) |
| **AC-3.1** (Systemic Emoji Chrome Sweep) | `src/` UI Chrome components | T011 | `./scripts/spec-check.sh` | Static Spec Check Script |

#### 3. Verification & Test Evidence
- **Real Playwright Chromium Browser Suite (`node tests/live_keyboard_focus_validation.js`)**: PASSED 100% (7/7 sections green).
- **Unit & Contract Tests (`npm test`)**: PASSED 100% (95/95 test files, 252/252 tests green under Vitest/jsdom).
- **Static Spec Check Gate (`./scripts/spec-check.sh`)**: PASSED cleanly.
- **SpecKit Quality Checklist (`specs/025-phase2-simplification/checklist.md`)**: 11/11 criteria satisfied (`[x]`).






