# Feature Specification: Demo Access Token Protection

**Feature Branch**: `012-demo-access-token`  
**Created**: 2026-08-18  
**Status**: Clarified  
**Input**: User description: "Demo Access Token: protect public write and research endpoints with an optional shared demo token from server config. Missing or invalid tokens fail visibly. Health and static assets remain public. Preserve 003 through 011 invariants. Do not add a full multi-tenant auth system."

---

## Clarifications

### Session 2026-08-18
- Q: What happens when DEMO_ACCESS_TOKEN is not configured on the server? → A: If DEMO_ACCESS_TOKEN is unset, mutations stay open.
- Q: Which endpoints are guarded when the token is configured? → A: If set, write and research endpoints require a matching token.
- Q: Which endpoints remain exempt from authentication? → A: GET /api/health, fixture load, and static assets stay public.
- Q: What response and error disclosure is returned for unauthorized requests? → A: Invalid tokens return 401 with a visible message and never leak the expected token.
- Q: What is the architectural boundary of this access control mechanism? → A: This is a shared demo token, not multi-user auth.

---

## User Scenarios & Testing

### User Story 1 - Optional Shared Demo Token Enforcement on Mutation Endpoints (Priority: P1) 🎯 MVP

As a project administrator or judge running ClearanceScout on a public cloud deployment, I want mutating write and expensive research endpoints (script ingestion, entity mutations, research evaluations, replacement generation, counsel overrides) to be protected by a configurable shared demo token so that unauthorized anonymous actors cannot abuse API quotas.

**Why this priority**: Prevents cost overruns, unauthorized data tampering, and spam while keeping the system simple and zero-friction for authorized evaluators.

**Independent Test**: Configure `DEMO_ACCESS_TOKEN=judge-pass-2026` on the server. Attempt a POST to `/api/projects` or `/api/projects/:id/clearance/evaluate` without the token; verify it fails visibly with HTTP 401. Then provide the valid token header/parameter; verify the request succeeds.

**Acceptance Scenarios**:
1. **Given** `DEMO_ACCESS_TOKEN` is configured on the server, **When** a client sends a write or research request without a valid token, **Then** the server responds with HTTP 401 and an explicit error payload: `{"error": "Unauthorized: Invalid or missing demo access token."}` without disclosing the expected token.
2. **Given** `DEMO_ACCESS_TOKEN` is configured, **When** a client provides the matching token via `x-demo-token` header, `Authorization: Bearer <token>`, or `?token=<token>` query param, **Then** the request is authorized and proceeds normally.
3. **Given** `DEMO_ACCESS_TOKEN` is unset or empty, **When** any client sends a request, **Then** all endpoints execute without requiring a token (seamless local development default).

---

### User Story 2 - Public Health, Fixture Load & Static Asset Access (Priority: P2)

As a cloud platform health monitor, contest judge, or web visitor, I want static web assets (`/`, CSS, JS, favicon), `GET /api/health`, and demo screenplay fixtures (`GET /api/fixtures/*`) to remain publicly accessible without requiring a demo token so that health probes, initial UI bootstrapping, and bundled demo loading never fail.

**Why this priority**: Cloud Run health checks, static asset delivery, and 1-click fictional demo screenplay fixtures must function without credentials.

**Independent Test**: With `DEMO_ACCESS_TOKEN` enabled, send `GET /api/health`, `GET /api/fixtures/demo-screenplay`, and `GET /`; verify all respond with HTTP 200 without any authentication headers.

**Acceptance Scenarios**:
1. **Given** `DEMO_ACCESS_TOKEN` is active, **When** a request is made to `GET /api/health`, **Then** the health payload is returned with HTTP 200 without token requirement.
2. **Given** `DEMO_ACCESS_TOKEN` is active, **When** a request is made to `GET /api/fixtures/demo-screenplay`, **Then** the fixture is returned with HTTP 200 without token requirement.
3. **Given** `DEMO_ACCESS_TOKEN` is active, **When** a browser loads static assets (`index.html`, bundle scripts, stylesheets), **Then** assets are served with HTTP 200.

---

### User Story 3 - Client UI Demo Token Entry & Header Attachment (Priority: P3)

As an evaluator or clearance coordinator accessing a token-protected ClearanceScout deployment, I want a lightweight UI prompt or header settings modal where I can input my demo access token (persisted in browser storage) so that subsequent actions automatically attach the token without repetitive prompts.

**Why this priority**: Streamlines the evaluator experience on shared demo deployments.

**Independent Test**: Open the workspace in a token-protected environment, enter the demo token into the access settings, and execute script ingestion and clearance research; verify all actions succeed and the token is saved in browser storage.

