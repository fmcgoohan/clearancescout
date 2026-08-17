# Implementation Plan: ClearanceScout Entertainment Clearance Workspace

**Branch**: `001-clearance-workspace` | **Date**: 2026-08-17 | **Spec**: [`specs/001-clearance-workspace/spec.md`](spec.md)

**Input**: Feature specification from `/specs/001-clearance-workspace/spec.md`

---

## Summary

ClearanceScout is an agentic entertainment clearance workspace designed to automate script parsing, canonical entity registry matching ("Clear once, recognize everywhere"), live trademark research grounding via the `parallel-web` SDK, scene-specific legal risk assessment, and fictional replacement brand artwork generation. The system operates on a containerized Node/Express backend running Google ADK agents with `gemini-3.6-flash` and Imagen 3, persisting state in Google Cloud Firestore, and serving a Vite/React frontend with real-time SSE timeline streaming across three execution modes (`TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE`).

---

## Technical Context

- **Language/Version**: TypeScript 5.x / Node.js 20+
- **Primary Dependencies**: `@google/adk`, `@google/genai`, `@parallel-web/sdk`, `@google-cloud/firestore`, `express`, `react`, `vite`
- **Storage**: Google Cloud Firestore (Native Mode)
- **Testing**: `vitest` (unit/contract/integration tests)
- **Target Platform**: Google Cloud Run (stateless containerized Web/API service) + Modern Web Browsers
- **Project Type**: Web application (stateless Express API service in `server/` + Vite/React UI in `src/`)
- **Performance Goals**: Parse 100-page script <30s; generate replacement artwork <15s; 0s latency SSE timeline streaming
- **Constraints**: Strict code isolation (`server/` vs `src/`); zero exposure of raw model chain-of-thought; 100% citation provenance retention
- **Scale/Scope**: 500+ entity occurrences per project; real-time event streaming across multi-scene screenplays

---

## Constitution Check

*GATE: Passed pre-Phase 0 research and verified post-Phase 1 design.*

| Principle / Rule | Compliance Status | Implementation Detail |
|------------------|-------------------|------------------------|
| **1. Agent Framework Rule** | **PASS** | Uses Google ADK and `@google/genai` (`gemini-3.6-flash`, Imagen 3); zero external frameworks (LangChain, CrewAI, AutoGen). |
| **2. Live Grounding Rule** | **PASS** | External web & trademark search uses `@parallel-web/sdk` wrapped as native ADK tools in `server/tools/`. |
| **3. Architecture & Persistence** | **PASS** | Stateless Express API on Cloud Run; Firestore persistence; strict code isolation (`server/` backend, `src/` frontend). |
| **4. Clearance Invariant** | **PASS** | Canonical entity ID resolution ("Clear once, recognize everywhere"); scene context risk evaluation; formal statuses (`NO ISSUE SURFACED`, `REVIEW RECOMMENDED`, `ACTION REQUIRED`, `INSUFFICIENT EVIDENCE`); legal disclaimer. |
| **5. Execution Modes Rule** | **PASS** | Supports `TEST_MODE` (offline mocks), `DEMO_MODE` (cached synthetic datasets), and `CLOUD_MODE` (live APIs). |
| **6. Chain-of-Thought Privacy** | **PASS** | Sanitization filter in `server/events/timelineEmitter.ts` strips raw model chain-of-thought before emitting SSE or logging. |

---

## Project Structure

### Documentation (`specs/001-clearance-workspace/`)

```text
specs/001-clearance-workspace/
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 research & technology decisions
├── data-model.md        # Phase 1 data model & state transition specification
├── quickstart.md        # Phase 1 end-to-end validation guide
├── contracts/           # Phase 1 API & SSE contracts
│   └── clearance-api.md # REST and SSE interface contracts
└── checklists/          # Quality checklist
    └── requirements.md  # Spec quality validation checklist
```

### Source Code (`/`)

```text
server/
├── agents/              # Google ADK Agent definitions (ScriptParser, ClearanceAgent, ReplacementAgent)
├── tools/               # Native ADK Tools (parallelSearchTool, firestoreTool, artworkTool)
├── workflows/           # Multi-step agent workflows (scriptClearanceWorkflow, riskEvaluator)
├── integrations/        # Client SDK wrappers (@google/genai, @parallel-web/sdk, cache/)
├── repositories/        # Firestore DB repositories (ProjectRepo, SceneRepo, EntityRepo, AssessmentRepo)
├── events/              # SSE Broadcaster & Timeline Event Sanitizer
├── api/                 # Express REST routes & controllers
└── index.ts             # Server entrypoint

src/
├── components/          # React UI components (ScriptViewer, EntityTable, RiskBadge, TimelineDrawer)
├── pages/               # Page views (DashboardPage, WorkspacePage)
├── services/            # API client & SSE timeline subscriber
└── App.tsx              # Application entrypoint

tests/
├── unit/                # Unit tests for deterministic calculation logic & parser
├── contract/            # REST API & SSE contract tests
└── integration/         # Multi-mode end-to-end integration tests
```

---

## Complexity Tracking

> **No Constitution Violations**: The architecture strictly complies with all constitutional invariants and architectural boundaries.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *None* | N/A | N/A |
