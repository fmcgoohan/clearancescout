# Research: Demo Access Token Protection

**Feature**: `specs/012-demo-access-token` | **Date**: 2026-08-18

---

## 1. Auth Guard Pattern: Shared Demo Token vs. Multi-User Database Auth

### Context
When running ClearanceScout on a public domain or during competition judging demonstrations, anonymous visitors could trigger multiple heavy script ingestions or Parallel search evaluations, exhausting API quotas. However, adding full multi-tenant user accounts, sessions, password tables, and JWT signing is out of scope and introduces user friction.

### Decision
- Implement a server-configured shared demo access token via `DEMO_ACCESS_TOKEN`.
- When unset, auth middleware is a transparent no-op (`next()`), keeping local development 100% open and zero-config.
- When set, mutating write endpoints (`POST`, `PATCH`, `DELETE`) and expensive research evaluations require the token.
- `GET /api/health`, `GET /api/fixtures/*`, and frontend static assets are always unauthenticated.

---

## 2. Token Extraction Mechanisms

### Context
Evaluators may connect via the React web UI, curl scripts, or direct link preview URLs.

### Decision
Support 3 token extraction sources in order of preference:
1. `x-demo-token` HTTP header (primary client fetch header).
2. `Authorization: Bearer <token>` HTTP header (standard HTTP convention).
3. `?token=<token>` or `?demoToken=<token>` query string parameter (convenient for testing or direct links).

---

## 3. Secret Disclosure Prevention

### Context
Error messages must fail visibly without inadvertently revealing the secret value to attackers.

### Decision
- 401 Unauthorized returns a standardized message: `{"error": "Unauthorized: Invalid or missing demo access token."}`.
- Never output the expected token in logs, headers, or error payloads.
