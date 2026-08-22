<!--
Sync Impact Report:
- Version change: 1.1.0 → 1.2.0
- List of modified principles: None
- Added sections: XIV. Article 9: Target Shipped Architecture (Reference Implementations Are Rendered Oracles)
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

## UI & Visual Design System Principles

### VI. Article 1: Semantic Color Is Sacred (NON-NEGOTIABLE)
- Green, amber, and red MUST exist solely to convey clearance statuses (`CLEARED` / `WORKING_CLEAR`, `REVIEW_RECOMMENDED`, and `BLOCKS_SHOOTING` / `ACTION_REQUIRED`).
- Exactly ONE additional brand accent color is permitted, chosen specifically to be confusable with none of green, amber, or red.
- No other color hues MUST be introduced across the application interface.
- Raw hex color strings MUST NOT be hardcoded in UI components; all color references MUST use CSS tokens defined in `src/index.css`.

### VII. Article 2: Type Encodes Provenance (NON-NEGOTIABLE)
- Monospace typography MUST be reserved strictly for raw text artifacts (e.g., screenplay draft excerpts, raw JSON event-log payloads, code blocks) and MUST NOT appear anywhere in UI chrome, labels, headers, buttons, or metadata badges.
- UI chrome MUST use a single variable sans-serif typeface with a strictly defined typographic scale.

### VIII. Article 3: No Emoji in Chrome (NON-NEGOTIABLE)
- Emoji characters MUST NOT be used as iconography or visual decorations in UI chrome, headers, tab bars, modal titles, or action buttons.
- All iconography MUST be clean, accessible inline stroke SVG icons with unified stroke width and scaling.

### IX. Article 4: The Hero Is the Answer (NON-NEGOTIABLE)
- The Shooting Readiness Index and per-scene "why-blocked" failure reasons MUST visually outrank all secondary content, widgets, metadata tables, and action controls.
- Key metrics and clearance blockers MUST be prominently styled with primary visual weight, clear typography, and immediate legibility.

### X. Article 5: Motion Is One Moment Plus One Signal (NON-NEGOTIABLE)
- Motion MUST be restricted to a single orchestrated initial page load sequence and at most ONE looping animation, reserved exclusively for active `BLOCKS_SHOOTING` / `ACTION_REQUIRED` status indicators.
- CSS transitions and animations MUST use `transform` and `opacity` properties only.
- All motion and animations MUST fully collapse when `prefers-reduced-motion: reduce` is enabled.

### XI. Article 6: Status Is Never Color Alone (NON-NEGOTIABLE)
- Color MUST NEVER be used as the sole indicator of clearance status, risk severity, or system state.
- Every status badge, indicator, and alert MUST pair color with explicit, unambiguous text labels (e.g., "Cleared", "Review Recommended", "Blocks Shooting", "Action Required").

### XII. Article 7: Every Defect Becomes Law (NON-NEGOTIABLE)
- Any bug or regression identified during QA or evaluation MUST be encoded into the relevant specification as a testable regression clause citing the date and finding.
- Active mandatory defect laws:
  1. **Modal Body Scroll Lock**: Overlays and modal dialogs MUST lock body scrolling (`overflow: hidden` on body / viewport lock) when open to prevent background scrolling.
  2. **Character Encoding Protection**: All typographic non-ASCII characters (e.g., em-dashes, curved quotes, non-breaking spaces) MUST be written as safe HTML entities or standard ASCII to prevent mojibake rendering artifacts under servers omitting explicit charset headers.

### XIII. Article 8: Append-Only Design Log (NON-NEGOTIABLE)
- Every UI/UX design iteration MUST record what changed, the underlying rationale, and verification evidence in `DESIGN_LOG.md` in an append-only format.
- Conflicts between specification requirements and visual implementation MUST be resolved explicitly and documented in `DESIGN_LOG.md`, never silently overridden.

### XIV. Article 9: Target Shipped Architecture (NON-NEGOTIABLE)
- Plans and implementations MUST strictly target the actual shipped stack and application architecture (currently TypeScript, React, Vite, Express, and Google ADK).
- When a reference implementation (such as a single self-contained HTML file, vanilla CSS/JS demo, or prototype) is provided as guidance, it defines the intended rendered visual/behavioral outcomes and verification criteria as an oracle, but MUST NOT be interpreted as a mandate to rewrite, replace, or discard the actual shipped application architecture.
- All specification plans, task breakdowns, and feature deliverables MUST continue to target and integrate cleanly into the real shipped codebase.

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

**Version**: 1.2.0 | **Ratified**: 2026-08-17 | **Last Amended**: 2026-08-23
