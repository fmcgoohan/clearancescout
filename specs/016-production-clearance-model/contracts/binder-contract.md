# API Contract: Production Legal Clearance Binder (Feature 016 Phase 10)

**Feature**: `specs/016-production-clearance-model` (Phase 10 Focus)  
**Date**: 2026-08-19  

---

## 1. Export or Fetch Latest Legal Clearance Binder

### `GET /api/projects/:id/binder`
Returns latest compiled binder snapshot or compiles a new one on demand.

#### Response (200 OK):
```json
{
  "id": "bnd-1a2b3c4d",
  "projectId": "proj-12345",
  "projectSummary": {
    "projectId": "proj-12345",
    "projectType": "Movie",
    "title": "Neon Horizon",
    "productionCompany": "Entrant Studio",
    "scriptVersion": "v1.0",
    "totalScenes": 3,
    "finalClearScenes": 2,
    "workingClearScenes": 1,
    "redScenes": 0,
    "overallReadinessPercentage": 83.3,
    "totalEntities": 5,
    "clearedCount": 4,
    "actionRequiredCount": 0,
    "reviewRecommendedCount": 1,
    "activePlaceholdersCount": 1,
    "activeRightsCount": 1,
    "openActionsCount": 0,
    "overridesCount": 0
  },
  "provenanceSummary": {
    "liveCount": 0,
    "demoCount": 5,
    "fallbackCount": 0,
    "dominantProvenance": "DEMO_FIXTURE"
  },
  "scenes": [],
  "sceneReadinessSchedule": [],
  "canonicalEntities": [],
  "rightsAgreements": [],
  "placeholders": [],
  "unresolvedActions": [],
  "citationsIndex": [],
  "replacementCatalog": [],
  "overridesHistory": [],
  "exportedAt": "2026-08-19T17:45:00.000Z",
  "integrityDigest": "a3f5e9c7b1d4...",
  "disclaimer": "ClearanceScout provides workflow issue-spotting and clearance risk categorization. It does NOT render formal legal advice."
}
```

---

## 2. Compile Fresh Immutable Snapshot

### `POST /api/projects/:id/binder/export`
Compiles a new immutable snapshot with freshly calculated SHA-256 integrity digest and emits a `BINDER_EXPORT` SSE timeline event.

---

## 3. Download Formatted Markdown Binder

### `GET /api/projects/:id/binder/markdown`
Returns `Content-Type: text/markdown` with a clean, formatted Markdown document with tables for scene readiness, rights catalog, placeholders, and the SHA-256 verification seal.
