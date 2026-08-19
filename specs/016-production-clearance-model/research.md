# Research & Architectural Decisions: Production Clearance Operating Model (Phase 10)

**Feature**: `specs/016-production-clearance-model` (Phase 10 Focus)  
**Date**: 2026-08-19  
**Status**: Completed  

---

## 1. Comprehensive Legal Clearance Binder Architecture

### Context & Problem
For studio and network legal delivery, production counsel requires an immutable, audit-grade record capturing the complete lifecycle of clearance decisions across all departments:
1. **Contractual Rights Catalog**: Executed licenses, territory limitations, media windows, and expiration covenants.
2. **Generalized Placeholders**: On-set `TEMP_APPROVED` vs post-production `FINAL_CLEARED` fictional assets.
3. **Scene Readiness Schedule**: Scene-by-scene shoot clearance with exact occurrence blockers.
4. **Unresolved Action Items**: Outstanding to-dos for delivery sign-off.
5. **Citations & Provenance Index**: Exact web/trademark search references.
6. **Audit Immutability**: SHA-256 integrity digest ensuring tamper evidence.

```mermaid
graph TD
    BinderWorkflow[binderExportWorkflow.ts] --> ProjectRepo[ProjectRepo.ts]
    BinderWorkflow --> EntityRepo[EntityRepo.ts]
    BinderWorkflow --> RightsRepo[RightsRepo.ts]
    BinderWorkflow --> PlaceholderRepo[PlaceholderRepo.ts]
    BinderWorkflow --> SceneEngine[sceneReadinessEngine.ts]
    BinderWorkflow --> ActionRepo[ActionNotificationRepo.ts]
    BinderWorkflow --> OverrideRepo[OverrideRepo.ts]
    BinderWorkflow --> AssessmentRepo[AssessmentRepo.ts]
    BinderWorkflow --> Digest[SHA-256 Digest Generator]
    Digest --> Firestore[projects/{id}/binder_exports/{id}]
```

---

## 2. Cryptographic Integrity Digest Invariant

The SHA-256 digest is deterministically computed over the canonical exported JSON payload:
$$\text{Digest} = \text{SHA256}(\text{JSON.stringify}(\text{dataWithoutIdOrDigest}))$$
Any post-export modification to scenes, entities, rights, or placeholders invalidates the checksum, guaranteeing audit provenance for E&O insurance delivery.

---

## 3. Legal Disclaimer Invariant

All exported binder artifacts (JSON, Markdown, UI views) MUST include the standard legal notice:
> **Notice**: *ClearanceScout provides workflow issue-spotting and clearance risk categorization. It does NOT render formal legal advice. Production counsel should independently review all chain-of-title and rights documents prior to distribution.*
