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


