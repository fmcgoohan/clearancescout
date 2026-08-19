# Quickstart: Production Clearance Operating Model (Phase 7 Validation)

**Feature**: `specs/016-production-clearance-model` (Phase 7 Focus)  
**Date**: 2026-08-19  

---

## Scenario 1: Attach Music Placeholder with Key/BPM at `TEMP_APPROVED` Tier

### Steps:
1. Create a project and ingest screenplay with music mention ("Nocturne of the Wild").
2. Create music placeholder via `POST /api/projects/$PROJECT_ID/placeholders`:
   - `assetCategory: 'ART_MUSIC'`
   - `fictionalName: 'Echoes of the Wild'`
   - `clearanceTier: 'TEMP_APPROVED'`
   - `categoryDetails: { bpm: 110, key: 'D Minor', musicalStyle: 'Atmospheric Rock' }`
3. Evaluate Scene 1 readiness $\to$ Scene transitions to **`WORKING CLEAR`**.

---

## Scenario 2: Promote Music Placeholder to `FINAL_CLEARED`

### Steps:
1. Promote placeholder tier via `PATCH /api/projects/$PROJECT_ID/placeholders/$PLACEHOLDER_ID/tier` with `{ clearanceTier: 'FINAL_CLEARED' }`.
2. Evaluate Scene 1 readiness $\to$ Scene upgrades to **`FINAL CLEAR`**.

---

## Scenario 3: Attach Dialogue and Artwork Placeholders

### Steps:
1. Create dialogue placeholder with `categoryDetails: { alternativeLines: ['Line A', 'Line B'] }`.
2. Create artwork placeholder with `categoryDetails: { artistPrompt: 'Fictional cyberpunk skyline painting in acrylic style' }`.
3. Query placeholders `GET /api/projects/$PROJECT_ID/placeholders`.
4. Verify both placeholders retain category details and link accurately to canonical entities.
