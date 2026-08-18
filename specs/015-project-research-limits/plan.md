# Implementation Plan: Per-Project Research Limits

**Branch**: `015-project-research-limits` | **Date**: 2026-08-18 | **Status**: Plan Complete  
**Specification**: [`specs/015-project-research-limits/spec.md`](spec.md)

---

## 1. Summary of Feature & Architectural Goals

The **Per-Project Research Limits** feature introduces deterministic quota tracking and fail-visible limits for live Parallel Search and Gemini API invocations:
1. **Live Quota Accounting (`US1`)**:
   - Track live calls per project in `ProjectRepo` with `liveQuotaLimit` (default `25`) and `liveQuotaUsed` (default `0`).
   - Deliver project quota status in `GET /api/projects/:id` and after evaluations.
   - Display a high-contrast badge in the workspace header showing remaining of total (`⚡ Live Quota: 25 / 25`).
2. **Fail-Visible Rejection on Quota Exhaustion (`US2`)**:
   - In `CLOUD_MODE`, when a project's remaining quota reaches 0, reject evaluation, retry, and replacement requests immediately with HTTP `429 Too Many Requests`.
   - Prevent silent fallback, mock degradation, or ungrounded evaluations when limits are breached.
   - Render a prominent, fail-visible error banner in the frontend.
3. **Offline Mode Exemption (`US3`)**:
   - In `TEST_MODE` and `DEMO_MODE`, repository record-replay fixtures NEVER increment or consume live quota.
4. **Preserve Invariants (003–014)**:
   - 100% preservation of all previously ratified features, invariants, and test suites.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | `CLOUD_MODE` calls Gemini 3.6 Flash while respecting per-project live quota constraints. |
| **II. Live Grounding & Research Tooling** | **PASS** | Parallel Search grounding provenance tracked; quota prevents runaway live queries. |
| **III. Architecture & Cloud Persistence** | **PASS** | Quota tracking persisted cleanly inside `server/repositories/ProjectRepo.ts`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Clearance evaluation integrity and 4-status taxonomy strictly preserved. |
| **V. Multi-Tier Execution Modes** | **PASS** | Mode boundaries strictly respected: `TEST_MODE` & `DEMO_MODE` bypass live quota entirely. |
| **Observable Action Timeline** | **PASS** | Quota exhaustion emits fail-visible observable timeline events with zero CoT. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/015-project-research-limits/research.md`](research.md))
- **Phase 1: Data Model & Schema** ([`specs/015-project-research-limits/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/015-project-research-limits/contracts/project-quota-contract.md`](contracts/project-quota-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/015-project-research-limits/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/repositories/ProjectRepo.ts`: Add `liveQuotaLimit` (default 25) and `liveQuotaUsed` fields to `ProjectData`, plus `consumeLiveQuota(projectId, count)` and `getQuota(projectId)` methods.
- `server/workflows/clearanceEvaluator.ts`: Check and consume live quota before performing live Parallel Search or Gemini evaluations in `CLOUD_MODE`.
- `server/workflows/replacementGenerator.ts`: Check and consume live quota before generating candidate replacements in `CLOUD_MODE`.
- `server/api/projectRoutes.ts`: Return quota metadata in `GET /api/projects/:id` and `POST /api/projects`.
- `src/App.tsx`: Track and display `liveQuota` (`used`, `limit`, `remaining`) in the header (`⚡ Live Quota: X / Y`) and handle 429 quota error alerts.
- `tests/contract/test_project_research_limits.test.ts`: Contract test suite validating quota tracking, mode isolation, and 429 exhaustion rejections.
- `tests/integration/project_quota_workflow.test.ts`: Integration test verifying full quota enforcement and UI badge visibility.
