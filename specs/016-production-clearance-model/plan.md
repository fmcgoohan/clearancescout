# Implementation Plan: Production Clearance Operating Model (Phase 4 - Rights & Restrictions Domain Objects)

**Branch**: `016-production-clearance-model` | **Date**: 2026-08-19 | **Status**: Plan Complete (Phase 4 Focus)  
**Specification**: [`specs/016-production-clearance-model/spec.md`](spec.md)

---

## 1. Summary of Feature & Phase 4 Scope

Phase 4 upgrades the clearance operating model by establishing **Rights & Restrictions as first-class domain records** (`FR-005`, `US4`). This connects research issue-spotting with actual contractual licenses, territorial grants, media distribution windows, expiration dates, and restrictive covenants linked to entities and occurrences.

### Core Objectives (Phase 4 Only):
1. **Rights & Restrictions Domain Modeling (`FR-005`, `US4`)**:
   - Create `RightsRecordData` domain model with structured fields:
     - `id`: string (`rgt-...`)
     - `projectId`: string
     - `canonicalEntityId`: string
     - `occurrenceIds?: string[]` (empty or omitted = applies to all occurrences of the entity; non-empty = applies to specified scene occurrences)
     - `licensorName`: string (e.g. *"Sony Music Publishing"*, *"Summit Beverages LLC"*)
     - `grantType`: `'EXCLUSIVE' | 'NON_EXCLUSIVE' | 'FAIR_USE' | 'PUBLIC_DOMAIN' | 'PROD_MADE'`
     - `territory`: `'WORLDWIDE' | 'NORTH_AMERICA' | 'EUROPE' | 'US_ONLY' | 'SPECIFIED_COUNTRIES'`
     - `territoryDetails?: string`
     - `mediaWindow`: `'ALL_MEDIA_IN_PERPETUITY' | 'THEATRICAL_SVOD' | 'THEATRICAL_ONLY' | 'LINEAR_TV' | 'FESTIVAL_ONLY' | 'DIGITAL_PROMO'`
     - `effectiveDate`: string (ISO date `YYYY-MM-DD`)
     - `expirationDate?: string` (ISO date `YYYY-MM-DD`, null if in-perpetuity)
     - `isPerpetual`: boolean
     - `covenants?: string[]` (contractual restrictions, e.g. *"Must not be depicted alongside violent acts"*, *"End credits attribution required"*)
     - `feeAmount?: number`, `currency?: string`
     - `documentReferenceUrl?: string` (executed contract attachment/path)
     - `status`: `'ACTIVE' | 'PENDING_SIGNATURE' | 'EXPIRED' | 'REVOKED'`
2. **Rights Repository Layer (`server/repositories/RightsRepo.ts`)**:
   - Implement complete CRUD and evaluation queries in `RightsRepo`:
     - `createRightsRecord`, `getRightsRecordById`, `getRightsByProject`, `getRightsByEntity`, `getRightsByOccurrence`, `updateRightsRecord`, `deleteRightsRecord`.
     - `evaluateRightsCoverage(projectId, canonicalEntityId, occurrenceId, queryDate)`: Computes deterministic license validity, checks territorial/media coverage, detects expiration status, and gathers active contractual covenants.
3. **Rights Clearance & Evaluator Integration (`server/workflows/clearanceEvaluator.ts`)**:
   - In `evaluateOccurrenceClearance` and `evaluateEntityClearance`:
     - Evaluate whether active rights exist for the entity / occurrence.
     - When active valid license is present, incorporate license grant and covenants into `contextFlags` and deterministic risk evaluation (e.g. `NO_ISSUE_SURFACED` with license grant summary, or `REVIEW_RECOMMENDED` if contractual covenants require legal inspection).
4. **REST API Endpoints (`server/api/rightsRoutes.ts`)**:
   - `POST /api/projects/:id/rights`
   - `GET /api/projects/:id/rights`
   - `GET /api/projects/:id/entities/:entityId/rights`
   - `GET /api/projects/:id/rights/:rightsId`
   - `PATCH /api/projects/:id/rights/:rightsId`
   - `DELETE /api/projects/:id/rights/:rightsId`
5. **Frontend Rights UX (`src/components/RightsModal.tsx`)**:
   - Provide interactive modal to create, view, edit, and revoke rights records.
   - Display rights coverage badges in `EntityRegistryTable.tsx` (`📜 Rights: Worldwide (In Perpetuity)`) and `EntityDetailModal.tsx`.
6. **Preserve Invariants (003–015 & Phases 1–3)**:
   - 100% preservation of project types, occurrence-level evaluations, derived roll-ups, aliases, parent brand hierarchies, counsel overrides, and SSE timeline streams.
7. **Strict Scope Boundary**:
   - Phases 5 through 10 (scene readiness state machine, actions queue, placeholders, live self-clearance loop, etc.) remain strictly unbuilt until Phase 4 is implemented and converged.

---

## 2. Constitution Check

| Principle | Status | Compliance Details |
|:---|:---:|:---|
| **I. Agent Framework & Model Standard** | **PASS** | AI evaluation reasons over deterministic mathematical rights coverage and dates using Gemini 3.6 Flash. |
| **II. Live Grounding & Research Tooling** | **PASS** | Contractual rights records retain provenance links and license source citations without hallucination. |
| **III. Architecture & Cloud Persistence** | **PASS** | Rights records stored in Firestore under `projects/{projectId}/rights/{rightsId}` via `RightsRepo.ts`. |
| **IV. Canonical Entity & Risk Invariant** | **PASS** | Rights link to canonical entities and specific scene occurrences; covenants trigger contextual review. |
| **V. Multi-Tier Execution Modes** | **PASS** | Test, demo, and cloud modes supported; deterministic expiration and coverage checks operate identically. |
| **Observable Action Timeline** | **PASS** | Emits `STATE_TRANSITION` events upon rights creation, coverage updates, and expiration alerts without CoT leakage. |

---

## 3. Implementation Phases & Artifacts

- **Phase 0: Research & Architecture** ([`specs/016-production-clearance-model/research.md`](research.md))
- **Phase 1: Data Model & Schema** ([`specs/016-production-clearance-model/data-model.md`](data-model.md))
- **Phase 1: Interface Contracts** ([`specs/016-production-clearance-model/contracts/rights-contract.md`](contracts/rights-contract.md))
- **Phase 1: Quickstart Validation Guide** ([`specs/016-production-clearance-model/quickstart.md`](quickstart.md))

---

## 4. Touchpoints & Target Modules

- `server/repositories/RightsRepo.ts`:
  - New repository for rights records: CRUD operations, occurrence linking, and `evaluateRightsCoverage`.
- `server/api/rightsRoutes.ts`:
  - Express router for rights management endpoints mounted at `/api`.
- `server/workflows/clearanceEvaluator.ts`:
  - Incorporate `RightsRepo.evaluateRightsCoverage` into occurrence and canonical clearance assessment logic.
- `src/components/RightsModal.tsx`:
  - New React modal for viewing, creating, and updating rights records and covenants.
- `src/components/EntityRegistryTable.tsx` & `src/components/EntityDetailModal.tsx`:
  - Display rights status badges, license grants, and covenants.
- `tests/contract/test_rights_management.test.ts`:
  - Contract test validating rights CRUD, occurrence linking, and coverage query responses.
- `tests/integration/rights_clearance_workflow.test.ts`:
  - End-to-end integration test verifying that attaching a license clears risk and enforces contractual covenants across scene occurrences.
