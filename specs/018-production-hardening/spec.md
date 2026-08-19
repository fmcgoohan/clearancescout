# Feature Specification: Production Hardening & Live Evidence Integrity

**Feature Branch**: `018-production-hardening`  
**Created**: 2026-08-20  
**Status**: Draft  
**Input**: User description: "018 Production Hardening and Live Evidence Integrity. Feature-complete product; this is a bounded correctness pass, not new capabilities. 1) CLOUD_MODE fail-closed: FALLBACK_FIXTURE or failed Parallel research must never independently yield NO_ISSUE_SURFACED, WORKING_CLEAR, or FINAL_CLEAR; result is INSUFFICIENT_EVIDENCE unless independently mitigated by applicable rights, counsel approval, or valid final replacement. Apply across occurrence eval, baseline research, retry, batch, and replacement self-clearance. 2) PARALLEL_LIVE zero relevant hits is completed live research, not failure; do not invent registration/owner facts. 3) CLOUD_MODE Gemini structured interpretation of actual occurrence context (tone, endorsement, prominence, foreground/background, dialogue vs visual, unsafe-product, defamatory implication); Gemini interprets, deterministic logic owns states. Reuse canonical research; reassess new occurrence context. 4) Placeholders scoped to one occurrence, selected occurrences, selected scenes, or explicit project-wide; default scoped not project-wide. TEMP_APPROVED/FINAL_CLEARED only affect covered occurrences. 5) WORKING_CLEAR requires affirmative interim basis (TEMP_APPROVED placeholder, temp rights, counsel authorization); REVIEW_RECOMMENDED alone is not WORKING_CLEAR. 6) PDF: genuine text extraction with visible failure, or remove PDF support from API, UI, README, and claims. 7) CLOUD_MODE sample load may create scenes/entities/occurrences but must not seed fixture assessments, synthetic rights/placeholders, or fixture readiness. Provenance PARALLEL_LIVE/DEMO_FIXTURE/FALLBACK_FIXTURE remains visible. 8) Verify parallel-web npm ci; no Parallel MCP claim unless code uses MCP; reconcile README with code. Preserve 003-017 architecture. Do not implement code."

---

## Executive Summary & Purpose

ClearanceScout is feature-complete across all 17 foundational capabilities (multi-format script parsing, trademark grounding, counsel review binders, candidate self-clearance loops, demo deployment, manual entity mutations, failed research retries, replacement comparisons, multi-dimension filters, deep binder jumps, bounded batch research, demo access tokens, record-replay fixtures, WCAG accessibility, project quotas, 10-phase production clearance operating model, and 1-click demo automation).

Feature 018 is a **bounded production hardening and evidence integrity pass**. It introduces no speculative features. Instead, it enforces strict legal correctness, fail-closed production cloud behavior, authentic live research semantics, granular placeholder scoping, deterministic scene readiness standards, genuine text extraction, and truthful architectural documentation.

---

## User Scenarios & Testing

### User Story 1 (Priority: P1) — Fail-Closed Cloud Evidence & Authentic Live Grounding

As a production legal counsel evaluating scripts in `CLOUD_MODE`, I want any failed search, missing credentials, or unmitigated fallback fixtures to fail closed as `INSUFFICIENT_EVIDENCE`, and I want genuine live research returning zero hits (`PARALLEL_LIVE`) to be recorded as completed live research without inventing fictitious trademark registrations, synthetic owners, or bogus classifications, and without independently assigning `NO_ISSUE_SURFACED` purely from absent trademark facts.

**Why this priority**: Prevents false clearances in live production and upholds the non-negotiable anti-hallucination invariant.

**Independent Test**:
- Execute research in `CLOUD_MODE` without credentials or during network outage: Verify that unmitigated entity status evaluates to `INSUFFICIENT_EVIDENCE` and scene readiness evaluates to `RED` (blocker).
- Execute live search in `CLOUD_MODE` on an entity returning zero relevant hits: Verify that search is recorded as completed live research (`PARALLEL_LIVE`), zero hits are cited without inventing registrations/owners, and status is determined by category and contextual review rather than assuming `NO_ISSUE_SURFACED` purely from absence of trademark hits.

**Acceptance Scenarios**:
1. **Given** `CLOUD_MODE` execution with missing search credentials or network failure, **When** evaluating an occurrence, baseline entity, batch item, or self-clearance candidate without signed overrides or rights agreements, **Then** the system assigns `INSUFFICIENT_EVIDENCE` and tags provenance as `FALLBACK_FIXTURE` (⚡), never granting unverified `NO_ISSUE_SURFACED`, `WORKING_CLEAR`, or `FINAL_CLEAR`.
2. **Given** `CLOUD_MODE` live search with valid credentials (`PARALLEL_LIVE`), **When** the Parallel Search API returns zero relevant trademark or litigation hits, **Then** the system records this as completed live research (not a service failure and not `FALLBACK_FIXTURE`), does NOT invent synthetic registrant names, serial numbers, or classifications, and does NOT independently assign `NO_ISSUE_SURFACED` purely from the absence of trademark records.
3. **Given** an entity in `INSUFFICIENT_EVIDENCE`, **When** legal counsel applies a signed counsel override, active rights agreement, or finalized replacement prop, **Then** the effective clearance status updates based on the affirmative legal mitigation while retaining the original research provenance.

