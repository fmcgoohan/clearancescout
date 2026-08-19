# Quickstart: Production Clearance Operating Model (Phase 10 Validation)

**Feature**: `specs/016-production-clearance-model` (Phase 10 Focus)  
**Date**: 2026-08-19  

---

## Scenario 1: Export Comprehensive Legal Clearance Binder

### Steps:
1. Ingest multi-scene screenplay with brands, music, and prop placeholders.
2. Attach 1 rights agreement (`THEATRICAL_SVOD`, 60 days expiration).
3. Attach 1 music placeholder (`TEMP_APPROVED` "Echoes of Midnight").
4. Execute `POST /api/projects/$PROJECT_ID/binder/export`.
5. Verify response payload contains:
   - `integrityDigest`: 64-character SHA-256 hex string.
   - `projectSummary`: Project type, readiness percentage, total scenes, and entity counts.
   - `rightsAgreements`: Populated with the 60-day rights contract.
   - `placeholders`: Populated with the music placeholder.
   - `sceneReadinessSchedule`: Scene schedule with working vs final statuses.
   - `unresolvedActions`: List of open actions.
   - `disclaimer`: Legal disclaimer string.
   - `exportedAt`: Valid ISO timestamp.

---

## Scenario 2: Download Formatted Markdown Clearance Binder

### Steps:
1. Execute `GET /api/projects/$PROJECT_ID/binder/markdown`.
2. Verify response is `text/markdown` containing:
   - Header with Project Title, Type, and Production Company.
   - Table of Scene Readiness Schedule.
   - Table of Contractual Rights & Restrictions.
   - Table of Fictional Replacements & Placeholders.
   - SHA-256 Cryptographic Checksum seal.
