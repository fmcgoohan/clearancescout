# Implementation Architecture Plan: Clearance Binder Export & Studio Counsel Review Module

**Branch**: `003-counsel-review-binder` | **Date**: 2026-08-18 (Updated) | **Spec**: [`specs/003-counsel-review-binder/spec.md`](spec.md)  
**Governance**: Constitution v1.0.0

---

## 1. Summary & Architecture Strategy

This feature introduces the **Studio Counsel Review & Clearance Binder Export** module to ClearanceScout, enabling legal teams to review, override, and print clearance binders with strict human-in-the-loop integrity:

1. **Hierarchical Counsel Override & Anti-Overwrite Subsystem**:
   - REST endpoints & Firestore storage for manual counsel status overrides (canonical project-wide and scene-specific).
   - **Hierarchical Effective Status Resolver**:
     $$\text{Effective Status} = \text{Scene Override} \;\;??\;\; \text{Canonical Entity Override} \;\;??\;\; \text{Automated Risk Assessment}$$
   - **Anti-Overwrite Invariant**: Automated re-evaluation (`clearanceEvaluator`) MUST NEVER overwrite an active counsel override (`isOverridden === true`). Baseline automated scores and citations are refreshed in the background, but the counsel's manual decision remains authoritative.
   - Audit trail capturing counsel name, previous status, new status, optional scene scope, timestamp, and mandatory legal rationale.
   - Real-time `OVERRIDE_RECORDED` event broadcast over SSE.
2. **Result-Grounded Evidence Provenance & Fail-Visible Fallbacks**:
   - Evidence provenance is determined directly by the actual search outcome:
     - `PARALLEL_LIVE`: Live Parallel Search API succeeded in `CLOUD_MODE`.
     - `DEMO_FIXTURE`: Intentionally running synthetic fixtures in `DEMO_MODE` / `TEST_MODE`.
     - `FALLBACK_FIXTURE`: Parallel Search was attempted in `CLOUD_MODE` but failed or had missing credentials, falling back with a visible amber warning banner.
   - Synthetic/fallback evidence is never mislabeled as "Live Parallel-Web".
3. **Unpopulated Counsel Identity Input**:
   - Zero hardcoded fictional attorney identities.
   - Form inputs start unpopulated with guidance placeholders (`placeholder="e.g. Jane Doe, Esq."`) to enforce authentic human entry.
4. **Multi-Scene In-Script Visual Highlighter**:
   - Dynamic regex-based text tokenization in `ScriptViewer.tsx` mapping entity occurrences to color-coded badges using hierarchical effective status.
   - Synchronized click handling that focuses the registry and slides open the `CitationDrawer`.
5. **Downloadable & Printable Legal Clearance Binder with SHA-256 Integrity Digest**:
   - Enhanced `BinderRepo` and `binderExportWorkflow` computing an unkeyed SHA-256 `integrityDigest` over normalized payload data.
   - Formatted `BinderExportModal` equipped with `@media print` styling, page break rules, and print-to-PDF capabilities.

---

## 2. Directory Structure & File Touchpoints

```text
clearancescout/
├── server/
│   ├── api/
│   │   ├── clearanceRoutes.ts      # Add POST/GET override endpoints (canonical & scene-specific)
│   │   └── binderRoutes.ts         # Update binder export endpoint with integrityDigest & provenance
│   ├── repositories/
│   │   ├── OverrideRepo.ts         # Counsel override Firestore repository with optional sceneId
│   │   ├── EntityRepo.ts           # Protect isOverridden entities and support hierarchical resolution
│   │   └── BinderRepo.ts           # Update binder aggregation with overridesHistory & integrityDigest
│   ├── workflows/
│   │   ├── clearanceEvaluator.ts   # Enforce override protection and actual result provenance tagging
│   │   ├── binderExportWorkflow.ts # Include override logs and compute integrityDigest
│   │   └── effectiveStatusResolver.ts # Pure hierarchical resolver function
│   ├── tools/
│   │   └── parallelSearchTool.ts   # Return actual ProvenanceType (PARALLEL_LIVE, DEMO_FIXTURE, FALLBACK_FIXTURE)
│   └── events/
│       └── timelineEmitter.ts      # OVERRIDE_RECORDED event type
│
├── src/
│   ├── components/
│   │   ├── ScriptViewer.tsx        # In-line visual entity highlighter badges with effective status
│   │   ├── CitationDrawer.tsx      # Clean override form (with scene scope option) & actual provenance badges
│   │   ├── EntityRegistryTable.tsx # Display "Overridden by Counsel" badge
│   │   └── BinderExportModal.tsx   # Display SHA-256 integrityDigest and actual provenance labels
│   └── pages/
│       └── WorkspacePage.tsx       # Connect script badge clicks to citation/override drawer
│
└── tests/
    ├── contract/
    │   ├── test_counsel_override.test.ts   # Contract test for hierarchical overrides & anti-overwrite invariant
    │   ├── test_binder_export.test.ts      # Contract test verifying integrityDigest
    │   └── test_script_highlighter.test.ts # Contract test for script highlighting
    └── integration/
        └── counsel_review_workflow.test.ts # Integration test for hierarchical override and integrity digest
```

---

## 3. Constitution Compliance & Quality Gates

| Principle | Requirement | Design Compliance |
|-----------|-------------|-------------------|
| **I. ADK & Gemini Standards** | Backend AI models strictly in `server/` | Zero client-side AI calls; AI provides baseline, human counsel overrides with full auditability. |
| **II. Live Grounding** | Grounding with exact source provenance | Provenance is grounded in actual search result: `PARALLEL_LIVE`, `DEMO_FIXTURE`, or `FALLBACK_FIXTURE`. |
| **III. Isolation & Persistence** | Backend in `server/`, Firestore persistence | Overrides persisted in `projects/{projectId}/overrides` via `OverrideRepo`. |
| **IV. Clearance Invariant & Disclaimer** | 4 statuses & prominent disclaimer | Disclaimer rendered in Binder export modal and print preview; 4 statuses enforced for overrides. |
| **V. Multi-Tier Modes** | `TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE` | Automated re-evaluations respect active counsel overrides deterministically in all execution modes. |
| **VI. Observable Timeline & CoT Privacy** | SSE streaming without raw CoT | `OVERRIDE_RECORDED` event emitted with clean payload; zero CoT exposed. |

---

## 4. Phased Implementation Plan

- **Phase 1: Actual Result Provenance in Tools & Workflows**: Update `parallelSearchTool.ts` and `clearanceEvaluator.ts` to return explicit `ProvenanceType`.
- **Phase 2: Hierarchical Effective Status Resolver**: Implement `effectiveStatusResolver.ts` and integrate with `EntityRepo.ts`, `ScriptViewer.tsx`, and `binderExportWorkflow.ts`.
- **Phase 3: SHA-256 Integrity Digest Refactor**: Rename `auditSignature` to `integrityDigest` across backend repositories, workflows, export modal, and test suites.
- **Phase 4: Contract & Integration Testing**: Update test suites to verify hierarchical scene overrides, actual result provenance tagging, and `integrityDigest` verification.
