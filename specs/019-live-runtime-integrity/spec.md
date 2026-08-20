# Feature Specification: Feature 019 - Live Runtime and Real-Script Integrity

**Feature Branch**: `019-live-runtime-integrity`  
**Created**: 2026-08-21  
**Status**: Draft  
**Input**: User description: "019 Live Runtime and Real-Script Integrity. New bounded feature from real-user defects, not another 018 converge. Feature-complete product; this is live runtime integrity. P0: 1) real file-picker and multipart screenplay upload with visible errors so users can actually upload files. 2) CLOUD_MODE parser must not silently fall back to demo-only recognizer; real scripts must not succeed while missing most entities. 3) server CLOUD_MODE is authoritative everywhere; persisted project DEMO_MODE must not override live evaluator/parser. 4) Cloud Run must use real Firestore via ADC and fail visibly if unavailable, not volatile in-memory store. 5) protect uploaded project data and live-write endpoints on public Cloud Run. 6) failed replacement must not make scene WORKING_CLEAR. 7) Gemini collision failure must not auto-clear replacement (fail closed). P1: 8) correct atomic live quota accounting so 25 means 25. 9) robust/chunked real-script ingestion; do not send entire feature-length script in one Gemini request with silent truncate/fallback. 10) re-upload must replace/version screenplay not append/duplicate scenes. 11) canonical roll-up must include unresolved occurrences so registry cannot show clear while a scene remains unresolved. 12) invalidate/version grounding after edits; always use latest research; stale grounding must not resurrect. P2: 13) repair project-scoped assessment/replacement Firestore paths. Live-path integration tests must exercise production UI/API contract not only repo internals. Preserve 003-018 architecture. Do not implement code."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real Screenplay File-Picker & Resilient Chunked Ingestion (Priority: P1)

As a Production Clearance Coordinator or Legal Counsel,  
I want to select and upload real full-length screenplays (.fountain, .txt, .pdf) using a native file-picker or drag-and-drop interface with visible upload progress and descriptive error feedback,  
So that our production team can ingest authentic 120+ page scripts without silent truncation, token overflows, or failures being hidden from the user.

**Why this priority**: Real-world studio users cannot use the platform if file selection fails, if multi-page scripts are silently truncated, or if extraction errors fail to report why a document was rejected.

**Independent Test**: Upload a genuine 100+ page screenplay (.pdf and .fountain) via the native file upload dialog. The system parses the entire document using chunked/windowed passes, presents real-time progress, extracts all clearance mentions across all scenes, and displays descriptive validation errors if a file is malformed.

**Acceptance Scenarios**:
1. **Given** a clearance coordinator in the project workspace, **When** they click "Upload Screenplay" or drag a `.fountain`, `.txt`, or `.pdf` file into the upload zone, **Then** the file is transmitted via multipart upload, validated for size and type, and processed with observable progress.
2. **Given** a feature-length screenplay exceeding single-call token thresholds, **When** ingestion executes, **Then** the parser processes scenes in structured sequential chunks without truncating scenes, dropping dialogue/action blocks, or missing clearance entities.
3. **Given** an unreadable, corrupted, or scanned non-OCR PDF, **When** upload is attempted, **Then** the system visibly displays a descriptive error banner explaining why extraction failed (e.g. `PDF_EXTRACTION_FAILED`) and prompts for a text-based format.

---

### User Story 2 - Authoritative Server Runtime & Strict Live Extraction Integrity (Priority: P1)

As Studio Legal Counsel and Production Delivery Supervisors,  
I want the server's live cloud execution mode to be authoritative across all parsing and clearance workflows without silent demo fallbacks or project-level mode overrides,  
So that real production scripts evaluated on live Cloud Run infrastructure are guaranteed to run against live AI and trademark registries rather than returning synthetic demo fixtures.

**Why this priority**: Silent fallback to demo entities or cached mock data during production script review creates severe legal liability by giving false clearance confidence to filmmakers.

