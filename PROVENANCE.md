# Development Provenance Log: ClearanceScout

**Repository**: `fmcgoohan/clearancescout`  
**License**: MIT  
**Date Established**: August 2026  
**Status**: Active Production Reference  
**Verified Test Baseline**: 156 Tests Passing across 74 Suites (100% Pass Rate)

---

## 1. Executive Summary & Development Philosophy

ClearanceScout was engineered to solve one of the entertainment industry's most costly, manual, and legally hazardous workflows: **production script clearance, trademark risk assessment, and legal delivery binder management**. The architecture was built from the ground up to embody three fundamental engineering values:

1. **Deterministic Rigor over LLM Fluff**: AI is used strictly for semantic comprehension, contextual spotting, and creative replacement generation. All mathematical metrics, scene readiness states, expiration day deltas, override precedence hierarchies, retry attempt limits, and binder integrity digests are computed deterministically in TypeScript.
2. **Grounded Provenance over Hallucination**: No clearance risk verdict or trademark assertion is ever fabricated. Every finding is anchored to authentic external registry queries via the Parallel Search API (`parallel-web`) with explicit provenance tracking (`PARALLEL_LIVE` 🌐, `DEMO_FIXTURE` 📦, `FALLBACK_FIXTURE` ⚡, `MIXED` 🔀).
3. **Chain-of-Thought Privacy & Human-in-the-Loop Governance**: While the platform maintains an Observable Action Timeline via Server-Sent Events, raw internal reasoning is never leaked. Production legal counsel retains authoritative override control at both global and scene-specific granularities.

---

## 2. Technical Stack & Tooling Provenance

| Component | Technology | Version | Justification |
|:---|:---|:---:|:---|
| **Core Reasoning Agent** | Google `@google/genai` (`gemini-3.6-flash`) | `0.1.2` | Rapid semantic document understanding, multi-format script parsing, occurrence context extraction, and risk evaluation. |
| **Concept Artwork Generator** | Google Imagen 3 / Gemini Image Generation | Latest | Generates era-authentic visual packaging and prop cards for cleared replacement marks. |
| **Trademark Grounding Search** | Parallel Web SDK (`parallel-web`) | `^1.3.0` | Live, authoritative search across global USPTO, WIPO, and commercial brand registries (direct SDK integration, no MCP required). |
| **Backend API & Event Broker** | Node.js / Express / TypeScript | `4.21.2` | High-throughput REST API with real-time SSE execution event streaming. |
| **Frontend Workspace** | React 18 / Vite 5 / Vanilla CSS Design System | `18.3.1` | Responsive, accessible studio interface with script viewer, entity registry, and timeline drawer. |
| **State Persistence** | Google Cloud Firestore | Latest | Cloud persistence with local in-memory fallback for deterministic test suites. |
| **Testing & CI/CD** | Vitest / Supertest | `1.6.1` | Unit, contract, and integration test execution with 100% automated regression verification. |
| **Containerization** | Google Cloud Run / Docker | Multi-stage | Single unified serverless container hosting API endpoints and built static SPA bundle. |

---

## 3. Complete Architectural Progression & Feature History (001–019)

```mermaid
timeline
    title ClearanceScout Architecture Evolution
    001 Workspace Foundation : Multi-Format Parser : 5-Category Registry : Script Viewer UI
    002 Grounded MVP : Parallel Search Tooling : Deterministic Math : Real-Time Action Timeline
    003 Counsel Review : Authoritative Overrides : Scene Isolation : SHA-256 Binder Digest
    004 Self-Clearance Loop : Closed-Loop Verification : Negative Constraints : 3-Attempt Limit
    005 Judge-Ready Deployment : Fictional Demo Screenplay : Health Endpoint : Cloud Run Docker
    006 Manual Item Management : Manual Item Addition : Assessment Invalidation : Clean Deletion
    007 Single-Item Retry : Granular Failed Research Retry : Sibling Result Isolation
    008 Comparison Tool : Side-by-Side Original vs Replacement : Era Styling : Printable View
    009 Registry Filters : Status/Category/Scene Filtering : Empty State Recovery
    010 Deep Binder Jump : Jump to Evidence Drawer : Jump to Observable Action Timeline
    011 Batch Research : Bounded Concurrency (N=3) : SSE Progress : Fail-Visible Isolation
    012 Demo Access Token : Bearer Token Auth : Modal Configuration : Public Endpoint Exemptions
    013 Replay Fixtures : Deterministic Snapshot Fixtures : Cloud Isolation : Universal Badging
    014 Accessible UI : WCAG 2.1 AA : Keyboard Navigation : Focus Rings : Mobile Stacking
    015 Quota Management : Project Live Quotas : Header Counter : Fail-Visible 429 Guards
    016 Production Operating Model : Project Types : Occurrence Unit : Entity Aliases : Rights Catalog : Scene Readiness : Action Queues : Placeholders : Live Self-Clearance : Dashboard : Extended Binder
    017 Judge-Ready Demo : 1-Click Ingest & Auto-Eval : Populated Dashboard & Binder : Production Workspace Rebrand
    018 Production Hardening : Fail-Closed CLOUD_MODE : Structured Search Outcomes : Scoped Placeholders : RETRY_RESEARCH
    019 Live Runtime Integrity : Multipart File Upload : Windowed Chunk Parsing : Server CLOUD_MODE Precedence : Firestore ADC : Atomic 25-Call Quota : Draft Versioning
```

