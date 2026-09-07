# Implementation Plan: Honest Ingestion UX & Production Creation Flow

**Branch**: `029-honest-ingestion-ux` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

## Summary

Expand Feature 029 to implement the four approved architecture and correctness slices:
1. **Slice 1 (Release-Blocking Correctness)**: Auto-resolve/prune `RETRY_RESEARCH` tasks on clearance evaluation (FR-013), preserve verbatim slugline time-of-day including `CONTINUOUS` (FR-014), strip PDF page markers from script excerpts (FR-015), and clarify occurrence vs unique blocker copy (FR-016).
2. **Slice 2 (Header & Workspace IA)**: Streamline navigation header to a compact single row <=64px with overflow menus (FR-017), elevate Department Tasks to a first-class workspace tab/view (FR-018), persist active tab/task/entity in URL query params (FR-019), and position onboarding guide below the Primary Recommendation Card (FR-020).
3. **Slice 3 (Workflow Language & Terminology)**: Converge domain terminology ("Clearance Items", "Scene Occurrence", "View Evidence", "API Research Quota") and fix dynamic pluralization (FR-021, FR-022).
4. **Slice 4 (Mobile Responsive & Accessibility)**: Implement responsive stacked cards for clearance items on viewports <768px (FR-023) and enforce 44px touch targets across all controls (FR-024).

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js 20 LTS  
**Primary Dependencies**: React 18, Vite 5, Express 4, Google ADK (`@google/genai`), Playwright, pdf-parse  
**Storage**: Google Cloud Firestore (emulator for local / production in Cloud Run)  
**Testing**: Playwright automated browser test suite (`tests/repro_local.js`, `tests/repro_live.js`) + Vitest contract tests  
**Target Platform**: Google Cloud Run (Linux container) & Web Browsers (Desktop & 375px/390px/420px Mobile)  
**Project Type**: Full-stack web application (React frontend + Express backend)  
**Performance Goals**: Script extraction preview < 500ms, workspace switch < 100ms, mobile header height <= 64px  
**Constraints**: Single status contract, 100% WCAG 2.2 AA accessibility, 44px touch targets, zero external non-ADK agent frameworks  
**Scale/Scope**: Multi-project isolation, supporting clean user-created productions alongside golden sample benchmarks (3/7/11)  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Article 1: Semantic Color Is Sacred**: PASS. Status badges use green, amber, red exclusively for clearance states.
- **Article 3: No Emoji in Chrome**: PASS. All icons use stroke SVG icon components; zero raw emojis in header/modals.
- **Article 10: No Regression in Project-Data Synchronization & Stale Task Pruning**: PASS. Clearance evaluation automatically resolves initial `RETRY_RESEARCH` tasks for evaluated entities (FR-013).
- **Article 11: Accessibility Is a Release Requirement**: PASS. Modals lock scroll, support focus trapping, live regions (`aria-live="polite"`), and 44px touch targets (FR-024).
- **Article 12: Counts Have One Documented Semantic Source & Slugline Fidelity**: PASS. Sluglines preserve `CONTINUOUS`, `SAME`, `DAWN`, `DUSK` without normalizing to `DAY` (FR-014); blocker counts distinguish occurrences vs items (FR-016).
- **Article 13: Every Screen Exposes a Clear Next Action**: PASS. Exactly one contextual primary recommendation card per workspace state.
- **Article 16: Streamlined Header & Workspace Section Navigation**: PASS. Single compact header <=64px; Department Tasks elevated to first-class workspace tab (FR-017, FR-018).
- **Article 17: Visible System Data Hierarchy**: PASS. Navigation and data flow strictly follow $\text{Scenes} \to \text{Clearance Items} \to \text{Department Tasks} \to \text{Readiness} \to \text{Binder}$.

## Project Structure

### Documentation (this feature)

```text
specs/029-honest-ingestion-ux/
├── plan.md              # This file
├── research.md          # Architectural decisions & rationale
├── data-model.md        # Data models & state transitions
├── quickstart.md        # Verification scenarios & execution guide
├── contracts/           # API and UI interface contracts
│   ├── api-contracts.md
│   ├── ui-contracts.md
│   └── correctness-ia-contracts.md
└── tasks.md             # Actionable dependency-ordered implementation tasks
```

### Source Code Modifications

