# Technical Research: Feature 019 - Live Runtime and Real-Script Integrity

**Feature Branch**: `019-live-runtime-integrity`  
**Created**: 2026-08-21  
**Status**: Completed  
**Spec**: [spec.md](./spec.md)

---

## 1. Executive Research Summary

Feature 019 targets live production runtime integrity, real screenplay scale, storage hygiene, and fail-closed safety for ClearanceScout on Google Cloud Run. This research document resolves technical decisions across all 13 defect areas defined in the specification.

---

## 2. Technical Decisions & Research Matrix

### Decision 1: Native Multipart Screenplay Upload & Client UI File Picker
- **Chosen Approach**:
  - Implement a native React file picker component (`<input type="file" accept=".fountain,.txt,.pdf">`) supporting both button-triggered selection and drag-and-drop file upload.
  - Use `multer` (in-memory storage buffer, max 25MB) on the Express backend (`server/routes/scriptRoutes.ts` via `POST /api/projects/:id/script/upload`).
  - Extract text via native string parsing for Fountain/Plaintext and `pdf-parse` for PDF files.
  - Return structured JSON error codes on failure: `EMPTY_FILE`, `FILE_TOO_LARGE`, `UNSUPPORTED_FORMAT`, `PDF_EXTRACTION_FAILED`.
  - Render an alert banner in the UI displaying exact error diagnostic text if ingestion fails.
- **Rationale**: Production coordinators need to upload genuine studio screenplay files directly from their local workstation without converting to raw API JSON payloads. In-memory buffer processing in Cloud Run handles up to 25MB safely without requiring local disk mounts.
- **Alternatives Considered**:
  - *Direct Cloud Storage Signed URLs*: Adds infrastructure complexity, requires extra roundtrips, and complicates local test runners.
  - *JSON Base64 Payload Upload*: Suffers 33% payload expansion overhead and browser memory serialization overhead on 20MB PDFs.

---

### Decision 2: Chunked / Windowed Real-Script Parsing for Feature-Length Scripts
- **Chosen Approach**:
  - Implement a scene-windowed ingestion pipeline in `server/agents/ScriptParserAgent.ts`.
  - Break full-length screenplays into sequential chunks of 10–15 scenes (target ~4,000–6,000 tokens per chunk) with a 1-scene overlap buffer to preserve cross-boundary context.
  - Send structured scene chunk prompts to Gemini 3.6 Flash using `@google/genai` with strict JSON schema enforcement (`responseMimeType: 'application/json'`).
  - Merge and deduplicate extracted mentions into canonical entities across chunk boundaries, linking each mention to its exact scene number and script line number.
- **Rationale**: Feature-length screenplays (120+ pages, 30,000+ words) frequently exceed single-turn generation token limits or suffer from "lost in the middle" entity omission when sent in a single monolithic prompt.
- **Alternatives Considered**:
  - *Monolithic Single Request*: Fails or silently truncates on 100+ page scripts and risks model token timeouts.
  - *Scene-by-Scene Extraction ($N=1$)*: Generates 80–120 individual API requests per screenplay, causing rate limit throttling and losing multi-scene character/brand narrative context.

---

### Decision 3: Global Authoritative Server Execution Mode Precedence
- **Chosen Approach**:
  - Enforce that environment configuration `process.env.EXECUTION_MODE` is globally authoritative in `server/config.ts` and throughout all workflow engines (`clearanceEvaluator.ts`, `ScriptParserAgent.ts`, `parallelSearchTool.ts`, `replacementGenerator.ts`).
  - When `EXECUTION_MODE=CLOUD_MODE`, all parsers and evaluators strictly execute live Google Gemini and Parallel Search tools. Persisted project `executionMode: 'DEMO_MODE'` or client request headers are ignored.
  - In `CLOUD_MODE`, if the Gemini parser fails or is unparseable, `ScriptParserAgent` strictly returns a descriptive error (`PARSING_FAILED`), removing the legacy silent fallback to demo recognizers (`extractEntitiesFromTextFallback`).
- **Rationale**: In production Cloud Run runtime, silent fallback to synthetic demo fixtures or cached responses produces dangerous false clearances on real screenplays.
- **Alternatives Considered**:
  - *Client-driven Mode Header*: Allows untrusted client requests to force demo mode in production, masking real-world clearance risks.

---

### Decision 4: Google Cloud Run Firestore Persistence via ADC & Startup Fail-Closed Guard
- **Chosen Approach**:
  - In `server/repositories/firestoreClient.ts`, initialize the `@google-cloud/firestore` SDK using Google Application Default Credentials (ADC) whenever `GOOGLE_CLOUD_PROJECT` or `GCP_PROJECT` is configured, or in `CLOUD_MODE`.
  - Add an active startup connectivity check in `server/index.ts` and `GET /api/health` that verifies Firestore read/write capabilities.
  - If Firestore is unreachable in `CLOUD_MODE`, the health endpoint returns `503 Service Unavailable` with status `'UNHEALTHY'` and an error diagnostic, preventing Cloud Run traffic from routing to an un-persisted, volatile in-memory container.
