# Implementation Plan: Feature 024 ClearanceScout UX Redesign

**Branch**: `024-ux-redesign` | **Date**: 2026-08-23 | **Spec**: [`spec.md`](spec.md) | **Constitution Version**: `1.3.0`

---

## Summary

Execute a comprehensive UX redesign of the ClearanceScout clearance workspace across all primary surfaces (Header & Command Bar, Contextual Recommended Action Card, Monospace Screenplay Panel, Clearance Items Registry, Operations Dashboard & Department Task Center Modals, and Ingestion Feedback System). 

This plan implements all 10 UX requirement areas and 12 user stories defined in [`spec.md`](spec.md) while strictly adhering to the 15 non-negotiable principles of the ClearanceScout Constitution (v1.3.0). It preserves all existing functional workflows, data integrity, and the stable 3-scene, 7-entity, 7-task bundled demo scenario.

---

## Technical Context

- **Framework**: React 18, Vite 5.4, TypeScript 5.5+
- **Styling**: Vanilla CSS using tokens in `src/index.css` (Constitution Article 1)
- **State Management**: React Context, custom hooks, atomic state reducer (`dispatch`)
- **Backend API**: Express REST endpoints (`server/index.ts`), Google ADK agents, Google Cloud Firestore
- **Testing Suite**: Vitest (`npm test`), Playwright (`tests/live_design_system_validation.js`), `scripts/spec-check.sh`
- **Target Breakpoints**:
  - Wide Desktop: `>= 1200px` (side-by-side 50/50 split view)
  - Medium Tablet: `768px – 1199px` (collapsible/expandable script panel)
  - Narrow Mobile: `< 768px` (single-column stacked layout with card view for registry)

---

## Workstream Mapping to Constitution, Requirements & User Stories

| Workstream | Constitution Articles | UX Requirement Areas | User Stories | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **WS 1: Terminology & Navigation Delineation** | Art. 14 (*Domain Terminology*), Art. 12 (*Count Semantics*) | Area 2 (*Terminology*), Area 3 (*Navigation*) | US5 (*Research*), US6 (*Occurrences*), US10 (*Tasks*) | AC-5.1, AC-6.1, AC-10.1 |
| **WS 2: Header, Command Bar & Contextual Next Action** | Art. 4 (*Hero*), Art. 13 (*Clear Next Action*), Art. 1 (*Color*) | Area 1 (*Primary Action*), Area 4 (*Header Density*) | US4 (*Review Red Scene*), US5 (*Research*) | AC-1.1–1.4, AC-4.1 |
| **WS 3: Clearance Item Registry & Responsive Split Pane** | Art. 15 (*Responsive*), Art. 12 (*Counts*), Art. 1 (*Color*) | Area 5 (*Registry*), Area 7 (*Responsive*), Area 8 (*Counts*) | US5 (*Research*), US6 (*Occurrences*), US7 (*Placeholder*) | AC-5.1–5.3, AC-6.1–6.3, AC-7.1–7.4 |
| **WS 4: Operations Dashboard, Task Center & Clearance Binder** | Art. 10 (*Data Sync*), Art. 12 (*Counts*), Art. 7 (*Defect Laws*) | Area 3 (*Navigation*), Area 8 (*Counts*) | US8 (*Rights*), US9 (*Counsel*), US10 (*Tasks*), US11 (*Binder*) | AC-8.1–8.2, AC-9.1–9.2, AC-10.1–10.3, AC-11.1–11.2 |
| **WS 5: Ingestion Focus, Atomic Sync & Live Announcements** | Art. 10 (*Data Sync*), Art. 11 (*Accessibility*) | Area 8 (*Counts*), Area 9 (*Ingestion Feedback*) | US1 (*Upload*), US2 (*Replace*), US3 (*Merge*) | AC-1.1–1.4, AC-2.1–2.3, AC-3.1–3.3 |
| **WS 6: Onboarding & First-Use Guidance** | Art. 13 (*Clear Action*), Art. 14 (*Domain Terminology*) | Area 10 (*Onboarding*) | US4 (*Red Scene*), US5 (*Research*), US7 (*Placeholder*) | AC-10.1 |
| **WS 7: Accessibility, Responsive QA & E2E Validation** | Art. 11 (*Accessibility*), Art. 6 (*Status Not Color Alone*) | Area 6 (*Readability*), Area 7 (*Responsive*), Area 9 (*Feedback*) | US12 (*Keyboard/Screen Reader*) | AC-12.1–12.4 |

---

## Responsive Breakpoints & Layout Architecture

