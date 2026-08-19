# Feature Specification: Judge-Ready 1-Click Demo & Production Workspace Rebrand

**Feature Branch**: `017-judge-ready-demo`  
**Created**: 2026-08-19  
**Status**: Specified  
**Input**: User description: "Judge-ready 1-click demo: Load Sample Screenplay in DEMO_MODE must ingest The Neon Horizon and auto-run fixture-backed clearance evaluation so registry, dashboard, and binder show populated statuses with DEMO_FIXTURE provenance without live API keys. Rebrand UI from MVP Workspace to Production Clearance Workspace. Preserve 003-016 invariants. Do not implement code."

---

## Executive Summary & Business Context

ClearanceScout has evolved from an initial issue-spotting prototype into a comprehensive 10-phase enterprise **Production Clearance Operating Model** (project types, occurrence-level evaluations, entity resolution, contractual rights schedules, deterministic scene readiness, department action queues, fictional placeholders, live self-clearance, operations dashboard, and SHA-256 legal clearance binder). 

For hackathon judges, studio executives, and external evaluators reviewing the platform in `DEMO_MODE` without configuring live Google Cloud Gemini or Parallel Search API keys, clicking **"Load Sample Screenplay"** must provide an immediate, zero-friction, end-to-end operational experience. Instead of requiring manual multi-step evaluation clicks on un-assessed entities, loading the sample screenplay must automatically ingest the complete 10-scene bundled screenplay (*"The Neon Horizon"*), resolve entities, and auto-execute deterministic fixture-backed clearance evaluation. Consequently, the Entity Registry, Production Operations Dashboard, and Legal Clearance Binder are instantly populated with realistic clearance verdicts, scene readiness distributions (`FINAL CLEAR`, `WORKING CLEAR`, `RED`), active rights, placeholders, and action items bearing verifiable `DEMO_FIXTURE` (📦) provenance badges. Furthermore, all remaining user-facing references to "MVP Workspace" are updated to reflect the platform's full identity as the **"Production Clearance Workspace"**.

---

## User Scenarios & Testing

### User Story 1 (Priority: P1) — 1-Click Sample Screenplay Ingestion & Auto-Evaluation

As a hackathon judge or studio legal evaluator reviewing ClearanceScout in `DEMO_MODE`, I want clicking "Load Sample Screenplay" to ingest *"The Neon Horizon"* and automatically execute fixture-backed clearance evaluation across all extracted entities, so that I immediately see a fully evaluated, live-feeling production clearance workspace without needing to supply external API keys or click repetitive evaluation buttons.

**Why this priority**: Eliminates all judge onboarding friction and demonstrates the complete operating model with a single click.

**Independent Test**: Start the app in `DEMO_MODE` without API keys; click "Load Sample Screenplay"; verify that script scenes, entities, and clearance evaluations are automatically ingested, evaluated, and displayed with `DEMO_FIXTURE` provenance badges.

**Acceptance Scenarios**:
1. **Given** the application running in `DEMO_MODE` with no API keys configured, **When** a user clicks "Load Sample Screenplay" on the project landing or workspace header, **Then** the system ingests *"The Neon Horizon"* screenplay (10 scenes, 5 categories).
2. **Given** successful ingestion in `DEMO_MODE`, **When** the ingestion completes, **Then** the system automatically triggers fixture-backed clearance evaluation across all canonical entities and occurrences without requiring manual user intervention.
3. **Given** the auto-evaluation process running, **When** evaluating entities, **Then** the UI displays live progress or smooth transition into the fully populated workspace state.

---

### User Story 2 (Priority: P2) — Populated Operations Dashboard & Extended Legal Binder

As a production coordinator or clearance attorney, I want the Production Operations Dashboard and Legal Clearance Binder to immediately reflect populated clearance statistics, scene readiness distributions, active rights, placeholders, and open action queues upon demo script loading, so that all enterprise clearance features are immediately auditable.

**Why this priority**: Demonstrates the full value of Features 001–016 (scene readiness math, rights expirations, open blockers, department work queues, and SHA-256 cryptographic digests) during an evaluation session.

**Independent Test**: Load the sample screenplay in `DEMO_MODE`; open the `📊 Operations Dashboard` and `📁 Clearance Binder` modals; verify KPI metrics, scene readiness breakdown, rights catalog, placeholders, actions, and SHA-256 checksums are fully populated and accurate.