- **Rationale**: Serverless Cloud Run containers frequently scale down to zero or migrate instances. In-memory storage causes catastrophic data loss of uploaded scripts and legal binder records.
- **Alternatives Considered**:
  - *Silent In-Memory Fallback in Production*: Loses all studio project data when instances restart, causing unpredictable data corruption for users.

---

### Decision 5: Protected Live Mutation Endpoints on Public Cloud Run
- **Chosen Approach**:
  - Maintain the authorization middleware `server/middleware/authMiddleware.ts` to protect all state-modifying endpoints:
    - Screenplay uploads (`POST /api/projects/:id/script/upload`, `POST /api/projects/:id/script`)
    - Research executions (`POST /api/projects/:id/clearance/batch`, `POST /api/projects/:id/entities/:entityId/research`)
    - Replacement generation (`POST /api/projects/:id/replacements/generate`, `POST /api/projects/:id/placeholders`)
    - Counsel overrides (`POST /api/projects/:id/overrides`)
    - Rights mutations (`POST /api/projects/:id/rights`)
    - Action sync (`POST /api/projects/:id/actions/sync`)
  - Require a valid Bearer token (`DEMO_ACCESS_TOKEN`) or authorized project session header.
  - Keep read-only health checks (`GET /api/health`), project discovery (`GET /api/projects`), and bundled demo script loading (`POST /api/projects/:id/script/demo`) public for judge evaluation.
- **Rationale**: Protects public Cloud Run deployments against unauthorized screenplay IP exfiltration, database tampering, and unmetered Gemini/Parallel billing abuse.
- **Alternatives Considered**:
  - *Completely Open Public Endpoints*: Exposes production Firestore and API keys to arbitrary unauthenticated Internet traffic.

---

### Decision 6: Fail-Closed Replacement Self-Clearance & Strict Scene Readiness
- **Chosen Approach**:
  - In `server/workflows/replacementGenerator.ts`, wrap the Gemini likelihood-of-confusion / trademark collision check in a strict fail-closed handler:
    - If the model throws an error, returns invalid JSON, or identifies a potential collision, the candidate is marked `TEMP_REJECTED` or `FAILED`.
    - It MUST NEVER auto-clear to `FINAL_CLEARED` or `TEMP_APPROVED`.
  - In `server/workflows/sceneReadinessEngine.ts`, update `isOccurrenceMitigated()`:
    - Placeholders in `FAILED` or `TEMP_REJECTED` status provide zero mitigation.
    - Scenes with unmitigated occurrences evaluate as `BLOCKER` and overall scene status is locked to `RED`.
- **Rationale**: A rejected or failed replacement mark provides no legal indemnification. Treating failed replacement attempts as shooting mitigations violates core clearance protocols.
- **Alternatives Considered**:
  - *Best-effort Warning Flag*: Marking the scene as `WORKING_CLEAR` with a warning would allow production to film infringing props.

---

### Decision 7: Atomic Live Quota Accounting
- **Chosen Approach**:
  - In `server/repositories/ProjectRepo.ts`, implement `consumeLiveQuota(projectId, requestedAmount)` using Firestore atomic transactions (`db.runTransaction()`).
  - Read `liveResearchQuotaAllocated` and `liveResearchQuotaConsumed`.
  - If `liveResearchQuotaConsumed + requestedAmount > liveResearchQuotaAllocated`, abort the transaction and return `{ success: false, remaining: 0, requested: requestedAmount }`.
  - For in-memory local test environments, protect the balance counter with an atomic lock/mutex.
- **Rationale**: Concurrent batch evaluation requests ($N=3$) can trigger race conditions that over-consume API budget beyond the 25-call limit.
- **Alternatives Considered**:
  - *Non-transactional Read-then-Write*: Vulnerable to concurrent race conditions that bypass quota limits.

---

### Decision 8: Screenplay Draft Replacement & Orphan Cleanup
- **Chosen Approach**:
  - In `server/repositories/SceneRepo.ts` and `EntityRepo.ts`, implement a clean draft replacement transaction for `POST /api/projects/:id/script/upload`:
    1. Soft-delete or purge existing scenes and occurrences associated with previous drafts of the project.
    2. Cancel orphaned action items linked to obsolete occurrences (`resolutionTrigger: 'SCRIPT_REVISION_SUPERSEDED'`).
    3. Re-index canonical entities: retain existing counsel overrides or contractual rights if the entity name still exists in the new draft, and clean up or archive orphaned entities that no longer appear in the script.
- **Rationale**: Uploading a revised screenplay draft must not concatenate scenes or duplicate scene numbers (e.g. creating two Scene 1s).
- **Alternatives Considered**:
  - *Append-Only Draft Log*: Confuses scene readiness state machines and inflates clearance binders with obsolete scenes.