**Independent Test**: Configure the server in `CLOUD_MODE` and ingest an un-indexed real script containing custom brand mentions. Verify the system executes authentic AI extraction and Parallel Search queries, never reverts to synthetic demo entities, and fails visibly if external API credentials or services are unavailable.

**Acceptance Scenarios**:
1. **Given** a server running with `EXECUTION_MODE=CLOUD_MODE`, **When** any script is parsed or evaluated, **Then** the server strictly executes live Gemini extraction and live Parallel Search queries, ignoring any conflicting client headers or persisted project `DEMO_MODE` flags.
2. **Given** a live AI extraction request that encounters an API rate limit or outage, **When** the parsing pipeline fails, **Then** the system returns a visible error response (`PARSING_FAILED`) rather than silently falling back to synthetic demo recognizers or partial demo lists.
3. **Given** a real screenplay containing novel brand names, **When** live parsing completes, **Then** all detected entities reflect actual textual mentions from the uploaded draft rather than predefined benchmark demo fixtures.

---

### User Story 3 - Cloud Run Managed Persistence & Public Endpoint Security (Priority: P1)

As a Production Security Lead and Studio Administrator,  
I want production projects and script clearances hosted on Google Cloud Run to persist in Google Cloud Firestore via Application Default Credentials (ADC) and require authorization for data modification,  
So that uploaded screenplay intellectual property and clearance binder decisions persist across container lifecycles and are protected against unauthorized modification or data leaks on public endpoints.

**Why this priority**: Production legal binders and studio scripts must never be lost due to serverless container recycling, and proprietary screenplay data must not be exposed or modified by unauthenticated public actors.

**Independent Test**: Deploy the application to Cloud Run with Firestore ADC. Ingest a script, restart the container revision, and verify all projects, scenes, entities, rights, and binders remain intact. Verify that unauthenticated requests to live-write and AI execution endpoints are rejected with `401 Unauthorized`.

**Acceptance Scenarios**:
1. **Given** an active Cloud Run deployment in `CLOUD_MODE`, **When** the backend initializes, **Then** it connects to Google Cloud Firestore via ADC and fails health checks visibly if Firestore is unreachable or credentials are misconfigured (never silently degrading to volatile in-memory storage).
2. **Given** a public Cloud Run service, **When** requests attempt to upload scripts, trigger AI batch research, generate replacements, record counsel overrides, or mutate rights, **Then** requests must present a valid authorization token or project access key.
3. **Given** a project created in Cloud Run, **When** container instances scale down to zero and scale back up, **Then** all project data, scene occurrences, counsel overrides, and binder hashes remain fully retrievable from Firestore.

---

### User Story 4 - Fail-Closed Self-Clearance & Strict Scene Readiness (Priority: P1)

As Production Legal Counsel,  
I want replacement generator collisions and verification failures to fail closed, and I want failed replacements to be excluded from interim scene mitigations,  
So that a scene containing a rejected or unverified prop placeholder remains flagged as a `RED` blocker until affirmatively cleared or mitigated.

**Why this priority**: Under entertainment clearance standards, a failed or rejected replacement prop provides zero legal protection. Treating failed replacements as mitigations would allow cleared production to shoot infringing assets.

**Independent Test**: Trigger replacement generation for a conflicted brand mark where the collision check encounters an API error or finds an active trademark collision. Verify the replacement is marked `TEMP_REJECTED` / `FAILED`, does not grant `WORKING_CLEAR` status to the scene, and leaves the scene in `RED` blocker status.

**Acceptance Scenarios**:
1. **Given** an automated replacement self-clearance verification loop, **When** the collision check fails due to an external model error or surfaces an active conflicting mark, **Then** the system marks the candidate `TEMP_REJECTED` or `FAILED` (failing closed, never auto-clearing).
2. **Given** a scene containing an occurrence with a placeholder in `FAILED` or `TEMP_REJECTED` status, **When** scene shooting readiness is computed, **Then** the item is evaluated as a `BLOCKER` and the scene evaluates to `RED`.
3. **Given** a scene with a failed placeholder, **When** legal counsel inspects the Operations Dashboard and Legal Binder, **Then** the scene is clearly displayed under Active Blockers with an open `ART_DEPT_REPLACEMENT` action item.

