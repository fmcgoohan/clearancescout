# Phase 0 Research: Feature 023 Workspace Restyle

**Feature**: Workspace Restyle (All Five Surfaces)
**Spec**: [`spec.md`](spec.md)
**Status**: Completed

---

## Technical Investigations & Decisions

### 1. Single Command Bar Collapse (Section 1)
- **Question**: How to collapse the multi-row header into a single command bar while maintaining responsive adaptability down to 600px?
- **Decision**: Restructure `src/App.tsx` header toolbar into a single flex container (`display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px`). Set `font-variant-numeric: tabular-nums` on the quota counter to ensure stable numeral layout. Use exactly one primary `.btn-primary` button page-wide (pointing to open tasks with a live count badge).

### 2. High-Contrast Hero Readiness & Plain-Language Reasons (Section 2)
- **Question**: How to structure the Shooting Readiness Index hero card and scene cards to guarantee display-scale typography and human-readable reasons?
- **Decision**: Elevate the readiness index in `src/pages/WorkspacePage.tsx` with display typography (`font-size: 2.75rem`, `font-weight: 800`) and a severity border edge (`border-left: 4px solid var(--status-color)`). Transform raw system reasons into domain-specific, producer-focused plain language (e.g., *"Hazard placard artwork needs rights or replacement"*).

### 3. Legal Monospace Zone & Dotted Underline Highlights (Section 3)
- **Question**: How to enforce monospace typography on script content while rendering non-disruptive entity occurrences?
- **Decision**: In `src/components/ScriptViewer.tsx`, retain `.fountain-script` with `font-family: var(--font-mono)` (`Courier Prime`). Style entity occurrences using `text-decoration: underline dotted var(--status-color)` with `background-color: transparent`. Render a single highlight legend once above the script panel.

### 4. Scan-First Entity Registry Table (Section 4)
- **Question**: How to streamline the entity registry table for rapid visual scanning by clearance coordinators?
- **Decision**: In `src/components/EntityRegistryTable.tsx`, format the first column with bold entity title (`font-weight: 600`) and category as a muted sub-line (`font-size: 0.75rem`, `color: var(--text-muted)`). Render status badges as chip-plus-word badges (`.badge`). Label right-aligned action buttons by domain meaning (*"2 uses"*, *"Ground"*, *"Compare"*). Purge all emojis and monospace fonts from table chrome.

### 5. Modals & Body Scroll Lock Invariants (Section 5 & Regression Clause)
- **Question**: How to ensure modal overlays present high-density KPI metrics and task triage while strictly locking body scroll?
- **Decision**: In `src/components/ProductionDashboardModal.tsx` and `src/components/ActionListModal.tsx`, maintain 5 KPI tiles and row-level triage controls. Ensure all 13 modal components invoke `useModalFocus` (which encapsulates `useBodyScrollLock`), setting `document.body.style.overflow = 'hidden'` when open and restoring original overflow on dismissal via Escape key, backdrop click, or close button (`✕`).

---

## Performance & Accessibility Validation

- **Color Contrast**: All HSL status color tokens in `src/index.css` meet WCAG AAA / AA contrast ratios against dark theme backgrounds.
- **Keyboard Trapping & Focus**: All interactive buttons, tabs, and inputs display visible `outline` focus rings when navigated via keyboard.
- **Zero Emoji Compliance**: All icons render as clean, accessible `<svg>` elements with `aria-hidden="true"` or explicit `aria-label`.
