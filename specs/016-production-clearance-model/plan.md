# Implementation Plan: Production Clearance Operating Model (Phase 8 - Evidence-Driven Live Self-Clearance)

**Branch**: `016-production-clearance-model` | **Date**: 2026-08-19 | **Status**: Plan Complete (Phase 8 Focus)  
**Specification**: [`specs/016-production-clearance-model/spec.md`](spec.md)

---

## 1. Summary of Feature & Phase 8 Scope

Phase 8 elevates the autonomous candidate generation and replacement workflow into an **Evidence-Driven Live Self-Clearance Engine** (`US8`, `FR-009`) operating directly against live Parallel Search and USPTO/WIPO trademark databases in `CLOUD_MODE` / live mode, rather than relying on synthetic keyword collision fixtures.

### Core Objectives (Phase 8 Only):
1. **Live Parallel Search Grounding**:
   - In `CLOUD_MODE` (and live `DEMO_MODE`), every generated replacement candidate is grounded via real-time Parallel Search (`PARALLEL_LIVE` provenance).
   - Gemini evaluates real search result snippets and trademark registration data to detect actual collisions, trademark dilution, or defamatory conflicts.
2. **Negative Constraint Accumulation & Loop Bounding**:
   - Hard iteration ceiling: $\le 3$ attempts (`MAX_ATTEMPTS = 3`).
   - On collision detection, the collided name, conflicting brand, and citation provenance are added to the negative constraints context passed to Gemini for the next iteration.
   - Early termination: Clean clearance with zero collisions immediately accepts the candidate, generates visual artwork, and exits the loop.
3. **4-Event SSE Timeline Stream**:
   - `REPLACEMENT_ATTEMPT`: Dispatched when a new candidate is synthesized.
   - `REPLACEMENT_RESEARCH_STARTED`: Dispatched when trademark queries launch.
   - `REPLACEMENT_REJECTED`: Dispatched when a collision is discovered, detailing the conflict and updated negative constraints.
   - `REPLACEMENT_ACCEPTED`: Dispatched when a candidate passes clearance with zero collisions.
4. **Counsel Escalation & Department Action**:
   - If 3 consecutive iterations fail to clear, the system marks the candidate as `ESCALATED_TO_COUNSEL` (`PROPOSED`), attaches full multi-attempt citation history, and dispatches high-priority actions to Art Dept and Legal Counsel via `actionDispatcher`.
5. **Strict Invariant & Scope Boundaries**:
   - Preserves all 003–015 invariants (occurrence evaluation, rights covenants, scene readiness calculation, action lists, multi-domain placeholders).
   - Phases 9 and 10 (production dashboard and final clearance binder export) remain strictly unbuilt.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | Uses `gemini-3.6-flash` for candidate generation and live search collision analysis; Imagen 3 for concept artwork. |
| **II. Live Grounding & Research Tooling** | **PASS** | In `CLOUD_MODE`, uses real Parallel Search with full citation URLs, retrieved timestamps, and excerpt snippets. Fails visibly if API keys are missing. |
| **III. Architecture & Cloud Persistence** | **PASS** | Backend isolation in `server/workflows/replacementGenerator.ts` and `server/agents/ReplacementAgent.ts`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Attachments update canonical entities and refresh scene readiness deterministically. |
| **V. Multi-Tier Execution Modes** | **PASS** | `TEST_MODE` uses deterministic fixtures; `CLOUD_MODE` enforces live grounding with live quota consumption. |
| **Observable Action Timeline** | **PASS** | 4-event SSE timeline emits observable events without logging raw model CoT. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/016-production-clearance-model/research.md`](research.md))
- **Phase 1: Data Model & Schema** ([`specs/016-production-clearance-model/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/016-production-clearance-model/contracts/self-clearance-contract.md`](contracts/self-clearance-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/016-production-clearance-model/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/agents/ReplacementAgent.ts`:
  - Candidate generator prompting with negative constraints and aesthetic style.
  - Live collision evaluator evaluating real-time search citations.
- `server/workflows/replacementGenerator.ts`:
  - Iterative $\le 3$ self-clearance loop, 4-event SSE emission, live Parallel Search integration, and fallback handling.
- `server/tools/parallelSearchTool.ts`:
  - Live trademark and web grounding with `PARALLEL_LIVE` provenance.
- `server/api/replacementRoutes.ts`:
  - SSE and REST endpoints for candidate replacement generation and live clearance stream.
- `tests/contract/test_evidence_self_clearance.test.ts`:
  - Contract test for live search evaluation, negative constraints, and 3-attempt bounding.
- `tests/integration/evidence_self_clearance_workflow.test.ts`:
  - Integration test for end-to-end self-clearance loop across single and multi-iteration scenarios.
