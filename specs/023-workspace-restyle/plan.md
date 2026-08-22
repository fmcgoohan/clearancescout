# Implementation Plan: Feature 023 Workspace Restyle

**Branch**: `023-workspace-restyle` | **Date**: 2026-08-22 | **Spec**: [`spec.md`](spec.md)

**Input**: Feature specification from [`specs/023-workspace-restyle/spec.md`](spec.md)

---

## Summary

Restyle all five surfaces of the ClearanceScout clearance workspace (Toolbar Command Bar, Readiness Band Hero, Monospace Screenplay Panel, Scan-First Entity Registry, Operations Dashboard & Task Center Modals) as a single unified feature adhering strictly to Constitution v1.1.0 visual design system rules, HSL semantic color tokens, variable typography, inline stroke SVG iconography, and modal body scroll locking invariants.

---

## Technical Context

**Language/Version**: TypeScript 5.5+, React 18, Vite 5.4  
**Primary Dependencies**: React 18, Lucide-style SVG Icon library, Vitest, Playwright  
**Storage**: Google Cloud Firestore (backend persistence), React local state & hooks  
**Testing**: Vitest (`npm test`), Playwright live validation script (`tests/live_design_system_validation.js`)  
**Target Platform**: Web browsers (Chrome, Safari, Firefox, Edge) desktop & tablet  
**Project Type**: Single-page web application (React + Vite)  
**Performance Goals**: Fast UI rendering (<16ms frame target), instantaneous modal open/close without layout shift  
**Constraints**: Zero raw hex outside `src/index.css`, zero raw emoji in UI chrome, 100% modal body scroll locking when active  
**Scale/Scope**: 5 workspace UI surfaces across 13 modal/overlay components and core workspace page  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Article 1: Semantic Color Is Sacred**: Green, amber, and red strictly reserved for clearance states. Single brand accent (`--accent-cyan`). All colors tokenized in `src/index.css`. **PASS**
- **Article 2: Type Encodes Provenance**: `Inter` for UI chrome, `Courier Prime` reserved exclusively for screenplay text and JSON logs. **PASS**
- **Article 3: No Emoji in Chrome**: 100% inline stroke SVG iconography in UI chrome. **PASS**
- **Article 4: The Hero Is the Answer**: Shooting Readiness Index (`2.75rem`) and plain-language unblocking reasons take top visual hierarchy. **PASS**
- **Article 5: Motion Is One Moment Plus One Signal**: Single load entrance sequence, max 1 looping signal on block state, prefers-reduced-motion collapse. **PASS**
- **Article 6: Status Is Never Color Alone**: Every status indicator pairs HSL color with explicit text labels. **PASS**
- **Article 7: Defect Law Compliance**: Body scroll locking on all active modals (`overflow: hidden`), safe HTML entities for non-ASCII text. **PASS**
- **Article 8: Append-Only Design Log**: All design changes and verification results logged in `DESIGN_LOG.md`. **PASS**

---

## Project Structure

### Documentation (this feature)

```text
specs/023-workspace-restyle/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan
├── research.md          # Technical research & decisions (Font pairing & dark theme justifications)
├── data-model.md        # Tokens & component data contracts
├── quickstart.md        # Build & test verification guide
├── contracts/           # Interface & DOM contract definitions
│   └── workspace_restyle_contract.md
└── checklists/          # Quality checklists
    └── requirements.md
```

### Verification & Gate Scripts

```text
scripts/
└── spec-check.sh       # Static grep/perl gate verifying zero emoji, CSS tokens, font zones, and HTML entities
```

### Source Code Structure

```text
src/
├── index.css                    # HSL CSS custom properties & base tokens
├── App.tsx                      # Header Command Bar & Quota Meter (Section 1)
├── pages/
│   └── WorkspacePage.tsx        # Readiness Band Hero & Scene Breakdown (Section 2)
├── components/
│   ├── ScriptViewer.tsx         # Monospace Screenplay Panel (Section 3)
│   ├── EntityRegistryTable.tsx  # Scan-First Entity Registry Table (Section 4)
│   ├── ProductionDashboardModal.tsx # Operations Dashboard Modal (Section 5)
│   ├── ActionListModal.tsx      # Department Task Center Modal (Section 5)
│   ├── StatusBadge.tsx          # Paired Status Badge
│   └── icons/
│       └── Icons.tsx            # Inline Stroke SVG Icon Library
├── hooks/
│   ├── useModalFocus.js         # Focus Trap & Modal Management
│   └── useBodyScrollLock.ts     # Body Scroll Locking Hook
└── tests/
    └── live_design_system_validation.js # Playwright Live Design System Audit
```

**Structure Decision**: Web application single-project architecture (`src/` frontend React codebase with `server/` backend API isolation).

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *None* | *All implementation strictly adheres to Constitution v1.1.0 with zero design system or architectural violations.* | *N/A* |