---

### User Story 5 - Atomic Quota Accounting & Accurate Canonical Status Roll-Up (Priority: P2)

As a Production Executive and Clearance Coordinator,  
I want live research quota deductions to be strictly atomic and the canonical entity registry to accurately roll up all scene occurrences (including unresolved items),  
So that quota limits are enforced with exact precision and the entity registry never falsely displays an entity as cleared while an unresolved scene occurrence remains.

**Why this priority**: Financial quota runaway causes unexpected billing, while an entity registry showing "Cleared" for an item that has un-cleared scene occurrences misleads department heads into shooting un-cleared props.

**Independent Test**: Issue 30 concurrent research requests against a project with a 25-call quota limit; verify that exactly 25 succeed and 5 fail with `429 Quota Exceeded`. Evaluate an entity with one `NO_ISSUE_SURFACED` occurrence and one `INSUFFICIENT_EVIDENCE` occurrence; verify canonical status is `INSUFFICIENT_EVIDENCE` (never `NO_ISSUE_SURFACED`).

**Acceptance Scenarios**:
1. **Given** a project with a remaining live quota balance of $N$, **When** concurrent research queries are executed across batch workflows, **Then** quota is reserved and deducted atomically in persistent state such that exactly $N$ live queries are permitted.
2. **Given** a canonical entity referenced across multiple scenes, **When** one occurrence is cleared but another occurrence is `INSUFFICIENT_EVIDENCE` or `ACTION_REQUIRED`, **Then** the canonical entity's overall status rolls up to the most severe status (`ACTION_REQUIRED` or `INSUFFICIENT_EVIDENCE`).
3. **Given** a canonical entity, **When** it has any un-cleared or un-assessed occurrence in any scene, **Then** the canonical registry must NOT show `NO_ISSUE_SURFACED`.

---

### User Story 6 - Grounding Invalidation on Edits & Clean Draft Re-Upload Versioning (Priority: P2)

As a Clearance Coordinator and Script Supervisor,  
I want entity modifications to invalidate stale research cache immediately and script re-uploads to replace or version scenes cleanly without creating duplicate scenes or orphaned occurrences,  
So that clearance binder records always reflect the active script draft and current legal research facts.

**Why this priority**: Renaming an entity or modifying a character's usage context must not retain stale trademark search results from the old name, and uploading "Draft 2" must not duplicate scenes 1–10.

**Independent Test**: Edit an entity canonical name from "Summit Cola" to "Aero Cola"; verify grounding cache is invalidated and a fresh search is required. Upload a revised screenplay draft for an existing project; verify existing scenes are cleanly superseded and scene count matches the new draft exactly without duplicates.

**Acceptance Scenarios**:
1. **Given** an existing canonical entity with completed research, **When** a user edits the entity's canonical name, category, or description, **Then** all previous grounding cache and occurrence risk assessments for that entity are invalidated and flagged for re-evaluation.
2. **Given** an existing project with scenes from Draft 1, **When** the user uploads Draft 2 for the same project, **Then** the system replaces or versions the scene hierarchy, recalculates entity occurrence mappings, and removes orphaned references.
3. **Given** an updated entity or re-uploaded draft, **When** subsequent clearance evaluations run, **Then** the evaluator executes fresh grounding research against the revised entity metadata.

---

## Edge Cases

