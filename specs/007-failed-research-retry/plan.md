# Implementation Plan: Failed Research Retry

**Branch**: `007-failed-research-retry` | **Date**: 2026-08-18 | **Status**: Plan Complete  
**Specification**: [`specs/007-failed-research-retry/spec.md`](spec.md)

---

## 1. Summary of Feature & Architectural Goals

The **Failed Research Retry** feature provides clearance coordinators with a targeted, per-item mechanism to re-evaluate clearance items that yielded `INSUFFICIENT_EVIDENCE` or failed during automated grounding research (e.g. transient search timeouts, missing network availability, or newly corrected entity definitions).

### Core Architectural Invariants:
1. **Per-Item Granularity**: Retries exclusively re-evaluate the targeted entity without re-running or modifying completed sibling items.
2. **Eligibility Gating**: Retries are permitted only for items with `INSUFFICIENT_EVIDENCE` or failed research status.
3. **Anti-Fabrication & Live Grounding**: Research queries use the Parallel Search API (or demo fixtures in `DEMO_MODE`), retaining genuine citation provenance badges (`PARALLEL_LIVE`, `DEMO_FIXTURE`, or `FALLBACK_FIXTURE`).
4. **Fail-Visible `CLOUD_MODE`**: In `CLOUD_MODE`, missing keys or provider outages fail visibly, preserving `INSUFFICIENT_EVIDENCE` with zero silent mock substitution.
5. **Counsel Override Invariant**: Retrying research updates automated risk assessments and citations, but never mutates, overrides, or erases active legal counsel overrides.
6. **Observable Timeline Streaming**: Emits `RESEARCH_RETRY_STARTED` followed by standard `TOOL_CALL`, `CITATION_ADDED`, and `RISK_EVAL` events over SSE.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | Uses Google ADK and `@google/genai` Gemini 3.6 Flash. |
| **II. Live Grounding & Research Tooling** | **PASS** | Uses Parallel Search SDK via `parallelSearchTool`. Zero citation fabrication. |
| **III. Architecture & Cloud Persistence** | **PASS** | Backend endpoints in `server/api/` and `server/workflows/`, UI in `src/`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | 4-status classification (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`, `INSUFFICIENT_EVIDENCE`). No legal opinions rendered. |
| **V. Multi-Tier Execution Modes** | **PASS** | `TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE` supported. `CLOUD_MODE` fails visibly on missing credentials. |
| **Observable Action Timeline** | **PASS** | Emits `RESEARCH_RETRY_STARTED`, `TOOL_CALL`, `CITATION_ADDED`, `RISK_EVAL` over SSE with raw chain-of-thought stripped. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/007-failed-research-retry/research.md`](research.md))
- **Phase 1: Data Model & Interfaces** ([`specs/007-failed-research-retry/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/007-failed-research-retry/contracts/failed-research-retry-api.md`](contracts/failed-research-retry-api.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/007-failed-research-retry/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/events/timelineEmitter.ts`: Add `RESEARCH_RETRY_STARTED` to `TimelineEventType`.
- `server/workflows/clearanceEvaluator.ts`: Add `retryEntityResearch(projectId, entityId)` method.
- `server/api/clearanceRoutes.ts`: Expose `POST /projects/:id/entities/:entityId/retry-research` with eligibility validation.
- `src/components/EntityRegistryTable.tsx`: Render dedicated "🔁 Retry" button when status is `INSUFFICIENT_EVIDENCE`.
- `src/components/TimelineDrawer.tsx`: Add event badge for `RESEARCH_RETRY_STARTED`.
- `tests/contract/test_failed_research_retry.test.ts`: Contract tests for single-item retry, eligibility gating, and override preservation.
- `tests/integration/failed_research_retry_workflow.test.ts`: End-to-end integration test verifying retry execution, sibling isolation, timeline streaming, and binder compilation.
