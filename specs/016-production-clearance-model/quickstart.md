# Quickstart: Production Clearance Operating Model (Phase 4 Validation)

**Feature**: `specs/016-production-clearance-model` (Phase 4 Focus)  
**Date**: 2026-08-19  

---

## Scenario 1: Attaching a Worldwide Perpetual Rights License to an Entity

### Steps:
1. Create a project `POST /api/projects`.
2. Create canonical entity `POST /api/projects/:id/entities` (`Summit Cola`).
3. Attach a worldwide perpetual license:
   ```bash
   curl -X POST http://localhost:3000/api/projects/$PROJECT_ID/rights \
     -H "Content-Type: application/json" \
     -d '{
       "canonicalEntityId": "'$ENTITY_ID'",
       "licensorName": "Summit Beverage Corporation",
       "grantType": "NON_EXCLUSIVE",
       "territory": "WORLDWIDE",
       "mediaWindow": "ALL_MEDIA_IN_PERPETUITY",
       "effectiveDate": "2026-01-01",
       "isPerpetual": true,
       "status": "ACTIVE"
     }'
   ```
4. Verify rights record created with `status: 'ACTIVE'`.
5. Trigger clearance evaluation `POST /api/projects/:id/evaluate`.
6. Verify entity evaluation resolves with clearance status `NO_ISSUE_SURFACED` citing active contractual rights.

---

## Scenario 2: Scene-Specific Rights with Contractual Covenants

### Steps:
1. Create a scene occurrence for Scene 12 (music track sync).
2. Attach a scene-specific license with a restrictive covenant:
   ```bash
   curl -X POST http://localhost:3000/api/projects/$PROJECT_ID/rights \
     -H "Content-Type: application/json" \
     -d '{
       "canonicalEntityId": "'$ENTITY_ID'",
       "occurrenceIds": ["'$OCCURRENCE_ID'"],
       "licensorName": "Sony Music Publishing",
       "grantType": "NON_EXCLUSIVE",
       "territory": "NORTH_AMERICA",
       "mediaWindow": "THEATRICAL_SVOD",
       "effectiveDate": "2026-01-01",
       "expirationDate": "2028-12-31",
       "isPerpetual": false,
       "covenants": ["Prominent end credit mandatory: Courtesy of Sony Music"],
       "status": "ACTIVE"
     }'
   ```
3. Verify `GET /api/projects/:id/entities/:entityId/rights` returns the attached license and covenants.
4. Verify occurrence evaluation reflects the license grant and notes the end credit covenant in `contextFlags`.

---

## Scenario 3: Expired License Detection

### Steps:
1. Attach a license with an expired expiration date (`expirationDate: "2020-01-01"`).
2. Evaluate clearance for the occurrence/entity.
3. Verify rights coverage evaluation flags `isCovered: false` and `hasExpiringSoon: true` / `EXPIRED`, triggering trademark/copyright risk evaluation.
