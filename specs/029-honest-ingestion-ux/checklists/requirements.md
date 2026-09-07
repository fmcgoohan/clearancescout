# Specification Quality Checklist: 029-honest-ingestion-ux

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-02
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Specification validated against project constitution principles and user requirements.

---

## Release Blockers & Ergonomic Audit Checklist (FR-031 to FR-036)

#### 1. Task Duplication (Release Blocker — FR-031)
- [x] Action query/view strictly filters out superseded actions whose scene IDs are not in active script scenes.
- [x] Pluralize helper string formatting corrected: renders `${filteredActions.length} of ${pluralize(actions.length, 'Task')}` without duplicated numerals (e.g., "X of Y Tasks", never "X of Y Y Tasks").
- [x] Department tabs display consistent open vs total counts.
- [x] No deduplication by task title; preserves legitimate same-title tasks across distinct entities/scenes.
- [x] Historical QA finding (21 total tasks in earlier runs due to 10 superseded orphans) distinguished from current empty `actions: []` payload on serving `00061-lms`; no live purge proposed for non-existent orphans on this instance.

### 2. Contradictory Zero-Item Readiness (Release Blocker — FR-032)
- [x] `WorkspacePage.tsx` per-scene card grid explicitly handles `PENDING_REVIEW` with neutral/review badging and "Pending Review" copy.
- [x] Ingested zero-item scenes do not display `FINAL CLEAR` or "Ready for filming" while overall project readiness is 0%.
- [x] State consistency verified across: pending analysis, failed analysis, completed analysis with no candidates, human-reviewed no-concern, and fully cleared.
- [x] Semantic changes strictly limited to the zero-item presentation regression.

### 3. Scenario G Reliability (Unresolved Release Evidence — FR-030)
- [x] Scenario G tracked as UNRESOLVED on serving production `clearancescout-00061-lms` (100% traffic).
- [x] Canary test pass on `clearancescout-00062-cjq` (0% traffic) superseded by proven verification on NEW canary revision `clearancescout-00064-lav`.
- [x] Fixture verified: exact 39,078-byte Coors Light PDF fixture (`tests/fixtures/coors_light_4page.pdf`).
- [x] Execution protocol defines isolated disposable workspace (`proj-test-g-<timestamp>`) with deterministic assertions.
- [x] Full lifecycle verified: preview -> confirm -> 6 occurrences across 3 scenes -> 0 cleared / 1 insufficient evidence -> reload survival (PASS on `clearancescout-00064-lav`).
- [x] Teardown/cleanup protocol defined; production mutation requirements identified for separate approval.

### 4. Project-Card Accessibility (Release Blocker — FR-033 / FR-028)
- [x] Native interactive `<button>` elements in `ProjectListModal.tsx` stripped of invalid `role="option"`.
- [x] Current/selected workspace indicated via valid ARIA state (`aria-current="true"` or `aria-pressed="true"`; never `aria-selected` without a parent listbox/tablist), reconciling FR-028 and FR-033.
- [x] Accessible name includes production title and current indicator.
- [x] Native keyboard Enter/Space activation preserved with visible focus outline.
- [x] Meaningful focus restored to active workspace production heading upon dismissal.

### 5. Mobile Usability & Ergonomics (Structural Correction — FR-034)
- [x] 375px viewport header maintains <=64px height with unclipped title and >=44px touch targets.
- [x] Role perspective selection accessible and legibly labeled in mobile drawer/popover.
- [x] Navigation tabs container has readable labels, visible scroll indicators, and comfortable touch padding.
- [x] Task controls in Action Center provide uncluttered wrapping, legible dropdowns, and reachable action buttons.
- [x] Zero document horizontal overflow preserved across 320/375/390/420/768/1280.

### 6. Project Directory Identity Ambiguity (Identity Audit — FR-035)
- [x] Productions with identical titles ("Mountain Refuge Live QA") verified as distinct persistent entities with unique IDs and timestamps.
- [x] Project Switcher and Directory display creation timestamp/code to disambiguate identical titles.
- [x] Zero deletion or merging of existing project records.