```text
server/
├── agents/
│   └── ScriptParserAgent.ts       # High-fidelity slugline time-of-day extraction (preserve CONTINUOUS), page marker filter
├── workflows/
│   ├── clearanceEvaluator.ts      # Auto-resolve / prune RETRY_RESEARCH tasks on entity evaluation
│   ├── canonicalRegistryWorkflow.ts # Page marker sanitization during script upload
│   └── sceneReadinessEngine.ts    # Group identical entity blockers in rationale strings
src/
├── App.tsx                       # Single compact header (<=64px), first-class Tasks tab, URL query param sync
├── components/
│   ├── EntityRegistryTable.tsx   # Card layout on <768px, "View Evidence", "Scene Occurrence" copy, 44px targets
│   ├── ActionListModal.tsx       # Embedded full-page view component support for Tasks tab
│   ├── RecommendedActionCard.tsx # Correct pluralization, render above onboarding banner
│   ├── OnboardingBanner.tsx      # Placed below recommendation card, auto-hidden once scenes exist
│   └── SettingsPopover.tsx       # Houses secondary admin controls, quota, revision provenance
tests/
├── contract/
│   └── test_coors_pdf_extraction.test.ts # Verify CONTINUOUS timeOfDay & no page markers
├── repro_local.js                # Playwright Scenarios A through G + Scenarios H (AeroTech sync), I (IA tabs)
└── repro_live.js                 # Playwright live test suite mirror
```

## Complexity Tracking

| Invariant / Choice | Why Needed | Simpler Alternative Rejected Because |
|--------------------|------------|--------------------------------------|
| Server-side `RETRY_RESEARCH` task auto-resolution | Keeps Action Center, Registry, and Preflight 100% in sync | Frontend-only filtering hides dirty database state |
| Retaining exact slugline temporal strings | Preserves screenplay author intent and prevents false daylight assumptions | Hardcoded enum forces losing contextual time info |
| Responsive table-to-card CSS/React layout | Eliminates horizontal scroll/clipping on 375px/390px/420px viewports | Horizontal scroll on tables fails mobile readability |
| Browser URL query parameter synchronization | Allows deep-linking to specific tabs/tasks that survive refresh | Hash-routing requires router architecture rewrite |
| Active-draft task scoping | Prevents superseded script tasks from polluting Action Center | Deleting superseded tasks risks data loss on draft revert |
| Honest empty workspace (Option B) | Eliminates synthetic demo substitution and enforces honest lifecycle (SC-001, FR-030) | Auto-seeding on cold start masks unpopulated state and violates honest ingestion |

---

## Phase 9: Corrective Implementation Plan (Approved Blockers & Tracks)

### 1. Active-Draft Task Scoping & Counter Format (FR-031)
- Scope Action Center tasks strictly to scenes of the active script draft. Exclude tasks from superseded scene IDs.
- Correct `ActionListModal.tsx` counter string interpolation to prevent duplicate count numerals (render "X of Y Tasks", not "X of Y Y Tasks").

### 2. Zero-Item Scene Review & Non-Contradictory Readiness Presentation (FR-032)
- In `WorkspacePage.tsx`, explicitly handle `PENDING_REVIEW` zero-item scenes with neutral review badging and "Pending Review" copy.
- Prevent fallthrough to green `FINAL CLEAR` / "Ready for production filming" while overall project readiness is 0% or pending review.

### 3. Native Interactive Project Card Semantics (FR-028 / FR-033)
- In `ProjectListModal.tsx`, strip invalid `role="option"` from native `<button>` elements outside ARIA listboxes.
- Indicate active workspace selection with valid `aria-current="true"` or `aria-pressed="true"`.
- Preserve Enter/Space activation, visible focus outline, and restore focus to active production heading upon dismissal.

### 4. Narrow Viewport Usability & Ergonomics (FR-034)
- Audit 375px layout: ensure header <=64px, navigation tab scrolling isolated, >=44px touch targets, zero document horizontal overflow (`document.scrollWidth <= clientWidth`).

### 5. Project Directory Identity Disambiguation (FR-035)
- In `ProjectListModal.tsx`, render creation timestamps and project codes to disambiguate identical titles ("Mountain Refuge Live QA") without deleting or merging projects.

### 6. Public Canary Persistence & Option B Lifecycle (FR-030, FR-036)
- Maintain honest-empty in-memory lifecycle: `proj-default` initializes with 0/0/0; sample baseline (3/7/11) loaded strictly via explicit "Load Sample Production" or authorized `demo-load`.
- Deploy new revision to Cloud Run with 0% production traffic (`clearancescout-00061-lms` remains 100%).
- Prove Scenario G persistence on canary using isolated disposable project IDs (`proj-test-g-<timestamp>`), with bounded cleanup.

