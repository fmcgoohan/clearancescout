# Interface Contract: Feature 018 Production Hardening & Live Evidence Integrity

**Feature Branch**: `018-production-hardening`  
**Created**: 2026-08-20  
**Status**: Completed

---

## 1. Clearance Evaluation Contract

### `POST /api/projects/:id/clearance/evaluate`

Evaluates entity and occurrence clearance with fail-closed cloud integrity, authentic live zero-hit handling, and Gemini structured occurrence context.

#### Request Body
```json
{
  "canonicalEntityIds": ["entity-123"],
  "sceneId": "scene-1",
  "occurrenceId": "occ-456"
}
```

#### Response Body (`200 OK`)
```json
{
  "assessments": [
    {
      "id": "asm-789",
      "canonicalEntityId": "entity-123",
      "status": "INSUFFICIENT_EVIDENCE",
      "riskScore": 95,
      "provenance": "FALLBACK_FIXTURE",
      "citations": [
        {
          "sourceName": "Trademark Registry Offline Fallback",
          "query": "Summit Cola",
          "provenance": "FALLBACK_FIXTURE",
          "notes": "Live search unavailable in CLOUD_MODE. Fails closed to INSUFFICIENT_EVIDENCE."
        }
      ],
      "occurrenceContext": {
        "prominence": "HERO_FOREGROUND",
        "modality": "VISUAL_PROP",
        "tone": "DISPARAGING",
        "endorsementImplication": true,
        "safetyHazardDepiction": false,
        "defamationRisk": true
      },
      "legalRationale": "Evaluated in CLOUD_MODE. External research returned fallback data. Status set to INSUFFICIENT_EVIDENCE."
    }
  ]
}
```

---

## 2. Granular Scoped Placeholder Management Contract

### `POST /api/projects/:id/placeholders`

Creates or updates a replacement placeholder scoped to specific occurrences, scenes, or project-wide.

#### Request Body
```json
{
  "canonicalEntityId": "entity-123",
  "suggestedName": "NovaTech Zenith",
  "placeholderTier": "TEMP_APPROVED",
  "visualDescription": "Sleek fictional matte-silver notebook with glowing cyan ring logo.",
  "rationale": "Temporary art department prop for scene 1 interior office.",
  "scopeType": "SELECTED_SCENES",
  "sceneIds": ["scene-1"],
  "occurrenceIds": [],
  "isProjectWide": false
}
```

#### Response Body (`201 Created`)
```json
{
  "id": "pl-456",
  "projectId": "proj-001",
  "canonicalEntityId": "entity-123",
  "canonicalName": "AeroTech Prism Laptop",
  "suggestedName": "NovaTech Zenith",
  "placeholderTier": "TEMP_APPROVED",
  "approvalDate": "2026-08-20T01:52:00.000Z",
  "visualDescription": "Sleek fictional matte-silver notebook with glowing cyan ring logo.",
  "rationale": "Temporary art department prop for scene 1 interior office.",
  "scopeType": "SELECTED_SCENES",
  "occurrenceIds": [],
  "sceneIds": ["scene-1"],
  "isProjectWide": false
}
```

---

## 3. PDF Script Ingestion & Visible Failure Contract

### `POST /api/projects/:id/script`

Uploads and parses a screenplay in Plaintext, Fountain, or PDF format.

#### Success Response (`200 OK`)
```json
{
  "message": "Script parsed and canonical entities populated",
  "scenesCount": 3,
  "entitiesCount": 7,
  "occurrencesCount": 11
}
```

#### Error Response for Scanned / Corrupt PDF (`400 Bad Request`)
```json
{
  "error": "Unable to extract text from PDF. The document may be a scanned image or encrypted. Please provide a text-based PDF, Fountain, or Plaintext screenplay.",
  "code": "PDF_EXTRACTION_FAILED"
}
```

---

## 4. `CLOUD_MODE` Demo Boundary Contract

### `POST /api/projects/:id/script/demo`

Ingests *"The Neon Horizon"*. In `CLOUD_MODE`, parses scenes and discovers entities without injecting fake fixture assessments, fake rights, or synthetic readiness.

#### Response Body in `CLOUD_MODE` (`200 OK`)
```json
{
  "message": "Loaded sample screenplay in CLOUD_MODE without synthetic fixtures. Ready for live research.",
  "projectId": "proj-001",
  "provenance": "PARALLEL_LIVE",
  "scenesCount": 3,
  "entitiesCount": 7,
  "evaluationsCount": 0,
  "activeRightsCount": 0,
  "activePlaceholdersCount": 0,
  "readinessSummary": {
    "totalScenes": 3,
    "redScenesCount": 3,
    "workingClearScenesCount": 0,
    "finalClearScenesCount": 0,
    "overallReadinessPercentage": 0
  }
}
```
