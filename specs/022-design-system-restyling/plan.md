# Implementation Plan: Restyle ClearanceScout UI to Constitution v1.1.0

**Branch**: `022-design-system-restyling` | **Date**: 2026-08-22 | **Spec**: [`spec.md`](spec.md)

**Input**: Feature specification from [`specs/022-design-system-restyling/spec.md`](spec.md)

## Summary

Restyle ClearanceScout film production clearance workspace to strictly adhere to **Constitution v1.1.0 Articles 1 through 8**:
1. *Semantic Color Is Sacred*: Centralized HSL CSS tokens in `src/index.css` (Green = Cleared, Amber = Review, Red = Blocks Shooting; single Slate-Cyan accent; 0 raw hex in JSX/TSX).
2. *Type Encodes Provenance*: Inter Variable font for UI chrome; Courier Prime monospace reserved exclusively for screenplay text viewer and raw JSON event logs.
3. *No Emoji in Chrome*: Reusable inline stroke SVG icon library replacing all emoji characters in chrome, headers, buttons, and modal titles.
4. *The Hero Is the Answer*: Shooting Readiness Index metric (3rem hero font) and per-scene why-blocked alert cards taking top visual ranking.
5. *Motion Orchestration*: Single load entrance sequence; max 1 looping animation on red status; `transform`/`opacity` properties only; full `prefers-reduced-motion` collapse.
6. *Status Text Pairing*: Every status badge pairs color with explicit text labels.
7. *Defect Laws*: Body scroll lock (`useBodyScrollLock`) on all 13 modal overlays; safe HTML entity encoding for non-ASCII typographic characters.
8. *Append-Only Design Log*: Audit trail maintained in `DESIGN_LOG.md`.

## Technical Context

**Language/Version**: TypeScript 5.x / React 18 / Vite 5

**Primary Dependencies**: React, Lucide/Inline SVG Icon components, Vanilla CSS Custom Properties (`src/index.css`)

**Storage**: LocalStorage / In-memory state / Firestore REST backend

**Testing**: Vitest (`npm test`), Playwright E2E (`node tests/live_*.js`)

**Target Platform**: Modern Web Browsers (Chrome, Safari, Firefox, Edge)

**Project Type**: Web Application (React frontend + Cloud Run Express backend)

**Performance Goals**: Instantaneous theme token evaluation (<16ms 60fps transitions), zero layout shifts

**Constraints**: Constitution v1.1.0 Articles 1-8 (Semantic Color tokens, variable sans typography, inline stroke SVGs, Hero readiness index, single load motion sequence, body scroll lock, HTML entity protection)

## Constitution Check

*GATE: Passed. All 8 articles of Constitution v1.1.0 are explicitly addressed by the design artifacts.*

- [X] **Article 1: Semantic Color Is Sacred**: Verified. HSL color tokens in `src/index.css`; zero raw hex in components.
- [X] **Article 2: Type Encodes Provenance**: Verified. Variable sans for UI chrome; Courier Prime monospace for screenplay text viewer & JSON logs only.
- [X] **Article 3: No Emoji in Chrome**: Verified. Inline stroke SVG icon registry in `src/components/icons/`.
- [X] **Article 4: The Hero Is the Answer**: Verified. Shooting Readiness Index hero card and why-blocked alert callouts take top visual hierarchy.
- [X] **Article 5: Motion Is One Moment Plus One Signal**: Verified. Load entrance animation + single looping animation on red status; prefers-reduced-motion supported.
- [X] **Article 6: Status Is Never Color Alone**: Verified. Paired text labels on all status badges.
- [X] **Article 7: Every Defect Becomes Law**: Verified. `useBodyScrollLock` hook locks body scroll on all 13 modals; safe HTML entity encoding.
- [X] **Article 8: Append-Only Design Log**: Verified. Updated [`DESIGN_LOG.md`](../../DESIGN_LOG.md).

## Project Structure

### Documentation (this feature)

```text
specs/022-design-system-restyling/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 research and design decisions
├── data-model.md        # CSS token schema and component models
├── quickstart.md        # Run & validation guide
└── contracts/
    └── ui-design-contract.md # Non-negotiable visual invariants
```

### Source Code

```text
src/
├── index.css                     # Centralized CSS custom properties & design tokens
├── components/
│   ├── icons/                    # Reusable inline stroke SVG icons (Article 3)
│   │   ├── CheckCircleIcon.tsx
│   │   ├── AlertTriangleIcon.tsx
│   │   ├── XCircleIcon.tsx
│   │   ├── HelpCircleIcon.tsx
│   │   ├── FilmIcon.tsx
│   │   ├── FileTextIcon.tsx
│   │   ├── SearchIcon.tsx
│   │   └── ...
│   ├── StatusBadge.tsx           # Status text + color badge component (Article 6)
│   ├── ScriptUploadModal.tsx
│   ├── ProductionDashboardModal.tsx # Hero why-blocked scene cards (Article 4)
│   ├── ActionListModal.tsx
│   ├── EntityRegistryTable.tsx
│   └── ... (all 13 modals with useBodyScrollLock)
├── hooks/
│   ├── useBodyScrollLock.ts      # Modal body scroll locking hook (Article 7)
│   └── useModalFocus.ts          # Integrates focus trap + body scroll lock
└── pages/
    └── WorkspacePage.tsx         # Hero Shooting Readiness Index header (Article 4)
```

## Complexity Tracking

*No violations. Implementation strictly simplifies existing component code by centralizing styling tokens and replacing ad-hoc emoji with standardized SVG icon components.*