### Feature 001: Script Workspace & Canonical Entity Registry
- Established `server/` backend isolation standard.
- Implemented multi-format screenplay ingestion (`.fountain`, `.txt`, `.pdf`) and 5-category clearance categorization (`BRAND`, `ART_MUSIC`, `PUBLIC_FIGURE`, `PROPRIETARY_LOCATION`, `GRAPHIC_PROP`).
- Implemented *"Clear once, recognize everywhere"* canonical entity deduplication.

### Feature 002: Live Grounded Research & Observable Action Timeline
- Integrated the official `parallel-web` npm SDK (`^1.3.0`) directly in TypeScript (no MCP server required) as the primary live web and trademark research tool.
- Established 3-tier execution mode architecture: `TEST_MODE` (offline mocks), `DEMO_MODE` (deterministic fixtures), `CLOUD_MODE` (live cloud APIs with fail-visible outage handling).
- Implemented Server-Sent Events (SSE) `timelineEmitter` with strict chain-of-thought privacy sanitization.

### Feature 003: Authoritative Counsel Review & Auditable Clearance Binder
- Designed scene-specific override isolation, ensuring overrides applied to a specific scene do not alter canonical entity baselines.
- Implemented hierarchical status resolution: $\text{Effective Status} = \text{Scene Override} \;\;??\;\; \text{Canonical Override} \;\;??\;\; \text{Automated Baseline}$.
- Implemented clearance binder compilation with SHA-256 cryptographic integrity digest and mixed-evidence provenance tallies.

### Feature 004: Autonomous Candidate Self-Clearance Loop
- Created closed-loop replacement candidate clearance verification engine (`replacementGenerator.ts`).
- Enforced deterministic acceptance rule: Candidates accepted iff grounded research returns `NO_ISSUE_SURFACED`.
- Implemented negative prompt constraint accumulation across retry attempts.
- Enforced a deterministic maximum attempt ceiling of 3 attempts with transparent escalation to studio counsel.

### Feature 005: Judge-Ready Demo, Documentation & Cloud Run Deployment
- Authored the bundled entrant-created fully fictional demo screenplay ("The Neon Horizon") with 1-click workspace loading.
- Implemented secret-masked container health checking (`GET /api/health`).
- Created multi-stage `Dockerfile` and single-service Cloud Run deployment configuration.

### Feature 006: Manual Item Addition, Editing & Deletion
- Enabled manual creation of custom clearance items with category and scene mapping.
- Implemented item property edits with automatic invalidation of stale research assessments.
- Enabled clean deletion with cascading occurrence cleanup.

### Feature 007: Single-Item Failed Research Retry
- Built granular retry mechanism for individual items returning `INSUFFICIENT_EVIDENCE` or failed search.
- Isolated retry executions to preserve successful sibling results without expensive whole-script re-evaluations.

### Feature 008: Side-by-Side Original & Replacement Comparison
- Created comparative view pairing original scripted entities with approved fictional replacement prop cards.
- Surfaces risk rationales, Parallel Search evidence, attempt history, and era aesthetic styling in modals and printable binders.

### Feature 009: Multi-Dimension Workspace Registry Filters
- Added client and API filtering across Clearance Status, Entity Category, and Scene Number.
- Provided empty-state recovery banner with 1-click filter reset.

