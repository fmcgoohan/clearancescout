# Phase 0 Research: Feature 023 Workspace Restyle

**Feature**: Workspace Restyle (All Five Surfaces)  
**Spec**: [`spec.md`](spec.md)  
**Status**: Completed  

---

## Technical Investigations & Architecture Decisions

### 0. Visual Mockup Reference & Access Limitation Note
- **URL**: `https://claude.ai/code/artifact/c116e0ca-7ba8-4e7a-bbcf-80cd1211431b`
- **Access Limitation**: Direct HTTP retrieval returns an authenticated application container shell without rendered DOM content.
- **Resolution (Constitution Article 9)**: Per Constitution Article 9 (*Target Shipped Architecture*), reference implementations are visual and behavioral oracles, never architectural mandates. The written feature specification (`spec.md`), acceptance checklist, and DOM contracts serve as the canonical oracle for rendered visual outcomes, DOM classes, and behavioral criteria. The existing shipped TypeScript/React/Vite architecture remains 100% authoritative.

### 1. Token Architecture (`src/index.css`)
- **Requirement**: One single source of truth for all color, spacing, typography, and motion custom properties.
- **Decision**: Define all tokens strictly under `:root` in `src/index.css`. Component styles consume `var(--*)` exclusively. Any raw hex color `#xxx` inside a `.tsx` component file is treated as a violation of Constitution Article 1.

### 2. Unified SVG Icon Component (`src/components/icons/Icon.tsx`)
- **Requirement**: Purge all raw emojis across application chrome and enforce ban via static grep.
- **Decision**: Create a single `<Icon name="check-circle" className="..." />` component wrapping the inline stroke SVG icon set. Replace all raw emoji string literals in TSX files with `<Icon name="..." />` calls, enabling static scripts (`scripts/spec-check.sh`) to enforce a 100% zero-emoji rule across `src/**/*.tsx`.

### 3. Google Fonts Pairing & Monospace Confinement (Article 2)
- **Sans Font**: `Inter` loaded via `index.html`. Used for all UI chrome, tabular figures (`font-variant-numeric: tabular-nums`), and status badges.
- **Mono Font**: `Courier Prime` loaded via `index.html`. Reserved strictly for raw manuscript text (`ScriptViewer`) and raw event logs (`EventLog`).
- **Confinement Gate**: `scripts/spec-check.sh` enforces that `var(--font-mono)` or `font-family: monospace` is consumed by exactly two component files (`ScriptViewer.tsx` and `EventLog.tsx`).

### 4. Shared Modal Primitive & Body Scroll Lock
- **Requirement**: Consolidate scroll lock (`document.body.style.overflow = 'hidden'`), Esc key dismissal, and backdrop-click dismissal in one shared primitive.
- **Decision**: Maintain `useModalFocus.js` / `useBodyScrollLock.ts` as the central modal primitive. Migrate both `ProductionDashboardModal.tsx` and `ActionListModal.tsx` onto this shared hook, ensuring body scroll locking and keyboard/backdrop dismissal are implemented and tested in one central location.

### 5. Motion Rules & Reduced-Motion Collapse
- **Requirement**: Single initial page load sequence and max 1 looping signal on block state.
- **Decision**: Define all keyframes (`heroEntrance`, `pulseBlockSignal`) in `src/index.css`. Provide explicit `@media (prefers-reduced-motion: reduce)` block in `src/index.css` that resets animation duration to `0.01ms` and disables looping transitions.

### 6. Behavioral Verification via Playwright
- **Requirement**: Behavioral clauses (scroll lock, Esc/backdrop dismiss, resolve without layout shift) must be verified via E2E browser tests in a real browser.
- **Decision**: Implement Playwright test assertions in `tests/live_design_system_validation.js`:
  - Assert `document.body.style.overflow === 'hidden'` when `ProductionDashboardModal` or `ActionListModal` is open.
  - Assert press of `Escape` or click on `.modal-backdrop` closes the modal and restores `document.body.style.overflow`.
  - Assert task status change to `RESOLVED` in `ActionListModal` updates badge in place without changing row height or element offset position.

### 7. Static Spec Check Gate (`scripts/spec-check.sh`)
- **Decision**: `scripts/spec-check.sh` scans `src/**/*.tsx` and `src/**/*.css` for:
  - Emoji codepoints in TSX/CSS.
  - Hex colors outside token definition in `src/index.css`.
  - Monospace font usage outside `ScriptViewer` and `EventLog`.
  - More than 1 infinite CSS animation.
  - Missing `prefers-reduced-motion` or `:focus-visible` rules.
  - Unescaped `·`, `—`, or `<=` characters in markup.
