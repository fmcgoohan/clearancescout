# Quickstart & Validation Guide: ClearanceScout MVP Engine

**Feature**: `specs/002-clearancescout-mvp`  
**Date**: 2026-08-17  

---

## 1. Setup & Environment Selection

```bash
# Set execution mode (TEST_MODE | DEMO_MODE | CLOUD_MODE)
export EXECUTION_MODE=DEMO_MODE

# Install dependencies (if not already installed)
npm install
```

---

## 2. Validation Scenario 1: Multi-Format Ingestion & 5-Category Resolution

**Goal**: Verify Plaintext, Fountain, and PDF ingestion with 5-category entity extraction.

```bash
# Create project
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Action Thriller","productionCompany":"Apex","scriptVersion":"v1","executionMode":"DEMO_MODE"}'

# Upload Fountain/Text script with multi-category items
curl -X POST http://localhost:8080/api/projects/{projectId}/script \
  -H "Content-Type: application/json" \
  -d '{"scriptText":"INT. COFFEE SHOP - DAY\nALEX drinks Coca-Cola while listening to Bohemian Rhapsody on an Apple MacBook.\n\nEXT. CITY STREET - NIGHT\nJORDAN drives a Porsche past the Empire State Building holding a can of Coca-Cola.","format":"FOUNTAIN"}'
```

**Expected Outcome**:
- `scenesParsed` = 2.
- Multiple mentions of "Coca-Cola" / "can of Coca-Cola" resolved to 1 canonical entity ("Clear once, recognize everywhere").
- 5 categories recognized (`BRAND`, `ART_MUSIC`, `PROPRIETARY_LOCATION`).

---

## 3. Validation Scenario 2: Grounded Trademark Research & Risk Engine

**Goal**: Verify live grounding citations and 4-status clearance assignment.

```bash
curl -X POST http://localhost:8080/api/projects/{projectId}/clearance/evaluate \
  -H "Content-Type: application/json" \
  -d '{"canonicalEntityIds":["{entityId}"]}'
```

**Expected Outcome**:
- Returns `riskStatus`: `ACTION_REQUIRED` / `REVIEW_RECOMMENDED`.
- Citations array includes `sourceUrl` and `corporateOwner`.
- Response contains mandatory non-legal-advice disclaimer.

---

## 4. Validation Scenario 3: Replacement Brand & Artwork Concept Card

**Goal**: Verify era-appropriate replacement brand name and visual concept card generation.

```bash
curl -X POST http://localhost:8080/api/projects/{projectId}/replacements/generate \
  -H "Content-Type: application/json" \
  -d '{"canonicalEntityId":"{entityId}","eraAesthetic":"Modern Thriller"}'
```

**Expected Outcome**:
- Returns `fictionalBrandName` (e.g., "Summit Cola").
- Returns `artworkImageUrl` and `nonInfringementRationale`.

---

## 5. Validation Scenario 4: Auditable Clearance Binder Export

**Goal**: Verify generation and export of the complete auditable Clearance Binder.

```bash
curl -X GET http://localhost:8080/api/projects/{projectId}/binder/export
```

**Expected Outcome**:
- Returns complete JSON export with `projectSummary`, `scenes`, `canonicalEntities`, `citationsIndex`, `replacementCatalog`, `auditSignature`, and `exportedAt` timestamp.