---

### User Story 2 (Priority: P1) — Structured Contextual Occurrence Interpretation via Gemini

As a clearance supervisor, I want Gemini 3.6 Flash in `CLOUD_MODE` to semantically interpret the actual scene depiction context (prominence, dialogue vs visual, tone, endorsement implication, defamatory context, product safety) so that the deterministic clearance engine can assign mathematically objective risk verdicts based on nuanced dramatic usage.

**Why this priority**: Bridges the gap between raw trademark lookup and actual script context while strictly maintaining the division of labor between AI interpretation and deterministic state ownership.

**Independent Test**:
- Ingest a scene where a brand is used incidentally in the background versus a scene where the same brand is used dangerously or defamatorily: Verify that Gemini structures the contextual flags and the deterministic engine evaluates the scene occurrences with differing, appropriate clearance tiers.

**Acceptance Scenarios**:
1. **Given** a scene occurrence in `CLOUD_MODE`, **When** evaluating occurrence risk, **Then** Gemini 3.6 Flash extracts structured context attributes: `prominence` (`HERO_FOREGROUND` | `BACKGROUND_INCIDENTAL`), `modality` (`VISUAL_PROP` | `DIALOGUE_MENTION`), `tone` (`FAVORABLE` | `NEUTRAL` | `DISPARAGING`), `endorsementImplication` (`true` | `false`), and `safetyHazardDepiction` (`true` | `false`).
2. **Given** structured context attributes, **When** computing occurrence status, **Then** deterministic TypeScript rules evaluate defamation, trademark dilution, or publicity rights risks without letting the LLM directly mutate state machine flags.
3. **Given** multiple scene occurrences of the same canonical entity, **When** evaluating subsequent occurrences, **Then** the system reuses canonical trademark grounding research and evaluates only the new scene occurrence context.

---

### User Story 3 (Priority: P2) — Granular Placeholder Scoping & Strict Scene Readiness Semantics

As an art director or clearance coordinator, I want replacement prop placeholders to be scoped specifically to a single occurrence, selected occurrences, selected scenes, or explicitly project-wide (defaulting to scoped), and I want scene readiness to require affirmative interim mitigations before declaring a scene `WORKING_CLEAR`.

**Why this priority**: Prevents temporary art department prop approvals for one specific scene from erroneously clearing unrelated scenes across the entire screenplay, and ensures `REVIEW_RECOMMENDED` items are not prematurely treated as shooting-ready.

**Independent Test**:
- Create a `TEMP_APPROVED` placeholder scoped to Scene 1: Verify that Scene 1 transitions to `WORKING_CLEAR`, while Scene 4 with the same underlying brand mark remains a blocker (`RED`) until mitigated.
- Inspect a scene with unmitigated `REVIEW_RECOMMENDED` items: Verify that the scene status is `RED` (or `UNDER_REVIEW` blocker) rather than `WORKING_CLEAR` unless supported by an affirmative temporary approval or counsel authorization.

**Acceptance Scenarios**:
1. **Given** a new replacement placeholder creation, **When** specifying scope, **Then** the user can choose `SINGLE_OCCURRENCE`, `SELECTED_OCCURRENCES`, `SELECTED_SCENES`, or `PROJECT_WIDE` (defaulting to scoped `SINGLE_OCCURRENCE` or `SELECTED_SCENES`, not `PROJECT_WIDE`).
2. **Given** an active `TEMP_APPROVED` or `FINAL_CLEARED` placeholder, **When** calculating occurrence and scene readiness, **Then** only occurrences within the placeholder's explicit target scope receive `WORKING_CLEAR` or `FINAL_CLEAR`.
3. **Given** a scene containing unmitigated `REVIEW_RECOMMENDED` or `ACTION_REQUIRED` items without an active placeholder, rights agreement, or signed counsel override, **When** evaluating scene shooting readiness, **Then** the scene evaluates as `RED` (blocker) and cannot be marked `WORKING_CLEAR`.

---

### User Story 4 (Priority: P2) — Ingestion Extraction Integrity & Cloud Demo Boundaries

As a production delivery supervisor, I want script uploads (Fountain, Plaintext, PDF) to perform genuine, robust text extraction with visible failure diagnostics when unparseable, and I want `CLOUD_MODE` sample script loading to create clean un-evaluated script scenes without injecting fake pre-populated fixture data.

