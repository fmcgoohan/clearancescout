# Implementation Architecture Plan: Clearance Binder Export & Studio Counsel Review Module

**Branch**: `003-counsel-review-binder` | **Date**: 2026-08-18 (Updated) | **Spec**: [`specs/003-counsel-review-binder/spec.md`](spec.md)  
**Governance**: Constitution v1.0.0

---

## 1. Summary & Architecture Strategy

This feature introduces the **Studio Counsel Review & Clearance Binder Export** module to ClearanceScout, enabling legal teams to review, override, and print clearance binders with strict human-in-the-loop integrity:

1. **Counsel Decision Override Subsystem with Anti-Overwrite Invariant**:
   - REST endpoints & Firestore storage for manual counsel status overrides.
   - **Critical Invariant**: Automated re-evaluation (`clearanceEvaluator`) MUST NEVER overwrite an active counsel override (`isOverridden === true`). Baseline automated scores and citations are refreshed, but the counsel's manual decision remains authoritative.
   - Audit trail capturing counsel name, previous status, new status, timestamp, and mandatory legal rationale.
   - Real-time `OVERRIDE_RECORDED` event broadcast over SSE.
2. **Transparent Evidence Provenance Attribution**:
   - In `DEMO_MODE` and `TEST_MODE`, research citations are clearly identified as **"Demo Fixture Research Evidence (Synthetic Dataset)"**, never "Live Parallel-Web Citations".
   - In `CLOUD_MODE`, research citations are labeled as **"Live Parallel-Web Grounded Research Citations"**.
3. **Unpopulated Counsel Identity Input**:
   - Removal of fictional pre-populated lawyer identities (e.g. "Morgan Vance, Esq.").
   - Form inputs start unpopulated with guidance placeholders to enforce intentional counsel data entry.
4. **Multi-Scene In-Script Visual Highlighter**:
   - Dynamic regex-based text tokenization in `ScriptViewer.tsx` mapping entity occurrences to color-coded badges.
   - Synchronized click handling that focuses the registry and slides open the `CitationDrawer`.
5. **Downloadable & Printable Legal Clearance Binder**:
   - Enhanced `BinderRepo` and `binderExportWorkflow` including override history and SHA-256 signatures.
   - Formatted `BinderExportModal` equipped with `@media print` styling, page break rules, and print-to-PDF capabilities.

---

## 2. Directory Structure & File Touchpoints

```text
clearancescout/
├── server/
│   ├── api/
│   │   ├── clearanceRoutes.ts      # Add POST/GET override endpoints
│   │   └── binderRoutes.ts         # Update binder export endpoint with override history
│   ├── repositories/
│   │   ├── OverrideRepo.ts         # Counsel override Firestore repository
│   │   ├── EntityRepo.ts           # Protect isOverridden entities from automated overwrites
│   │   └── BinderRepo.ts           # Update binder aggregation with overridesHistory
│   ├── workflows/
│   │   ├── clearanceEvaluator.ts   # Enforce override protection during automated re-eval
│   │   └── binderExportWorkflow.ts # Include override logs in compiled binder payload
│   └── events/
│       └── timelineEmitter.ts      # OVERRIDE_RECORDED event type
│
├── src/
│   ├── components/
│   │   ├── ScriptViewer.tsx        # In-line visual entity highlighter badges
│   │   ├── CitationDrawer.tsx      # Clean override form (no pre-populated lawyer) & mode-aware citation labels
│   │   ├── EntityRegistryTable.tsx # Display "Overridden by Counsel" badge
│   │   └── BinderExportModal.tsx   # Mode-aware evidence labels and @media print layout
│   └── pages/
│       └── WorkspacePage.tsx       # Connect script badge clicks to citation/override drawer
│
└── tests/
    ├── contract/
    │   ├── test_counsel_override.test.ts   # Contract test for counsel overrides & anti-overwrite invariant
    │   └── test_script_highlighter.test.ts # Contract test for script highlighting
    └── integration/
        └── counsel_review_workflow.test.ts # Integration test for override persistence across re-eval
```

---

## 3. Constitution Compliance & Quality Gates

| Principle | Requirement | Design Compliance |
|-----------|-------------|-------------------|
| **I. ADK & Gemini Standards** | Backend AI models strictly in `server/` | Zero client-side AI calls; AI provides baseline, human counsel overrides with full auditability. |
| **II. Live Grounding** | Grounding with exact source provenance | Provenance is accurately attributed: "Live Parallel-Web" in CLOUD_MODE, "Demo Fixture" in DEMO_MODE. |
| **III. Isolation & Persistence** | Backend in `server/`, Firestore persistence | Overrides persisted in `projects/{projectId}/overrides` via `OverrideRepo`. |
| **IV. Clearance Invariant & Disclaimer** | 4 statuses & prominent disclaimer | Disclaimer rendered in Binder export modal and print preview; 4 statuses enforced for overrides. |
| **V. Multi-Tier Modes** | `TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE` | Automated re-evaluations respect active counsel overrides deterministically in all execution modes. |
| **VI. Observable Timeline & CoT Privacy** | SSE streaming without raw CoT | `OVERRIDE_RECORDED` event emitted with clean payload; zero CoT exposed. |

---

## 4. Phased Implementation Plan

- **Phase 1: Anti-Overwrite Invariant & Entity Protection**: Update `EntityRepo.ts` and `clearanceEvaluator.ts` so `updateCanonicalEntityStatus` preserves `overallClearanceStatus` when `isOverridden === true`.
- **Phase 2: Transparent Evidence Attribution**: Update `CitationDrawer.tsx`, `BinderExportModal.tsx`, and `binderExportWorkflow.ts` to reflect demo fixture vs live search mode.
- **Phase 3: Clean Counsel Identity Input**: Remove pre-populated lawyer identities in `CitationDrawer.tsx` and ensure form validation requires active input.
- **Phase 4: Contract & Integration Testing**: Add tests verifying that automated re-evaluation does not overwrite an active counsel override and verify demo mode evidence labeling.