**Acceptance Scenarios**:
1. **Given** a loaded demo project, **When** opening the `📊 Operations Dashboard`, **Then** the dashboard displays non-zero populated metrics for Shoot Readiness %, Scene Readiness breakdown (`FINAL CLEAR`, `WORKING CLEAR`, `RED`), active blockers, upcoming rights expirations, and department work queues.
2. **Given** a loaded demo project, **When** opening the `📁 Clearance Binder`, **Then** the binder compiles complete occurrence schedules, rights agreements, prop placeholders, unresolved actions, and a valid 64-character SHA-256 integrity digest with download actions (`JSON`, `Markdown`, `Print PDF`).
3. **Given** demo evaluations and binder records, **When** inspecting research citations and provenance badges, **Then** every item clearly indicates `DEMO_FIXTURE` (📦) provenance without pretending to be live API data.

---

### User Story 3 (Priority: P3) — UI Rebranding to "Production Clearance Workspace"

As a studio legal executive, I want the user interface to consistently present itself as the "Production Clearance Workspace" rather than an "MVP Workspace", so that the branding reflects the mature, 10-phase production clearance operating model.

**Why this priority**: Eliminates obsolete prototype terminology across headers, landing pages, modals, and toolbars.

**Independent Test**: Inspect the application header, title tags, project landing cards, and modal dialogs; verify zero occurrences of "MVP Workspace" or "ClearanceScout MVP" remain in user-facing UI copy.

**Acceptance Scenarios**:
1. **Given** any page or modal in the application, **When** viewing headers, banners, and tooltips, **Then** the system displays "ClearanceScout Production Clearance Workspace" / "Production Clearance Studio".
2. **Given** the project landing page, **When** viewing the workspace banner, **Then** it highlights the enterprise production clearance capabilities (scene readiness, rights management, placeholders, operations dashboard, and legal binders).

---

### User Story 4 (Priority: P4) — Preservation of System Invariants (003–016)

As a system architect and compliance engineer, I want all prior invariants established across Features 003 through 016 to remain strictly enforced, so that demo automation does not regress live cloud mode, security token rules, counsel override isolation, or accessibility standards.

**Why this priority**: Ensures zero regressions in production safety, chain-of-thought privacy, and mode-locked isolation.

**Independent Test**: Run the full contract and integration test suite; verify 100% pass rate with mode isolation and quota tracking intact.

**Acceptance Scenarios**:
1. **Given** `CLOUD_MODE` execution, **When** credentials are missing, **Then** the system continues to fail visibly and never silently falls back to synthetic fixtures.
2. **Given** `DEMO_MODE` execution, **When** counsel overrides or placeholders are applied, **Then** scene isolation, hierarchical status resolution, and action queue auto-resolution behave identically to live mode.
3. **Given** keyboard navigation, **When** navigating the newly rebranded workspace, **Then** WCAG 2.1 AA focus rings, accessible modal dialogs, and keyboard shortcuts remain fully functional.

---

## Edge Cases

- **User switches projects after demo load**: Switching to a newly created project should present a fresh, un-evaluated state without leaking demo project entities or assessments.
- **Loading demo screenplay multiple times**: Re-clicking "Load Sample Screenplay" should reset or re-ingest the demo project cleanly without creating duplicate entities or orphan occurrences.
- **Offline / Zero Network Connectivity in DEMO_MODE**: The entire demo workflow (ingestion, evaluation, dashboard, binder export, markdown download) must succeed 100% offline without attempting external network calls.
- **Live Research Attempt in DEMO_MODE without Quota/Keys**: If a user attempts a live research retry or candidate self-clearance in `DEMO_MODE`, the system should either use fixture-backed deterministic simulation or prompt for credentials/demo token transparently.

---

## Requirements

### Functional Requirements