- **Large Script Chunking Boundaries**: What happens when an entity mention or dialogue exchange spans across a scene chunk boundary? The chunking algorithm MUST preserve scene boundary integrity and overlap contextual window buffers so mentions at boundaries are never missed or split into nonsense fragments.
- **Intermittent Firestore ADC Failures in Cloud Run**: What happens if Firestore experiences transient connection latency during container scale-up? The repository layer MUST implement exponential backoff retry for transient network errors and fail visibly if unrecoverable, logging structured diagnostics without data corruption.
- **Multipart Upload Edge Failures**: What happens when a user uploads a zero-byte file, an executable disguised as `.txt`, or a password-protected PDF? The upload middleware MUST validate MIME headers and payload buffers, immediately rejecting invalid files with an explicit HTTP 400 and user-friendly error message.
- **Concurrent Quota Depletion**: What happens when multiple clearance coordinators trigger batch research simultaneously on the same project when only 2 quota calls remain? Atomic reservation guarantees only the first 2 calls proceed to external APIs while remaining calls immediately return `429 Quota Exceeded` with retry recommendations.
- **Orphaned Actions on Entity Re-Upload**: What happens to open action items when an entity is removed in a revised script draft? Obsolete occurrence-linked action items MUST be transitioned to `CANCELLED` with resolution trigger `SCRIPT_REVISION_REMOVED`.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a native UI file picker and drag-and-drop file upload component supporting `.fountain`, `.txt`, and `.pdf` screenplay files with real-time upload progress and client-side format validation.
- **FR-002**: System MUST implement a secure multipart/form-data upload endpoint that validates file size ($\le 25\text{MB}$), MIME type, and text extractability, returning structured error diagnostics (e.g. `PDF_EXTRACTION_FAILED`, `FILE_TOO_LARGE`, `EMPTY_FILE`) on failure.
- **FR-003**: System MUST execute full-length screenplay ingestion using robust, chunked scene-windowed processing with overlap buffers to prevent token exhaustion, payload truncation, or missed entities on large scripts ($\ge 100$ pages).
- **FR-004**: System MUST strictly enforce server `EXECUTION_MODE=CLOUD_MODE` as authoritative over all ingestion, evaluation, and search workflows, ignoring any persisted project `DEMO_MODE` flags or client-provided mock headers when deployed in production runtime.
- **FR-005**: In `CLOUD_MODE`, the screenplay parser MUST execute authentic Gemini-powered entity extraction and MUST NOT silently fall back to synthetic demo entity lists or fixture recognizers; parsing failures MUST fail visibly with descriptive error codes.
- **FR-006**: When running in `CLOUD_MODE` on Google Cloud Run, the system MUST connect to Google Cloud Firestore via Application Default Credentials (ADC) and MUST fail visibly during startup/health checks if Firestore is unavailable (silent degradation to in-memory storage is strictly prohibited).
- **FR-007**: System MUST protect project mutation, AI parsing, batch evaluation, replacement generation, and counsel override endpoints on public deployments using authorization token validation or project access keys.
- **FR-008**: System MUST enforce that failed replacement candidates (`TEMP_REJECTED` or `FAILED` self-clearance verification) do NOT grant interim mitigation status; scene readiness MUST evaluate occurrences with failed replacements as `BLOCKER` and mark the scene `RED`.
- **FR-009**: Automated replacement self-clearance verification MUST fail closed: any exception, model failure, or active trademark collision during candidate verification MUST assign `TEMP_REJECTED` or `FAILED`, never `FINAL_CLEARED`.
- **FR-010**: System MUST enforce atomic reservation and deduction for project live research quotas in persistent storage, ensuring project quota limits (e.g. 25 calls) strictly bound external API usage across concurrent requests.
- **FR-011**: Screenplay re-upload workflows MUST cleanly version or replace existing scenes, occurrence mappings, and orphaned clearance action items rather than appending duplicate scenes or accumulating ghost entities.
- **FR-012**: Canonical entity clearance status roll-up MUST evaluate all associated scene occurrences, strictly prohibiting an overall status of `NO_ISSUE_SURFACED` if any active scene occurrence remains `ACTION_REQUIRED`, `REVIEW_RECOMMENDED`, or `INSUFFICIENT_EVIDENCE`.
- **FR-013**: Editing canonical entity metadata (name, category, description) MUST immediately invalidate cached grounding search results and associated occurrence risk assessments, enforcing fresh research on subsequent clearance runs.
- **FR-014**: System MUST standardize project-scoped Firestore subcollection paths (e.g. `projects/{projectId}/entities/{entityId}/assessments`, `projects/{projectId}/placeholders`, `projects/{projectId}/actions`) and provide comprehensive live-path contract and integration tests exercising the complete public API and UI contract.

