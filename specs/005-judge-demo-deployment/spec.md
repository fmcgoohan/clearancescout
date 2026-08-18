# Feature Specification: Judge-Ready Demo, Documentation, and Production Deployment

**Feature Branch**: `005-judge-demo-deployment`  
**Created**: 2026-08-18  
**Status**: Clarified  
**Input**: User description: "Judge-Ready Demo, Documentation, and Production Deployment: add an MIT license, truthful README, development provenance log, and one bundled fully fictional entrant-created demo screenplay. Provide a health/readiness endpoint and a Cloud Run deploy path so the hosted app is judge-accessible. Production must fail visibly if Gemini or Parallel credentials are missing and must never silently use fixtures. Public docs and the demo screenplay must use only fictional entities. Preserve existing 003 and 004 invariants. Do not add unrelated product scope."

---

## Clarifications

### Session 2026-08-18

- Q: What bundled demo content and loading mechanism should be provided for evaluation? → A: Exactly one bundled fully fictional, entrant-created demo screenplay accessible via a single-click "Load Sample Screenplay" action in the workspace UI.
- Q: What information must `GET /api/health` return and how must secrets be protected? → A: `GET /api/health` reports operational status, active execution mode (`TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE`), uptime, and boolean flags indicating whether Gemini and Parallel credentials are present; it must NEVER expose secret API key values or tokens.
- Q: How must credential omission or provider failure behave in `CLOUD_MODE`? → A: In `CLOUD_MODE`, any missing credentials or provider failure is strictly fail-visible (status `DEGRADED`/error with diagnostic details) and must NEVER silently fall back to demo fixtures or synthetic datasets.
- Q: What documentation and licensing standards must be upheld? → A: All README claims must strictly match shipped production behavior; an MIT `LICENSE` is provided at the repository root; and `PROVENANCE.md` transparently records development tooling, model usage (`gemini-3.6-flash`, Imagen 3), `@parallel-web/sdk` research grounding, and the fictional-content policy.
- Q: What is the Cloud Run deployment topology? → A: Exactly one unified Google Cloud Run container service hosting the Express API and built Vite/React static assets, built using a multi-stage `Dockerfile`.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Judge-Ready Experience & Bundled Fictional Demo Screenplay (Priority: P1) 🎯 MVP

Hackathon judges, legal counsel, and studio reviewers must be able to explore the full ClearanceScout workflow immediately without supplying external API keys or uploading external copyright-encumbered scripts. The system bundles one fully fictional, entrant-created demo screenplay ("The Neon Horizon") featuring exclusively fictional entities across all 5 clearance categories (`BRAND`, `ART_MUSIC`, `PUBLIC_FIGURE`, `PROPRIETARY_LOCATION`, `GRAPHIC_PROP`). The UI provides a 1-click "Load Sample Screenplay" action that loads this script, runs scene parsing, canonical entity registry matching, trademark research, risk assessments, replacement brand generation, counsel override recording, and auditable binder export.

**Why this priority**: Empowers hackathon judges and evaluators to experience the complete, high-fidelity end-to-end clearance workflow in seconds with zero configuration and zero copyright or trademark infringement risk.

**Independent Test**: Navigate to the workspace page in `DEMO_MODE`, click "Load Sample Screenplay", and verify that all scenes, entities, risk assessments, replacement brand cards, counsel reviews, and binder exports function smoothly using exclusively fictional assets.

**Acceptance Scenarios**:

1. **Given** a user opens ClearanceScout in `DEMO_MODE` or `TEST_MODE`, **When** they click "Load Sample Screenplay", **Then** the system populates the script editor with the bundled fully fictional entrant-created screenplay containing entities across all 5 clearance categories.
2. **Given** the loaded fictional screenplay is parsed and evaluated, **When** reviewing the entity table and citation drawer, **Then** all extracted entities are strictly fictional (e.g. `Summit Cola`, `AeroTech Prism`, `Veloce GT`, `Midtown Spire Tower`, `Nocturne of the Wild`), citations display authentic provenance badges, and no real-world proprietary trademarks appear.
3. **Given** an entity requires replacement, **When** generating a candidate, **Then** the self-clearance loop executes with strict 4-event SSE timeline updates and accepts or escalates according to policy.

---

### User Story 2 - Health / Readiness Endpoint & Fail-Visible Cloud Mode (Priority: P2)

Cloud operations engineers, hosting platforms, and evaluation checkers require a deterministic health and readiness endpoint (`GET /api/health`) to assess container lifecycle readiness, active execution mode (`TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE`), and credential status. In `CLOUD_MODE`, the system must strictly verify that required Gemini and Parallel Search API credentials are present; if credentials are missing or services are unreachable, the endpoint and clearance workflows must fail visibly with clear, diagnostic error messages and must NEVER silently fall back to synthetic fixtures.

**Why this priority**: Guarantees truthful runtime operation and prevents silent mock fallback in production competition environments, fulfilling Principle V and Principle II of the project constitution.

**Independent Test**: Query `GET /api/health` in `DEMO_MODE` (verify status `HEALTHY` with mode `DEMO_MODE` and boolean flags); switch to `CLOUD_MODE` without API keys (verify status `DEGRADED` with missing credentials list and zero secret leakage).

**Acceptance Scenarios**:

