# Phase 0 Research: Feature 023 Workspace Restyle

**Feature**: Workspace Restyle (All Five Surfaces)  
**Spec**: [`spec.md`](spec.md)  
**Status**: Completed  

---

## Technical Investigations & Architecture Decisions

### 0. Visual Reference Oracle (`mockup-v3.html`)
- **Location**: `mockup-v3.html` (repo root)
- **Role (Constitution Article 9)**: Per Constitution Article 9 (*Target Shipped Architecture*), `mockup-v3.html` serves exclusively as a visual reference and acceptance oracle for rendered styling, layout metrics, custom properties, and keyframe animations.
- **Architectural Isolation**: `mockup-v3.html` MUST NOT be imported, served, or bundled in the React application code. No parallel HTML files are created.

### 1. Token Architecture (`src/index.css`)
- **Requirement**: One single source of truth for all color, spacing, typography, and motion custom properties, aligned with `mockup-v3.html`.
- **Token Map**:
  - `--bg`: `#0E1116`
  - `--panel`: `#151B23`
  - `--panel2`: `#111721`
  - `--border`: `#242E3A`
  - `--border-soft`: `#1C2530`
  - `--text`: `#E7EDF4`
  - `--muted`: `#8B97A7`
  - `--faint`: `#5C6878`
  - `--accent`: `#7C9CFF` (periwinkle brand accent)
  - `--accent-dim`: `#7C9CFF33`
  - `--ok`: `#4CC38A` / `--ok-bg`: `#4CC38A1A`
  - `--warn`: `#E5B454` / `--warn-bg`: `#E5B4541A`
  - `--crit`: `#E5646E` / `--crit-bg`: `#E5646E1F`
  - `--mono`: `'IBM Plex Mono', monospace`
  - `--font-sans`: `'Archivo', system-ui, sans-serif`
- **Enforcement**: Component styles in `src/**/*.tsx` consume `var(--*)` exclusively. Any raw hex color `#xxx` in TSX components is flagged as a Constitution Article 1 violation by `scripts/spec-check.sh`.

### 2. Unified SVG Icon Component (`src/components/icons/Icon.tsx`)
- **Requirement**: Purge all raw emojis across application chrome and enforce ban via static grep.
- **Decision**: Create a single `<Icon name="check-circle" className="..." />` component wrapping the inline stroke SVG icon set (stroke-width 1.8). Replace all raw emoji string literals in TSX files with `<Icon name="..." />` calls, enabling static scripts (`scripts/spec-check.sh`) to enforce a 100% zero-emoji rule across `src/**/*.tsx`.

### 3. Google Fonts Pairing & Monospace Confinement (Article 2)
- **Sans Font**: `Archivo` (variable width/weight `Archivo:wdth,wght@75..125,400..800`) loaded via `index.html`. Used for all UI chrome, tabular figures (`font-variant-numeric: tabular-nums`), and status badges.
- **Mono Font**: `IBM Plex Mono` loaded via `index.html`. Reserved strictly for raw manuscript text (`ScriptViewer`) and raw event logs (`EventLog`).
- **Confinement Gate**: `scripts/spec-check.sh` enforces that `var(--mono)` or `font-family: monospace` is consumed by exactly two component files (`ScriptViewer.tsx` and `EventLog.tsx`).

### 4. Shared Modal Primitive & Body Scroll Lock
- **Requirement**: Consolidate scroll lock (`document.body.style.overflow = 'hidden'`), Esc key dismissal, and backdrop-click dismissal in one shared primitive.
- **Decision**: Consolidate `useModalFocus.js` / `useBodyScrollLock.ts` in `Modal.tsx`. Migrate both `ProductionDashboardModal.tsx` and `ActionListModal.tsx` onto this shared primitive, ensuring body scroll locking and keyboard/backdrop dismissal are implemented and tested in one central location.

### 5. Motion Rules & Reduced-Motion Collapse
- **Requirement**: Staggered load sequence (`rise`, `pop`, `fade`) and max 1 looping signal (`pulse` on critical dot).
- **Decision**: Define keyframes in `src/index.css` matching `mockup-v3.html`:
  - `@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }`
  - `@keyframes pop { from { opacity: 0; transform: translateY(18px) scale(0.97); } to { opacity: 1; transform: none; } }`
  - `@keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 transparent; } 50% { box-shadow: 0 0 0 4px var(--crit-bg); } }`
- **Reduced Motion**: Provide explicit `@media (prefers-reduced-motion: reduce)` block in `src/index.css` that resets animation duration to `0.01ms` and disables looping transitions.

### 6. Behavioral Verification via Playwright
- **Requirement**: Behavioral clauses (scroll lock, Esc/backdrop dismiss, resolve without layout shift) must be verified via Playwright E2E browser tests.
- **Decision**: Implement Playwright test assertions in `tests/live_design_system_validation.js`:
  - Assert `document.body.style.overflow === 'hidden'` when `ProductionDashboardModal` or `ActionListModal` is open.
  - Assert press of `Escape` or click on `.overlay` closes the modal and restores `document.body.style.overflow`.
  - Assert task status change to `RESOLVED` in `ActionListModal` updates badge in place without changing row height or element offset position.

### 7. Static Spec Check Gate (`scripts/spec-check.sh`)
- **Decision**: `scripts/spec-check.sh` scans `src/**/*.tsx` and `src/**/*.css` for:
  - Emoji codepoints in TSX/CSS.
  - Hex colors outside token definition in `src/index.css`.
  - Monospace font usage outside `ScriptViewer` and `EventLog`.
  - More than 1 infinite CSS animation (`pulse`).
  - Missing `prefers-reduced-motion` or `:focus-visible` rules.
  - Unescaped `·`, `—`, or `<=` characters in markup.
