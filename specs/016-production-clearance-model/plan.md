# Implementation Plan: Production Clearance Operating Model (Phase 5 - Deterministic Scene Readiness State Machine)

**Branch**: `016-production-clearance-model` | **Date**: 2026-08-19 | **Status**: Plan Complete (Phase 5 Focus)  
**Specification**: [`specs/016-production-clearance-model/spec.md`](spec.md)

---

## 1. Summary of Feature & Phase 5 Scope

Phase 5 upgrades the clearance operating model with a **Deterministic Scene Readiness State Machine** (`FR-006`, `US5`). Each scene in a production screenplay is evaluated and classified into one of three definitive operational states: **`RED`**, **`WORKING CLEAR`**, or **`FINAL CLEAR`**, computed deterministically from occurrence clearance verdicts, contractual rights, replacement cards, and signed counsel overrides.

### Core Objectives (Phase 5 Only):
1. **Scene Readiness Domain Modeling (`FR-006`, `US5`)**:
   - Define `SceneReadinessStatus = 'RED' | 'WORKING_CLEAR' | 'FINAL_CLEAR'`.
   - Define structured `SceneReadinessAssessment` capturing:
     - Scene identifiers (`sceneId`, `sceneNumber`, `heading`)
     - Overall computed status (`RED`, `WORKING_CLEAR`, `FINAL_CLEAR`)
     - Occurrence breakdown with item readiness tiers (`BLOCKER`, `WORKING_CLEAR`, `FINAL_CLEAR`)
     - Counters (`blockersCount`, `workingClearCount`, `finalClearCount`, `totalOccurrences`)
     - Summary & blocking rationale
2. **Deterministic State Machine Engine (`server/workflows/sceneReadinessEngine.ts`)**:
   - `evaluateSceneReadiness(projectId: string, sceneId: string): Promise<SceneReadinessAssessment>`:
     - Pure mathematical determination across all scene occurrences taking into account:
       - Occurrence `clearanceStatus`
       - Counsel overrides (`overrideRepo`)
       - Active rights coverage (`rightsRepo.evaluateRightsCoverage`)
       - Replacement cards (`replacementCard`)
     - **Rule 1 (`RED`)**: If ANY occurrence in the scene is a blocker (`ACTION_REQUIRED` with no replacement/override, or `INSUFFICIENT_EVIDENCE`, or expired license) $\to$ Scene is **`RED`**.
     - **Rule 2 (`WORKING CLEAR`)**: If NO blockers exist and at least one item relies on temporary license / approved replacement card / covenants review $\to$ Scene is **`WORKING CLEAR`**.
     - **Rule 3 (`FINAL CLEAR`)**: If all occurrences have final unconditional clearance (`NO_ISSUE_SURFACED`), active perpetual license, or signed counsel override (or scene has 0 occurrences) $\to$ Scene is **`FINAL CLEAR`**.
3. **Repository Extensions (`server/repositories/SceneRepo.ts`)**:
   - Extend `SceneData` with `readinessStatus`, `readinessEvaluatedAt`, and `readinessDetails`.
   - Implement `updateSceneReadiness` and `getSceneReadiness`.
4. **REST API Endpoints (`server/api/sceneRoutes.ts` or `server/api/clearanceRoutes.ts`)**:
   - `GET /api/projects/:id/scenes/readiness` (project-wide readiness summary)
   - `GET /api/projects/:id/scenes/:sceneId/readiness` (scene breakdown)
   - `POST /api/projects/:id/scenes/:sceneId/readiness/evaluate` (trigger evaluation)
   - `POST /api/projects/:id/scenes/readiness/evaluate-all` (batch evaluate all scenes)
5. **Frontend UI Integration**:
   - Display readiness badges in `src/components/ScriptViewer.tsx` (`🔴 RED`, `🟡 WORKING CLEAR`, `🟢 FINAL CLEAR`).
   - Render project-level scene readiness metrics banner in `src/pages/WorkspacePage.tsx`.
6. **Preserve Invariants (003–015 & Phases 1–4)**:
   - 100% preservation of project types, occurrence assessments, derived roll-ups, aliases, parent brand hierarchies, rights records, counsel overrides, and SSE timeline streams.
7. **Strict Scope Boundary**:
   - Phases 6 through 10 (action queues, generalized placeholders, live self-clearance loop, dashboard, binder) remain strictly unbuilt until Phase 5 is implemented and converged.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | Scene readiness is computed via deterministic TypeScript rules over structured occurrence and rights states. |
| **II. Live Grounding & Research Tooling** | **PASS** | Grounded in existing research assertions, rights records, and counsel overrides. |
| **III. Architecture & Cloud Persistence** | **PASS** | Scene readiness persisted in Firestore under `projects/{projectId}/scenes/{sceneId}` via `SceneRepo.ts`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Evaluates occurrences directly; respects scene-override hierarchy (Feature 003). |
| **V. Multi-Tier Execution Modes** | **PASS** | Operates identically in `TEST_MODE`, `DEMO_MODE`, and `CLOUD_MODE`. |
| **Observable Action Timeline** | **PASS** | Emits `STATE_TRANSITION` events upon scene readiness state transitions without CoT leakage. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/016-production-clearance-model/research.md`](research.md))
- **Phase 1: Data Model & Schema** ([`specs/016-production-clearance-model/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/016-production-clearance-model/contracts/scene-readiness-contract.md`](contracts/scene-readiness-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/016-production-clearance-model/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/repositories/SceneRepo.ts`:
  - Extend `SceneData` with `readinessStatus` and add `updateSceneReadiness` methods.
- `server/workflows/sceneReadinessEngine.ts`:
  - New workflow implementing deterministic scene readiness calculations.
- `server/api/sceneRoutes.ts` / `server/api/clearanceRoutes.ts`:
  - Express routes for scene readiness queries and evaluation triggers.
- `src/components/ScriptViewer.tsx` & `src/pages/WorkspacePage.tsx`:
  - Visual readiness status badges on scene cards and project readiness overview counters.
- `tests/contract/test_scene_readiness.test.ts`:
  - Contract tests for scene readiness state transitions (`RED` $\to$ `WORKING CLEAR` $\to$ `FINAL CLEAR`).
- `tests/integration/scene_readiness_workflow.test.ts`:
  - Integration test verifying multi-scene readiness calculations with mixed overrides, rights, and uncleared items.
