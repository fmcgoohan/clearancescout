# Tasks: Feature 019 - Live Runtime and Real-Script Integrity

**Feature Branch**: `019-live-runtime-integrity` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 1: Setup (Shared Infrastructure & Types)

**Purpose**: Establish core data types, subcollection path schemas, and error taxonomy for live runtime integrity.

- [X] T001 Define screenplay upload, chunk ingestion job, and draft versioning interfaces in `server/types/screenplayTypes.ts`
- [X] T002 [P] Define atomic quota ledger, reservation result, and quota transaction interfaces in `server/types/quotaTypes.ts`
- [X] T003 [P] Add `groundingCacheVersion` and cache invalidation metadata to `CanonicalEntityData` in `server/repositories/EntityRepo.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core cloud persistence, server mode authority, and route protection infrastructure that MUST be completed before user stories.

- [X] T004 Standardize Firestore subcollection path resolution across `server/repositories/firestoreClient.ts`, `server/repositories/AssessmentRepo.ts`, `server/repositories/PlaceholderRepo.ts`, and `server/repositories/EntityRepo.ts`
- [X] T005 [P] Implement Firestore ADC initialization with active startup connectivity check and fail-closed health verification (`503 Service Unavailable` if unreachable in `CLOUD_MODE`) in `server/repositories/firestoreClient.ts` and `server/index.ts`
- [X] T006 [P] Enforce authoritative server `EXECUTION_MODE=CLOUD_MODE` precedence over client headers and persisted project flags in `server/config.ts` and `server/workflows/clearanceEvaluator.ts`
- [X] T007 [P] Enhance Bearer token route protection middleware in `server/middleware/authMiddleware.ts` to guard all script uploads, batch research, replacement generation, counsel overrides, and rights mutations on public Cloud Run deployments

---

## Phase 3: User Story 1 - Real Screenplay File-Picker & Resilient Chunked Ingestion (Priority: P1) 🎯 MVP

**Goal**: Enable clearance coordinators and legal counsel to upload real `.fountain`, `.txt`, and `.pdf` screenplays up to 25MB via native UI controls, processing 120+ page scripts with chunked scene extraction and visible error reporting.

**Independent Test**: Upload genuine `.fountain` and `.pdf` screenplays via the native UI dialog. Verify chunked extraction without truncation, and verify unparseable/corrupted PDFs fail visibly with `PDF_EXTRACTION_FAILED`.

### Tests for User Story 1
- [X] T008 [P] [US1] Create contract test for multipart upload validation, format filters, and error diagnostics in `tests/contract/test_file_upload_multipart.test.ts`
- [X] T009 [P] [US1] Create contract test for chunked/windowed scene extraction with overlap buffers in `tests/contract/test_chunked_script_ingestion.test.ts`

### Implementation for User Story 1
- [X] T010 [US1] Implement `multer` and `pdf-parse` multipart upload handling with format/size validation in `server/api/routes.ts`
- [X] T011 [US1] Implement windowed chunking scene parser with 1-scene overlap buffers in `server/agents/ScriptParserAgent.ts`
- [X] T012 [US1] Implement native file picker, drag-and-drop upload zone, progress bar, and visible error alert banners in `src/components/ScriptUploadModal.tsx`
- [X] T013 [US1] Integrate script upload handler with project workspace state and real-time SSE progress in `src/pages/ProjectWorkspace.tsx`

---

## Phase 4: User Story 2 - Authoritative Server Runtime & Strict Live Extraction Integrity (Priority: P1)

**Goal**: Guarantee that `CLOUD_MODE` runtime executes authentic Gemini parsing and Parallel Search queries without silent demo recognizer fallbacks or project-level mode overrides.

**Independent Test**: Run in `CLOUD_MODE`, ingest an un-indexed real script containing custom brand marks, and verify all detected entities come from live AI extraction with 0 synthetic demo fallback leakage.

### Tests for User Story 2
- [X] T014 [P] [US2] Create contract test verifying server `CLOUD_MODE` authority and fail-visible parsing errors (`PARSING_FAILED`) in `tests/contract/test_cloud_runtime_authority.test.ts`

### Implementation for User Story 2
- [X] T015 [US2] Remove silent fallback to synthetic demo recognizers (`extractEntitiesFromTextFallback`) in `server/agents/ScriptParserAgent.ts` when running in `CLOUD_MODE`
- [X] T016 [US2] Enforce live model extraction error propagation with structured diagnostic codes (`PARSING_FAILED`) in `server/agents/ScriptParserAgent.ts` and `server/api/routes.ts`

---

## Phase 5: User Story 3 - Cloud Run Managed Persistence & Public Endpoint Security (Priority: P1)

**Goal**: Connect to Google Cloud Firestore via Application Default Credentials (ADC) in production Cloud Run runtime, failing startup visibly if unreachable, and protect public write/AI endpoints.

**Independent Test**: Verify Firestore ADC initialization on container startup, verify health endpoint returns 503 if Firestore is offline, and verify unauthenticated write requests to protected endpoints return 401.

### Tests for User Story 3
- [X] T017 [P] [US3] Create contract test for Firestore ADC health verification and public endpoint route protection in `tests/contract/test_firestore_adc_persistence.test.ts`

### Implementation for User Story 3
- [X] T018 [US3] Wire Firestore ADC connection and fail-closed readiness probe into `GET /api/health` in `server/index.ts`
- [X] T019 [US3] Apply `authMiddleware` across all write and AI mutation endpoints in `server/api/routes.ts` while preserving public exemptions for health checks and demo viewing

---

## Phase 6: User Story 4 - Fail-Closed Self-Clearance & Strict Scene Readiness (Priority: P1)

**Goal**: Ensure replacement candidate generation and collision checks fail closed on model exceptions, and exclude failed replacements from interim shooting readiness mitigations (locking scenes to RED).

**Independent Test**: Trigger replacement generation with forced collision/model error; verify replacement is marked `FAILED`/`TEMP_REJECTED`, provides 0 mitigation, and the scene evaluates to `RED` blocker.

### Tests for User Story 4
- [X] T020 [P] [US4] Create contract test for fail-closed collision checks and failed replacement blocker scene readiness in `tests/contract/test_replacement_readiness_blocker.test.ts`

### Implementation for User Story 4
- [X] T021 [US4] Implement fail-closed error handling for Gemini collision check and candidate verification in `server/workflows/replacementGenerator.ts`
- [X] T022 [US4] Update `server/workflows/sceneReadinessEngine.ts` to strictly exclude `FAILED` and `TEMP_REJECTED` placeholders from interim mitigations, evaluating occurrences as `BLOCKER` and scenes as `RED`
- [X] T023 [US4] Surface failed replacement blockers and open `ART_DEPT_REPLACEMENT` actions in `src/components/OperationsDashboard.tsx` and `src/components/LegalClearanceBinder.tsx`

---

## Phase 7: User Story 5 - Atomic Quota Accounting & Accurate Canonical Status Roll-Up (Priority: P2)

**Goal**: Enforce atomic Firestore transaction boundaries for live research quota balance (strictly bounding 25 calls) and ensure canonical entity status accurately rolls up worst-case status across all scene occurrences.

**Independent Test**: Execute 30 concurrent live research calls against a 25-call quota and verify exactly 25 succeed and 5 return 429. Verify an entity with one cleared occurrence and one unresolved occurrence displays `INSUFFICIENT_EVIDENCE` (never `NO_ISSUE_SURFACED`).

### Tests for User Story 5
- [X] T024 [P] [US5] Create contract test for atomic live quota deduction and concurrent boundary exhaustion in `tests/contract/test_atomic_quota_accounting.test.ts`
- [X] T025 [P] [US5] Create contract test for worst-case canonical status roll-up with unresolved occurrences in `tests/contract/test_canonical_rollup_integrity.test.ts`

### Implementation for User Story 5
- [X] T026 [US5] Implement atomic Firestore transaction quota deduction in `server/repositories/ProjectRepo.ts` -> `consumeLiveQuota`
- [X] T027 [US5] Update `server/repositories/EntityRepo.ts` -> `computeDerivedCanonicalStatus` to strictly roll up worst-case status across all scene occurrences, prohibiting `NO_ISSUE_SURFACED` if any active occurrence is non-cleared

---

## Phase 8: User Story 6 - Grounding Invalidation on Edits & Clean Draft Re-Upload Versioning (Priority: P2)

**Goal**: Invalidate grounding research caches immediately upon entity property edits, and cleanly replace scene hierarchies during screenplay re-uploads without creating duplicate scenes or orphaned actions.

**Independent Test**: Edit an entity canonical name and verify grounding cache is invalidated and fresh search is triggered. Re-upload a modified screenplay draft and verify existing scenes are replaced without duplicates.

### Tests for User Story 6
- [X] T028 [P] [US6] Create contract test for entity edit cache invalidation and screenplay draft replacement in `tests/contract/test_screenplay_versioning_lifecycle.test.ts`

### Implementation for User Story 6
- [X] T029 [US6] Implement cache invalidation and `groundingCacheVersion` increment on entity updates in `server/repositories/EntityRepo.ts` and `server/workflows/clearanceEvaluator.ts`
- [X] T030 [US6] Implement screenplay draft replacement transaction (scene purge, occurrence re-indexing, orphaned action cancellation) in `server/repositories/SceneRepo.ts` and `server/api/routes.ts`

---

## Phase 9: Polish, Cross-Cutting Concerns & Integration Verification

**Purpose**: End-to-end integration lifecycle test, documentation synchronization, and container build verification.

- [X] T031 [P] Create full end-to-end live runtime integrity integration test exercising upload, chunking, live research, replacement fail-closed, quota boundary, and draft re-upload in `tests/integration/test_live_runtime_integrity_workflow.test.ts`
- [X] T032 [P] Update `README.md` and `PROVENANCE.md` with Feature 019 runtime integrity architecture, multipart upload contract, and updated test suite metrics
- [X] T033 Execute full test suite (`npm test`) and multi-stage container build (`npm run build`) to verify 100% pass rate with 0 errors

---

## Phase 10: Convergence (Live Runtime & Real-Script Integrity Remediations)

**Purpose**: Remediate remaining gaps in fail-closed collision checks, server mode authority, Firestore persistence verification, endpoint auth, grounding invalidation, chunk overlap, and live-path test coverage.

- [X] T034 Enforce fail-closed collision checks in `server/agents/ReplacementAgent.ts` so exceptions and missing live AI in `CLOUD_MODE` return `INSUFFICIENT_EVIDENCE` and never fall through to demo knownCollisions auto-clear per FR-008 (contradicts)
- [X] T035 Enforce authoritative server `CLOUD_MODE` precedence for quota reservation and search grounding in `server/workflows/replacementGenerator.ts` preventing persisted project `DEMO_MODE` from bypassing quota per FR-004 (contradicts)
- [X] T036 Update `server/repositories/firestoreClient.ts` to strictly instantiate authentic Google Cloud Firestore via ADC in `CLOUD_MODE` and report disconnected if in-memory fallback is attempted per FR-005 (contradicts)
- [X] T037 Guard all mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) and live write routes in `server/middleware/authMiddleware.ts` and `server/middleware/demoAuthMiddleware.ts` when running in `CLOUD_MODE` per FR-006 (partial)
- [X] T038 Implement automatic `groundingCacheVersion` increment and grounding cache invalidation in `server/repositories/EntityRepo.ts` and `server/workflows/clearanceEvaluator.ts` on entity property updates per FR-013 (missing)
- [X] T039 Implement 1-scene overlap buffer in windowed chunk parsing within `server/agents/ScriptParserAgent.ts` per FR-003 (partial)
- [X] T040 Enforce fail-visible `PARSING_FAILED` exception in `server/agents/ScriptParserAgent.ts` when `!this.ai` in `CLOUD_MODE` without silent demo fallback per FR-004 (contradicts)
- [X] T041 Strengthen live-path contract and integration tests in `tests/contract/` and `tests/integration/` to verify server `CLOUD_MODE` authority, collision fail-closed, replacement readiness gating, grounding cache invalidation, and Firestore ADC persistence per SC-001, SC-002, SC-003 (partial)
- [X] T042 Standardize `server/repositories/AssessmentRepo.ts` paths to project-scoped subcollections only, removing legacy path dual-writes per FR-005 (partial)

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**.
- **User Story 1 (Phase 3)**: Depends on Phase 2. Delivers core MVP (native file upload & chunked parsing).
- **User Story 2 (Phase 4)**: Depends on Phase 2 & Phase 3. Enforces live parser authority.
- **User Story 3 (Phase 5)**: Depends on Phase 2. Enforces Firestore ADC & endpoint protection.
- **User Story 4 (Phase 6)**: Depends on Phase 2. Enforces fail-closed replacement readiness.
- **User Story 5 (Phase 7)**: Depends on Phase 2. Enforces atomic quota & canonical roll-up.
- **User Story 6 (Phase 8)**: Depends on Phase 2 & Phase 3. Enforces cache invalidation & draft versioning.
- **Polish (Phase 9)**: Depends on completion of all desired user stories.

---

## Parallel Execution Examples

### Parallel Testing & Foundation
```bash
# Launch Foundational tasks in parallel:
Task: "T005 Implement Firestore ADC initialization and health check in server/repositories/firestoreClient.ts"
Task: "T006 Enforce server CLOUD_MODE authority in server/config.ts"
Task: "T007 Enhance Bearer token route protection in server/middleware/authMiddleware.ts"

# Launch User Story 1 Contract Tests in parallel:
Task: "T008 Create contract test for multipart upload in tests/contract/test_file_upload_multipart.test.ts"
Task: "T009 Create contract test for chunked parsing in tests/contract/test_chunked_script_ingestion.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Focus)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1: Native file upload & chunked scene ingestion).
3. Validate User Story 1 independently with `.fountain` and `.pdf` files.
4. Incrementally deliver Phase 4 through Phase 8.
5. Finalize Phase 9 (Full Integration, Documentation, and Build Verification).