---

### Key Entities *(include if feature involves data)*

- **Screenplay Upload Package**: Represents an uploaded screenplay file package containing the raw binary buffer, extracted plaintext, file format (`FOUNTAIN`, `TEXT`, `PDF`), page count, character count, and draft version identifier.
- **Ingestion Chunk Job**: Represents a windowed chunk of scenes processed during multi-pass ingestion, tracking chunk index, scene range, token count, extraction status, and extracted candidate entities.
- **Canonical Entity Registry Record**: The central source of truth for an intellectual property or brand mark, maintaining canonical name, aliases, category, hierarchy relations, active grounding cache version, and derived overall status.
- **Scene Entity Occurrence Record**: An isolated, contextual instance of an entity in a specific scene, capturing excerpt text, script line number, dialogue sentiment, prominence, clearance status, risk score, and assigned mitigation references.
- **Live Research Quota Ledger**: Persistent atomic counter tracking allocated quota, consumed live searches, reserved concurrent calls, and expiration timestamps per project.
- **Replacement Placeholder Record**: Fictional replacement asset containing candidate mark, era aesthetic, generation attempt history, self-clearance verification outcome (`TEMP_APPROVED`, `FINAL_CLEARED`, `TEMP_REJECTED`, `FAILED`), and scoping rules.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **100% Native File Upload Success**: Users can select and upload authentic `.fountain`, `.txt`, and `.pdf` files up to 25MB via native UI controls with zero silent failures and 100% visible error reporting for invalid files.
- **SC-002**: **Full Script Ingestion Completeness**: Feature-length screenplays of 120+ pages (30,000+ words) ingest completely across chunked passes with 0% silent scene truncation and 100% scene extraction parity.
- **SC-003**: **Zero Silent Demo Fallbacks in Cloud Mode**: When running in production `CLOUD_MODE`, 100% of parsed scripts and evaluated items use live model and search endpoints, with 0% synthetic demo entity leakage.
- **SC-004**: **100% Fail-Closed Safety on Replacements & Readiness**: 0% of failed replacement generation attempts grant `WORKING_CLEAR` scene status, and 100% of unmitigated risk occurrences block scene shooting readiness as `RED`.
- **SC-005**: **Strict Atomic Quota Precision**: Live quota consumption across concurrent requests exhibits 0% overage beyond the allocated project quota limit ($N/N$ exact boundary).
- **SC-006**: **Complete Canonical Registry Accuracy**: 100% of canonical entity statuses accurately reflect the worst-case status across all associated scene occurrences, with 0 false `NO_ISSUE_SURFACED` roll-ups on unresolved items.

---

## Assumptions

- **Cloud Run Environment Configuration**: Google Cloud Run instances deployed in `CLOUD_MODE` have access to Firestore via ADC (`GOOGLE_CLOUD_PROJECT=clearance-scout-2026`) and secret manager keys for `GEMINI_API_KEY` and `PARALLEL_WEB_API_KEY`.
- **Supported Screenplay Formats**: Standard industry screenplay formats (Final Draft exported Fountain/PDF, text scripts with standard sluglines like `INT. / EXT.`) are supported; scanned non-OCR PDFs will fail gracefully with guidance to supply text.
- **Chunk Sizing**: A scene-window chunk size of ~10–15 scenes (or ~4,000–6,000 tokens) provides an optimal balance between context preservation, entity extraction quality, and Gemini rate limit stability.
- **Authentication**: On public Cloud Run instances, API write endpoints are gated by the configured shared demo access token or project-level authorization headers.
