# Implementation Plan: Multi-Item Clearance Research Progress & Concurrency Control

**Branch**: `011-multi-item-research-progress` | **Date**: 2026-08-18 | **Status**: Plan Complete  
**Specification**: [`specs/011-multi-item-research-progress/spec.md`](spec.md)

---

## 1. Summary of Feature & Architectural Goals

The **Multi-Item Clearance Research Progress & Concurrency Control** feature provides a transparent, robust batch clearance research mechanism within the **Canonical Entity Registry**:
1. **Targeted Eligibility**: "🔍 Research All Pending" selectively queues only entities with status `INSUFFICIENT_EVIDENCE` or un-evaluated status.
2. **Strict Concurrency Limit (Pool Size = 2)**: Client-side asynchronous worker pool executes at most 2 parallel evaluations simultaneously to prevent API throttling and browser resource exhaustion.
3. **Immediate Per-Item Persistence & Live Table Updates**: As each item completes, its risk assessment and citations are immediately persisted and reflected in the UI without waiting for the batch to finish.
4. **Fail-Visible Error Isolation**: Any individual item failure (network timeout or search failure) is isolated and marked fail-visible (`INSUFFICIENT_EVIDENCE`), allowing remaining queued items to complete without interruption.
5. **Signed Override Protection**: Authoritative legal counsel overrides are preserved and never overwritten.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | Evaluates clearance with Gemini 3.6 Flash and Parallel search grounding. |
| **II. Live Grounding & Research Tooling** | **PASS** | Retains authentic Parallel Search grounding citations; zero synthetic evidence fabrication. |
| **III. Architecture & Cloud Persistence** | **PASS** | Backend endpoints isolated in `server/`; UI orchestration cleanly in `src/`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Adheres to standardized 4-status model; legal disclaimer maintained. |
| **V. Multi-Tier Execution Modes** | **PASS** | Operates reliably across `TEST_MODE`, `DEMO_MODE`, and `CLOUD_MODE`. |
| **Observable Action Timeline** | **PASS** | Emits observable tool calls and status updates without raw model chain-of-thought. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/011-multi-item-research-progress/research.md`](research.md))
- **Phase 1: Data Model & Interfaces** ([`specs/011-multi-item-research-progress/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/011-multi-item-research-progress/contracts/batch-research-contract.md`](contracts/batch-research-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/011-multi-item-research-progress/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `src/components/EntityRegistryTable.tsx`: Add "🔍 Research All Pending" button, batch progress banner, and live per-item status badges (`QUEUED`, `RESEARCHING`, `COMPLETED`, `FAILED`).
- `src/hooks/useBatchResearch.ts` / `src/pages/WorkspacePage.tsx`: Implement the bounded concurrency promise worker pool (concurrency = 2) with incremental state updates.
- `tests/contract/test_batch_research.test.ts`: Contract tests verifying concurrency bounding ($\le 2$), per-item progress transitions, fail-visible isolation, and override protection.
- `tests/integration/batch_research_workflow.test.ts`: End-to-end integration test verifying batch screenplay ingestion, multi-item evaluation, table updates, and complete binder export.