### 7. Performance Observation (View Evidence Drawer)
- [x] Non-blocking timing check verified on canary (drawer open 20.25ms <= 4000ms threshold).
- [x] Successful drawer opening and Escape key focus restoration preserved.

### 8. Shared Neon Horizon Honest-Empty Lifecycle & Baseline Contract (Release Blocker — FR-036)
- [x] Honest-empty in-memory lifecycle verified: `proj-default` lazily initializes with 0 scenes / 0 clearance items / 0 tasks upon container boot without synthetic demo substitution (strictly adhering to Option B, FR-030, and SC-001).
- [x] No automatic demo data injection or auto-seeding in `InMemoryStore`.
- [x] Explicit populate path verified: clicking "Load Sample Production" or authorized `POST /api/projects/proj-default/demo-load` correctly populates the canonical baseline.
- [x] Populated baseline contract verified: exactly 3 scenes, 7 clearance items, 11 tasks (statuses: 3 Cleared / 2 Action Required / 2 Review Recommended; 33.3% readiness; 2 blocked scenes; 4 open tasks describes strictly the open-filter subset, never the sample total).
- [x] In-memory store lifecycle recorded: container uptime separated from lazy project creation timestamp; multi-instance in-memory store uncertainty documented.
- [x] Shared workspace isolation enforced: mutating QA and evaluation runs prohibited from targeting `proj-default` or `proj-cyberpunk`; must use isolated disposable project IDs (`proj-test-g-<timestamp>`) with isolation assertions and bounded cleanup.
- [x] Production preservation: no unauthorized live POST demo-load executed against shared production.

### 9. Independent Review Fail-Resolution Gates (FAIL 1 & FAIL 2)
- [x] FAIL 1: Cyberpunk Odyssey Scene 1 with zero detected items evaluates honestly to `PENDING_REVIEW` with 0% readiness and 0 blocked scenes (never `FINAL_CLEAR` or 100% "Ready for production filming" without human review). Isolation from Neon Horizon preserved.
- [x] FAIL 2: Unpopulated `proj-default` is semantically labeled as `Default Production Workspace` `[PRJ-DEFAULT]` and does NOT present as the populated baseline `The Neon Horizon` `[PRJ-NEON-HORIZON]` until explicit Load Sample. After explicit Load Sample, exactly 3 scenes, 7 clearance items, and 11 unique department tasks.

### 10. Bounded P2 Usability Gates
- [x] P2 (Mobile Button Discoverability): Header `+ New Production` button renders a visible label (e.g. `+ New`) and visible affordance on mobile viewports (<=768px / 375px), maintaining >=44px touch targets without horizontal page overflow.
- [x] P2 (Mobile Tabs Controlled Scroll): Navigation tabs maintain `white-space: nowrap` and `flex-shrink: 0` without compressing or wrapping labels, scrolling smoothly within existing tab container.

### 11. Cyberpunk Zero-Task UI State Lifecycle (FR-037)
- [x] Explicit fetch state (`idle | loading | loaded | error`) distinguishes genuine network fetch from loaded-empty results.
- [x] Loaded-empty state renders "0 of 0 Tasks", zeros per department tab `(0)`, and zero ellipsis `(…)`.
- [x] Empty state renders explicit message: "No department tasks have been generated for this production".
- [x] Empty state provides route/button to recommended next action (upload screenplay).
- [x] Re-Sync button is enabled upon loaded empty success.
- [x] Switching active projects immediately resets tasks and fetch state to loading, preventing cross-workspace task leakage.
- [x] Direct cold load with `?tab=tasks` cleanly renders loaded-empty state without hanging.

### 12. Authoritative Cross-Format Binder Identity (FR-038)
- [x] Downloaded Markdown filename matches sanitized title pattern: `Clearance_Binder_<SanitizedTitle>_<id>.md`.
- [x] Downloaded JSON filename matches sanitized title pattern: `Clearance_Binder_<SanitizedTitle>_<id>.json`.
- [x] Project ID and active title explicitly included in Markdown header metadata and export modal.
- [x] Switching active projects clears client-side `binderData` and `preflightData` (`setBinderData(null)`).