### Feature 010: Read-Only Binder Jump to Evidence & Timeline
- Built deep navigation links from the Legal Clearance Binder to the Citation Drawer (with live URLs) and Observable Action Timeline (with entity context filters).

### Feature 011: Bounded Concurrency Batch Research
- Implemented bounded concurrency ($N=3$) research pipeline to prevent rate limit throttling on large scripts.
- Broadcast real-time per-item progress via SSE timeline events with fail-visible network error isolation.

### Feature 012: Configurable Shared Demo Access Token
- Implemented Bearer token authorization for live AI model invocations and Parallel Search executions.
- Added public route exemptions for container health checks, project listings, and bundled fixtures with an in-app token management modal.

### Feature 013: Record-Replay Fixtures & Universal Provenance Badging
- Captured deterministic snapshot fixtures for 100% offline replay.
- Enforced mode-locked cloud isolation: `CLOUD_MODE` strictly requires live credentials and never falls back silently.
- Displayed universal provenance badges (`PARALLEL_LIVE` 🌐, `DEMO_FIXTURE` 📦, `FALLBACK_FIXTURE` ⚡, `MIXED` 🔀) across cards, drawers, and binder exports.

### Feature 014: Accessible, Responsive Studio Design
- Enforced WCAG 2.1 AA compliance with full keyboard navigation (`Tab`, `Enter`, `Escape`), high-contrast focus rings, touch targets ($\ge 44\text{px}$), and responsive mobile stacking.

### Feature 015: Per-Project Live Research Quota Tracking
- Implemented project-scoped live research quotas to prevent runaway API billing.
- Added header indicator showing real-time quota usage and fail-visible `429 Quota Exceeded` HTTP responses.

### Feature 016: Production Clearance Operating Model (10 Ordered Phases)
- **Phase 1 (Project Types)**: `Movie`, `TV Show`, `Commercial` categorization with multi-project switching and dedicated landing workspace.
- **Phase 2 (Occurrence Unit)**: Evaluates scene action context (dialogue sentiment, background vs foreground depiction) per occurrence; canonical status is a derived roll-up.
- **Phase 3 (Entity Resolution)**: Disambiguates brand aliases, product lines, and parent/subsidiary corporate hierarchies with material equivalence tracking.
- **Phase 4 (Rights Catalog)**: First-class domain records for contractual licenses (`grantType`, `territory`, `mediaWindow`, `effectiveDate`, `expirationDate`, `isPerpetual`, `covenants`).
- **Phase 5 (Scene Readiness)**: Deterministic mathematical state machine evaluating scenes as `RED`, `WORKING CLEAR`, or `FINAL CLEAR`.
- **Phase 6 (Action Queues)**: Automated department task routing to `Art Dept`, `Legal Counsel`, `Locations`, and `Production Mgmt` upon clearance state transitions.
- **Phase 7 (Placeholders)**: Generalized replacement lifecycle across brands, music, artworks, dialogue, and props managing on-set `TEMP_APPROVED` vs post-production `FINAL_CLEARED` tiers.
- **Phase 8 (Live Self-Clearance)**: Evidence-driven candidate self-clearance grounded in live Parallel Search results with negative prompt constraints and $\le 3$ loop ceiling.
- **Phase 9 (Operations Dashboard)**: Executive operational cockpit surfacing active shooting blockers, expiring rights ($\le 90$ days), active placeholders, scene readiness breakdown, and department queues with 1-click mitigation shortcuts.
- **Phase 10 (Extended Legal Binder)**: Comprehensive legal delivery binder compiling multi-domain clearance dossiers with verifiable 64-character SHA-256 cryptographic integrity digest and instant JSON, Markdown, and print-ready PDF export formats.

### Feature 017: Judge-Ready 1-Click Demo & Production Workspace Rebrand
- **1-Click Demo Automation Workflow (`demoAutomationWorkflow.ts`)**: Loads the bundled entrant-authored screenplay (*"The Neon Horizon"*), resolves all entities across 10 scenes, batch executes fixture-backed clearance evaluations with `DEMO_FIXTURE` (📦) provenance, attaches sample rights (`Summit Beverage Group LLC`), creates sample prop placeholders (`NovaTech Zenith`), and computes scene shooting readiness without requiring external API keys.
- **Populated Operations Dashboard & Extended Legal Binder**: Immediately populates executive KPIs, Shoot Readiness %, scene readiness distribution (`FINAL CLEAR`, `WORKING CLEAR`, `RED`), active blockers, upcoming rights expirations, active placeholders, department work queues, and verifiable 64-character SHA-256 integrity seal upon sample load.
- **Production Workspace Rebranding**: Rebranded all user-facing interface copy from "MVP Workspace" / "ClearanceScout MVP" to "ClearanceScout Production Clearance Workspace" / "Production Clearance Studio".

