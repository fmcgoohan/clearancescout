# Implementation Plan: Demo Access Token Protection

**Branch**: `012-demo-access-token` | **Date**: 2026-08-18 | **Status**: Plan Complete  
**Specification**: [`specs/012-demo-access-token/spec.md`](spec.md)

---

## 1. Summary of Feature & Architectural Goals

The **Demo Access Token Protection** feature provides a lightweight, shared-token authorization guard for public deployments:
1. **Configurable Environment Guard**: Reads `DEMO_ACCESS_TOKEN` / `DEMO_TOKEN` from server environment. If unset or empty, requests proceed without restriction (open local dev).
2. **Protected Mutations & Expensive Research**: Protects project creation, script parsing, entity mutations/edits/deletions, clearance research evaluations, retry calls, replacement generation, and counsel overrides.
3. **Public Health & Static Assets**: Keeps `GET /api/health`, `GET /api/fixtures/*`, and frontend build assets fully public without credentials.
4. **Fail-Visible Error Feedback**: Returns HTTP 401 Unauthorized with a clear message and zero secret disclosure.
5. **Client UI Token Support**: Provides an access token settings modal in the header and attaches `x-demo-token` to all mutation requests.
6. **Preserve Invariants (003–011)**: Operates without regression across all existing features and test suites.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | Does not alter Gemini or Imagen agent reasoning models. |
| **II. Live Grounding & Research Tooling** | **PASS** | Protects live Parallel Search API from anonymous quota drainage. |
| **III. Architecture & Cloud Persistence** | **PASS** | Middleware lives in `server/middleware/`; config in `server/config.ts`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Preserves all canonical entity status definitions and legal disclaimers. |
| **V. Multi-Tier Execution Modes** | **PASS** | Works across `TEST_MODE`, `DEMO_MODE`, and `CLOUD_MODE`. |
| **Observable Action Timeline** | **PASS** | Preserves observable action event timelines without chain-of-thought. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/012-demo-access-token/research.md`](research.md))
- **Phase 1: Data Model & Interfaces** ([`specs/012-demo-access-token/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/012-demo-access-token/contracts/demo-token-contract.md`](contracts/demo-token-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/012-demo-access-token/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/config.ts`: Add `demoAccessToken` property to `AppConfig` and `loadConfig()`.
- `server/middleware/demoAuthMiddleware.ts`: Create `demoAuthMiddleware` protecting write & research routes.
- `server/index.ts`: Apply `demoAuthMiddleware` to protected routers while preserving public routers (`healthRouter`, `fixtureRouter`, static assets).
- `src/utils/apiClient.ts` / `src/App.tsx`: Provide token storage helper and header injection on outgoing requests.
- `tests/contract/test_demo_auth.test.ts`: Contract tests for token validation, header/query extraction, 401 error payloads, and health exemptions.
- `tests/integration/demo_token_workflow.test.ts`: Integration test verifying protected screenplay ingestion, clearance research, and token validation.
