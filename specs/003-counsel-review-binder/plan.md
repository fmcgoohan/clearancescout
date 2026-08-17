# Implementation Architecture Plan: Clearance Binder Export & Studio Counsel Review Module

**Branch**: `003-counsel-review-binder` | **Date**: 2026-08-17 | **Spec**: [`specs/003-counsel-review-binder/spec.md`](spec.md)  
**Governance**: Constitution v1.0.0

---

## 1. Summary & Architecture Strategy

This feature introduces the **Studio Counsel Review & Clearance Binder Export** module to ClearanceScout, enabling legal teams to review, override, and print clearance binders:

1. **Counsel Decision Override Subsystem**:
   - REST endpoints & Firestore storage for manual counsel status overrides.
   - Audit trail capturing counsel name, previous status, new status, timestamp, and non-empty legal rationale.
   - Real-time `OVERRIDE_RECORDED` event broadcast over SSE.
2. **Multi-Scene In-Script Visual Highlighter**:
   - Dynamic regex-based text tokenization in `ScriptViewer.tsx` mapping entity occurrences to color-coded badges.
   - Synchronized click handling that focuses the registry and slides open the `CitationDrawer`.
3. **Downloadable & Printable Legal Clearance Binder**:
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
│   │   ├── OverrideRepo.ts         # NEW: Counsel override Firestore repository
│   │   ├── EntityRepo.ts           # Update CanonicalEntity with isOverridden and latestOverride
│   │   └── BinderRepo.ts           # Update binder aggregation with overridesHistory
│   ├── workflows/
│   │   └── binderExportWorkflow.ts # Include override logs in compiled binder payload
│   └── events/
│       └── timelineEmitter.ts      # Add OVERRIDE_RECORDED event type
│
├── src/
│   ├── components/
│   │   ├── ScriptViewer.tsx        # Add in-line visual entity highlighter badges
│   │   ├── CitationDrawer.tsx      # Add Counsel Override form & history tab
│   │   ├── EntityRegistryTable.tsx # Display "Overridden by Counsel" badge
│   │   └── BinderExportModal.tsx   # Add printable @media print layout and overrides section
│   └── pages/
│       └── WorkspacePage.tsx       # Connect script badge clicks to citation/override drawer
│
└── tests/
    └── contract/
        ├── test_counsel_override.test.ts   # NEW: Contract test for counsel overrides
        └── test_script_highlighter.test.ts # NEW: Contract test for script highlighting
```

---

## 3. Constitution Compliance & Quality Gates

| Principle | Requirement | Design Compliance |
|-----------|-------------|-------------------|
| **I. ADK & Gemini Standards** | Backend AI models strictly in `server/` | Zero client-side AI calls; AI provides baseline, human counsel overrides with full auditability. |
| **II. Live Grounding** | Grounding with exact source provenance | Citation drawer retains USPTO/web URLs while adding human counsel override justifications. |
| **III. Isolation & Persistence** | Backend in `server/`, Firestore persistence | Overrides persisted in `projects/{projectId}/overrides` via `OverrideRepo`. |
| **IV. Clearance Invariant & Disclaimer** | 4 statuses & prominent disclaimer | Disclaimer rendered in Binder export modal and print preview; 4 statuses enforced for overrides. |
| **V. Multi-Tier Modes** | `TEST_MODE`, `DEMO_MODE`, `CLOUD_MODE` | Overrides and script highlighter operate deterministically in all modes. |
| **VI. Observable Timeline & CoT Privacy** | SSE streaming without raw CoT | `OVERRIDE_RECORDED` event emitted with clean payload; zero CoT exposed. |

---

## 4. Phased Implementation Plan

- **Phase 1: Setup & Data Models**: Implement `OverrideRepo.ts` and update `EntityRepo.ts` with override fields.
- **Phase 2: Backend Overrides API**: Implement `POST/GET /api/projects/:id/entities/:entityId/override` and SSE broadcaster event.
- **Phase 3: Visual In-Script Highlighter**: Update `ScriptViewer.tsx` to highlight entity occurrences with clickable risk badges.
- **Phase 4: Counsel Review & Override UI**: Add override form and audit history to `CitationDrawer.tsx` and `EntityRegistryTable.tsx`.
- **Phase 5: Enhanced Clearance Binder & Print Styles**: Update `BinderRepo.ts` and `BinderExportModal.tsx` with printable styling and override tables.
- **Phase 6: Integration Testing & Verification**: Write contract and integration tests in `tests/contract/`.
