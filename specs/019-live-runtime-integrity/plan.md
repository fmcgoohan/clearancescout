# Implementation Plan: Feature 019 - Live Runtime and Real-Script Integrity

**Branch**: `019-live-runtime-integrity` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/019-live-runtime-integrity/spec.md`

---

## Summary

Feature 019 delivers live production runtime integrity, real screenplay scale, storage hygiene, and fail-closed safety for ClearanceScout on Google Cloud Run. The technical implementation establishes:
1. Native UI file-picker and multipart/form-data screenplay upload (`.fountain`, `.txt`, `.pdf`) with visible client and server error reporting.
2. Resilient chunked/windowed scene extraction with overlap buffers for 120+ page scripts.
3. Strict server `CLOUD_MODE` precedence with complete removal of silent demo fallback in the live parser.
4. Google Cloud Run Firestore persistence via Application Default Credentials (ADC) with startup fail-closed health verification.
5. Authorization protection for project mutation and AI execution endpoints on public Cloud Run.
6. Fail-closed candidate self-clearance verification and strict exclusion of failed replacements from scene shooting readiness mitigations.
7. Atomic Firestore live research quota accounting ($N/N$ exact boundary).
8. Screenplay draft re-upload versioning and orphan cleanup.
9. Comprehensive canonical entity clearance roll-up incorporating all scene occurrences.
10. Immediate cache invalidation and versioning on entity metadata edits.
11. Standardized Firestore subcollection paths (`projects/{projectId}/entities/{entityId}/assessments`) with complete live-path API and UI contract tests.

---

## Technical Context

**Language/Version**: TypeScript 5.4 / Node.js 20+ (ES Modules)  
**Primary Dependencies**: `@google/genai` (`0.1.2`), `parallel-web` (`^1.3.0`), `express` (`4.21.2`), `react` (`18.3.1`), `multer` (`^1.4.5-lts.1`), `pdf-parse` (`^1.1.1`), `uuid` (`^9.0.1`)  
**Storage**: Google Cloud Firestore (`@google-cloud/firestore`) with in-memory test mocks  
**Testing**: Vitest (`1.6.1`), Supertest (`6.3.4`)  
**Target Platform**: Google Cloud Run (Linux x86_64 container, port 8080)  
**Project Type**: Full-stack web application (React/Vite frontend + Express/Node.js backend with SSE)  
**Performance Goals**: File upload parsing $< 5\text{s}$ for 100-page scripts; live quota transaction $< 100\text{ms}$; 100% test pass rate across 65+ suites  
**Constraints**: Zero chain-of-thought leakage; fail-closed on model/network outages; strict 25-call live research quota boundary; WCAG 2.1 AA accessibility  
**Scale/Scope**: Feature-length screenplays up to 120+ pages / 30,000+ words; multi-project studio workspace  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Plan Alignment | Status |
|:---|:---|:---|:---:|
| **I. Agent Framework & Model Standard** | Strictly `@google/genai` Gemini models (Gemini 3.6 Flash / Imagen 3). No external agent frameworks. | Uses `@google/genai` with `gemini-3.6-flash` for chunked scene parsing and structured context. | ✅ Passed |
| **II. Live Grounding & Research Tooling** | Official `parallel-web` SDK wrapped as ADK tools. Authentic citations with exact URLs and provenance badges. Zero hallucinated web evidence. | Direct `parallel-web` (`^1.3.0`) SDK integration in `server/tools/parallelSearchTool.ts` with structured `searchOutcome` and universal badges (`PARALLEL_LIVE`, `DEMO_FIXTURE`, `FALLBACK_FIXTURE`, `MIXED`). | ✅ Passed |
| **III. Architecture & Cloud Persistence** | Google Cloud Run container with Google Cloud Firestore persistence. Strict `server/` backend isolation. | Backend isolated in `server/`, frontend in `src/`. Cloud Run uses real Firestore via ADC with startup health verification. | ✅ Passed |
| **IV. Canonical Entity & Contextual Risk** | Clear once, recognize everywhere. 4 formal statuses (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`, `INSUFFICIENT_EVIDENCE`). No legal opinions. | Occurrence-level risk evaluation with worst-case canonical roll-up. Strict 4-status legal disclaimer taxonomy. | ✅ Passed |
| **V. Multi-Tier Execution Modes** | `TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE`. Fail-closed on missing credentials or API failures. | Authoritative server `CLOUD_MODE` precedence. Zero silent demo fallbacks in live mode. | ✅ Passed |

---

## Project Structure

### Documentation (this feature)

