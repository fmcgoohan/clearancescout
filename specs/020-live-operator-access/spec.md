# Feature Specification: 020 Live Operator Access and Cloud-Mode First Run

**Feature Branch**: `020-live-operator-access`  
**Created**: 2026-08-21  
**Status**: Draft  
**Input**: User description: "Create feature 020 — Live Operator Access and Cloud-Mode First Run. New bounded feature from live-user defects after 019 deploy to clearance-scout-00020. Do not reopen 018 or 019 internals (parser, Firestore ADC, quota ledger, collision fail-closed, chunking). Preserve 003-018 architecture. Do not write application code."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Blocking Live Token Gate & First-Run Bootstrap (Priority: P1)

When an operator or evaluation judge accesses ClearanceScout in `CLOUD_MODE` on Google Cloud Run for the first time (without a token in local storage), the initial `GET /api/projects` call returns HTTP 401. Instead of ignoring the 401 and rendering an empty workspace that resembles "no projects found", the application immediately presents an active, blocking Token Access Modal. The modal explains that production access requires authorization, provides a pre-populated field with the documented judge access token (`judge-pass-2026`), and upon clicking "Save Token", immediately retries the workspace bootstrap and loads existing projects from Google Cloud Firestore.

**Why this priority**: Without this gate, new visitors on production Cloud Run see a broken, empty interface without realizing authentication is required.

**Independent Test**: Can be tested by opening the live application in a clean incognito session: verify that the token gate opens automatically on 401, entering `judge-pass-2026` saves to storage, and projects immediately load from Cloud Firestore.

**Acceptance Scenarios**:
1. **Given** a user opens the application in `CLOUD_MODE` with no stored token, **When** the initial project list request returns 401, **Then** the Token Access Modal opens automatically and a prominent "Authentication Required" status is displayed instead of "No projects found".
2. **Given** the Token Access Modal is open, **When** the user saves the valid demo token, **Then** the application immediately re-executes project loading and workspace initialization without requiring a page refresh.
3. **Given** an invalid token is entered, **When** the user attempts to save, **Then** an explicit "Invalid demo access token" error is displayed and the gate remains active.

---

### User Story 2 - Comprehensive Authenticated Client Network Layer (Priority: P1)

Every client-side network request must include the configured access token when communicating with the backend in `CLOUD_MODE`. Network requests that previously bypassed the standard authenticated fetch client—specifically the Observable Action Timeline Server-Sent Events stream (`EventSource`), the Markdown Clearance Binder export fetch in `BinderExportModal`, and the Operations Dashboard KPI fetch in `ProductionDashboardModal`—must pass the token (using the `Authorization: Bearer <token>` header or `?token=<token>` query parameter for SSE).

**Why this priority**: Unauthenticated background and modal calls fail with 401 in `CLOUD_MODE`, breaking live timeline streaming, dashboard analysis, and markdown binder downloads.

**Independent Test**: Can be tested by navigating the workspace, opening the Action Timeline, exporting a markdown binder, and viewing the Operations Dashboard in `CLOUD_MODE` with an active token; verify 100% of network requests succeed with HTTP 200.

**Acceptance Scenarios**:
1. **Given** an active workspace session in `CLOUD_MODE`, **When** the Observable Action Timeline initializes an SSE connection, **Then** the request passes the authentication token via query parameter and stream events flow in real-time.
2. **Given** an operator opens the `BinderExportModal`, **When** clicking "Download Markdown Binder", **Then** the fetch request includes the `Authorization` header and the file downloads successfully.
3. **Given** an operator opens the `ProductionDashboardModal`, **When** KPI metrics load, **Then** the fetch request includes the `Authorization` header and renders populated clearance metrics.

---

### User Story 3 - Honest Live Demo Execution & Provenance Integrity (Priority: P1)

When an operator triggers the "1-Click Demo" on a live `CLOUD_MODE` deployment, the demo workflow must honestly reflect its execution environment. Either the demo screenplay is parsed with live Gemini extraction and grounded via Parallel Search with authentic `PARALLEL_LIVE` (or fail-visible `FALLBACK_FIXTURE`) provenance badges and accurate evaluation counts, or it provides a clearly labeled demonstration path with verified non-zero evaluation counts that cannot be mistaken for ungrounded mock responses.

**Why this priority**: Returning zero evaluations or misleading provenance badges while the header displays `CLOUD_MODE` undermines trust in the platform's live clearance capability.

**Independent Test**: Can be tested by clicking "Load 1-Click Demo" in a live `CLOUD_MODE` project; verify that extracted entities display valid clearance statuses, accurate citation counts, and verifiable provenance badges.

