# Implementation Plan: Side-by-Side Original and Replacement Comparison

**Branch**: `008-replacement-comparison` | **Date**: 2026-08-18 | **Status**: Plan Complete  
**Specification**: [`specs/008-replacement-comparison/spec.md`](spec.md)

---

## 1. Summary of Feature & Architectural Goals

The **Side-by-Side Original and Replacement Comparison** feature provides clearance coordinators, production designers, and legal counsel with an intuitive two-column comparative view contrasting the original flagged clearance item against the generated fictional replacement asset.

### Core Architectural Invariants:
1. **Gated Availability**: Comparison is active exclusively when an entity has an attached replacement card.
2. **Side-by-Side Dual Column View**:
   - **Left Column (Original)**: Canonical name, entity category, clearance risk status, risk score, and legal rationale.
   - **Right Column (Replacement)**: Replacement name, category, evaluated clearance status, design prompt/style, and artwork card visual.
3. **Attempt History & Citations Auditability**: Itemizes all candidate attempts ($1 \le \text{attempts} \le 3$), negative constraints applied, and authentic citation provenance badges (`PARALLEL_LIVE`, `DEMO_FIXTURE`, or `FALLBACK_FIXTURE`).
4. **Counsel Review Banner on Escalations**: Escalated 3rd attempt replacements render a prominent "⚖️ Counsel Review Required" / "Escalated to Legal Counsel" banner rather than a false cleared badge.
5. **Strictly Read-Only**: Inspecting the comparison view executes 0 mutations on entity records, assessments, or counsel overrides.
6. **Binder Print View Integration**: Side-by-side comparison tables are embedded directly into the project clearance binder print view (`BinderViewer.tsx` / `binderExportWorkflow.ts`).

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | Uses Google ADK and `@google/genai` Gemini 3.6 Flash / Imagen 3 models. |
| **II. Live Grounding & Research Tooling** | **PASS** | Retains authentic Parallel Search grounding citations; zero evidence fabrication. |
| **III. Architecture & Cloud Persistence** | **PASS** | Backend comparison data routing in `server/api/`, UI modal and binder views in `src/`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Standardized 4-status classification (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`, `INSUFFICIENT_EVIDENCE`). No legal opinions rendered. |
| **V. Multi-Tier Execution Modes** | **PASS** | Deterministic `TEST_MODE`, `DEMO_MODE`, and fail-visible `CLOUD_MODE`. |
| **Observable Action Timeline** | **PASS** | Displays observable candidate attempts and tool results with raw chain-of-thought stripped. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/008-replacement-comparison/research.md`](research.md))
- **Phase 1: Data Model & Interfaces** ([`specs/008-replacement-comparison/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/008-replacement-comparison/contracts/comparison-api.md`](contracts/comparison-api.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/008-replacement-comparison/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/api/replacementRoutes.ts`: Add `GET /projects/:id/entities/:entityId/comparison` endpoint returning compound comparison payload.
- `src/components/ComparisonModal.tsx`: Create side-by-side comparison modal with attempt history and counsel review banner.
- `src/components/EntityRegistryTable.tsx`: Add "🔍 Compare" button for rows with attached replacement cards.
- `src/components/BinderViewer.tsx`: Embed side-by-side comparison view in the exported clearance binder print view.
- `src/pages/WorkspacePage.tsx`: Wire comparison modal state and trigger handlers.
- `tests/contract/test_replacement_comparison.test.ts`: Contract test for `GET /api/projects/:id/entities/:entityId/comparison`.
- `tests/integration/replacement_comparison_workflow.test.ts`: End-to-end integration test verifying comparison rendering, attempt history, counsel escalation banner, and binder inclusion.
