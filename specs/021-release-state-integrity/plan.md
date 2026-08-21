# Implementation Plan: 021 Release State Integrity and Operator Trust

**Branch**: `021-release-state-integrity` | **Date**: 2026-08-22 | **Spec**: [specs/021-release-state-integrity/spec.md](spec.md)

**Input**: Feature specification from `/specs/021-release-state-integrity/spec.md`

## Summary

Deliver release-blocking convergence and operator trust hardening across the clearance lifecycle based on hands-on QA findings:
1. **P0-1 Ingestion State Machine & Atomic Snapshot**: Explicit 7-phase state machine (`IDLE`, `UPLOADING`, `PARSING`, `EXTRACTING`, `RECONCILING`, `COMPLETE`, `FAILED`) shared by file uploads and sample demo scripts; immediate progress feedback; locked duplicate submission; atomic UI refresh from one committed snapshot eliminating jumping scene counts and summary/registry mismatches.
2. **P0-2 & P0-6 Interactive Overlays & Stable Toolbar**: Elevated z-index stacking (`1400`/`1350`) for Actions modal and Timeline drawer with full keyboard focus management and accessible dismissal; stable primary toolbar fixed across all draft states.
3. **P0-3 Generic Canonical Entity Disambiguation**: Enhanced multi-tier lexical normalizer resolving acronyms, punctuation variations, parenthetical forms, and delimiter tokens (e.g. `Associated Press`, `A.P.`, `AP`, `A.P. (Associated Press)`, `Associated Press / A.P.`).
4. **P0-4 Current-Draft Scoping & Historical Archival**: Enforce that all active registry items possess ≥1 occurrence in the current draft; archive superseded entities as `NOT_IN_CURRENT_DRAFT` excluded from shooting readiness calculations.
5. **P0-5 Passive Timeline Idempotency**: Side-effect-free GET endpoints and client-side SSE event deduplication eliminating timeline count inflation during passive observation.
6. **P0-7 Truthful Provenance & P0-8 Recovery Guidance**: Truthful source labeling for `The Neon Horizon (Bundled Fictional Demo)` vs uploaded files; stage-specific duration guidance, cancel triggers, and actionable retry alerts.
7. **Secondary UX**: Quieter header layout, consolidated Binder Export control, grouped table row actions, and WCAG AA high-contrast status badges.

## Technical Context

