# Implementation Plan: Replacement Self-Clearance Loop

**Feature**: `specs/004-replacement-clearance-loop`  
**Branch**: `004-replacement-clearance-loop`  
**Date**: 2026-08-18  
**Spec**: [`specs/004-replacement-clearance-loop/spec.md`](spec.md)  

---

## Summary

Implement an autonomous closed-loop candidate clearance research pipeline for fictional replacement brand cards (`specs/004-replacement-clearance-loop`). After proposing a candidate replacement name, the system immediately submits that candidate to the grounded `ParallelSearch` trademark and web research tool before presenting it to production. If the candidate clears (`NO_ISSUE_SURFACED`), it is accepted. If a conflict or insufficient evidence is detected (`ACTION_REQUIRED`, `REVIEW_RECOMMENDED`, `INSUFFICIENT_EVIDENCE`), the candidate is rejected, collision details are recorded, and a new candidate is generated avoiding prior collisions, bounded by a deterministic maximum of 3 attempts. In `CLOUD_MODE`, any search API failure fails visibly as `INSUFFICIENT_EVIDENCE` without silent fixture fallback. All attempts, research starts, rejections, and acceptances are streamed as observable timeline events.

---

## Technical Context

**Language/Version**: TypeScript 5.4+ / Node.js 20+  
**Primary Dependencies**: Express 4.19, React 18.3, Vite 5.4, `@google/genai` (Gemini 3.6 Flash / Imagen 3), `parallel-web` SDK (ADK tool), Vitest 1.6  
**Storage**: In-memory repository pattern for local/test execution, Google Cloud Firestore for cloud persistence  
**Testing**: Vitest (`npm test`) contract, integration, and UI component tests  
**Target Platform**: Google Cloud Run (Node container + static React SPA)  
**Project Type**: Full-stack Agentic Web Application  
**Performance Goals**: Candidate generation + research clearance loop completes in $\le 3.5\text{s}$ per attempt in live search mode  
**Constraints**: Strict 3-attempt deterministic bound; fail-visible `INSUFFICIENT_EVIDENCE` on search outage in `CLOUD_MODE`; strictly 4 SSE timeline event types; preservation of all 003 counsel override and binder invariants  
**Scale/Scope**: Single feature addition to existing ClearanceScout workspace  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|:---|:---|:---:|:---|
| **I. Agent Framework & Models** | Google ADK & `gemini-3.6-flash` only | **PASS** | `gemini-3.6-flash` used for candidate generation and structured clearance evaluation |
| **II. Live Grounding & Provenance** | `parallel-web` research, authentic provenance, no fabricated evidence | **PASS** | Candidates tested via `ParallelSearch` tool; fail-visible on outage in `CLOUD_MODE` |
| **III. Architecture & Persistence** | Backend logic in `server/`, frontend in `src/`, Firestore repos | **PASS** | Loop workflow strictly inside `server/workflows/replacementGenerator.ts` |
| **IV. Canonical Entity & Invariants** | 4 standard clearance statuses, no legal opinion disclaimers | **PASS** | Standard statuses (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`, `INSUFFICIENT_EVIDENCE`) |
| **V. Multi-Tier Execution Modes** | `TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE` support | **PASS** | Deterministic fixtures in test/demo; live search with fail-visible errors in cloud mode |
| **Observable Action Timeline** | Observable execution events, no raw chain-of-thought | **PASS** | Strictly 4 events: `REPLACEMENT_ATTEMPT`, `REPLACEMENT_RESEARCH_STARTED`, `REPLACEMENT_REJECTED`, `REPLACEMENT_ACCEPTED` |

---

## Project Structure

### Documentation (this feature)

```text
specs/004-replacement-clearance-loop/
├── spec.md              # Clarified feature specification
├── checklists/
│   └── requirements.md  # 16/16 Quality checklist
├── plan.md              # Implementation plan (this file)
├── research.md          # Technical research and design decisions
├── data-model.md        # Data models and entity relations
├── contracts/
│   └── replacement-clearance-api.md # REST and SSE event contracts
└── quickstart.md        # End-to-end validation scenarios
```

### Source Code Touchpoints

```text
server/
├── workflows/
│   └── replacementGenerator.ts  # Autonomous self-clearance loop logic with negative constraint retry
├── repositories/
│   └── ReplacementRepo.ts       # Storage of ReplacementCardData with attemptHistory
├── api/
│   └── replacementRoutes.ts     # POST /api/projects/:id/replacements/generate
└── events/
    └── timelineEmitter.ts       # SSE event types for replacement loop

src/
├── components/
│   ├── ReplacementCardModal.tsx # Displays attempt count, self-clearance badge, and collision citations
│   └── TimelineDrawer.tsx       # Renders 4 replacement lifecycle events
└── pages/
    └── WorkspacePage.tsx        # Integrates updated replacement generation flow

tests/
├── contract/
│   ├── test_replacement_gen.test.ts # Contract tests for self-clearance loop & 3-attempt ceiling
│   └── test_era_replacement.test.ts # Contract test for era aesthetic prompts & negative constraints
└── integration/
    └── replacement_clearance_workflow.test.ts # End-to-end multi-attempt loop & counsel escalation
```

---

## Complexity Tracking

*No constitutional violations or unjustified complexity introduced.*
