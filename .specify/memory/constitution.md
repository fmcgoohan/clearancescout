<!--
Sync Impact Report:
- Version change: 0.0.0 → 1.0.0
- List of modified principles: Initial adoption of constitution for ClearanceScout
- Added sections: Core Principles (Agent Framework, Live Grounding, Architecture & Persistence, Clearance Invariant, Execution Modes), System Architecture & Operational Constraints, Governance
- Removed sections: None
- Follow-up TODOs: None
-->

# ClearanceScout Constitution

## Core Principles

### I. Agent Framework & Model Standard
- Strict adherence to the Google Agent Development Kit (ADK) and `@google/genai` Gemini models for all AI agent logic.
- Absolute prohibition on external multi-agent frameworks (e.g., no LangChain, CrewAI, AutoGen, or LlamaIndex).
- Primary reasoning, document understanding, and structured clearance assessments MUST use `gemini-3.6-flash`. Fictional replacement brand artwork card generation MUST use Google Imagen 3 / Gemini Image Generation models.

### II. Live Grounding & Research Tooling
- All external web search and trademark clearance research MUST use the official `parallel-web` SDK wrapped as native Google ADK tools.
- Every research factual assertion MUST retain exact source provenance and live Parallel Search citations.
- The system MUST NEVER fabricate external web or trademark evidence.

### III. Architecture & Cloud Persistence
- System architecture MUST consist of a stateless containerized API and React frontend deployed on Google Cloud Run.
- Project, scene, canonical entity state, and clearance assessments MUST be persisted in Google Cloud Firestore.
- Strict code isolation MUST be enforced:
  - All ADK agents, Gemini model calls, `parallel-web` integrations, Cloud Storage/Firestore repositories, and secrets MUST reside exclusively within the `server/` directory.
  - The Vite/React frontend (`src/`) MUST strictly contain UI components, API client hooks, and client view logic, communicating with backend services via authenticated REST APIs or SSE event streams.

### IV. Canonical Entity & Contextual Risk Clearance Invariant
- Core Invariant: *"Clear once, recognize everywhere, reassess when context changes."*
- Every entity reference detected across scripts or scenes MUST resolve to a canonical entity ID and undergo contextual risk evaluation on a per-scene basis.
- Clearance verdicts MUST be strictly classified under four formal statuses: `NO ISSUE SURFACED`, `REVIEW RECOMMENDED`, `ACTION REQUIRED`, or `INSUFFICIENT EVIDENCE`. ClearanceScout MUST NOT render definitive legal advice or legal opinions.

### V. Multi-Tier Execution Modes & Resource Minimization
- The platform MUST provide configurable execution modes to control external API expenditures and ensure operational safety:
  - `TEST_MODE`: Automated deterministic test suite utilizing local mocks and offline fixtures.
  - `DEMO_MODE`: Interactive demonstration mode leveraging cached responses and synthetic datasets to minimize external API calls while supporting rich user interaction.
  - `CLOUD_MODE`: Live production runtime connected to Google Gemini and Parallel Search APIs. Must fail visibly with descriptive diagnostics if required API credentials are missing.

## System Architecture & Operational Constraints

### Deterministic Calculation & Reasoning Pattern
1. Gemini models MUST be restricted to identifying semantic target tables, fields, and unstructured document contents.
2. Deterministic TypeScript code MUST execute objective mathematical computations (ratios, dates, expiration booleans, metric deltas).
3. Gemini 3.6 Flash MUST reason over the calculated objective outputs against clearance requirement specifications to issue final verdicts.

### Observable Action Timeline Standard
- User interfaces MUST render observable execution events (tool calls, document queries, deterministic calculations, risk evaluations, citations, state transitions).
- Raw model chain-of-thought MUST NEVER be displayed, stored in persistent state, or logged in client-accessible interfaces.

## Governance

- The ClearanceScout Constitution supersedes all informal team agreements, individual coding preferences, and runtime implementation defaults.
- Any amendment to this constitution requires formal proposal, rationale review, and a semantic version bump:
  - **MAJOR**: Backward-incompatible principle redefinitions, governance changes, or invariant removals.
  - **MINOR**: Addition of new core principles, new execution modes, or major architectural extensions.
  - **PATCH**: Wording clarifications, typo fixes, or non-semantic formatting updates.
- All Pull Requests, architectural specs (`spec.md`), implementation plans (`plan.md`), and task breakdowns (`tasks.md`) MUST explicitly comply with all principles defined in this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-08-17 | **Last Amended**: 2026-08-17