**Language/Version**: TypeScript 5.5+, Node.js 20+  
**Primary Dependencies**: React 18, Vite, Express, `@google/genai` (Gemini 3.6 Flash), `@google-cloud/firestore`  
**Storage**: Google Cloud Firestore (stateless persistence)  
**Testing**: Vitest, `@testing-library/react`, Supertest  
**Target Platform**: Google Cloud Run (Linux container)  
**Project Type**: Full-Stack Web Application (Express API + Vite/React SPA)  
**Performance Goals**: Feature screenplay ingestion (~150 scenes) < 45s; 0 intermediate count flickers; 0 duplicate SSE events  
**Constraints**: Zero Tailwind dependency; CLOUD_MODE server authority; strict code isolation (`server/` vs `src/`); chain-of-thought privacy  
**Scale/Scope**: ~150 scenes per screenplay, up to 100 canonical entities per project  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Verification |
|---|---|---|---|
| **I. Agent Framework & Model Standard** | Gemini 3.6 Flash for reasoning/extraction; Imagen 3 for cards | **PASS** | `ScriptParserAgent` uses `gemini-3.6-flash`; no external agent frameworks |
| **II. Live Grounding & Provenance** | `parallel-web` for research; live citations; zero fabrication | **PASS** | Provenance retained; fallback fixtures visible only in demo modes |
| **III. Architecture & Isolation** | Backend exclusively in `server/`; Frontend in `src/`; Firestore persistence | **PASS** | Strict directory boundaries maintained; authenticated REST / SSE APIs |
| **IV. Canonical Invariant & Statuses** | Four formal statuses; resolve to canonical IDs; per-scene contextual risk | **PASS** | 4-tier status machine (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`, `INSUFFICIENT_EVIDENCE`) |
| **V. Execution Modes & Fail-Closed** | `CLOUD_MODE` fails visibly if API keys missing; zero synthetic fallbacks | **PASS** | `CLOUD_MODE` authority strictly preserved |
| **Deterministic Calculations** | Code computes math/counts; LLM extracts entities; CoT hidden | **PASS** | Local scene splitting, regex/lexical normalization, CoT stripped in `timelineEmitter` |

## Project Structure

### Documentation (this feature)

```text
specs/021-release-state-integrity/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Phase 0 technical decisions & root cause analysis
├── data-model.md        # Phase 1 data models, state machines & schemas
├── quickstart.md        # Phase 1 end-to-end operator validation guide
├── contracts/           # Phase 1 API, SSE, and resolution contracts
│   ├── ingestion-lifecycle.contract.md
│   └── entity-alias-resolution.contract.md
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (affected paths)

```text
clearancescout/
├── server/
│   ├── agents/
│   │   └── ScriptParserAgent.ts          # Bounded entity extraction & local scene shells
│   ├── api/
│   │   ├── projectRoutes.ts              # Ingestion endpoints & atomic snapshot response
│   │   ├── fixtureRoutes.ts              # Demo fixture endpoints & truthful Neon Horizon label
│   │   └── entityMutationRoutes.ts       # Canonical entity mutations & alias sync
│   ├── events/
│   │   └── timelineEmitter.ts            # Side-effect-free event emission & CoT sanitization
│   ├── repositories/
│   │   ├── EntityRepo.ts                 # Active draft scoping & NOT_IN_CURRENT_DRAFT status
│   │   └── SceneRepo.ts                  # Scene persistence & draft replacement
│   └── workflows/
│       ├── canonicalRegistryWorkflow.ts  # Ingestion orchestration & atomic commit
│       ├── entityResolutionEngine.ts     # Generic lexical, acronym & parenthetical normalizer
│       └── demoAutomationWorkflow.ts     # Bundled demo ingestion with truthful provenance
├── src/
│   ├── components/
│   │   ├── ScriptUploadModal.tsx         # Unified 7-phase ingestion state machine UI & guidance
│   │   ├── TimelineDrawer.tsx            # Elevated stacking (z-1350) & keyboard accessibility
│   │   ├── ActionListModal.tsx           # Elevated stacking (z-1400) & backdrop blurring
│   │   └── ProductionDashboardModal.tsx  # Accessible dashboard overlay
│   ├── hooks/
│   │   └── useTimelineSSE.ts             # Client-side event deduplication (prevents runaway)
│   ├── pages/
│   │   └── WorkspacePage.tsx             # Stable toolbar, single snapshot refresh, quiet header
│   └── App.tsx                           # Global overlay triggers, auth modal & project bar
└── tests/
    ├── contract/
    │   ├── test_script_upload_modal_ui.test.ts  # Modal interactions, timeout & formats
    │   ├── test_entity_resolution.test.ts       # Acronym, alias & parenthetical merge tests
    │   └── test_timeline_sse.test.ts            # Idempotent SSE & bounded event growth
    └── integration/
        ├── test_live_operator_access_workflow.test.ts
        └── production_dashboard_workflow.test.ts
```

## Complexity Tracking

*No architectural violations or unconstitutional complexity introduced.*

| Area | Solution | Rationale |
|---|---|---|
| Ingestion Synchronization | Atomic single snapshot response | Prevents intermediate race conditions and UI count flicker |
| Overlay Visibility | Inline React styles & semantic CSS classes | Eliminates Tailwind-only missing styles and stacking context traps |
| Alias Merging | Pure TypeScript multi-tier lexical rules | Instant, deterministic, zero external API cost or token consumption |
| Timeline Stability | Client-side ID deduplication | Guarantees idempotency across network reconnects and passive polls |