```text
+-----------------------------------------------------------------------------------+
| Wide Desktop (>= 1200px)                                                          |
| +-------------------------------------------------------------------------------+ |
| | Header: Project Identity | Project Summary | Contextual Recommended Action Card | |
| +-------------------------------------------------------------------------------+ |
| | Side-by-Side View (50% / 50% Flex Split Pane)                                 | |
| | +------------------------------------+ +------------------------------------+ | |
| | | Monospace Screenplay Panel         | | Clearance Items Registry Table     | | |
| | | (Courier Prime, Dotted Underlines) | | (Chip+Word Badges, Action Btns)  | | |
| | +------------------------------------+ +------------------------------------+ | |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| Medium Tablet (768px - 1199px)                                                    |
| +-------------------------------------------------------------------------------+ |
| | Header: Compact Project Bar + "More Tools" Overflow Menu                      | |
| +-------------------------------------------------------------------------------+ |
| | Resizable / Collapsible Split Pane                                            | |
| | [Expand / Collapse Script Toggle]                                             | |
| | +------------------------------------+ +------------------------------------+ | |
| | | Screenplay (Collapsible)           | | Clearance Items Table              | | |
| | +------------------------------------+ +------------------------------------+ | |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| Narrow Mobile (< 768px)                                                           |
| +-------------------------------------------------------------------------------+ |
| | Header: Stacked Project Identity & Single Primary Action                        | |
| +-------------------------------------------------------------------------------+ |
| | View Switcher: [ Screenplay Panel ] | [ Clearance Items Cards ]               | |
| | +---------------------------------------------------------------------------+ | |
| | | Stacked View: Clearance Items Rendered as Responsive Cards                | | |
| | +---------------------------------------------------------------------------+ | |
+-----------------------------------------------------------------------------------+
```

---

## Single Authoritative Source for Counts

All counts across the application derive strictly from `ProjectWorkspace` (`ProjectState`) defined in `src/types/workspace.ts` and managed via React Context (`useWorkspaceContext`):

1. **Scenes (`project.scenes.length`)**: Total count of parsed screenplay scene headings.
2. **Entities (`project.entities.length`)**: Total count of unique canonical clearance items.
3. **Blocking Occurrences (`sum(entity.occurrences.filter(o => o.riskLevel === 'BLOCKS_SHOOTING'))`)**: Total individual appearances across scenes that currently block shooting readiness.
4. **Department Tasks (`project.departmentTasks.filter(t => t.status === 'OPEN').length`)**: Total active assigned work items across Art, Legal, Props, and Production.

*Explicit Semantic Clarification*: UI tooltips explicitly state: *"An entity (e.g. Nocturne artwork) appearing in 3 separate scenes generates 3 blocking occurrences but 1 department task."*

---

## Atomic Ingestion Synchronization & Rollback Behavior

During screenplay upload (`Replace` vs `Merge`):
1. **Modal Locking**: Ingestion modal opens, trapping focus. Background `#root` element is set to `aria-hidden="true"`.
2. **State Pipeline**: Ingestion progresses through `UPLOADING` $\rightarrow$ `PARSING` $\rightarrow$ `EXTRACTING` $\rightarrow$ `EVALUATING` $\rightarrow$ `COMPLETE`.
3. **Atomic Commit**: On completion, `scenes`, `entities`, `occurrences`, `departmentTasks`, and `shootingReadiness` update simultaneously in a single React state render cycle (`dispatch({ type: 'INGESTION_SUCCESS', payload })`).
4. **Rollback Behavior**: If parsing or API submission fails or is cancelled, the reducer executes `dispatch({ type: 'INGESTION_ROLLBACK' })`, restoring the pre-upload `ProjectState` entirely. An error alert with `role="alert"` presents diagnostic details without leaving partial script data.

---

## Accessibility & Responsive Validation Suite

- **Keyboard Navigation**: 100% interactive elements accessible via Tab/Shift+Tab with visible focus rings (`:focus-visible`). Modals trap focus and support Escape dismissal.
- **VoiceOver Screen Reader**: Modal background inertness enforced via `aria-hidden="true"`. Stage updates announced via `<div role="status" aria-live="polite">`. Durable summaries announced via `aria-atomic="true"`.
- **200% Zoom & Contrast**: Fluid typography (`rem`), minimum 4.5:1 text contrast on dark background (`#0A0D12`), zero content clipping or horizontal page scrollbar.
- **Viewport Testing**: Verified across 1440px (Desktop), 1024px (Tablet), 768px (Small Tablet), and 375px (Mobile).

---

## Preserved Demo Workflow

The 1-Click Bundled Demo (`sample_script.txt`) MUST deterministically generate:
- **3 Scenes**: Scene 1 (Lab Interior), Scene 2 (Alley Exterior), Scene 3 (Command Center).
- **7 Canonical Entities**: Fictional brands, character names, and prop items.
- **7 Department Tasks**: Assigned tasks across Art, Legal, and Props.
- **Shooting Readiness Index**: 100% synchronized display.

---

## Dependencies, Risks & Migration Concerns

- **Dependencies**: React 18, Vite 5.4, Vitest, Playwright, `src/index.css`.
- **Risks**: Layout shift during panel collapse on medium viewports; focus trap leakage if nested modals open over parent modals. Mitigated by using the shared `useModalFocus` and `useBodyScrollLock` hooks.
- **Migration Concerns**: Zero database schema migration required (pure UI/UX refactoring over existing REST API contracts).
- **Regression Test Coverage**: `npm test` (224 unit/contract tests pass), `scripts/spec-check.sh` static gate passes, Playwright E2E browser audit passes.
