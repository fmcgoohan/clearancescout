# Implementation Plan: Production Clearance Operating Model (Phase 2 - Occurrence-Level Evaluation)

**Branch**: `016-production-clearance-model` | **Date**: 2026-08-19 | **Status**: Plan Complete (Phase 2 Focus)  
**Specification**: [`specs/016-production-clearance-model/spec.md`](spec.md)

---

## 1. Summary of Feature & Phase 2 Scope

The **Occurrence-Level Evaluation Model** shifts the fundamental unit of clearance assessment from abstract global entities to specific scene occurrences.

### Core Objectives (Phase 2 Only):
1. **Occurrence-Level Assessment as Fundamental Unit (`FR-002`, `US2`)**:
   - Assessment evaluated per scene occurrence combining **Canonical Grounding Research + Occurrence Scene Action Context** (`excerptText`, `usageContext`, `sentimentScore`, `exposureDurationSeconds`).
   - Each occurrence independently stores its `clearanceStatus` (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`, `INSUFFICIENT_EVIDENCE`), `riskScore`, `riskRationale`, and `citations`.
   - Distinct scene depictions of the same entity (e.g. background/incidental in Scene 1 vs. defamed/weaponized in Scene 4) produce distinct occurrence verdicts.
2. **Deterministic Canonical Status Roll-Up (`FR-003`, `US2`)**:
   - Canonical entity overall status is a deterministic roll-up derived from its active occurrences:
     $$\text{Canonical Status} = \max_{\text{severity}}(\text{Occurrence Statuses})$$
     Severity rank: `ACTION_REQUIRED` (4) > `REVIEW_RECOMMENDED` (3) > `INSUFFICIENT_EVIDENCE` (2) > `NO_ISSUE_SURFACED` (1).
3. **Preserve Feature 003 Scene Override Hierarchy (`FR-013`)**:
   - Effective occurrence status resolves as:
     $$\text{Effective Occurrence} = \text{Scene Counsel Override} ?? \text{Occurrence Evaluated Status} ?? \text{Canonical Override} ?? \text{NO\_ISSUE\_SURFACED}$$
   - Preserves signed counsel overrides and sibling occurrence isolation.
4. **Preserve Invariants (003–015)**:
   - 100% preservation of project types, demo tokens, quotas, SSE timelines, offline fixtures, and responsive a11y.
5. **Strict Scope Boundary**:
   - Phases 3 through 10 (aliases, rights objects, scene readiness state machine, actions queue, etc.) remain strictly unbuilt until Phase 2 is implemented and converged.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | Evaluation workflow uses Gemini 3.6 Flash / deterministic reasoning over scene occurrence context. |
| **II. Live Grounding & Research Tooling** | **PASS** | Evaluator retains Parallel Search grounding citations at both occurrence and canonical levels. |
| **III. Architecture & Cloud Persistence** | **PASS** | Occurrences persisted in Firestore via `EntityRepo.ts` with atomic updates. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Occurrence verdicts roll up deterministically into canonical entity status. |
| **V. Multi-Tier Execution Modes** | **PASS** | Mode-locked execution (`TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE`) fully preserved. |
| **Observable Action Timeline** | **PASS** | Occurrence evaluations emit observable `RISK_EVAL` events with scene and occurrence provenance without CoT leakage. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/016-production-clearance-model/research.md`](research.md))
- **Phase 1: Data Model & Schema** ([`specs/016-production-clearance-model/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/016-production-clearance-model/contracts/occurrence-evaluation-contract.md`](contracts/occurrence-evaluation-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/016-production-clearance-model/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/repositories/EntityRepo.ts`:
  - Extend `SceneEntityOccurrenceData` with `clearanceStatus`, `riskScore`, `riskRationale`, `citations`, `evaluatedAt`.
  - Add `updateOccurrenceEvaluation(occurrenceId, data)` and `computeDerivedCanonicalStatus(projectId, canonicalEntityId)`.
- `server/workflows/clearanceEvaluator.ts`:
  - Update `evaluateEntityClearance` and add `evaluateOccurrenceClearance` to evaluate occurrences per scene context and roll up canonical status.
- `server/api/clearanceRoutes.ts`:
  - Support `POST /api/projects/:id/occurrences/:occurrenceId/evaluate` and return occurrence-level evaluation results.
- `src/pages/WorkspacePage.tsx` / `src/components/EntityDetailModal.tsx`:
  - Display occurrence-level clearance verdicts in scene breakdown tables with scene badges.
- `tests/contract/test_occurrence_evaluation.test.ts`:
  - Contract test validating occurrence evaluation and roll-up status calculation.
- `tests/integration/occurrence_clearance_workflow.test.ts`:
  - End-to-end integration test verifying multi-scene occurrence isolation, differential risk scores, and canonical roll-up.
