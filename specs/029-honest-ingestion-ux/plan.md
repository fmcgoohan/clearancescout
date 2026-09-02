# Implementation Plan: Honest Ingestion UX & Production Creation Flow

**Branch**: `029-honest-ingestion-ux` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

## Summary

Eliminate silent demo seeding across project initialization and upload workflows, introduce an in-memory screenplay extraction preview endpoint before database commit, reject 0-scene extractions with informative diagnostics, add a persistent "New Production" action in the main navigation header, relocate secondary diagnostic/admin controls to Settings, and ensure a deterministic single-primary-action recommendation hierarchy for every workspace state.

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js 20 LTS  
**Primary Dependencies**: React 18, Vite 5, TailwindCSS, Express 4, Google ADK (`@google/genai`), Playwright  
**Storage**: Google Cloud Firestore (emulator for local / production in Cloud Run)  
**Testing**: Playwright automated browser test suite (`tests/repro_local.js`, `tests/repro_live.js`)  
**Target Platform**: Google Cloud Run (Linux container) & Web Browsers (Desktop & 375px Mobile)  
**Project Type**: Full-stack web application (React frontend + Express backend)  
**Performance Goals**: Script extraction preview < 500ms, workspace switch < 100ms  
**Constraints**: Zero silent demo seeding, 100% WCAG 2.2 AA accessibility, zero external non-ADK agent frameworks  
**Scale/Scope**: Multi-project isolation, supporting clean user-created productions alongside golden sample benchmarks  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Article 1: Semantic Color Is Sacred**: PASS. Status badges use green, amber, red exclusively for clearance states.
- **Article 3: No Emoji in Chrome**: PASS. All icons use stroke SVG icon components; zero raw emojis in header/modals.
- **Article 10: No Regression in Project-Data Synchronization**: PASS. Scene counts, clearance entity counts, and department tasks synchronize atomically.
- **Article 11: Accessibility Is a Release Requirement**: PASS. Modals lock scroll, support focus trapping, live regions (`aria-live="polite"`), and full keyboard navigation.
- **Article 13: Every Screen Exposes a Clear Next Action**: PASS. Exactly one contextual primary recommendation card per workspace state.
- **Article 16: Streamlined Header & Workspace Section Navigation**: PASS. Header houses identity, New Production, Switch Project, and Alerts; administrative controls moved to Settings.

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
│   └── ui-contracts.md
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code Modifications

```text
server/
├── api/
│   └── projectRoutes.ts          # Add POST /:id/script/preview, reject 0-scene uploads in /:id/script
├── services/
│   └── CanonicalRegistryWorkflow.ts # Add in-memory script preview method
src/
├── App.tsx                       # Remove auto-demo-seeding in initProject & loadProjectDetails; header New Production integration
├── components/
│   ├── Header.tsx                # Add persistent New Production button; move admin controls to Settings
│   ├── ScriptUploadModal.tsx     # Add extraction preview step with detected scenes & warnings
│   ├── NewProjectModal.tsx       # Dedicated clean production creation modal
│   ├── RecommendedActionCard.tsx # Honest empty state handling ("Upload Screenplay" when scenes === 0)
│   └── SettingsModal.tsx         # Host Execution Mode, Live Quota, Serving Revision K_REVISION
tests/
├── repro_local.js                # Update with Scenarios A through F
└── repro_live.js                 # Update with Scenarios A through F
```

## Complexity Tracking

| Invariant / Choice | Why Needed | Simpler Alternative Rejected Because |
|--------------------|------------|--------------------------------------|
| Dedicated `POST /script/preview` endpoint | Allows client to preview detected scenes before writing to Firestore | Writing unconfirmed files to DB requires complex rollback logic on failure |
| Relocating Admin Controls to Settings | Declutters header chrome on mobile and matches Constitution Article 16 | Leaving controls in header crowded out the New Production button |

