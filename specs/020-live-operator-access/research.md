# Phase 0 Research: 020 Live Operator Access and Cloud-Mode First Run

## 1. Context & Architectural Problem Analysis

During live verification of the deployed Cloud Run service (`clearance-scout-00020` in `CLOUD_MODE`), the security boundary established in Feature 019 correctly protected mutating endpoints and data reads with HTTP 401 when unauthenticated. However, the client-side user experience exhibited several first-run friction points:

1. **Silent 401 on Initial Load**: First-time visitors without a stored token experienced an unhandled 401 on `GET /api/projects`. The UI rendered an empty project state rather than surfacing the token configuration modal.
2. **Outdated Copy**: Token configuration modal copy stated that tokens were required "only for mutations", whereas in `CLOUD_MODE` project and entity reads also require authorization.
3. **Unauthenticated Network Call Outliers**: Background streams (`EventSource` SSE in `TimelineDrawer.tsx`) and direct `fetch()` calls in modals (`BinderExportModal.tsx`, `ProductionDashboardModal.tsx`) bypassed `apiFetch` and did not attach authorization credentials, resulting in silent 401 errors.
4. **SSE Authorization Pattern**: Standard browser `EventSource` does not support custom request headers. The backend must reliably accept `?token=` query parameters on `/api/events` streams.
5. **1-Click Demo Provenance Honesty**: In `CLOUD_MODE`, demo load actions must either execute live extraction or provide clearly labeled evaluation badges with non-zero evaluation counts.
6. **Health Diagnostics Transparency**: `GET /api/health` should explicitly return `firestoreConnected: true` in `CLOUD_MODE`.

---

## 2. Technical Decisions & Tradeoffs

### Decision 1: Blocking Token Modal & Reactive 401 Interception
- **Decision**: Introduce a global 401 interceptor in `src/services/api.ts` and `WorkspacePage.tsx` that immediately surfaces the `TokenConfigModal` in blocking mode when an unauthenticated response is received in `CLOUD_MODE`.
- **Rationale**: Prevents users from assuming the application is broken or empty. Pre-populating the documented judge token (`judge-pass-2026`) enables instantaneous onboarding.
- **Alternatives Considered**:
  - *Redirect to separate `/login` route*: Unnecessary architectural complexity for a single-page studio application.
  - *Silent failure with empty state*: Rejected; misleads users into thinking no data or projects exist.

### Decision 2: Query Parameter Token Passing for Server-Sent Events (SSE)
- **Decision**: Pass `?token=${encodeURIComponent(storedToken)}` when establishing the `EventSource` connection in `TimelineDrawer.tsx`.
- **Rationale**: Browser `EventSource` standard does not allow setting headers like `Authorization` or `x-demo-token`. The server `demoAuthMiddleware` already supports query parameter tokens (`req.query.token || req.query.demoToken`).
- **Alternatives Considered**:
  - *Replace SSE with WebSockets*: Adds unnecessary server state and infrastructure overhead.
  - *Fetch-based chunked streaming polyfill*: Adds unnecessary client bundle weight when native query parameters are fully standard and supported.

### Decision 3: Standardized Authenticated Client Fetch Utility
- **Decision**: Ensure all modal and helper fetches (`BinderExportModal`, `ProductionDashboardModal`) use `apiFetch` or attach `Authorization: Bearer <token>` explicitly.
- **Rationale**: Guarantees zero 401 regressions when opening modals or downloading markdown clearance binders.

### Decision 4: Honest 1-Click Demo Evaluation in CLOUD_MODE
- **Decision**: When `1-Click Demo` is triggered in `CLOUD_MODE`, the workflow executes script parsing and evaluates entities with non-zero counts and verifiable provenance badges (`PARALLEL_LIVE` or fail-visible `FALLBACK_FIXTURE`).
- **Rationale**: Accurately demonstrates the live agentic clearance capabilities to judges and operators without synthetic zero-count discrepancies.

### Decision 5: Firestore Health Probe Enhancement
- **Decision**: Extend `HealthStatusResponse` to include `firestoreConnected: boolean` from `verifyFirestoreConnectivity()`.
- **Rationale**: Provides immediate, visible confirmation of cloud persistence health on `GET /api/health` without exposing secrets.

---

## 3. Best Practices & Constitution Compliance

- **Google ADK & Gemini Standards**: Maintains pure `gemini-3.6-flash` execution in `CLOUD_MODE`.
- **Zero Raw CoT Disclosure**: Retains observable event streaming without leaking model thought traces.
- **Secret Hygiene**: Documented judge token (`judge-pass-2026`) is surfaced in placeholder copy without exposing live Gemini or Parallel API keys.
