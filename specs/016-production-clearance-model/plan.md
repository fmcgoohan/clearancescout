# Implementation Plan: Production Clearance Operating Model (Phase 10 - Legal Clearance Binder)

**Branch**: `016-production-clearance-model` | **Date**: 2026-08-19 | **Status**: Plan Complete (Phase 10 Focus)  
**Specification**: [`specs/016-production-clearance-model/spec.md`](spec.md)

---

## 1. Summary of Feature & Phase 10 Scope

Phase 10 completes the Production Clearance Operating Model (`US10`, `FR-011`, `FR-012`) by delivering the comprehensive, audit-grade **Legal Clearance Binder**:
- **Executive Metadata**: Project Type (`Movie`, `TV Show`, `Commercial`), Production Company, Script Version, Export Timestamp.
- **Contractual Rights Catalog**: Complete rights & restrictions table (Grant type, territory, media window, expiration date, perpetual status, covenants, licensor).
- **Fictional Placeholders & Replacements**: Multi-category replacement assets (`BRAND`, `ART_MUSIC`, `ARTWORK`, `DIALOGUE`, `GRAPHIC_PROP`) with clearance tiers (`TEMP_APPROVED` on-set vs `FINAL_CLEARED`).
- **Scene-by-Scene Readiness Schedule**: Full shoot readiness breakdown (`FINAL CLEAR`, `WORKING CLEAR`, `RED`, with occurrence item breakdowns).
- **Unresolved Department Actions**: Open to-do items across `Art Dept`, `Legal Counsel`, `Locations`, and `Production Mgmt`.
- **Canonical Entity Registry & Citations**: Complete IP catalog with Parallel Search citations and provenance (`PARALLEL_LIVE`, `DEMO_FIXTURE`, `FALLBACK_FIXTURE`).
- **Signed Counsel Overrides**: Immutable audit log of all legal approvals.
- **Cryptographic SHA-256 Integrity Digest**: Hex digest computed over the canonical exported payload ensuring tamper-evident auditability.
- **Observable Action Timeline Standard**: Emits `BINDER_EXPORT` SSE timeline events without raw model chain-of-thought.
- **Mandatory Legal Disclaimer**: Invariant stating ClearanceScout provides issue-spotting and clearance workflow management, not formal legal opinions.

### Core Objectives (Phase 10 Only):
1. **Extend Binder Domain Models & Repo (`server/repositories/BinderRepo.ts`)**:
   - Add `rightsAgreements`, `placeholders`, `sceneReadinessSchedule`, `unresolvedActions`, and extended `projectSummary` to `ClearanceBinderData`.
   - Ensure `generateIntegrityDigest` computes SHA-256 over all canonical data fields.
2. **Update Compilation Workflow (`server/workflows/binderExportWorkflow.ts`)**:
   - Pull from `projectRepo`, `entityRepo`, `rightsRepo`, `placeholderRepo`, `sceneReadinessEngine`, `actionNotificationRepo`, `overrideRepo`, and `assessmentRepo`.
3. **REST Endpoints (`server/api/binderRoutes.ts`)**:
   - `GET /projects/:id/binder`
   - `POST /projects/:id/binder/export`
   - `GET /projects/:id/binder/markdown`
4. **UI Binder Viewer (`src/components/BinderExportModal.tsx`)**:
   - Render multi-section tabs with rights, placeholders, scene readiness, open actions, and cryptographic checksum.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | Binder compilation uses deterministic TypeScript aggregation; no unneeded model calls. |
| **II. Live Grounding & Research Tooling** | **PASS** | Exact citation URLs, rights agreement terms, and occurrence provenance preserved. |
| **III. Architecture & Cloud Persistence** | **PASS** | Backend persistence in Firestore collection `projects/{projectId}/binder_exports`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Occurrence-level roll-ups and scene readiness tiers accurately represented. |
| **V. Multi-Tier Execution Modes** | **PASS** | Functions identically in `TEST_MODE`, `DEMO_MODE`, and `CLOUD_MODE`. |
| **Observable Action Timeline** | **PASS** | Emits `BINDER_EXPORT` with digest and metadata; CoT remains hidden. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/016-production-clearance-model/research.md`](research.md))
- **Phase 1: Data Model & Schema** ([`specs/016-production-clearance-model/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/016-production-clearance-model/contracts/binder-contract.md`](contracts/binder-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/016-production-clearance-model/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/repositories/BinderRepo.ts`:
  - Extended `ClearanceBinderData` schema, SHA-256 digest computation.
- `server/workflows/binderExportWorkflow.ts`:
  - End-to-end binder compilation across all 8 domain modules.
- `server/api/binderRoutes.ts`:
  - JSON and Markdown export routes.
- `src/components/BinderExportModal.tsx`:
  - Full binder viewer modal with rights catalog, placeholders, scene schedule, and SHA-256 download actions.
- `tests/contract/test_binder_export.test.ts`:
  - Contract test for extended binder payload and SHA-256 digest.
- `tests/integration/binder_export_workflow.test.ts`:
  - End-to-end integration test validating full binder compilation with rights, placeholders, scene readiness, and open actions.
