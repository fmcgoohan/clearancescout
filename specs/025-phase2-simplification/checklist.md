# Phase 2 Verification & Cross-Panel Focus Restoration Checklist: Phase 2 Workflow & Terminology Simplification

**Purpose**: Quality gate checklist for cross-panel focus restoration, project-scoped onboarding persistence, and real browser verification.  
**Created**: 2026-08-24  
**Feature**: [spec.md](./spec.md)  

**Review Ownership**: Reviewer-owned requirements-quality and verification artifact.

## Cross-Panel Focus Restoration & Accessible Name Agreement

- [x] **CHK001**: Activating Overview recommendation ("Research Nocturne of the Wild") switches tabs to Clearance Items and opens `CitationDrawer` for Nocturne of the Wild.
- [x] **CHK002**: Closing `CitationDrawer` via Escape key executes deterministic fallback focus restoration in priority order: (1) Nocturne's Research button in Clearance Items, (2) Nocturne row heading/container, (3) Clearance Items tab button.
- [x] **CHK003**: Focus never drifts or falls back to "Switch Project" header control upon drawer dismissal.
- [x] **CHK004**: Same-panel modals (`DemoTokenModal`, `ScriptUploadModal`, `OperationsDashboardModal`, `ActionListModal`) restore focus to their still-mounted trigger buttons upon dismissal.
- [x] **CHK005**: Visible button label ("Research"), accessible name (`aria-label="Research Nocturne of the Wild"`), supporting card text, and research dossier destination strictly agree.

## Project-Scoped Onboarding Persistence & Data Isolation

- [x] **CHK006**: Onboarding banner dismissal is saved per project using versioned namespaced keys: `clearancescout:onboarding:v1:<project-id>`.
- [x] **CHK007**: Dismissing onboarding banner in Project A keeps it hidden during panel switching and reloads for Project A, but shows it for newly created Project B.
- [x] **CHK008**: Active project ID selection is persisted across reloads via `clearancescout_active_project_id`.

## Real Browser & Test Evidence Labeling Accuracy

- [x] **CHK009**: Real Chromium browser test suite (`node tests/live_keyboard_focus_validation.js`) passes 100% across all 7 verification sections.
- [x] **CHK010**: Vitest/jsdom unit contract tests are accurately labeled as Vitest/jsdom simulated DOM tests in documentation and logs, and never claimed as Playwright browser evidence.
- [x] **CHK011**: Zero raw emoji characters detected in UI chrome by `./scripts/spec-check.sh`.

## Notes

- Verified with real Chromium Playwright automation on 2026-08-24.
- All items `[x]` satisfied and verified green.
