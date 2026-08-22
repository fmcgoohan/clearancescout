# Implementation Plan: Feature 023 Workspace Restyle

**Branch**: `023-workspace-restyle` | **Date**: 2026-08-23 | **Spec**: [`spec.md`](spec.md)

---

## Summary

Restyle all five surfaces of the shipped ClearanceScout workspace (Toolbar Command Bar, Readiness Band Hero, Monospace Screenplay Panel, Scan-First Entity Registry, Operations Dashboard & Task Center Modals) in the real React/TypeScript/Vite application. Uses `mockup-v3.html` (repo root) solely as a rendered visual reference and acceptance oracle per Constitution Article 9 (*Target Shipped Architecture*). Do not introduce parallel HTML pages or import `mockup-v3.html` into the app bundle. All tokens reside in `src/index.css`, iconography routes through a unified stroke SVG `<Icon name="..." />` component, monospace typography is strictly confined to `ScriptViewer` and `EventLog`, and modal dialogs share a single modal primitive enforcing body scroll lock and Esc/backdrop dismissal.

---

## Technical Context

**Language/Version**: TypeScript 5.5+, React 18, Vite 5.4  
**Primary Dependencies**: React 18, Unified Stroke SVG Icon Component, Vitest, Playwright  
**Storage**: Google Cloud Firestore (backend state), React local state & custom hooks  
**Testing**: Vitest (`npm test`), Playwright E2E browser tests (`tests/live_design_system_validation.js`), `scripts/spec-check.sh` static gate  
**Target Platform**: Web browsers (Chrome, Safari, Firefox, Edge) desktop & tablet  
**Project Type**: Single-page web application (React 18 + Vite build)  
**Visual Reference Oracle**: `mockup-v3.html` (local file at repo root) for rendered styling tokens, keyframe animations, and layout metrics  
**Performance Goals**: Instantaneous UI rendering (<16ms frame target), layout-stable modal open/close and task resolution without DOM reflow  
**Constraints**: Zero raw hex outside `src/index.css`, zero raw emoji in UI chrome, 100% modal body scroll locking when active, monospace confined strictly to `ScriptViewer` and `EventLog`  
**Out of Scope**: Pre-existing product bugs (Save Token button request feedback and mode selector state desync) to be filed separately.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Article 1: Semantic Color Is Sacred**: Green (`--ok`), amber (`--warn`), and red (`--crit`) strictly reserved for clearance states. Single brand accent (`--accent`: periwinkle `#7C9CFF`). All colors tokenized in `src/index.css` via `var(--*)`. **PASS**
- **Article 2: Type Encodes Provenance**: `Archivo` (variable sans) for UI chrome, `IBM Plex Mono` reserved exclusively for screenplay text (`ScriptViewer`) and log/code blocks (`EventLog`). **PASS**
- **Article 3: No Emoji in Chrome**: 100% inline stroke SVG iconography in UI chrome via unified `<Icon name="..." />` component. **PASS**
- **Article 4: The Hero Is the Answer**: Shooting Readiness Index (`56px` display scale) and plain-language unblocking reasons take top visual hierarchy. **PASS**
- **Article 5: Motion Is One Moment Plus One Signal**: Staggered entrance load sequence (`rise`), max 1 looping signal (`pulse` on critical dot), prefers-reduced-motion collapse in token stylesheet. **PASS**
- **Article 6: Status Is Never Color Alone**: Every status indicator pairs color with explicit text labels. **PASS**
- **Article 7: Defect Law Compliance**: Body scroll locking on all active modals (`overflow: hidden`), safe HTML entities for non-ASCII text. **PASS**
- **Article 8: Append-Only Design Log**: All design changes and verification results logged in `DESIGN_LOG.md`. **PASS**
- **Article 9: Target Shipped Architecture**: Targets shipped TypeScript/React/Vite app. `mockup-v3.html` is a visual oracle only; zero parallel HTML pages or runtime imports. **PASS**

---

## Project Structure

### Documentation (this feature)

```text
specs/023-workspace-restyle/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan
├── research.md          # Technical research, token map & oracle analysis of mockup-v3.html
├── data-model.md        # CSS Tokens & component data contracts
├── quickstart.md        # Build, test & Playwright verification guide
├── contracts/           # Interface & DOM contract definitions
│   └── workspace_restyle_contract.md
└── checklists/          # Quality checklists
    └── requirements.md
```

### Static Gate & Automation Scripts

```text
scripts/
└── spec-check.sh       # Static grep/perl gate verifying zero emoji, CSS tokens, font zones, and HTML entities
```

### Source Code Structure

```text
src/
├── index.css                    # One source of truth for CSS tokens (matching mockup-v3.html), keyframes & reduced motion
├── App.tsx                      # Header Command Bar & Quota Meter (Section 1)
├── pages/
│   └── WorkspacePage.tsx        # Readiness Band Hero & Scene Breakdown Grid (Section 2)
├── components/
│   ├── ScriptViewer.tsx         # Monospace Screenplay Panel (Section 3 - Legal Monospace Zone 1)
│   ├── EventLog.tsx             # System Event Log (Section 3 - Legal Monospace Zone 2)
│   ├── EntityRegistryTable.tsx  # Scan-First Entity Registry Table (Section 4)
│   ├── ProductionDashboardModal.tsx # Operations Dashboard Modal (Section 5)
│   ├── ActionListModal.tsx      # Department Task Center Modal (Section 5)
│   ├── StatusBadge.tsx          # Paired Status Badge
│   ├── Modal.tsx                # Shared Modal Primitive (Scroll lock, Esc, Backdrop)
│   └── icons/
│       └── Icon.tsx             # Unified Stroke SVG Icon Component (<Icon name="..." />)
├── hooks/
│   ├── useModalFocus.js         # Focus Trap & Shared Modal Primitive Hook
│   └── useBodyScrollLock.ts     # Body Scroll Locking Hook
└── tests/
    └── live_design_system_validation.js # Playwright E2E Behavioral & Visual Assertions
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *None* | *All implementation strictly adheres to Constitution v1.2.0 with zero design system or architectural violations.* | *N/A* |