```text
specs/019-live-runtime-integrity/
├── plan.md                                    # This file (/speckit-plan command output)
├── research.md                                # Phase 0 research decisions & rationale
├── data-model.md                              # Phase 1 data entities, schemas & state machines
├── quickstart.md                              # Phase 1 validation scenarios & test commands
├── contracts/                                 # Phase 1 interface specifications
│   ├── upload_endpoint.contract.md            # Multipart upload REST endpoint schema & errors
│   ├── auth_guard.contract.md                 # Public Cloud Run route protection rules
│   ├── quota_ledger.contract.md               # Atomic live quota reservation & deduction
│   └── screenplay_versioning.contract.md      # Draft re-upload and orphan cleanup contract
└── tasks.md                                   # Phase 2 output (/speckit-tasks command)
```

### Source Code Architecture

```text
server/
├── agents/
│   └── ScriptParserAgent.ts                   # Gemini 3.6 Flash chunked screenplay parser
├── api/
│   └── routes.ts                              # Express router with auth middleware & upload handlers
├── config.ts                                  # Authoritative execution mode & credentials config
├── events/
│   └── timelineEmitter.ts                     # SSE timeline broadcaster (sanitized)
├── middleware/
│   └── authMiddleware.ts                      # Bearer token protection for write/AI endpoints
├── repositories/
│   ├── ActionNotificationRepo.ts              # Department action queues & RETRY_RESEARCH
│   ├── AssessmentRepo.ts                      # Grounding assessment records
│   ├── EntityRepo.ts                          # Canonical entity registry & derived roll-ups
│   ├── firestoreClient.ts                     # Google Cloud Firestore ADC initialization
│   ├── PlaceholderRepo.ts                     # Scoped replacement prop records
│   ├── ProjectRepo.ts                         # Studio projects & atomic quota ledger
│   ├── RightsRepo.ts                          # Contractual rights catalog
│   └── SceneRepo.ts                           # Scene shooting readiness state machine
├── tools/
│   ├── artworkTool.ts                         # Google Imagen 3 replacement prop artwork
│   └── parallelSearchTool.ts                  # parallel-web SDK search with structured searchOutcome
└── workflows/
    ├── actionDispatcher.ts                    # Action sync & scoped override routing
    ├── clearanceEvaluator.ts                  # Deterministic math + Gemini context evaluation
    ├── demoAutomationWorkflow.ts              # 1-Click judge demo loader
    ├── replacementGenerator.ts                # Fail-closed self-clearance loop
    └── sceneReadinessEngine.ts                # Deterministic scene readiness engine

src/
├── components/
│   ├── ScriptUploadModal.tsx                  # Native UI file picker & progress dialog
│   ├── SceneDetailDrawer.tsx                  # Occurrence inspector & counsel override
│   ├── LegalClearanceBinder.tsx               # Delivery binder with SHA-256 seal
│   └── OperationsDashboard.tsx                # Executive cockpit & shooting readiness
├── hooks/
│   └── useProject.ts                          # Client API query & mutation hooks
└── pages/
    └── ProjectWorkspace.tsx                   # Main production clearance workspace

tests/
├── contract/
│   ├── test_file_upload_multipart.test.ts     # Multipart upload & error diagnostics contract
│   ├── test_chunked_script_ingestion.test.ts  # 120-page script chunking & boundary test
│   ├── test_cloud_runtime_authority.test.ts   # Server CLOUD_MODE authority & parser fail-closed
│   ├── test_firestore_adc_persistence.test.ts # Firestore ADC connectivity & subcollection paths
│   ├── test_atomic_quota_accounting.test.ts   # Concurrent 25-quota transaction boundary test
│   └── test_canonical_rollup_integrity.test.ts # Canonical status roll-up & cache invalidation
└── integration/
    └── test_live_runtime_integrity_workflow.test.ts # End-to-end live runtime integrity workflow
```

---

## Phases

### Phase 0: Outline & Research
- Resolved technical decisions across all 13 defect areas in `research.md`.
- Evaluated multipart upload options, scene chunking strategies, server execution mode precedence, Firestore ADC fail-closed guards, atomic quota transactions, and canonical status roll-up state machines.
- **Output**: [`specs/019-live-runtime-integrity/research.md`](./research.md)

### Phase 1: Design & Contracts
- Defined complete data model, TypeScript interfaces, subcollection hierarchies, and state machines in `data-model.md`.
- Specified interface contracts in `/contracts/`:
  - `upload_endpoint.contract.md`
  - `auth_guard.contract.md`
  - `quota_ledger.contract.md`
  - `screenplay_versioning.contract.md`
- Created runnable validation scenarios and test commands in `quickstart.md`.
- **Output**: [`specs/019-live-runtime-integrity/data-model.md`](./data-model.md), [`specs/019-live-runtime-integrity/contracts/`](./contracts/), [`specs/019-live-runtime-integrity/quickstart.md`](./quickstart.md)

### Phase 2: Tasks (Next Step)
- Generate actionable, dependency-ordered tasks in `tasks.md` using `/speckit-tasks`.