**Why this priority**: Upholds data integrity during real-world PDF script ingestion and preserves clear separation between deterministic offline demo datasets and live cloud operations.

**Independent Test**:
- Upload a valid PDF screenplay: Verify genuine text extraction and parsing into scenes.
- Upload an invalid or encrypted binary file: Verify clear, visible error feedback rather than silent corruption.
- Load sample script in `CLOUD_MODE`: Verify that scenes, entities, and occurrences are created in un-assessed state without synthetic fixture rights or fake evaluations.

**Acceptance Scenarios**:
1. **Given** a PDF screenplay upload (`POST /api/projects/:id/script`), **When** parsing the document, **Then** the system executes genuine PDF text extraction; if the file is scanned/unparseable, it fails visibly with a descriptive `400 Bad Request` explaining that text extraction failed.
2. **Given** `CLOUD_MODE` execution, **When** loading the sample screenplay (*"The Neon Horizon"*), **Then** the system creates scenes, entities, and occurrences, but does NOT inject synthetic fixture assessments, fake rights agreements, or pre-baked readiness scores.
3. **Given** any clearance record, **When** viewing the Entity Registry, Operations Dashboard, or Legal Clearance Binder, **Then** the provenance badge (`PARALLEL_LIVE` 🌐, `DEMO_FIXTURE` 📦, `FALLBACK_FIXTURE` ⚡) accurately reflects the real origin of the data.

---

### User Story 5 (Priority: P3) — Packaging Verification & Technical Claims Reconciliation

As an open-source contributor and evaluation auditor, I want `package.json`, `npm ci`, and documentation (`README.md`, `PROVENANCE.md`) to accurately document the `parallel-web` npm package and remove any un-implemented claims (such as Parallel MCP servers) so that the repository is 100% truthful and verifiable.

**Why this priority**: Ensures 100% truthful, audit-grade repository documentation and clean CI/CD execution.

**Independent Test**:
- Run `npm ci` and `npm run build`: Verify clean installation using `parallel-web`.
- Audit `README.md` and `PROVENANCE.md`: Verify that the search dependency is documented as `parallel-web` (not `@parallel-web/sdk`) and verify zero claims of "Parallel MCP" exist.

**Acceptance Scenarios**:
1. **Given** a clean clone, **When** executing `npm ci`, **Then** all packages including `parallel-web` and `@google/genai` install with zero unresolved peer dependency conflicts.
2. **Given** repository documentation (`README.md`, `PROVENANCE.md`), **When** auditing external integrations, **Then** the Parallel Search integration is truthfully documented as the `parallel-web` npm package used in Google ADK agent tools, with zero claims of MCP server usage unless an MCP server is actually implemented and used.

---

## Edge Cases

- **PDF with zero text layer (scanned images)**: System must reject the upload with a clear diagnostic message prompt suggesting OCR or Plaintext/Fountain format, rather than silently creating 0 scenes.
- **Occurrence evaluation during transient API outage in CLOUD_MODE**: Occurrence receives `INSUFFICIENT_EVIDENCE` with `FALLBACK_FIXTURE` provenance; scene is marked `RED` (blocker) and action queue dispatches a retry task to Legal Counsel.
- **Live Parallel Search rate limits (429 HTTP)**: Research tool emits a visible warning, assigns `INSUFFICIENT_EVIDENCE`, and increments failed quota counters without crashing.
- **Multiple placeholders on the same entity across different scenes**: Engine applies the most specific placeholder matching the occurrence's scene; if conflicting tiers exist, the more restrictive tier applies.
- **Rebranding & Invariants Consistency**: All 003–017 invariants (hierarchical status resolution, counsel override isolation, SHA-256 digests, WCAG accessibility, quota tracking) remain 100% active.

---

## Requirements

### Functional Requirements