---

## Phase 10: Fail-Resolution & Bounded P2 Implementation Plan

### 1. Cyberpunk Zero-Item Readiness (FAIL 1 / FR-029, FR-032)
- In `server/workflows/sceneReadinessEngine.ts`, remove the hardcoded `projectId === 'proj-cyberpunk'` bypass so unreviewed zero-item scenes in Cyberpunk Odyssey evaluate honestly to `PENDING_REVIEW` rather than `FINAL_CLEAR`.
- In `server/repositories/ProjectRepo.ts`, set `scene-cp01` initial readiness status to `PENDING_REVIEW` with `finalClearCount: 0`.
- In `src/pages/WorkspacePage.tsx`, render neutral review badging and "Pending Review: Human clearance verification required prior to filming" without false "FINAL CLEAR" / "Ready for filming" text.
- In `tests/repro_local.js` and `tests/repro_live.js`, update Scenario E assertions to verify honest 0% readiness (or non-cleared pending review) with 0 blocked scenes and 0 entity leaks from Neon Horizon.

### 2. Neon Horizon Identity vs. Empty Workspace Labeling (FAIL 2 / FR-036)
- In `server/repositories/ProjectRepo.ts`, initialize empty `proj-default` with title `'Default Production Workspace'` (`productionCompany: 'Studio Production'`), eliminating premature application of the Neon Horizon label before sample load.
- In `src/utils/formatters.ts`, update `formatProjectCode` to output `'PRJ-DEFAULT'` when empty and `'PRJ-NEON-HORIZON'` only once title contains `'neon'`.
- In `server/workflows/demoAutomationWorkflow.ts`, explicitly update project title to `'The Neon Horizon'` upon explicit sample load, populating 3 scenes, 7 items, and 11 unique department tasks.
- In `tests/repro_local.js` and `tests/repro_live.js`, verify `Default Production Workspace` `[PRJ-DEFAULT]` on container boot, and `The Neon Horizon` `[PRJ-NEON-HORIZON]` only after explicit "Load Sample Production".

### 3. Mobile + New Production Button Discoverability (P2 / FR-034)
- In `src/index.css`, reorder root `.mobile-only` rules so that media queries properly display `span.mobile-only` as `inline-flex` on viewports <=768px (preventing `.mobile-only { display: none !important; }` from suppressing labels on mobile).
- Ensure header `+ New Production` / `+ New` button renders a clear visible text label with >=44px touch targets without horizontal overflow.

### 4. Mobile Tabs Controlled Horizontal Scrolling (P2 / FR-034)
- In `src/pages/WorkspacePage.tsx` and `src/index.css`, enforce `white-space: nowrap !important` and `flex-shrink: 0 !important` on tab buttons within `[role="tablist"]`.
- Preserve the existing tab container with controlled horizontal scrolling (`overflow-x: auto`), preventing tabs from compressing, wrapping, or stacking vertically.

### 5. Local & Canary Verification Protocol
- Execute focused unit/contract tests and full local Playwright A–K suite on `localhost:8088`.
- Commit tested tree to `029-honest-ingestion-ux` and push to origin.
- Deploy a NEW non-serving Cloud Run canary revision (0% traffic; `clearancescout-00061-lms` remains 100%).
- Run isolated disposable Scenario G on canary first, followed by canary verification of FAIL 1, FAIL 2, P2s, and preserved PASSes.

---

## Phase 11: Pre-Walkthrough Corrective Implementation Plan

### 1. Cyberpunk Zero-Task UI State Lifecycle (FR-037)
- In `src/components/ActionListModal.tsx`, introduce explicit `TaskFetchState`: `'idle' | 'loading' | 'loaded' | 'error'`.
- Eliminate inferring loading from `actions.length === 0`.
- When `fetchState === 'loaded'` and `activeDraftActions.length === 0`:
  - Render header counter as `"0 of 0 Tasks"`.
  - Render each department tab count with explicit zero `(0)`, never indefinite ellipsis `(…)`.
  - Enable the Re-Sync button upon loaded empty success.
  - Render explicit empty state message: `"No department tasks have been generated for this production"`, with a clear navigation route/button to the recommended next action (upload script).
  - Eliminate indefinite loading spinners and screen-reader announcements.