**Acceptance Scenarios**:
1. **Given** a project in `CLOUD_MODE`, **When** the user clicks "Load 1-Click Demo", **Then** entities and occurrences are populated with valid clearance evaluations and accurate non-zero evaluation metrics.
2. **Given** demo entities are evaluated in `CLOUD_MODE`, **When** citations are inspected in the Evidence Drawer, **Then** provenance badges accurately indicate the research source (`PARALLEL_LIVE` 🌐, `DEMO_FIXTURE` 📦, or `FALLBACK_FIXTURE` ⚡).

---

### User Story 4 - Accurate Security Messaging, Firestore Diagnostics & Operator Documentation (Priority: P2)

All UI configuration copy, settings dialogs, security badges, and documentation must accurately describe the authentication boundary established in Feature 019: the access token protects all production live operations, including screenplay and entity reading as well as mutations. The public health probe (`GET /api/health`) in `CLOUD_MODE` must report Firestore ADC connectivity status. The `README.md` and live demo documentation must guide judges and operators on entering the access token without exposing private API secrets.

**Why this priority**: Eliminates operator confusion regarding access boundaries and verifies cloud database health at a glance.

**Independent Test**: Can be tested by inspecting the Token Configuration dialog, checking `GET /api/health` payload for `firestoreConnected: true`, and following the quickstart instructions in `README.md`.

**Acceptance Scenarios**:
1. **Given** a user opens the Token Configuration dialog, **When** reviewing the description, **Then** the text states that the token authorizes both live project data access and clearance mutations.
2. **Given** a health monitoring probe calls `GET /api/health` in `CLOUD_MODE`, **When** the response returns, **Then** it includes `firestoreConnected: true` confirming Firestore reachability.
3. **Given** an evaluator reads `README.md`, **When** following the Live Demo instructions, **Then** the judge access token `judge-pass-2026` is clearly documented.

---

### Edge Cases

- **Token cleared or revoked during active session**: Subsequent API calls immediately surface the Token Access Modal and prevent unhandled application state errors.
- **SSE connection drops**: Reconnection logic maintains the query token parameter, re-establishing real-time event streaming without manual intervention.
- **Server restart or Cloud Run cold start**: The client's stored token persists in browser local storage and authenticates the initial bootstrap request seamlessly.
- **Public health check probing**: `/api/health` and `/health` remain completely public and unauthenticated for load balancer and uptime monitoring probes.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an automatic, blocking Token Access Modal upon receiving an HTTP 401 response during initial application bootstrap in `CLOUD_MODE`.
- **FR-002**: System MUST automatically retry project list loading and workspace initialization immediately after the user saves an access token.
- **FR-003**: System MUST update all UI token dialogs, badges, and helper copy to state that authentication authorizes both project/screenplay data reading and mutating clearance workflows.
- **FR-004**: System MUST attach authentication credentials to all client-side network requests, including `EventSource` timeline streaming (`?token=`), `BinderExportModal` markdown downloads, and `ProductionDashboardModal` metrics requests.
- **FR-005**: In `CLOUD_MODE`, 1-Click Demo execution MUST populate entities with valid clearance evaluations, accurate non-zero evaluation counts, and honest provenance badges (`PARALLEL_LIVE` or `FALLBACK_FIXTURE`).
- **FR-006**: Project list 401 error state in the UI MUST explicitly render an "Authentication Required" message rather than an empty project list or "No projects found".
- **FR-007**: The public health endpoint `GET /api/health` in `CLOUD_MODE` MUST include `firestoreConnected: boolean` reflecting live Google Cloud Firestore connectivity.
- **FR-008**: System documentation (`README.md` and `PROVENANCE.md`) MUST document the live Cloud Run access token workflow and the documented judge access token (`judge-pass-2026`) without exposing private cloud credentials.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of unauthenticated visitors accessing a `CLOUD_MODE` deployment receive the blocking authentication prompt within 1 second of initial load.
- **SC-002**: 100% of client network calls (REST API, SSE streams, modal exports, and dashboard metrics) include valid authentication credentials, resulting in zero unexpected 401 errors during an operator session.
- **SC-003**: Saving a valid access token in the modal reloads projects and initializes the workspace in under 1 second without requiring a browser page refresh.
- **SC-004**: 1-Click Demo screenplay loading in `CLOUD_MODE` renders non-zero evaluated entities with accurate provenance badges in under 5 seconds.
- **SC-005**: All automated contract, integration, and UI tests pass with a 100% success rate across all test suites.

---

## Key Entities & Data Model

- **`ClientAuthConfig`**: Client-side storage model holding `demoAccessToken`, `lastValidatedAt`, and `authRequired` state.
- **`HealthStatusResponse`**: Extended health payload including `firestoreConnected: boolean`, `executionMode`, and credential indicators.
- **`TimelineStreamAuthParams`**: Query parameter contract for Server-Sent Events authorization (`?token=<token>`).
