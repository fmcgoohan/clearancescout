# Research & Architectural Decisions: Production Clearance Operating Model (Phase 4)

**Feature**: `specs/016-production-clearance-model` (Phase 4 Focus)  
**Date**: 2026-08-19  
**Status**: Completed  

---

## 1. Rights & Restrictions Domain Model Architecture

### Context & Problem
In studio film and television productions, legal clearances are governed not only by baseline intellectual property doctrines (e.g. fair use, incidental use), but primarily by **executed contractual agreements** (sync licenses, trademark release forms, location agreements, appearance releases). 

Clearance software must treat Rights and Restrictions as first-class domain entities capable of linking either to the global canonical entity or to specific scene occurrences, while capturing territorial boundaries, media distribution windows, expiration dates, and restrictive covenants.

### Decision
Implement `RightsRecordData` in a dedicated repository `server/repositories/RightsRepo.ts` with Firestore collection `projects/{projectId}/rights/{rightsId}`.

```typescript
export interface RightsRecordData {
  id: string;
  projectId: string;
  canonicalEntityId: string;
  occurrenceIds?: string[]; // Empty = all occurrences of entity; or specific occurrences
  licensorName: string;
  grantType: 'EXCLUSIVE' | 'NON_EXCLUSIVE' | 'FAIR_USE' | 'PUBLIC_DOMAIN' | 'PROD_MADE';
  territory: 'WORLDWIDE' | 'NORTH_AMERICA' | 'EUROPE' | 'US_ONLY' | 'SPECIFIED_COUNTRIES';
  territoryDetails?: string;
  mediaWindow: 'ALL_MEDIA_IN_PERPETUITY' | 'THEATRICAL_SVOD' | 'THEATRICAL_ONLY' | 'LINEAR_TV' | 'FESTIVAL_ONLY' | 'DIGITAL_PROMO';
  effectiveDate: string;
  expirationDate?: string;
  isPerpetual: boolean;
  covenants?: string[];
  feeAmount?: number;
  currency?: string;
  documentReferenceUrl?: string;
  status: 'ACTIVE' | 'PENDING_SIGNATURE' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
  updatedAt: string;
}
```

### Rationale
1. **Explicit Granularity**: Allows studio counsel to grant project-wide rights (e.g. hero vehicle purchased with worldwide rights) or scene-specific rights (e.g. music synchronization clearance for Scene 12 only).
2. **Deterministic Expiration Calculation**: Standardized ISO dates (`YYYY-MM-DD`) enable TypeScript code to perform deterministic expiration checks (`expirationDate < today`) and compute warning horizons.
3. **Covenants Tracking**: Contractual negative/positive covenants (e.g. *"Must not be consumed by antagonist"*, *"End credit mandatory"*) are captured structuredly so evaluation engines and counsel review workflows highlight compliance conditions.

---

## 2. Deterministic Rights Coverage & Evaluator Integration

### Context & Problem
When an entity or occurrence is evaluated by `clearanceEvaluator.ts`, how should contractual rights modify the risk status?

### Decision
`clearanceEvaluator.ts` invokes `rightsRepo.evaluateRightsCoverage(projectId, entityId, occurrenceId)`.

1. **Active Perpetual / In-Window License**:
   - If `status === 'ACTIVE'` and (`isPerpetual` or `expirationDate >= now`):
     - If no restrictive covenants exist: verdict resolves to `NO_ISSUE_SURFACED` with rationale citing the executed agreement (`"Covered by active license from [LicensorName]"`).
     - If covenants exist: verdict resolves to `REVIEW_RECOMMENDED` or `NO_ISSUE_SURFACED` with covenants flagged in `contextFlags: ["COVENANT: End credit required"]`.
2. **Expired / Revoked License**:
   - If license is expired or revoked: flags `LICENSE_EXPIRED` and falls back to baseline trademark/copyright risk evaluation.
3. **Pending Signature**:
   - Status remains `REVIEW_RECOMMENDED` (`"Clearance agreement pending signature from [LicensorName]"`).

### Rationale
This matches the constitution's **Deterministic Calculation Pattern**: deterministic code computes the mathematical date deltas and status checks, while Gemini/evaluator uses the output to formulate the legal risk rationale.

---

## 3. REST API Contract Design

### Endpoints:
- `POST /api/projects/:id/rights`: Register new rights/license record.
- `GET /api/projects/:id/rights`: List all project rights records.
- `GET /api/projects/:id/entities/:entityId/rights`: List rights records attached to a specific entity.
- `GET /api/projects/:id/rights/:rightsId`: Retrieve a single rights record.
- `PATCH /api/projects/:id/rights/:rightsId`: Update rights record details or covenants.
- `DELETE /api/projects/:id/rights/:rightsId`: Delete/revoke rights record.

---

## 4. Alternatives Considered

| Approach | Assessment | Decision |
|:---|:---|:---|
| **Embed Rights in CanonicalEntityData** | Inflexible for multi-license arrangements (e.g. separate sync license for Scene 4 and master license for Scene 8). | **Rejected**: Dedicated `RightsRecordData` collection provides clean relational links and auditability. |
| **Store Rights only in Counsel Overrides** | Overrides are counsel interventions rather than formal license agreements with financial/territorial terms. | **Rejected**: Overrides reference legal judgment; Rights records represent contractual reality. |
| **Complex Rights Expression Language (REL)** | Over-engineering that complicates standard film clearance without operational benefit. | **Rejected**: Standardized enums (`territory`, `mediaWindow`, `grantType`) + string covenants provide 100% of required expressiveness. |