- Reset `actions` to `[]`, `notifications` to `[]`, and `fetchState` to `'loading'` immediately when `projectId` changes, preventing stale task leakage across workspace switches.
- Ensure cold navigation with `?tab=tasks` cleanly transitions from loading to loaded-empty.

### 2. Authoritative Cross-Format Binder Identity (FR-038)
- In `server/api/binderRoutes.ts`, update `Content-Disposition` header for Markdown export to use human-readable sanitized filename from active title: `Clearance_Binder_${sanitizedTitle}_${binder.id}.md`, perfectly aligning with JSON export naming.
- In `server/api/binderRoutes.ts`, add `**Project ID**: ${binder.projectId}` to the markdown export header block.
- In `src/components/BinderExportModal.tsx`, sanitize JSON and Markdown filenames uniformly: `Clearance_Binder_${sanitizedTitle}_${binder.id}.json` and `.md`.
- In `src/App.tsx`, invoke `setBinderData(null)` and `setPreflightData(null)` in `loadProjectDetails` upon switching active projects, eliminating cross-project binder state leaks.

### 3. Human-Readable Scene References in Operator Prose (FR-039)
- In `server/workflows/clearanceEvaluator.ts`, retrieve scene metadata via `sceneRepo.getSceneById` and format operator-facing scene references as `Scene ${scene.sceneNumber} — ${scene.heading}` (e.g. `Scene 1 — INT. PENTHOUSE WORKSPACE – NIGHT`) rather than raw internal database UUIDs (e.g. `scene-a0556326`).
- Apply identical human-readable formatting in `server/workflows/actionDispatcher.ts` and timeline events while preserving internal IDs in structured metadata attributes.

### 4. Statutory Distribution vs Production Filming Clearance Dual Standard (FR-040)
- In `server/workflows/clearanceEvaluator.ts` and `server/workflows/actionDispatcher.ts`, update musical work clearance rationales to explicitly encode the dual standard:
  `"A synchronization license is required for distribution. This production’s clearance policy requires the license to be secured before filming proceeds."`
- Apply across evaluator occurrence rationales, scene blocker details, department action descriptions, and binder exports.

### 5. Verification & Canary Deployment Protocol
- Add focused contract tests verifying cross-format binder filename/ID alignment, human-readable scene references, and dual filming/distribution copy.
- Build frontend (`npm run build`) and execute unit test suite (`npx vitest run`).
- Run targeted Playwright browser validation covering Cyberpunk empty tasks, cold `?tab=tasks`, project switching, and Neon Horizon task restoration.
- Commit the coherent patch to `029-honest-ingestion-ux` and push to origin.
- Build container image and deploy a NEW Cloud Run canary revision (0% traffic; `clearancescout-00061-lms` remains 100%).
- Verify acceptance checks on canary and STOP for operator review.

---

## Phase 12: Operating Model Convergence Implementation Plan

### 1. Execution-Mode Authoritative Representation (FR-041 - Option A)
- In `src/components/SettingsPopover.tsx`, replace the interactive `<select id="mode-select">` with a read-only status badge displaying the authoritative server mode reported by `GET /api/health` (e.g. `DEMO_MODE (Authoritative)`).
- Include clear informational copy:
  `Execution mode is governed strictly by server configuration. Live CLOUD_MODE requires server-side secret mounting (GEMINI_API_KEY, PARALLEL_WEB_API_KEY).`
- In `src/components/ProjectListModal.tsx`, replace the interactive mode dropdown with a read-only runtime label (`Active Server Runtime: DEMO_MODE`).
- In `src/App.tsx`, eliminate client-side synthetic mode spoofing (`setExecutionMode`); lock execution mode strictly to server health.
- Audit server config: verify `server/config.ts` and `server/api/healthRoutes.ts` check credential presence without exposing key values.

### 2. Multi-State Zero-Item Scene Classification (FR-042)
- In `server/workflows/sceneReadinessEngine.ts` and `src/components/SceneReadinessCard.tsx`, implement the deterministic 5-state scene classification:
  - `ANALYSIS_PENDING`: Ingestion or parsing in progress.
  - `ANALYSIS_FAILED`: Parser/evaluator error requiring retry.
  - `NO_CANDIDATES_SURFACED`: Ingestion complete, 0 items surfaced. Evaluates to `PENDING_REVIEW` with 0% readiness; operator copy: *"No clearance items detected. Clearance coordinator sign-off required before filming."*
  - `HUMAN_REVIEWED_NO_CONCERN`: Explicit operator/counsel review recorded, transitioning scene to `FINAL_CLEAR`.
  - `FULLY_CLEARED`: All detected items resolved.