### Feature 018: Production Hardening & Live Evidence Integrity
- **`CLOUD_MODE` Fail-Closed Evidence Invariant**: Unmitigated fallback fixtures, search provider failures, or missing credentials in production runtime strictly fail closed to `INSUFFICIENT_EVIDENCE` ($riskScore \ge 80$), evaluating scenes as `RED` blockers unless affirmatively mitigated by active contractual rights, signed counsel approval, or an approved scoped replacement.
- **Explicit Structured Search Outcomes**: `ParallelSearchTool` returns structured `searchOutcome` metadata (`ZERO_RESULTS` | `MATCHES_FOUND` | `SERVICE_FALLBACK`) via direct `parallel-web` (`^1.3.0`) SDK integration (no MCP required), isolating citation-prose string matching to a legacy compatibility fallback.
- **Zero-Hit `PARALLEL_LIVE` Precision**: Live searches returning zero conflicting marks are recorded as authentic `PARALLEL_LIVE` citations with `ZERO_TRADEMARK_CONFLICTS_SURFACED` without synthesizing nonexistent corporate owners, fake registration numbers, or imaginary classifications (`registrationStatus: 'UNKNOWN'`).
- **Baseline BRAND Non-Auto-Clear**: Baseline / un-occurred brand evaluations never independently assign `NO_ISSUE_SURFACED` purely from absence of records; they evaluate as `REVIEW_RECOMMENDED`.
- **`RETRY_RESEARCH` Action Routing & Resolution**: `INSUFFICIENT_EVIDENCE` items dispatch a `RETRY_RESEARCH` action item to Legal Counsel and automatically resolve upon successful research retry.
- **Gemini Structured Scene Context**: Gemini 3.6 Flash semantically extracts scene occurrence prominence, modality, tone, endorsement implications, safety hazard depictions, and defamation risks into structured JSON, while deterministic TypeScript code owns mathematical risk calculations and state transitions. Canonical grounding research is cached and reused across occurrences of the same entity.
- **Granular Scoped Placeholders**: Support for `SINGLE_OCCURRENCE`, `SELECTED_OCCURRENCES`, `SELECTED_SCENES`, and `PROJECT_WIDE` replacement scoping, ensuring on-set prop approvals do not over-mitigate unapproved scene occurrences.
- **Strict `WORKING_CLEAR` Invariant**: Scene shooting readiness evaluates to `WORKING_CLEAR` only when every non-cleared occurrence has an affirmative interim mitigation basis (`TEMP_APPROVED` placeholder in scope, interim rights agreement, or signed counsel authorization). Unmitigated `REVIEW_RECOMMENDED` items remain `RED` blockers.
- **Genuine Ingestion Diagnostics & Cloud Demo Isolation**: Scanned or unparseable PDF uploads return structured `400 Bad Request` diagnostics with error code `PDF_EXTRACTION_FAILED`. Sample demo loading in `CLOUD_MODE` strictly creates un-evaluated scene occurrences without synthetic fixture seeding.

