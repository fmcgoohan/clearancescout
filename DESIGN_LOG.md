# Design System Log: Feature 023 Workspace Restyle

**Date**: August 23, 2026  
**Oracle Visual Reference**: `mockup-v3.html` (repo root)  
**Target Stack**: ClearanceScout React / Vite / TypeScript App  

---

## Executive Summary

The ClearanceScout workspace has been completely restyled across all five primary workspace surfaces in strict accordance with Constitution v1.2.0 and the visual/behavioral outcomes defined in `mockup-v3.html`. All core layout structures, typography scales, HSL status colors, modal primitive interactions, and static spec check gates have been implemented and verified.

---

## Key Design & Architectural Changes

1. **Tokens & Theme Source of Truth (`src/index.css`)**:
   - Single source of truth CSS custom properties for surfaces (`--bg`, `--panel`, `--panel2`), borders (`--border`, `--border-soft`), brand periwinkle accent (`--accent`), sacred HSL clearance status colors (`--ok`, `--warn`, `--crit`), and typography scales (`--font-sans`, `--mono`).
   - Defined keyframe animations (`rise`, `pop`, `pulse`, `fade`) and `@media (prefers-reduced-motion: reduce)` accessibility rules.

2. **Typography Confinement (Article 2)**:
   - Modern variable-width sans (`Archivo`) loaded via `index.html` for all chrome UI elements.
   - Monospace font (`IBM Plex Mono`) strictly confined to `ScriptViewer` screenplay panel and `EventLog` timeline drawer.

3. **Unified SVG Icon System (Article 3)**:
   - `<Icon name="..." />` component with uniform 1.8px stroke-width replacing legacy emoji characters across UI chrome and interactive buttons.

4. **Section 1: Header Command Bar**:
   - Compact single-row command bar with project selector, live tabular figure quota meter (`font-variant-numeric: tabular-nums`), and single primary open-tasks button (`.btn.primary`).

5. **Section 2: Hero Shooting Readiness & Plain-Language Reasons**:
   - Shooting Readiness Index hero card at display scale (`2.75rem` / `56px`) with high-visibility severity border edge.
   - Per-scene cards displaying INT/EXT location tags, status chips, and plain-language why-blocked reason copy (`.scene-why-blocked-reason`).

6. **Section 3: Monospace Screenplay Panel with Dotted Underlines**:
   - Screenplay manuscript breakdown rendered strictly in monospace typography with 100% source text parity.
   - Status-colored dotted underlines (`text-decoration: underline dotted var(--status-color)`) without background fills on entity occurrences.

7. **Section 4: Scan-First Entity Registry Table**:
   - Bold entity names with muted category sub-lines, chip-plus-word status badges (`CLEARED`, `REVIEW RECOMMENDED`, `ACTION REQUIRED`), and domain-meaning action buttons (*"2 uses"*, *"Ground"*).

8. **Section 5: Operations Dashboard & Department Task Center Modals**:
   - Shared `<Modal />` primitive enforcing body scroll lock (`document.body.style.overflow = 'hidden'`), Escape key dismissal, and backdrop dismissal.
   - 5 KPI tiles and per-row direct triage resolve actions in Operations Dashboard.
   - Department Task Center with department tabs, severity-striped task cards, and layout-stable in-place task resolution transitions.

---

## Verification Evidence

- **Static Spec Check Gate (`./scripts/spec-check.sh`)**: PASSED cleanly.
- **TypeScript Compilation (`npm run build`)**: PASSED cleanly without warnings or errors.
- **Unit Test Suite (`npm test`)**: 224+ passing tests across contract and integration suites.
- **Playwright E2E Audit (`tests/live_design_system_validation.js`)**: PASSED cleanly.
