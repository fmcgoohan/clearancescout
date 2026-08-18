# Quickstart Validation Guide: Demo Access Token Protection

**Feature**: `specs/012-demo-access-token` | **Date**: 2026-08-18

---

## Scenario 1: Rejection on Protected Server Without Token

1. Start server with `DEMO_ACCESS_TOKEN=judge-pass-2026`.
2. Attempt to create a project:
   ```bash
   curl -X POST http://localhost:8088/api/projects \
     -H "Content-Type: application/json" \
     -d '{"title": "Unauthorized Project", "productionCompany": "Spam Corp"}'
   ```
3. Verify server responds with `401 Unauthorized` and `{"error": "Unauthorized: Invalid or missing demo access token."}`.

---

## Scenario 2: Authorized Mutation With Demo Token Header

1. With `DEMO_ACCESS_TOKEN=judge-pass-2026` configured on server:
   ```bash
   curl -X POST http://localhost:8088/api/projects \
     -H "Content-Type: application/json" \
     -H "x-demo-token: judge-pass-2026" \
     -d '{"title": "Authorized Project", "productionCompany": "Judge Studio"}'
   ```
2. Verify server responds with `201 Created`.

---

## Scenario 3: Public Health Probe

1. With `DEMO_ACCESS_TOKEN=judge-pass-2026` configured on server:
   ```bash
   curl http://localhost:8088/api/health
   ```
2. Verify server responds with `200 OK` without any token header.