### Feature 019: Live Runtime & Real-Script Integrity
- **Native File Picker & Multipart Upload Handling**: Native browser file picker and drag-and-drop file upload zone supporting `.fountain`, `.txt`, and `.pdf` screenplays up to 25MB (`POST /api/projects/:id/script/upload` and `/script`) with SHA-256 integrity checksums and visible diagnostic error banners (`EMPTY_FILE`, `FILE_TOO_LARGE`, `UNSUPPORTED_FORMAT`, `PDF_EXTRACTION_FAILED`).
- **Windowed Chunk Script Ingestion**: Scalable scene partitioning with 1-scene overlap buffers in `ScriptParserAgent.ts`, enabling processing of 120+ page scripts without prompt truncation or LLM context window overflows.
- **Authoritative Server Runtime Mode**: `process.env.EXECUTION_MODE` (`CLOUD_MODE`) is globally authoritative across all backend workflows. Client request headers and persisted project-level mode flags are prohibited from overriding live AI extraction or Parallel Search execution.
- **Strict Error Propagation (`PARSING_FAILED`)**: In `CLOUD_MODE`, Gemini parser exceptions propagate as structured diagnostic errors (`PARSING_FAILED`), completely eliminating silent fallback to synthetic demo recognizers.
- **Google Cloud Firestore ADC Persistence**: Production Cloud Run runtime initializes Google Cloud Firestore via Application Default Credentials (ADC) with live connectivity health verification (`verifyFirestoreConnectivity()`) and transactional support (`db.runTransaction()`). If Firestore is unreachable in `CLOUD_MODE`, the startup health probe returns `503 Service Unavailable`.
- **Public Endpoint Security**: `authMiddleware` protects mutating and AI generation endpoints (`/upload`, `/replacements`, `/overrides`, `/rights`, `/actions`) with Bearer token authentication while preserving open access for health checks and demo exploration.
- **Fail-Closed Replacement Candidate Gate**: Gemini replacement generation and collision checks fail closed on model exceptions, assigning `FAILED` status and `ESCALATED_TO_COUNSEL` without auto-clearing replacements.
- **Strict Interim Mitigation Gating**: Scene shooting readiness strictly excludes unapproved replacement cards from interim mitigations. `WORKING_CLEAR` requires `TEMP_APPROVED` or `FINAL_CLEARED` placeholders or replacement cards with status `APPROVED` and `selfClearanceResult: ACCEPTED`.
- **Atomic 25-Call Live Quota Accounting**: Enforces atomic Firestore transaction boundaries so project live research quotas strictly honor the 25-call allocation under high concurrency.
- **Worst-Case Canonical Status Roll-Up**: Derived canonical entity status factors in all active occurrences across the script, preventing `NO_ISSUE_SURFACED` if any occurrence is non-cleared or unresolved (`INSUFFICIENT_EVIDENCE`).
- **Grounding Cache Invalidation & Clean Screenplay Draft Replacement**: Entity edits immediately invalidate grounding caches; screenplay re-uploads execute an atomic replacement transaction that purges old scenes, re-indexes occurrences, and auto-supersedes orphaned action items (`SCRIPT_REVISION_SUPERSEDED`).

---

## 4. Fictional-Content & Anti-Hallucination Policy

ClearanceScout operates under a strict, non-negotiable fictional-content and evidence-grounding policy:
1. **Public Documentation & Demo Screenplays**: All sample screenplays, documentation examples, and bundled fixtures use exclusively entrant-authored fictional entity names (e.g., *Summit Cola*, *AeroTech Prism*, *Veloce GT*, *Midtown Spire Tower*, *Nocturne of the Wild*, *Elena Vance*, *Titan Industrial Hazard Placard*, *NovaTech Zenith*).
2. **Zero Fabricated Evidence**: AI agents are strictly prohibited from generating simulated search URLs, fabricated trademark serial numbers, or false dispute citations. In `CLOUD_MODE`, any search provider outage immediately fails visibly as `INSUFFICIENT_EVIDENCE` without silent fixture substitution.
3. **Legal Status Disclaimers**: All clearance outputs are strictly framed as operational risk issue-spotting categories (`NO ISSUE SURFACED`, `REVIEW RECOMMENDED`, `ACTION REQUIRED`, `INSUFFICIENT EVIDENCE`) and explicitly disclaim rendering formal legal advice.

---

## 5. Verification & Test Attestation

As of Feature 019, the entire ClearanceScout test suite passes with 100% success rate across all contract, unit, and integration tests:
- **Contract Tests**: Verified endpoint schemas, SSE event taxonomies, health checks, counsel overrides, multi-format parsers, project types, occurrence evaluation, entity resolution, rights management, scene readiness, action queues, placeholders, evidence self-clearance, operations dashboard, extended binder export, 1-click judge demo automation, fail-closed cloud clearance, clean zero-hit citations, structured context interpretation, scoped placeholders, multipart file upload, chunked ingestion, server runtime authority, Firestore ADC persistence, replacement readiness blockers, atomic quota accounting, canonical rollup integrity, and screenplay versioning lifecycle.
- **Integration Tests**: Verified end-to-end script ingestion, candidate clearance loops, counsel overrides with scene isolation, batch research, offline replay, judge demo workflows, auditable binder compilation, production hardening lifecycles, and live runtime integrity workflows.
- **Test Baseline**: 152 tests passing across 74 test suites (100% pass rate).
- **Build Verification**: Multi-stage production container and Vite production bundle compile with 0 errors across 50 modules.
