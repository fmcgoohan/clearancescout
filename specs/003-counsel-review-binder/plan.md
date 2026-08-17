# Implementation Architecture Plan: Clearance Binder Export & Studio Counsel Review Module

**Branch**: `003-counsel-review-binder` | **Date**: 2026-08-18 (Updated) | **Spec**: [`specs/003-counsel-review-binder/spec.md`](spec.md)  
**Governance**: Constitution v1.0.0

---

## 1. Summary & Architecture Strategy

This feature introduces the **Studio Counsel Review & Clearance Binder Export** module to ClearanceScout, enabling legal teams to review, override, and print clearance binders with strict human-in-the-loop integrity:

1. **Scene-Specific Override Isolation & Hierarchical Status Resolution**:
   - REST endpoints & Firestore storage for manual counsel status overrides (canonical project-wide and scene-specific).
   - **Isolation Invariant**: A scene-specific override (`sceneId` present) records in `OverrideRepo` for that scene and **must never mutate the canonical entity's `isOverridden` or `overallClearanceStatus` fields**.
   - **Hierarchical Effective Status Resolver**:
     $$\text{Effective Status} = \text{Scene Override} \;\;??\;\; \text{Canonical Entity Override} \;\;??\;\; \text{Automated Risk Assessment}$$
   - **Anti-Overwrite Invariant**: Automated re-evaluation (`clearanceEvaluator`) MUST NEVER overwrite an active counsel override. Baseline automated scores and citations are refreshed in the background, but the counsel's manual decision remains authoritative.
   - Audit trail capturing counsel name, previous status, new status, optional scene scope, timestamp, and mandatory legal rationale.
   - Real-time `OVERRIDE_RECORDED` event broadcast over SSE.
2. **Result-Grounded Evidence Provenance & Accurate Mixed Binder Aggregation**:
   - Evidence provenance is determined directly by the actual search outcome (`PARALLEL_LIVE`, `DEMO_FIXTURE`, `FALLBACK_FIXTURE`).
   - Binder export compiles a `provenanceSummary` tallying `{ liveCount, demoCount, fallbackCount, dominantProvenance }` across all citations, ensuring mixed evidence is accurately presented rather than inferred from a single citation.
3. **Unpopulated Counsel Identity Input**:
   - Zero hardcoded fictional attorney identities.
   - Form inputs start unpopulated with guidance placeholders (`placeholder="e.g. Jane Doe, Esq."`) to enforce authentic human entry.
4. **Multi-Scene In-Script Visual Highlighter with Scene Context Propagation**:
   - `ScriptViewer.tsx` calculates in-script badge colors using the resolved scene-specific effective status for that exact scene.
   - Clicking an in-script badge propagates `(entityId, sceneId)` through `WorkspacePage` and `App` into `CitationDrawer`, automatically binding the drawer to the active scene context.
5. **Downloadable & Printable Legal Clearance Binder with SHA-256 Integrity Digest**:
   - Enhanced `BinderRepo` and `binderExportWorkflow` computing an unkeyed SHA-256 `integrityDigest` over normalized payload data.
   - Formatted `BinderExportModal` equipped with `@media print` styling, page break rules, and print-to-PDF capabilities.

---

## 2. Directory Structure & File Touchpoints

```text
clearancescout/
├── server/
│   ├── api/
│   │   ├── clearanceRoutes.ts      # Enforce scene override isolation: do not mutate canonical entity if sceneId present
│   │   └── binderRoutes.ts         # Update binder export endpoint with integrityDigest & provenanceSummary
│   ├── repositories/
│   │   ├── OverrideRepo.ts         # Counsel override Firestore repository with optional sceneId
│   │   ├── EntityRepo.ts           # Protect isOverridden entities and support hierarchical resolution
│   │   └── BinderRepo.ts           # Binder schema with provenanceSummary & integrityDigest
│   ├── workflows/
│   │   ├── clearanceEvaluator.ts   # Enforce override protection and actual result provenance tagging
│   │   ├── binderExportWorkflow.ts # Compute provenanceSummary tally and integrityDigest
│   │   └── effectiveStatusResolver.ts # Pure hierarchical resolver function
│   ├── tools/
│   │   └── parallelSearchTool.ts   # Return actual ProvenanceType (PARALLEL_LIVE, DEMO_FIXTURE, FALLBACK_FIXTURE)
│   └── events/
│       └── timelineEmitter.ts      # OVERRIDE_RECORDED event type
│
├── src/
│   ├── components/
│   │   ├── ScriptViewer.tsx        # In-line badges using resolved scene-specific status; propagate (entityId, sceneId) on click
│   │   ├── CitationDrawer.tsx      # Clean override form (with sceneId context) & actual provenance badges
│   │   ├── EntityRegistryTable.tsx # Display "Overridden by Counsel" badge
│   │   └── BinderExportModal.tsx   # Display SHA-256 integrityDigest and mixed provenance breakdown
│   └── pages/
│       └── WorkspacePage.tsx       # Propagate selectedSceneId to CitationDrawer on script badge click
│
└── tests/
    ├── contract/
    │   ├── test_counsel_override.test.ts   # Contract test for scene override isolation & anti-overwrite invariant
    │   ├── test_binder_export.test.ts      # Contract test verifying integrityDigest & provenanceSummary
    │   └── test_script_highlighter.test.ts # Contract test for scene-resolved script highlighting
    └── integration/
        └── counsel_review_workflow.test.ts # Integration test for hierarchical override, scene isolation, and integrity digest
```

---

## 3. Constitution Compliance & Quality Gates

| Principle | Requirement | Design Compliance |
|-----------|-------------|-------------------|
| **I. ADK & Gemini Standards** | Backend AI models strictly in `server/` | Zero client-side AI calls; AI provides baseline, human counsel overrides with full auditability. |
| **II. Live Grounding** | Grounding with exact source provenance | Provenance is grounded in actual search result; binder computes aggregated `provenanceSummary`. |
| **III. Isolation & Persistence** | Backend in `server/`, Firestore persistence | Overrides persisted in `projects/{projectId}/overrides` via `OverrideRepo`. |
| **IV. Clearance Invariant & Disclaimer** | 4 statuses & prominent disclaimer | Disclaimer rendered in Binder export modal and print preview; 4 statuses enforced for overrides. |
| **V. Multi-Tier Modes** | `TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE` | Automated re-evaluations respect active counsel overrides deterministically in all execution modes. |
| **VI. Observable Timeline & CoT Privacy** | SSE streaming without raw CoT | `OVERRIDE_RECORDED` event emitted with clean payload; zero CoT exposed. |

---

## 4. Phased Implementation Plan

- **Phase 1: Scene Override Isolation in Backend**: Update `clearanceRoutes.ts` so that when `sceneId` is provided, `entityRepo.updateCanonicalEntityOverride` is skipped.
- **Phase 2: Aggregated Mixed Provenance in Binder**: Update `BinderRepo.ts` and `binderExportWorkflow.ts` to compute `provenanceSummary: { liveCount, demoCount, fallbackCount, dominantProvenance }`.
- **Phase 3: Scene Context Propagation in Frontend**: Update `ScriptViewer.tsx`, `WorkspacePage.tsx`, `App.tsx`, and `CitationDrawer.tsx` to propagate `sceneId` on entity badge click and render scene-resolved badge colors.
- **Phase 4: Contract & Integration Testing**: Add automated contract and integration tests proving scene override isolation and mixed binder provenance.