- **FR-001**: In `CLOUD_MODE`, any search failure, missing API key, or `FALLBACK_FIXTURE` citation MUST evaluate to `INSUFFICIENT_EVIDENCE` and CANNOT independently produce `NO_ISSUE_SURFACED`, `WORKING_CLEAR`, or `FINAL_CLEAR`.
- **FR-002**: The fail-closed rule (FR-001) MUST apply across occurrence evaluation, baseline entity evaluation, single-item research retry, batch research, and replacement self-clearance.
- **FR-003**: In `CLOUD_MODE` with valid credentials (`PARALLEL_LIVE`), receiving zero relevant search hits MUST be recognized as completed live research (not a service failure and not `FALLBACK_FIXTURE`), and the system MUST NOT invent synthetic trademark registrants, serial numbers, or classifications, and MUST NOT independently assign `NO_ISSUE_SURFACED` purely from the absence of trademark records.
- **FR-004**: In `CLOUD_MODE`, Gemini 3.6 Flash MUST extract structured occurrence context (`prominence`, `modality`, `tone`, `endorsementImplication`, `safetyHazardDepiction`) from scene action text and dialogue.
- **FR-005**: Deterministic TypeScript code MUST own state transitions, risk thresholds, and status derivations from Gemini's structured context interpretations.
- **FR-006**: Subsequent occurrences of a previously researched canonical entity MUST reuse canonical trademark grounding citations while prompting Gemini to evaluate only the new occurrence scene context.
- **FR-007**: Replacement placeholders MUST support granular scoping: `occurrenceId`, `occurrenceIds`, `sceneIds`, or `isProjectWide` (defaulting to scoped, not project-wide).
- **FR-008**: Placeholder clearance tiers (`TEMP_APPROVED`, `FINAL_CLEARED`) MUST only affect occurrences within their designated scope.
- **FR-009**: Scene shooting readiness MUST require an affirmative interim mitigation basis (`TEMP_APPROVED` placeholder, temporary rights agreement, or signed counsel override) to evaluate as `WORKING_CLEAR`.
- **FR-010**: A scene containing unmitigated `REVIEW_RECOMMENDED` items without affirmative temporary authorization MUST evaluate as `RED` (blocker) and CANNOT evaluate as `WORKING_CLEAR`.
- **FR-011**: PDF screenplay uploads MUST use genuine PDF text extraction with visible failure diagnostics when unparseable.
- **FR-012**: In `CLOUD_MODE`, loading the sample screenplay MUST create scenes, entities, and occurrences in un-evaluated state without injecting synthetic fixture assessments, fake rights agreements, or pre-populated readiness scores.
- **FR-013**: Universal provenance badges (`PARALLEL_LIVE` 🌐, `DEMO_FIXTURE` 📦, `FALLBACK_FIXTURE` ⚡, `MIXED` 🔀) MUST remain visible across all entity cards, drawers, operations dashboards, and legal binders.
- **FR-014**: Repository configuration (`package.json`, `package-lock.json`) and documentation MUST document the live search dependency as `parallel-web`.
- **FR-015**: Repository documentation (`README.md`, `PROVENANCE.md`) MUST accurately describe the Parallel Search integration as the `parallel-web` npm package and MUST NOT claim MCP server integration unless MCP is actively implemented.
- **FR-016**: The system MUST preserve all architectural invariants established in Features 003 through 017.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: In `CLOUD_MODE`, 100% of failed external searches or missing-key evaluations evaluate to `INSUFFICIENT_EVIDENCE` and 0% produce unverified `FINAL_CLEAR` or `WORKING_CLEAR` states.
- **SC-002**: 100% of live `PARALLEL_LIVE` zero-hit searches record authentic completed research without generating fabricated registrant names or registration numbers and without bypassing legal review gating.
- **SC-003**: 100% of scene occurrences evaluated in `CLOUD_MODE` receive structured context interpretations from Gemini 3.6 Flash with zero raw model chain-of-thought logged or surfaced.
- **SC-004**: Placeholders scoped to a specific scene or occurrence affect 0% of occurrences outside their defined scope.
- **SC-005**: 100% of scenes evaluated as `WORKING_CLEAR` possess an explicit, auditable temporary mitigation record.
- **SC-006**: 100% of automated test suites pass (60+ test suites, 115+ tests) with zero regressions across contract, unit, and integration tests.

---

## Key Entities & Data Model

- **OccurrenceContext**: `prominence` (`HERO_FOREGROUND` | `BACKGROUND_INCIDENTAL`), `modality` (`VISUAL_PROP` | `DIALOGUE_MENTION`), `tone` (`FAVORABLE` | `NEUTRAL` | `DISPARAGING`), `endorsementImplication` (boolean), `safetyHazardDepiction` (boolean).
- **ReplacementPlaceholderData**: Enhanced with `scopeType` (`OCCURRENCE` | `SCENE` | `PROJECT_WIDE`), `occurrenceIds` (string[]), `sceneIds` (string[]), `isProjectWide` (boolean). Default is scoped.
- **SceneReadinessAssessment**: `status` (`FINAL_CLEAR` | `WORKING_CLEAR` | `RED`), where `WORKING_CLEAR` strictly requires an explicit `TEMP_APPROVED` placeholder, temporary rights agreement, or signed counsel override.

---

## Assumptions

- In `DEMO_MODE`, sample loading continues to use entrant-authored fictional benchmarks with explicit `DEMO_FIXTURE` (📦) provenance for frictionless judge review.
- In `CLOUD_MODE`, sample loading ingests *"The Neon Horizon"* text and discovers entities, but triggers live research only when explicitly requested by users with valid credentials.
- PDF parsing relies on standard, reliable text stream extraction with visible `400` error reporting for corrupt or image-only files.
- The npm dependency is `parallel-web` as specified in `package.json`.
