# Research & Decisions: Clearance Binder Export & Studio Counsel Review Module

**Feature**: `specs/003-counsel-review-binder` | **Date**: 2026-08-17

---

## 1. In-Script Visual Tokenization & Highlighting

### Problem Statement
Screenplays have structured dialogue headers, character cues, and action blocks. Highlighting entities in real-time must preserve exact word boundaries, avoid corrupting punctuation or capitalization, handle multiple entities in a single line, and remain high-performance on large multi-scene scripts.

### Decisions
- **Decision**: Tokenize screenplay scene text using regex boundary matching (`\b`) mapped to canonical entities and scene occurrences. Replace matches with accessible `<mark>` or `<span>` badge components styled with CSS design tokens.
- **Rationale**: Pure regex tokenization in React maintains sub-10ms rendering per scene without requiring heavyweight AST re-parsing of the entire screenplay text.
- **Alternatives Considered**:
  - Full Draft.js / Slate.js rich-text editor AST (rejected: adds unnecessary complex editor state when the viewer is read-only).
  - Dangerous `dangerouslySetInnerHTML` string manipulation (rejected: prone to XSS and breaks React click handlers).

---

## 2. Counsel Decision Override Persistence & Auditing

### Problem Statement
Automated risk scoring spots issues, but human studio attorneys make final risk determinations. How should overrides be stored, versioned, and reflected across the canonical registry, scene occurrences, and binder exports?

### Decisions
- **Decision**: Store overrides in an immutable `overrides` subcollection under `projects/{projectId}/overrides` and maintain `effectiveClearanceStatus` + `latestOverride` reference directly on `CanonicalEntity` and `Occurrence`.
- **Rationale**: Guarantees O(1) query performance for UI rendering while preserving a permanent, tamper-evident audit history of every human legal decision.
- **Alternatives Considered**:
  - Overwriting the automated risk assessment in-place (rejected: destroys original AI baseline and compromises audit trail).
  - Ephemeral client-side state (rejected: overrides must persist in Firestore across production sessions and binder exports).

---

## 3. Printable Legal Clearance Binder & Cryptographic Verification

### Problem Statement
Distribution contracts and insurance underwriters need printable binder PDFs and machine-readable JSON exports. How should PDF generation be implemented efficiently on Cloud Run?

### Decisions
- **Decision**: Provide structured `.json` export and an interactive printable HTML modal with dedicated `@media print` CSS rules (page breaks, clean cover sheets, high-contrast tables, E&O disclaimers) allowing direct browser "Print to PDF".
- **Rationale**: Zero backend Chromium/Puppeteer overhead, instant sub-second rendering, fully responsive, and supports standard studio browser printing workflows.
- **Alternatives Considered**:
  - Headless Puppeteer server-side generation (rejected: high memory footprint, cold starts, and container bloat on Cloud Run).
  - Client-side Canvas rendering via jsPDF (rejected: fuzzy text rendering and poor pagination control for complex multi-page tables).