**Acceptance Scenarios**:
1. **Given** a token is entered in the client Access Token modal/header input, **When** API mutation requests are dispatched, **Then** the `x-demo-token` header is automatically included in all fetch calls.
2. **Given** a 401 response occurs in the UI, **When** received, **Then** a clear notification prompts the user to verify or update their Demo Access Token.

---

### Edge Cases

- **Unset / Empty Server Token**: When `DEMO_ACCESS_TOKEN` is undefined, `""`, or whitespace-only, authentication checks are completely bypassed (open access).
- **Read-Only Inspection Endpoints**: Read-only queries (fetching scenes, entities, binder preview, SSE timeline events) remain accessible to coordinators.
- **Timing-Safe Comparison**: Server-side token comparison uses constant-time string comparison or length-safe comparison to prevent timing attacks.
- **No Secret Leakage**: Error messages and health checks must never leak the configured `DEMO_ACCESS_TOKEN` value.

---

## Requirements

### Functional Requirements

- **FR-001**: The server MUST support an optional `DEMO_ACCESS_TOKEN` configuration loaded from environment variables.
- **FR-002**: If `DEMO_ACCESS_TOKEN` is unset or empty, all API endpoints MUST remain accessible without token verification (open access for local development).
- **FR-003**: When `DEMO_ACCESS_TOKEN` is configured, the server MUST protect write, mutation, and research endpoints:
  - `POST /api/projects`
  - `POST /api/projects/:id/script`
  - `POST /api/projects/:id/clearance/evaluate`
  - `POST /api/projects/:id/entities`
  - `PATCH /api/projects/:id/entities/:entityId`
  - `DELETE /api/projects/:id/entities/:entityId`
  - `POST /api/projects/:id/entities/:entityId/retry-research`
  - `POST /api/projects/:id/entities/:entityId/override`
  - `POST /api/projects/:id/replacement/generate`
- **FR-004**: The auth middleware MUST accept the token from:
  - `x-demo-token` HTTP header
  - `Authorization: Bearer <token>` HTTP header
  - `?token=<token>` or `?demoToken=<token>` query string parameter
- **FR-005**: Missing or invalid tokens MUST fail visibly with HTTP 401 Unauthorized and JSON payload `{"error": "Unauthorized: Invalid or missing demo access token."}` without disclosing the expected token.
- **FR-006**: `GET /api/health`, `GET /api/fixtures/*`, and all static frontend assets MUST remain public and exempt from token enforcement.
- **FR-007**: The frontend UI MUST provide an access token settings control (persisted in browser storage) and attach the token header to outgoing API requests.
- **FR-008**: This mechanism MUST operate as a lightweight shared demo token without adding multi-tenant user accounts, password databases, or session state.
- **FR-009**: The system MUST preserve all 003 invariants (scene-specific counsel override isolation, hierarchical status resolution, and SHA-256 binder integrity digests).
- **FR-010**: The system MUST preserve all 004 invariants (autonomous candidate self-clearance loop ceiling $\le 3$, negative constraints, and 4-event SSE timeline).
- **FR-011**: The system MUST preserve all 005 invariants (bundled fictional demo screenplay, secret-masked health API, fail-visible `CLOUD_MODE`).
- **FR-012**: The system MUST preserve all 006 invariants (manual clearance item addition, editing with assessment invalidation, and clean deletion).
- **FR-013**: The system MUST preserve all 007 invariants (single-item failed research retry with eligibility gating and sibling isolation).
- **FR-014**: The system MUST preserve all 008 invariants (side-by-side original and replacement comparison modal and binder print view).
- **FR-015**: The system MUST preserve all 009 invariants (multi-dimension workspace registry filters across Status, Category, and Scene with empty recovery).
- **FR-016**: The system MUST preserve all 010 invariants (read-only binder jump to evidence citation drawer and observable action timeline context).
- **FR-017**: The system MUST preserve all 011 invariants (bounded concurrency batch research with live per-item progress and fail-visible isolation).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of mutation requests without a valid token on protected servers are rejected with HTTP 401 and zero secret disclosure.
- **SC-002**: 100% of mutation requests with a valid token succeed without degradation.
- **SC-003**: `GET /api/health` and demo screenplay fixtures return 200 OK without requiring authentication under all configurations.
- **SC-004**: Automated regression test suite maintains 100% pass rate across all test suites with 0 token regression.

---

## Assumptions

- No complex multi-tenant database tables, password hashing, or JWT signing algorithms are added. A shared string comparison is sufficient for demo protection.
- The default local environment runs with `DEMO_ACCESS_TOKEN` unset for frictionless local development.
