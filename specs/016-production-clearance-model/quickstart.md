# Quickstart Validation Guide: Production Clearance Operating Model (Phases 2 & 3)

**Feature**: `specs/016-production-clearance-model` | **Date**: 2026-08-19

---

## Scenario 1: Multi-Scene Occurrence Evaluation and Canonical Status Roll-up (Phase 2)

1. Create a production project:
   ```bash
   curl -X POST http://localhost:3000/api/projects \
     -H "Content-Type: application/json" \
     -d '{"title":"Cyberfall","productionCompany":"Apex","scriptVersion":"v1.0","projectType":"Movie","executionMode":"DEMO_MODE"}'
   ```
2. Ingest script with an entity appearing across Scene 1 (incidental use) and Scene 4 (tarnishing/dangerous context).
3. Trigger occurrence evaluation.
4. Verify:
   - Scene 1 occurrence evaluates to `NO_ISSUE_SURFACED`.
   - Scene 4 occurrence evaluates to `ACTION_REQUIRED`.
   - Canonical entity `overallClearanceStatus` automatically rolls up to `ACTION_REQUIRED`.
5. Apply a scene counsel override on Scene 4 to clear it.
6. Verify:
   - Scene 4 effective status becomes `NO_ISSUE_SURFACED`.
   - Canonical entity effective roll-up status updates to `NO_ISSUE_SURFACED`.

---

## Scenario 2: Alias Registration & Script Ingestion Entity Recognition (Phase 3)

1. Create a canonical entity:
   ```bash
   curl -X POST http://localhost:3000/api/projects/:id/entities \
     -H "Content-Type: application/json" \
     -d '{"canonicalName":"Summit Cola","entityCategory":"BRAND","description":"Flagship beverage mark"}'
   ```
2. Register an alias:
   ```bash
   curl -X POST http://localhost:3000/api/projects/:id/entities/:entityId/aliases \
     -H "Content-Type: application/json" \
     -d '{"alias":"Summit Pop"}'
   ```
3. Test resolution of an alias mention:
   ```bash
   curl -X POST http://localhost:3000/api/projects/:id/entities/resolve \
     -H "Content-Type: application/json" \
     -d '{"mention":"Summit Pop","category":"BRAND"}'
   ```
4. Verify response matches `canonicalEntityId` with `matchRule: "ALIAS_MATCH"` and `confidence: 0.95`.

---

## Scenario 3: Brand / Product Hierarchy Linking (Phase 3)

1. Create a child product entity (e.g. `Porsche 911 Turbo`).
2. Link to parent brand (`Porsche AG`):
   ```bash
   curl -X PATCH http://localhost:3000/api/projects/:id/entities/:childEntityId/relationship \
     -H "Content-Type: application/json" \
     -d '{"parentEntityId":":parentEntityId","relationshipType":"BRAND_PRODUCT"}'
   ```
3. Verify child entity reflects `parentEntityId` and `parentEntityName`.

---

## Scenario 4: Entity Merge and Occurrence Re-linking (Phase 3)

1. Ingest a script creating separate mentions `HyperFuel` in Scene 1 and `HyperFuel Can` in Scene 3.
2. Merge `HyperFuel Can` into `HyperFuel`:
   ```bash
   curl -X POST http://localhost:3000/api/projects/:id/entities/merge \
     -H "Content-Type: application/json" \
     -d '{"targetCanonicalEntityId":":targetId","sourceCanonicalEntityId":":sourceId"}'
   ```
3. Verify:
   - Target entity now holds all occurrences from both Scene 1 and Scene 3.
   - Target entity `aliases` contains `"HyperFuel Can"`.
   - Source entity is cleanly removed.
   - Derived canonical roll-up status reflects maximum severity across all combined occurrences.
