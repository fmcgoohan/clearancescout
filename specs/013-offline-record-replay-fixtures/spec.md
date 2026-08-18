# Feature Specification: Offline Record Replay Fixtures

**Feature Branch**: `013-offline-record-replay-fixtures`  
**Created**: 2026-08-18  
**Status**: Draft  
**Input**: User description: "Offline Record Replay Fixtures: add newly captured test fixtures in this repository for offline contract tests of Parallel and Gemini shaped responses. Production and CLOUD_MODE must never be switched to replay from the client. Fixtures are TEST_MODE and DEMO_MODE only and must be visibly labeled. Preserve 003 through 012 invariants. Do not add unrelated scope."

---

## User Scenarios & Testing

### User Story 1 - Deterministic Offline Contract Test Fixtures for Parallel & Gemini (Priority: P1) 🎯 MVP

As a developer, CI runner, or evaluator running the ClearanceScout test suite without internet or live API keys, I want comprehensive, realistic Parallel Search and Gemini-shaped record-replay fixtures in the repository so that all contract and workflow tests execute deterministically, reliably, and offline.

**Why this priority**: Guarantees zero-network test suite execution, fast deterministic regression runs, and robust verification of external API payload contracts.

**Independent Test**: Disconnect from external network or unset API keys, run `EXECUTION_MODE=TEST_MODE npm test`; verify 100% of contract and integration tests pass using recorded fixtures without network calls.

**Acceptance Scenarios**:
1. **Given** the test suite executes in `TEST_MODE`, **When** clearance research or replacement generation is triggered, **Then** responses are serviced by structured, recorded offline fixtures matching live Parallel Search and Gemini API schemas.
2. **Given** test fixtures are loaded, **When** inspected in tests, **Then** all essential schema fields (source URLs, registration status, corporate owners, dispute precedents, candidate attempts, legal rationales) are present and structurally valid.

---

### User Story 2 - Strict Mode Enforcement & Production Cloud Isolation (Priority: P2)

As a security auditor and compliance coordinator, I want `CLOUD_MODE` and live production runtime to strictly prohibit client-side replay overrides so that real production clearance evaluations always execute against live Gemini and Parallel Search APIs and fail visibly if keys are missing.

**Why this priority**: Prevents live production clearances from accidentally using stale, fake, or replayed mock data.

**Independent Test**: Configure `EXECUTION_MODE=CLOUD_MODE` without API keys; verify the server fails startup visibly with configuration error. Configure `CLOUD_MODE` with valid keys; verify all requests execute against live APIs and ignore any client attempts to force fixture replay.

**Acceptance Scenarios**:
1. **Given** `EXECUTION_MODE=CLOUD_MODE`, **When** the server starts without required API keys, **Then** the server throws a visible startup error and refuses to start in live mode.
2. **Given** `EXECUTION_MODE=CLOUD_MODE`, **When** a client sends a request attempting to specify or force mock replay, **Then** the server ignores the client override and routes strictly to live Google ADK/Parallel APIs.

---

### User Story 3 - Visible Provenance Labeling for Fixtures vs. Live Searches (Priority: P3)

As an entertainment legal counsel or clearance coordinator reviewing research citations in the UI or binder export, I want fixture-derived evidence to be clearly and visibly labeled (`DEMO_FIXTURE` / `FALLBACK_FIXTURE`) while live search results are labeled (`PARALLEL_LIVE`) so that mock research is never mistaken for live trademark/copyright verification.

**Why this priority**: Grounding transparency and legal safety.

**Independent Test**: Ingest entities in `DEMO_MODE`, evaluate clearance, and open the Citation Drawer and Binder Export; verify all citations display the `DEMO_FIXTURE` badge and provenance summary.

**Acceptance Scenarios**:
1. **Given** research runs in `DEMO_MODE` or `TEST_MODE`, **When** citations are viewed in the Citation Drawer or Binder Export, **Then** each citation displays a visible `DEMO_FIXTURE` or `FALLBACK_FIXTURE` badge.
2. **Given** research runs in `CLOUD_MODE`, **When** live Parallel Search results are returned, **Then** citations display `PARALLEL_LIVE` provenance badges.

---

## Requirements

### Functional Requirements

- **FR-001**: The repository MUST include structured, schema-validated offline record-replay fixtures in `server/fixtures/` covering Parallel Search queries and Gemini/Imagen response structures.
- **FR-002**: The fixture suite MUST provide realistic trademark, corporate owner, dispute precedent, and script entity fixture data for both standard brand entities and edge-case collision entities.
- **FR-003**: `TEST_MODE` and `DEMO_MODE` MUST use repository fixtures for deterministic offline execution.
- **FR-004**: `CLOUD_MODE` MUST strictly require live `GEMINI_API_KEY` and `PARALLEL_WEB_API_KEY` and MUST NOT fall back to fixtures or permit client-side replay switching.
- **FR-005**: The server MUST fail visibly on startup if `CLOUD_MODE` is set without required API credentials.
- **FR-006**: All research citations MUST retain explicit, visible provenance tagging (`PARALLEL_LIVE`, `DEMO_FIXTURE`, or `FALLBACK_FIXTURE`) in UI components and exported binder artifacts.
- **FR-007**: The system MUST preserve all 003 invariants (scene-specific counsel override isolation, hierarchical status resolution, and SHA-256 binder integrity digests).
- **FR-008**: The system MUST preserve all 004 invariants (autonomous candidate self-clearance loop ceiling $\le 3$, negative constraints, and 4-event SSE timeline).
- **FR-009**: The system MUST preserve all 005 invariants (bundled fictional demo screenplay, secret-masked health API, fail-visible `CLOUD_MODE`).
- **FR-010**: The system MUST preserve all 006 invariants (manual clearance item addition, editing with assessment invalidation, and clean deletion).
- **FR-011**: The system MUST preserve all 007 invariants (single-item failed research retry with eligibility gating and sibling isolation).
- **FR-012**: The system MUST preserve all 008 invariants (side-by-side original and replacement comparison modal and binder print view).
- **FR-013**: The system MUST preserve all 009 invariants (multi-dimension workspace registry filters across Status, Category, and Scene with empty recovery).
- **FR-014**: The system MUST preserve all 010 invariants (read-only binder jump to evidence citation drawer and observable action timeline context).
- **FR-015**: The system MUST preserve all 011 invariants (bounded concurrency batch research with live per-item progress and fail-visible isolation).
- **FR-016**: The system MUST preserve all 012 invariants (configurable shared demo access token with public health/fixture exemptions and client modal).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of contract and integration tests execute successfully offline in `TEST_MODE` without outbound network calls.
- **SC-002**: 100% of citations produced in `DEMO_MODE`/`TEST_MODE` include explicit `DEMO_FIXTURE` or `FALLBACK_FIXTURE` provenance metadata.
- **SC-003**: 0% chance of client-side replay switching in `CLOUD_MODE`.
- **SC-004**: Automated test suite maintains 100% pass rate across all suites with 0 regressions.

---

## Assumptions

- Captured fixtures contain only fictional, benchmark, or public domain test references safe for open-source repositories.
- `CLOUD_MODE` is reserved for live cloud deployments with real API keys provisioned in environment variables or Google Cloud Secret Manager.
