# Implementation Plan: 020 Live Operator Access and Cloud-Mode First Run

**Branch**: `020-live-operator-access` | **Date**: 2026-08-21 | **Spec**: [specs/020-live-operator-access/spec.md](spec.md)

**Input**: Feature specification from `specs/020-live-operator-access/spec.md`

---

## Summary

Feature 020 resolves live operator first-run and client authentication defects surfaced following the Feature 019 Cloud Run deployment:
1. **Blocking Token Gate**: Automatically surfaces the `TokenConfigModal` on `401 Unauthorized` responses during initial `GET /api/projects` in `CLOUD_MODE`, replacing misleading "no projects found" states with a clear authorization prompt.
2. **Instant Bootstrap Retry**: Saving the token immediately retries project loading and workspace hydration without requiring a browser refresh.
3. **Comprehensive Client Network Authentication**: Wires the access token to all client network pathways, including `EventSource` timeline streaming (`?token=`), markdown binder export downloads, and operations dashboard KPI requests.
4. **Honest 1-Click Demo Evaluation in CLOUD_MODE**: Ensures live demo runs reflect non-zero evaluation counts and authentic provenance badges.
5. **Enhanced Cloud Health Diagnostics**: Adds explicit `firestoreConnected: boolean` reporting to `GET /api/health`.
6. **Documentation & Operator Guidance**: Documents the live token gate and judge token `judge-pass-2026` in `README.md`.

---

## Technical Context

**Language/Version**: TypeScript 5.4+ / Node.js 20+ / React 18+  
**Primary Dependencies**: `@google/genai` (0.1.2), `parallel-web` (^1.3.0), `@google-cloud/firestore`, Express, Vite 5, Vitest 1.6.1  
**Storage**: Google Cloud Firestore with Application Default Credentials (ADC) in `CLOUD_MODE`  
**Testing**: Vitest + Supertest contract and integration test suites  
**Target Platform**: Google Cloud Run (Linux container) + Modern Web Browsers  
**Project Type**: Multi-tier Web Application (Express API backend + React SPA frontend)  
**Performance Goals**: <1s initial bootstrap hydration, real-time SSE stream delivery, zero unauthenticated 401 client request drops  
**Constraints**: Zero raw chain-of-thought exposure, strict secret hygiene, backward compatibility with Feature 003-019 architectures  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Agent Framework**: Pure Google ADK and `@google/genai` `gemini-3.6-flash` standard maintained (no LangChain/CrewAI).
- [x] **Live Grounding**: Direct `parallel-web` SDK integration with verifiable provenance badges (`PARALLEL_LIVE`, `FALLBACK_FIXTURE`).
- [x] **Cloud Persistence**: Authentic Google Cloud Firestore integration via ADC in `CLOUD_MODE`.
- [x] **Code Isolation**: Backend isolation inside `server/`, frontend UI and client hooks inside `src/`.
- [x] **Execution Modes**: Strict `CLOUD_MODE` fail-closed security with full client-side token transmission.
- [x] **Observable Timeline**: Event streaming maintains transparency without exposing internal model chain-of-thought.

---

## Project Structure

### Documentation (this feature)

```text
specs/020-live-operator-access/
├── plan.md              # Implementation plan (this document)
├── research.md          # Phase 0 architectural analysis & decisions
├── data-model.md        # Client authentication model & health response schemas
├── quickstart.md        # Automated & manual validation scenarios
├── contracts/           # API and UI contract definitions
│   ├── operator_auth_gate.contract.md
│   ├── client_network_auth.contract.md
│   └── health_diagnostics.contract.md
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code Layout & Touchpoints

```text
server/
├── api/
│   ├── healthRoutes.ts        # Return firestoreConnected: boolean in GET /api/health
│   ├── projectRoutes.ts       # 1-Click demo live execution & honest evaluation
│   └── timelineRoutes.ts      # Accept ?token= query parameter for EventSource
├── middleware/
│   └── demoAuthMiddleware.ts  # Support query token authentication on SSE streams
└── workflows/
    └── demoAutomationWorkflow.ts # Non-zero evaluation counts in CLOUD_MODE demo

src/
├── services/
│   └── api.ts                 # 401 response interception & token getter/setter
├── components/
│   ├── Header.tsx             # Updated token modal copy & read/write badge
│   ├── TokenConfigModal.tsx   # Blocking token prompt & pre-populated judge token
│   ├── TimelineDrawer.tsx     # Pass ?token= in EventSource stream URL
│   ├── BinderExportModal.tsx  # Attach Authorization header to markdown export fetch
│   └── ProductionDashboardModal.tsx # Attach Authorization header to KPI fetch
└── pages/
    └── WorkspacePage.tsx      # Blocking auth gate on 401 & immediate bootstrap retry

tests/
├── contract/
│   ├── test_demo_auth.test.ts          # Contract test for token gate & SSE query auth
│   ├── test_health_api.test.ts         # Contract test for firestoreConnected health
│   └── test_live_operator_access.test.ts # New contract test for client auth coverage
└── integration/
    └── test_live_operator_access_workflow.test.ts # End-to-end first run workflow test
```

---

## Implementation Phases & Strategy

### Phase 1: Authentication Core & Client Interceptor
1. Extend `src/services/api.ts` with global 401 interception and reactive auth state listeners.
2. Update `src/components/TokenConfigModal.tsx` and `src/components/Header.tsx` with updated security copy and pre-filled placeholder.
3. Update `src/pages/WorkspacePage.tsx` to display an "Authentication Required" gate on 401 and trigger immediate reload upon token save.

### Phase 2: Client Network Layer Authorization
1. Update `src/components/TimelineDrawer.tsx` to append `?token=${encodeURIComponent(token)}` to `EventSource`.
2. Update `src/components/BinderExportModal.tsx` and `src/components/ProductionDashboardModal.tsx` to include `Authorization` headers.

### Phase 3: Live Health & 1-Click Demo Provenance
1. Update `server/api/healthRoutes.ts` to surface `firestoreConnected: true` via `verifyFirestoreConnectivity()`.
2. Verify `server/workflows/demoAutomationWorkflow.ts` accurately populates evaluations in `CLOUD_MODE`.

### Phase 4: Verification, Documentation & Build
1. Create contract and integration tests in `tests/contract/` and `tests/integration/`.
2. Update `README.md` and `PROVENANCE.md` with judge token access instructions.
3. Execute `npm test` and `npm run build` to verify 100% pass rate.