1. **Given** the server is running in `DEMO_MODE` or `TEST_MODE`, **When** `GET /api/health` is requested, **Then** the server returns HTTP 200 with `{ status: "HEALTHY", executionMode: "DEMO_MODE", uptime: number, credentials: { geminiConfigured: boolean, parallelWebConfigured: boolean } }`, with zero secret keys exposed.
2. **Given** the server is running in `CLOUD_MODE` without `GEMINI_API_KEY` or `PARALLEL_WEB_API_KEY`, **When** `GET /api/health` is requested, **Then** the server returns `{ status: "DEGRADED", executionMode: "CLOUD_MODE", missingCredentials: ["GEMINI_API_KEY", ...] }` and descriptive diagnostics without leaking secrets.
3. **Given** `CLOUD_MODE` is active and credentials are missing, **When** a clearance evaluation or replacement generation request is submitted, **Then** the operation fails visibly returning `INSUFFICIENT_EVIDENCE` or HTTP 500 with diagnostic error, and does NOT silently return mock fixture data.

---

### User Story 3 - Comprehensive Documentation, MIT License, and Containerized Cloud Run Deployment (Priority: P3)

The repository must include complete, professional, judge-ready open source documentation: an MIT License (`LICENSE`), a truthful and structured `README.md` (covering architecture, ADK multi-agent design, setup guides, API endpoints, and legal disclaimers matching shipped behavior), a development provenance log (`PROVENANCE.md`), and a production containerization path (`Dockerfile`, `.dockerignore`, and Cloud Run deployment configuration) enabling deployment of a single unified Cloud Run service.

**Why this priority**: Satisfies hackathon submission criteria, guarantees reproducible judging evaluations, and establishes transparent open source licensing and development history.

**Independent Test**: Inspect `LICENSE`, `README.md`, `PROVENANCE.md`, and `Dockerfile`; build container image locally and verify container startup and readiness response.

**Acceptance Scenarios**:

1. **Given** the repository root, **When** inspected, **Then** an official MIT License file (`LICENSE`) is present with entrant attribution.
2. **Given** the `README.md`, **When** read by a judge or developer, **Then** all claims strictly match shipped behavior, documenting system architecture, ADK agents, `@google/genai` models (`gemini-3.6-flash`, Imagen 3), `parallel-web` grounding, execution modes, step-by-step quickstart, and non-legal-advice disclaimers using strictly fictional entity examples.
3. **Given** `PROVENANCE.md`, **When** reviewed, **Then** it provides an auditable chronological record of tools used, architectural progression, model selections, grounding integrations, and the fictional-content policy.
4. **Given** the `Dockerfile`, **When** built via Docker / Cloud Build, **Then** it generates a lightweight, multi-stage production container running the unified Express API and built Vite/React static assets on Google Cloud Run.

---

## Functional Requirements *(mandatory)*

- **FR-001**: The system MUST include an official standard MIT license in `LICENSE` in the repository root.
- **FR-002**: The system MUST provide a comprehensive, truthful `README.md` whose claims strictly match shipped behavior, documenting architecture, ADK agent pipelines, execution modes, quickstart instructions, and legal disclaimers, citing strictly fictional entities.
- **FR-003**: The system MUST provide a development provenance record in `PROVENANCE.md` detailing development tooling, architectural milestones, model selections, grounding integrations, and the fictional-content policy.
- **FR-004**: The system MUST include a bundled, entrant-created, fully fictional demo screenplay in `fixtures/demo_screenplay.txt` (or `.fountain`) containing entities across all 5 clearance categories (`BRAND`, `ART_MUSIC`, `PUBLIC_FIGURE`, `PROPRIETARY_LOCATION`, `GRAPHIC_PROP`).
- **FR-005**: The frontend UI MUST provide a 1-click "Load Sample Screenplay" action that loads the bundled fictional screenplay into the script workspace.
- **FR-006**: The server MUST expose a `GET /api/health` endpoint returning server health status, execution mode (`TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE`), uptime, and boolean credential flags (`geminiConfigured`, `parallelWebConfigured`), and MUST NEVER expose raw secret values.
- **FR-007**: In `CLOUD_MODE`, the system MUST fail visibly when API credentials (`GEMINI_API_KEY`, `PARALLEL_WEB_API_KEY`) are missing or unreachable, returning descriptive diagnostics and NEVER silently substituting synthetic fixtures.
- **FR-008**: The repository MUST provide a multi-stage production `Dockerfile` and `.dockerignore` for deploying a single unified Express API and Vite React frontend service to Google Cloud Run.
- **FR-009**: All public documentation, sample fixtures, and bundled screenplays MUST exclusively use fictional, non-infringing entity names.
- **FR-010**: All prior 003 (counsel review, scene override isolation, hierarchical resolver, binder SHA-256 integrity digest) and 004 (self-clearance loop, 3-attempt ceiling, strict 4-event SSE timeline) invariants MUST be strictly preserved without regressions.

---

## Success Criteria *(mandatory)*

- **SC-001**: 1-click demo screenplay loads and completes full script parsing, 5-category entity extraction, risk assessment, and binder compilation in $< 2$ seconds in `DEMO_MODE`.
- **SC-002**: `GET /api/health` returns valid JSON status payload in $< 50\text{ms}$ with boolean credential flags and 0% secret token leakage.
- **SC-003**: In `CLOUD_MODE` with missing keys or provider outage, 100% of clearance requests fail visibly with diagnostic `INSUFFICIENT_EVIDENCE` or error status with 0% silent fixture fallback.
- **SC-004**: Production Docker build succeeds cleanly and container serves static assets and API routes on specified `PORT` as a single unified service.
- **SC-005**: 100% test pass rate across all unit, contract, and integration test suites with zero 003/004 regressions.

---

## Assumptions & Boundaries

- **Assumptions**: Google Cloud Run is the target hosted platform for live competition judging; `PORT` environment variable is provided by Cloud Run runtime (defaults to 3000 or 8080).
- **Out of Scope**: Third-party OAuth authentication provider integrations, multi-tenant enterprise billing, and video rendering pipelines.