### 13. Human-Readable Scene References in Operator Prose (FR-039)
- [x] Clearance evaluator rationales format scene references as "Scene <number> — <heading>" (e.g. "Scene 1 — INT. PENTHOUSE WORKSPACE – NIGHT"), never raw internal database UUIDs (`scene-a0556326`).
- [x] Department tasks, notifications, and timeline event text use human-readable scene format.

### 14. Statutory Distribution vs Production Filming Clearance Dual Standard (FR-040)
- [x] Music clearance rationales state exact copy: "A synchronization license is required for distribution. This production’s clearance policy requires the license to be secured before filming proceeds."
- [x] Dual standard consistently reflected across evaluator rationales, department tasks, and clearance binder exports.

### 15. Execution-Mode Authoritative Representation (Proposal Gate — FR-041)
- [ ] Option A: Settings Popover and Project Creation dialog replace interactive execution-mode `<select>` with read-only badge/status indicator showing authoritative server mode (e.g. `DEMO_MODE (Authoritative)`).
- [ ] Explanatory tooltip/copy clearly indicates that execution mode is governed by server configuration and that live `CLOUD_MODE` requires server-side secret mounting.
- [ ] Client state is prohibited from simulating mode switching, adhering to Architectural Rule 5.

### 16. Zero-Item Multi-State Classification (Proposal Gate — FR-042)
- [ ] Deterministic five-state scene classification implemented (`ANALYSIS_PENDING`, `ANALYSIS_FAILED`, `NO_CANDIDATES_SURFACED`, `HUMAN_REVIEWED_NO_CONCERN`, `FULLY_CLEARED`).
- [ ] Scenes with zero detected clearance items evaluate to `PENDING_REVIEW` with 0% readiness, never `FINAL_CLEAR` without recorded human review.
- [ ] Operator or counsel sign-off mechanism transitions un-flagged scenes from `PENDING_REVIEW` to `FINAL_CLEAR`.

### 17. Task Active-Draft Scope & Deduplication Hygiene (Proposal Gate — FR-043)
- [ ] Department tasks are scoped to active screenplay draft ID; superseded draft tasks are excluded from active task lists.
- [ ] UI displays open vs total tasks (e.g. "4 open of 11 unique tasks").
- [ ] Blanket title-based deduplication is prohibited, preserving distinct tasks for distinct scene occurrences sharing standard titles.
- [ ] Audit of persisted duplicate records is performed separately from client-side rendering.

### 18. Coors Appearance vs Unresolved Semantics (Proposal Gate — FR-044)
- [ ] Coors Light baseline (1 canonical entity, 6 appearances across 3 scenes) maintains parity across Registry and Dossier.
- [ ] Scene 1, 2, and 3 readiness rationales and counters distinguish 1 unresolved blocker from textual occurrence count (1 in Scene 1, 2 in Scene 2, 3 in Scene 3).
- [ ] Singular/plural grammar enforced in blocker descriptions.
- [ ] Scene 2 heading retains `EXT. NEIGHBORHOOD CORNER - CONTINUOUS`.

### 19. Project Directory Stable ID Disambiguation & Non-Mutation (Proposal Gate — FR-045)
- [ ] Projects sharing identical titles in the switcher and directory are disambiguated with stable project ID (`proj-<uuid>`) and creation timestamp.
- [ ] Production datasets are preserved: zero unauthorized re-seeding, deletion, or overwriting of shared review workspaces.

### 20. Mobile Usability Bounded Ergonomics & Viewport Verification (Proposal Gate — FR-046)
- [ ] Verification across 320, 375, 390, 420, 768, 1280px viewports measures both `document.documentElement` and `document.body` with zero horizontal overflow without `overflow-x: hidden`.
- [ ] All interactive elements (header buttons, switcher cards, tabs, filter pills, drawer buttons) provide >=44px touch targets.
- [ ] Header height <=64px and drawer open latency <=4s monitored and evaluated against agreed performance criteria.