- Enforce strict invariant: zero-item scenes NEVER evaluate to `FINAL_CLEAR` or display "Ready for filming" without explicit human review.

### 3. Task Active-Draft Scope & Deduplication Hygiene (FR-043)
- In `server/repositories/ActionNotificationRepo.ts` and `server/workflows/actionDispatcher.ts`, scope department tasks to the active screenplay draft version (`scriptVersionId`).
- In `src/components/ActionListModal.tsx`:
  - Prohibit blanket title-based deduplication; preserve distinct tasks for distinct scene occurrences sharing standard titles.
  - Header badge explicitly formats open vs total unique tasks: `"${filteredOpenCount} open of ${totalUniqueTasks} Tasks"` (e.g. `"4 open of 11 Tasks"`).
  - Persisted duplicate task cleanup is separated from UI presentation into an explicit migration script.

### 4. Coors Semantics Parity & Blocker Formatting (FR-044)
- Maintain strict parity between Entity Registry and Evidence Dossier for *Coors Light* (1 canonical item, 6 occurrences across 3 scenes).
- In `server/workflows/sceneReadinessEngine.ts`, separate textual appearance counts from unresolved legal blocker counts in scene rationales:
  - Scene 1: 1 unresolved blocker, 1 appearance.
  - Scene 2: 1 unresolved blocker, 2 appearances; slugline retains `EXT. NEIGHBORHOOD CORNER - CONTINUOUS`.
  - Scene 3: 1 unresolved blocker, 3 appearances.
- Enforce singular/plural grammatical agreement in blocker rationales (`"1 clearance blocker prevents shooting Scene 2: \"Coors Light\" (INSUFFICIENT_EVIDENCE, appears 2 times)"`).

### 5. Project Accessibility & Switcher Focus (FR-045, FR-033)
- Ensure all project cards in `ProjectListModal.tsx` and `PortfolioDashboard.tsx` are native `<button>` elements with `aria-current` or `aria-pressed`.
- On project switch dismissal, programmatically shift focus to `h1#workspace-production-heading` in `WorkspacePage.tsx`.
- Disambiguate same-title projects in directory and switcher by displaying immutable project ID (`proj-<uuid>`) and creation timestamp.
- Preserve production datasets: zero deletion, re-seeding, or overwriting of shared review workspaces.

### 6. Notification Deep-Link & Tombstone Integrity (FR-027)
- Clicking `TASK-101` in notifications scrolls and focuses `h4#task-heading-TASK-101`.
- Missing tasks render disabled tombstone badges (`aria-disabled="true"`, `data-testid="tombstone-badge"`) and announce *"This task is no longer available."* without falling back to `Re-Sync`.

### 7. Mobile Usability & Full Viewport Verification (FR-046)
- Maintain bounded layout improvements on 375px viewports (visible `+ New` button, single-row horizontally scrolling navigation tabs).
- Enforce >=44px touch targets across all interactive controls.
- Audit viewports 320, 375, 390, 420, 768, 1280px: verify `document.documentElement.scrollWidth <= window.innerWidth` AND `document.body.scrollWidth <= window.innerWidth` with zero `overflow-x: hidden`.
- Track proposed criteria (header height <=64px, drawer open latency <=4s) as empirical measurements.

### 8. Two-Stage Canary-to-Production Deploy & Verification Protocol
- Step 1: Run focused unit/contract tests, build frontend (`npm run build`), execute local Playwright suite on port 8088. If failed, STOP.
- Step 2: Commit coherent patch to `029-honest-ingestion-ux`, push to origin, build container image, deploy to Cloud Run canary (`--no-traffic --tag canary`).
- Step 3: Reconcile canary identity (SHA, build, revision) and verify acceptance checks on canary URL. If failed, STOP.
- Step 4: Deploy that same tested commit to production (100% traffic) so serving revision is no longer `00061-lms`.
- Step 5: Reconcile production serving identity (SHA, build, revision, creation time, 100% traffic, Settings, `/api/health`).
- Step 6: Execute full public A–K Playwright audit against public URL using demo token via Settings/localStorage (isolated Scenario G on disposable project ID).
- Step 7: STOP for independent review.