---

### Decision 9: Comprehensive Canonical Status Roll-Up
- **Chosen Approach**:
  - In `server/repositories/EntityRepo.ts` -> `computeDerivedCanonicalStatus(projectId, entityId)`:
    - Collect all occurrences for the entity.
    - Hierarchy of severity:
      $$\text{Canonical Status} = \begin{cases} 
      \text{ACTION\_REQUIRED} & \text{if any occurrence is } \text{ACTION\_REQUIRED} \\
      \text{INSUFFICIENT\_EVIDENCE} & \text{if any occurrence is } \text{INSUFFICIENT\_EVIDENCE} \\
      \text{REVIEW\_RECOMMENDED} & \text{if any occurrence is } \text{REVIEW\_RECOMMENDED} \\
      \text{NO\_ISSUE\_SURFACED} & \text{iff ALL occurrences are } \text{NO\_ISSUE\_SURFACED} \\
      \text{INSUFFICIENT\_EVIDENCE} & \text{if zero occurrences exist and ungrounded}
      \end{cases}$$
    - If any occurrence has an active counsel override, that occurrence takes its overridden status.
- **Rationale**: Ensures the master Entity Registry never shows green (`NO_ISSUE_SURFACED`) if even one scene occurrence remains un-cleared or lacking evidence.
- **Alternatives Considered**:
  - *Majority Voting / Average Risk*: Masks severe copyright/trademark risks occurring in single critical scenes.

---

### Decision 10: Grounding Invalidation & Versioning on Entity Edits
- **Chosen Approach**:
  - Add `groundingCacheVersion: number` to `CanonicalEntityData`.
  - When `updateCanonicalEntity(projectId, entityId, patch)` modifies `canonicalName`, `entityCategory`, or `aliases`:
    - Increment `groundingCacheVersion`.
    - Invalidate in-memory `groundingCache` entries in `ClearanceEvaluator`.
    - Mark all existing assessments for that entity as `isStale: true`.
    - Trigger action dispatcher to sync new research requirements.
- **Rationale**: Modifying an entity's name (e.g. from a cleared mark to an infringing brand) must not reuse cached clearance citations from the previous name.
- **Alternatives Considered**:
  - *Manual Cache Purge Button*: Relies on human memory and risks stale research persisting silently.

---

### Decision 11: Firestore Subcollection Path Standardization & Contract Testing
- **Chosen Approach**:
  - Standardize all Firestore repository collection paths across the server:
    - Projects: `projects/{projectId}`
    - Scenes: `projects/{projectId}/scenes/{sceneId}`
    - Occurrences: `projects/{projectId}/scenes/{sceneId}/occurrences/{occurrenceId}`
    - Entities: `projects/{projectId}/entities/{entityId}`
    - Entity Assessments: `projects/{projectId}/entities/{entityId}/assessments/{assessmentId}`
    - Overrides: `projects/{projectId}/overrides/{overrideId}`
    - Rights: `projects/{projectId}/rights/{rightsId}`
    - Placeholders: `projects/{projectId}/placeholders/{placeholderId}`
    - Actions: `projects/{projectId}/actions/{actionId}`
  - Implement contract and integration tests exercising the entire HTTP REST and SSE API contract via Supertest to ensure end-to-end reliability.
- **Rationale**: Consistent subcollection hierarchies simplify Firestore security rules, enable clean cascading deletions, and prevent cross-project data contamination.
- **Alternatives Considered**:
  - *Root-Level Flat Collections with Project ID Fields*: Increases query complexity and complicates atomic multi-document transactions.

---

## 3. Implementation Verification Strategy

1. **Unit & Contract Tests**:
   - `test_file_upload_multipart.test.ts`: Tests native multipart uploads (.fountain, .txt, .pdf), size limits, and error diagnostics (`PDF_EXTRACTION_FAILED`).
   - `test_chunked_script_ingestion.test.ts`: Tests 120-page screenplay chunking, boundary preservation, and entity extraction integrity.
   - `test_cloud_runtime_authority.test.ts`: Tests server `CLOUD_MODE` precedence, rejection of demo fallbacks in live mode, and fail-closed collision checks.
   - `test_firestore_adc_persistence.test.ts`: Tests Firestore ADC initialization, startup fail-closed health check, and subcollection path standardization.
   - `test_atomic_quota_accounting.test.ts`: Tests concurrent 25-quota transactions with strict limit enforcement.
   - `test_canonical_rollup_integrity.test.ts`: Tests worst-case status roll-up with unresolved occurrences and grounding invalidation on edits.
2. **End-to-End Integration Suite**:
   - `test_live_runtime_integrity_workflow.test.ts`: Full end-to-end lifecycle test exercising upload, chunked extraction, live research, failed replacement rejection, atomic quota exhaustion, and draft re-upload.