- **FR-001**: In `DEMO_MODE`, clicking "Load Sample Screenplay" (or calling the sample script load API) MUST ingest the bundled 10-scene screenplay (*"The Neon Horizon"*) AND automatically execute fixture-backed clearance evaluation across all extracted canonical entities and scene occurrences.
- **FR-002**: Auto-evaluation in `DEMO_MODE` MUST complete without requiring any external Google Gemini API key or Parallel Search API key.
- **FR-003**: All automated demo research assessments and citations MUST be tagged with `DEMO_FIXTURE` (📦) provenance.
- **FR-004**: Following demo script load and auto-evaluation, the Entity Registry MUST immediately show populated clearance risk statuses (`NO_ISSUE_SURFACED`, `REVIEW_RECOMMENDED`, `ACTION_REQUIRED`) across all 5 clearance categories (`BRAND`, `ART_MUSIC`, `PUBLIC_FIGURE`, `PROPRIETARY_LOCATION`, `GRAPHIC_PROP`).
- **FR-005**: Following demo script load, the Production Operations Dashboard (`GET /api/projects/:id/dashboard`) MUST return non-zero populated metrics for Shoot Readiness %, Scene Readiness distribution, active blockers, expiring rights, active placeholders, and department work queues.
- **FR-006**: Following demo script load, the Legal Clearance Binder (`GET /api/projects/:id/binder` and `POST /api/projects/:id/binder/export`) MUST compile a complete multi-section dossier with valid 64-character SHA-256 integrity digest and downloadable Markdown (`GET /api/projects/:id/binder/markdown`).
- **FR-007**: The user interface MUST be rebranded from "MVP Workspace" / "ClearanceScout MVP" to "Production Clearance Workspace" / "ClearanceScout Production Clearance Studio" across all headers, page titles, landing cards, modals, and tooltips.
- **FR-008**: The system MUST preserve all 003 invariants (scene-specific counsel override isolation, hierarchical status resolution, and SHA-256 binder integrity digests).
- **FR-009**: The system MUST preserve all 004 invariants (autonomous candidate self-clearance loop ceiling $\le 3$, negative constraints, and 4-event SSE timeline).
- **FR-010**: The system MUST preserve all 005 invariants (bundled fictional demo screenplay, secret-masked health API, fail-visible `CLOUD_MODE`).
- **FR-011**: The system MUST preserve all 006 invariants (manual clearance item addition, editing with assessment invalidation, clean deletion).
- **FR-012**: The system MUST preserve all 007 invariants (single-item failed research retry with eligibility gating and sibling isolation).
- **FR-013**: The system MUST preserve all 008 invariants (side-by-side original and replacement comparison modal and binder print view).
- **FR-014**: The system MUST preserve all 009 invariants (multi-dimension workspace registry filters across Status, Category, and Scene with empty recovery).
- **FR-015**: The system MUST preserve all 010 invariants (read-only binder jump to evidence citation drawer and observable action timeline context).
- **FR-016**: The system MUST preserve all 011 invariants (bounded concurrency batch research with live per-item progress and fail-visible isolation).
- **FR-017**: The system MUST preserve all 012 invariants (configurable shared demo access token with public health/fixture exemptions and client modal).
- **FR-018**: The system MUST preserve all 013 invariants (newly captured repository record-replay fixtures, mode-locked cloud isolation, and universal provenance badges).
- **FR-019**: The system MUST preserve all 014 invariants (accessible responsive workspace, keyboard navigation, visible focus, and mobile stacking).
- **FR-020**: The system MUST preserve all 015 invariants (per-project live research quota tracking, header indicator, and 429 exhaustion fail-visible guard).
- **FR-021**: The system MUST preserve all 016 invariants (project types, occurrence evaluation, entity resolution, contractual rights, deterministic scene readiness, action queues, placeholders, evidence-driven live self-clearance, operations dashboard, and extended SHA-256 legal binder).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: In `DEMO_MODE`, clicking "Load Sample Screenplay" populates 100% of candidate entities with evaluated clearance statuses in under 3 seconds without requiring external network connectivity or API keys.
- **SC-002**: 100% of demo evaluations display explicit `DEMO_FIXTURE` (📦) provenance badges in the UI and exported clearance binders.
- **SC-003**: The Operations Dashboard immediately reflects calculated Shoot Readiness %, scene readiness breakdown (`FINAL CLEAR`, `WORKING CLEAR`, `RED`), active blockers, and department action counts upon demo load.
- **SC-004**: Zero instances of "MVP Workspace" or "ClearanceScout MVP" appear in user-facing UI elements.
- **SC-005**: All contract and integration test suites pass with 100% success rate (56+ test files, 108+ tests) with zero regressions.

---

## Assumptions

- `DEMO_MODE` utilizes the bundled entrant-authored fictional screenplay (*"The Neon Horizon"*) and existing deterministic repository fixtures in `server/fixtures/` and `server/repositories/fixtures/`.
- In `CLOUD_MODE`, loading a sample screenplay still parses the script, but live clearance evaluation requires valid credentials or demo access token.
- Rebranding is purely user-facing (copy, headers, titles, meta tags) and does not break existing API endpoint contracts.
