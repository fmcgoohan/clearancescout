# Quickstart Guide: Manual Clearance Item Correction

**Feature**: `specs/006-manual-item-correction` | **Date**: 2026-08-18

---

## Scenario 1: Edit Extracted Clearance Item and Verify Invalidation

1. Ingest a script (e.g. `POST /api/projects/:id/script`).
2. Identify an entity `Summit Cola`.
3. Run clearance research (`POST /api/projects/:id/clearance/evaluate`).
4. Update entity name to `Apex Cola` via `PATCH /api/projects/:id/entities/:entityId`.
5. Verify status is reset from `NO_ISSUE_SURFACED` to `INSUFFICIENT_EVIDENCE` (pending re-evaluation).
6. Verify an `ITEM_EDITED` event is streamed via SSE.

---

## Scenario 2: Manually Add Unscripted Prop and Clear It

1. Call `POST /api/projects/:id/entities` with:
   ```json
   {
     "canonicalName": "Starlight Energy Drink",
     "entityCategory": "BRAND",
     "sceneId": "scene-1"
   }
   ```
2. Verify entity appears in `GET /api/projects/:id/entities` with origin `MANUALLY_ADDED`.
3. Run `POST /api/projects/:id/clearance/evaluate` with the new entity ID.
4. Verify grounded research runs against `Starlight Energy Drink`.

---

## Scenario 3: Delete False Positive and Export Clean Binder

1. Delete an unwanted entity via `DELETE /api/projects/:id/entities/:entityId`.
2. Verify `ITEM_REMOVED` SSE event is received.
3. Export clearance binder via `GET /api/projects/:id/binder/export`.
4. Verify deleted entity is absent from the binder summary, scene breakdowns, and SHA-256 integrity digest.
