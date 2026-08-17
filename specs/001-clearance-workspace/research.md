# Research & Architecture Decisions: ClearanceScout Workspace

**Feature**: `specs/001-clearance-workspace`  
**Date**: 2026-08-17  
**Status**: Completed  

---

## 1. Agent Framework & AI Model Integration

### Decision
Use the official **Google Agent Development Kit (ADK)** for Node/TypeScript inside `server/agents/` along with `@google/genai` SDK.
- **Primary Agent Model**: `gemini-3.6-flash` for script parsing, canonical entity matching, contextual risk evaluation, and structured JSON output.
- **Visual Concept Artwork Model**: Google Imagen 3 / Gemini Image Generation (`imagen-3.0-generate-002`) for generating fictional replacement brand concept cards.

### Rationale
- Strictly aligns with **Constitution Principle I** (strict ADK & Gemini models requirement, zero external frameworks like LangChain/CrewAI).
- `gemini-3.6-flash` delivers low-latency structured JSON generation and high reasoning quality required for legal clearance issue-spotting.
- Imagen 3 produces photorealistic replacement brand packaging/art cards directly from generated design briefs.

### Alternatives Considered
- **LangChain / AutoGen / CrewAI**: Rejected due to explicit prohibition in Constitution Principle I and AGENTS.md Invariant 1.
- **Gemini 2.5 Flash**: Rejected per AGENTS.md Rule 2 (never use Gemini 2.5 in competition runtime).

---

## 2. Live Trademark Grounding & Web Research

### Decision
Wrap the official `@parallel-web/sdk` inside a native ADK Tool (`server/tools/parallelSearchTool.ts`).

### Rationale
- Satisfies **Constitution Principle II** and **Clearance Invariant**.
- Executes live queries against trademark databases and web sources.
- Every research output constructs a `ClearanceCitation` containing exact source provenance (`sourceUrl`, `query`, `timestamp`, `excerptSnippet`, `registrationStatus`).

### Alternatives Considered
- **Direct HTML Scraping**: Rejected due to fragility, lack of official provenance, and risk of rate limiting.
- **Un-grounded LLM Memory**: Rejected as LLMs hallucinate trademark statuses and registration ownership.

---

## 3. Storage, Persistence & Backend Isolation

### Decision
- **Storage**: Google Cloud Firestore (`@google-cloud/firestore`) running in Native Mode for real-time document persistence.
- **Hosting & Compute**: Stateless containerized Express service deployed on Google Cloud Run.
- **Code Isolation**:
  - `server/`: All ADK agents, Gemini model invocations, `parallel-web` tools, Firestore repositories, and secret key resolution.
  - `src/`: Vite + React + TypeScript single-page application (SPA), UI components, and API client hooks.

### Rationale
- Complies with **Constitution Principle III** and **AGENTS.md Invariant 1**.
- Firestore provides real-time snapshot listeners, low latency, and seamless document data modeling for projects, scenes, entities, and assessments.

---

## 4. Multi-Tier Execution Modes & Caching

### Decision
Implement three configurable execution modes controlled via `EXECUTION_MODE` environment variable (`TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE`):
- `TEST_MODE`: Uses local JSON fixtures (`server/tests/fixtures/`); zero external network calls.
- `DEMO_MODE`: Intercepts Gemini and `parallel-web` calls using local file-backed response cache (`server/integrations/cache/`); allows interactive demo execution without incurring API fees.
- `CLOUD_MODE`: Live production runtime invoking real Gemini and Parallel Search APIs. Raises explicit error if `GEMINI_API_KEY` or `PARALLEL_WEB_API_KEY` are missing.

### Rationale
- Directly addresses **User Requirement 5** and **Constitution Principle V**.
- Guarantees cost control during development and demonstrations while maintaining 100% operational fidelity in production.

---

## 5. Deterministic Calculation & Risk Pattern

### Decision
Implement a 3-step hybrid evaluation workflow (`server/workflows/clearanceEvaluator.ts`):
1. **Semantic Extraction**: Gemini 3.6 Flash identifies scene entity occurrences and extracts contextual dialogue/action snippets.
2. **Deterministic Computation**: TypeScript helper calculates objective metrics (frequency count across script, exact defamatory keyword occurrences, brand category classification).
3. **Verdict Synthesis**: Gemini 3.6 Flash evaluates calculated metrics against legal risk guidelines to issue final status (`NO ISSUE SURFACED`, `REVIEW RECOMMENDED`, `ACTION REQUIRED`, `INSUFFICIENT EVIDENCE`).

### Rationale
- Complies with **Constitution Principle IV** and **AGENTS.md Invariant 3**. Prevents model math errors while retaining semantic reasoning capabilities.

---

## 6. Real-Time Action Timeline & Chain-of-Thought Privacy

### Decision
- Implement Server-Sent Events (SSE) at `GET /api/projects/:id/timeline/stream`.
- A dedicated `TimelineEventEmitter` (`server/events/timelineEmitter.ts`) broadcasts `ExecutionEvent` objects to connected UI clients.
- Sanitization filter strips all raw model chain-of-thought (`thought` / `thinking` fields) prior to broadcasting or storing in Firestore.

### Rationale
- Complies with **AGENTS.md Invariant 5** and **Constitution Operational Constraints**. Provides live execution visibility to users while protecting raw model reasoning.
