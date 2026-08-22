# Research & Design Decisions: Restyle ClearanceScout UI to Constitution v1.1.0

## 1. CSS Custom Properties & Semantic Color Architecture (Article 1)

- **Decision**: Define all design system tokens as HSL-based CSS custom properties in `src/index.css` under `:root`.
- **Rationale**:
  - Semantic status colors MUST exist exclusively for clearance risk levels:
    - Green (`--color-status-green`: `hsl(142, 71%, 45%)` / `--bg-status-green`: `hsl(142, 71%, 95%)`) for `CLEARED` / `WORKING_CLEAR`.
    - Amber (`--color-status-amber`: `hsl(38, 92%, 50%)` / `--bg-status-amber`: `hsl(38, 92%, 95%)`) for `REVIEW_RECOMMENDED`.
    - Red (`--color-status-red`: `hsl(354, 70%, 54%)` / `--bg-status-red`: `hsl(354, 70%, 95%)`) for `BLOCKS_SHOOTING` / `ACTION_REQUIRED`.
  - Brand accent: Single Slate-Cyan (`--color-brand-accent`: `hsl(215, 25%, 27%)` / `--color-brand-interactive`: `hsl(217, 91%, 60%)`) for non-status chrome.
  - Zero raw hex codes in component files; all JSX style/class utilities reference CSS tokens.

## 2. Chrome Typography & Text Artifact Provenance (Article 2)

- **Decision**: Import Inter Variable Font for all UI chrome (`font-family: 'Inter', system-ui, sans-serif`) with a strict type scale (`--font-size-xs` to `--font-size-3xl`). Reserve `font-family: 'Courier Prime', monospace` exclusively for screenplay text viewer blocks (`.fountain-script`) and raw event logs (`.json-log`).
- **Rationale**: Establishes immediate visual distinction between screenplay source text artifacts and operational application chrome.

## 3. Inline Stroke SVG Icon System (Article 3)

- **Decision**: Create lightweight, reusable React SVG icon components (`src/components/icons/`) with `fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"`.
- **Rationale**: Completely eliminates emoji characters in buttons, navigation bars, headers, tabs, and modal titles while preserving zero-dependency SVG performance.

## 4. Hero Readiness Index & Per-Scene Blocked Hierarchy (Article 4)

- **Decision**: Redesign the workspace header and Operations Dashboard modal to feature a prominent Shooting Readiness Index Hero Card (large 3rem metric font, high contrast slate surface, status-tinted accent badge) and per-scene why-blocked callouts rendered at the top of blocked scene cards.
- **Rationale**: Delivers immediate, high-contrast clarity on whether the film is clear to shoot and why specific scenes are blocked.

## 5. Motion Orchestration & Accessibility (Article 5)

- **Decision**: Implement a single `@keyframes heroEntrance` animation on initial load. Restrict looping animations to `@keyframes pulseBlockSignal` applied exclusively to red `BLOCKS_SHOOTING` badges. Ensure `@media (prefers-reduced-motion: reduce)` disables all animations (`animation: none !important`, `transition: none !important`).
- **Rationale**: Adheres to strict motion budgets while delivering a dynamic, live feel for critical production blockers.

## 6. Status Text Pairing (Article 6)

- **Decision**: Require every status badge component (`StatusBadge.tsx`, `RiskBadge.tsx`) to pair semantic status color with explicit text labels ("Cleared", "Review Recommended", "Blocks Shooting", "Action Required", "Research Required").
- **Rationale**: Guarantees colorblind accessibility and eliminates color-only status communication.

## 7. Body Scroll Lock & HTML Entity Defect Laws (Article 7)

- **Decision**: Implement a central `useBodyScrollLock` hook (integrated directly into `useModalFocus`) that increments/decrements an active modal open count and sets `document.body.style.overflow = 'hidden'` when count > 0. Replace raw non-ASCII typographic characters with safe HTML entities (`&mdash;`, `&rdquo;`, `&lsquo;`, `&nbsp;`).
- **Rationale**: Prevents background scroll leaking on open modals and guarantees defect-free typography across all web servers.

## 8. Append-Only Design Log (Article 8)

- **Decision**: Maintain [`DESIGN_LOG.md`](../../DESIGN_LOG.md) as an append-only ledger documenting every design revision, rationale, and verification test result.
- **Rationale**: Guarantees full auditability and constitutional compliance.
