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

### 5. Google Fonts Pairing Justification (Article 2)
- **Variable Sans**: `Inter` (variable-width sans-serif, weights 400–800).
  - *Justification*: Unmatched clarity for dense tabular metadata, built-in `tabular-nums` support for financial and quota counters, neutral visual posture that preserves emphasis for sacred HSL status badges.
- **Monospace**: `Courier Prime` (monospace).
  - *Justification*: The gold standard screenplay font designed specifically for screenwriting formatting. Provides exact 10 CPI layout fidelity for Fountain manuscript parsing and strict monospace provenance for raw API/JSON logs.

### 6. Dark-Only Committed Theme Rationale
- **Decision**: Committed dark-only color palette defined strictly via CSS custom properties on `:root` in `src/index.css`.
- **Justification**: Film clearance operators evaluate high-density legal, rights, and screenplay metadata under controlled studio lighting. A committed dark theme prevents visual fatigue, eliminates background glare, and maximizes the visual salience of HSL status badges (`--status-no-issue`, `--status-review`, `--status-action`).

### 7. Static Spec Check Gate (`scripts/spec-check.sh`)
- **Decision**: Create `scripts/spec-check.sh` automated gate script using `perl` and `grep` to enforce static invariants:
  - Fails on raw emojis in markup/TSX.
  - Fails on hex color literals outside `src/index.css` token definitions.
  - Fails if more than 1 infinite CSS animation is defined.
  - Fails if `@media (prefers-reduced-motion)` or `:focus-visible` rules are missing.
  - Fails on raw `·`, `—`, or `<=` characters in markup (must use HTML entities `&middot;`, `&mdash;`, `&le;`).

---

## Performance & Accessibility Validation

- **Color Contrast**: All HSL status color tokens in `src/index.css` meet WCAG AAA / AA contrast ratios against dark theme backgrounds.
- **Keyboard Trapping & Focus**: All interactive buttons, tabs, and inputs display visible `outline` focus rings (`:focus-visible`) when navigated via keyboard.
- **Zero Emoji Compliance**: All icons render as clean, accessible `<svg>` elements with `aria-hidden="true"` or explicit `aria-label`.
- **Browser DOM Behavioral Assertions**: Modal scroll lock (`document.body.style.overflow === 'hidden'`) and Escape-to-close behavior verified via Playwright browser assertions in `tests/live_design_system_validation.js`.
