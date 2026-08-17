# Data Model Specification: ClearanceScout MVP Engine

**Feature**: `specs/002-clearancescout-mvp`  
**Date**: 2026-08-17  
**Persistence**: Google Cloud Firestore (Native Mode)

---

## Firestore Collection Topology

```text
projects/{projectId}
├── scenes/{sceneId}
│   └── occurrences/{occurrenceId}
├── entities/{canonicalEntityId}
├── assessments/{assessmentId}
├── replacements/{replacementId}
├── events/{eventId}
└── binder_exports/{exportId}
```

---

## Entity Schemas

### 1. Project (`projects`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Primary key (`proj-xxxx`) |
| `title` | string | Yes | Project title |
| `productionCompany` | string | Yes | Studio / production company |
| `scriptVersion` | string | Yes | Screenplay version draft |
| `scriptFormat` | string | Yes | `PLAINTEXT` \| `FOUNTAIN` \| `PDF` |
| `executionMode` | string | Yes | `TEST_MODE` \| `DEMO_MODE` \| `CLOUD_MODE` |
| `createdAt` | string (ISO-8601) | Yes | Creation timestamp |
| `updatedAt` | string (ISO-8601) | Yes | Last update timestamp |

---

### 2. Scene (`projects/{projectId}/scenes`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Primary key (`scene-xxxx`) |
| `projectId` | string | Yes | Parent project ID |
| `sceneNumber` | number | Yes | Scene order number |
| `heading` | string | Yes | Full slugline (e.g. `INT. DINER - NIGHT`) |
| `locationType` | string | Yes | `INT` \| `EXT` \| `INT/EXT` |
| `locationName` | string | Yes | Setting name (e.g. `DINER`, `CITY STREET`) |
| `timeOfDay` | string | Yes | `DAY` \| `NIGHT` \| `CONTINUOUS` |
| `rawText` | string | Yes | Complete scene text |
| `characterActionSummary` | string | Yes | Action and character dialogue summary |

---

### 3. CanonicalEntity (`projects/{projectId}/entities`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Primary key (`ent-xxxx`) |
| `projectId` | string | Yes | Parent project ID |
| `canonicalName` | string | Yes | Normalized name (e.g. `Coca-Cola`) |
| `category` | string | Yes | `BRAND` \| `ART_MUSIC` \| `PUBLIC_FIGURE` \| `PROPRIETARY_LOCATION` \| `GRAPHIC_PROP` |
| `description` | string | Yes | Brief description of the real-world entity |
| `overallClearanceStatus` | string | Yes | `NO_ISSUE_SURFACED` \| `REVIEW_RECOMMENDED` \| `ACTION_REQUIRED` \| `INSUFFICIENT_EVIDENCE` |
| `createdAt` | string (ISO-8601) | Yes | Creation timestamp |
| `updatedAt` | string (ISO-8601) | Yes | Last update timestamp |

---

### 4. SceneEntityOccurrence (`projects/{projectId}/scenes/{sceneId}/occurrences`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Primary key (`occ-xxxx`) |
| `sceneId` | string | Yes | Parent scene ID |
| `canonicalEntityId` | string | Yes | Linked canonical entity ID |
| `scriptLineNumber` | number | Yes | Line number in script |
| `excerptText` | string | Yes | Verbatim text mention |
| `usageContext` | string | Yes | Scene context description |
| `sentimentScore` | number | Yes | Computed polarity (-1.0 to 1.0) |
| `exposureDurationSeconds` | number | Yes | Estimated screen exposure time |

---

### 5. ClearanceRiskAssessment (`projects/{projectId}/assessments`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Primary key (`asm-xxxx`) |
| `occurrenceId` | string | Yes | Linked occurrence ID |
| `canonicalEntityId` | string | Yes | Linked canonical entity ID |
| `sceneId` | string | Yes | Linked scene ID |
| `riskStatus` | string | Yes | `NO_ISSUE_SURFACED` \| `REVIEW_RECOMMENDED` \| `ACTION_REQUIRED` \| `INSUFFICIENT_EVIDENCE` |
| `riskScore` | number (0-100) | Yes | Computed risk score |
| `legalRationale` | string | Yes | Legal issue-spotting analysis |
| `contextFlags` | string[] | Yes | Array of risk indicators (e.g. `["DEFAMATION_RISK", "UNAUTHORIZED_MUSIC"]`) |
| `citations` | object[] | Yes | Array of embedded `ClearanceCitation` records |
| `evaluatedAt` | string (ISO-8601) | Yes | Evaluation timestamp |
| `disclaimer` | string | Yes | Non-legal-advice legal disclaimer |

---

### 6. ClearanceCitation (Embedded Struct)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Citation ID (`cit-xxxx`) |
| `sourceUrl` | string | Yes | Live search source URL |
| `query` | string | Yes | Query string executed |
| `retrievedAt` | string (ISO-8601) | Yes | Retrieval timestamp |
| `excerptSnippet` | string | Yes | Grounded factual excerpt |
| `registrationStatus` | string | Yes | `REGISTERED_ACTIVE` \| `PENDING` \| `EXPIRED` \| `UNKNOWN` |
| `corporateOwner` | string | Yes | Registered trademark / copyright owner |

---

### 7. ReplacementConceptCard (`projects/{projectId}/replacements`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Primary key (`rep-xxxx`) |
| `canonicalEntityId` | string | Yes | Linked canonical entity ID |
| `fictionalBrandName` | string | Yes | Fictional non-infringing brand name |
| `designBrief` | string | Yes | Prop design packaging brief |
| `eraAesthetic` | string | Yes | Era / genre aesthetic alignment |
| `artworkImageUrl` | string | Yes | Imagen 3 concept artwork image URL |
| `nonInfringementRationale` | string | Yes | Rationale explaining non-infringement |
| `status` | string | Yes | `PROPOSED` \| `APPROVED` \| `REJECTED` |
| `createdAt` | string (ISO-8601) | Yes | Creation timestamp |

---

### 8. ClearanceBinderExport (`projects/{projectId}/binder_exports`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Primary key (`bnd-xxxx`) |
| `projectId` | string | Yes | Linked project ID |
| `projectSummary` | object | Yes | Title, company, version, total scenes & entities |
| `scenes` | object[] | Yes | Scene list with occurrence details |
| `canonicalEntities` | object[] | Yes | Full canonical registry with risk verdicts |
| `citationsIndex` | object[] | Yes | Complete list of all research citations |
| `replacementCatalog` | object[] | Yes | Catalog of approved replacement cards |
| `exportedAt` | string (ISO-8601) | Yes | Timestamp of export |
| `auditSignature` | string | Yes | SHA-256 integrity hash of export |
