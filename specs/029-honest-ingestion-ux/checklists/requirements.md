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

### 1. Task Duplication (Release Blocker — FR-031)
- [ ] Action query/view strictly filters out superseded actions whose scene IDs are not in active script scenes.
- [ ] Pluralize helper string formatting corrected: renders `${filteredActions.length} of ${pluralize(actions.length, 'Task')}` without duplicated numerals (e.g., "X of Y Tasks", never "X of Y Y Tasks").
- [ ] Department tabs display consistent open vs total counts.
- [ ] No deduplication by task title; preserves legitimate same-title tasks across distinct entities/scenes.
- [ ] Historical QA finding (21 total tasks in earlier runs due to 10 superseded orphans) distinguished from current empty `actions: []` payload on serving `00061-lms`; no live purge proposed for non-existent orphans on this instance.

### 2. Contradictory Zero-Item Readiness (Release Blocker — FR-032)
- [ ] `WorkspacePage.tsx` per-scene card grid explicitly handles `PENDING_REVIEW` with neutral/review badging and "Pending Review" copy.
- [ ] Ingested zero-item scenes do not display `FINAL CLEAR` or "Ready for production filming" while overall project readiness is 0%.
- [ ] State consistency verified across: pending analysis, failed analysis, completed analysis with no candidates, human-reviewed no-concern, and fully cleared.
- [ ] Semantic changes strictly limited to the zero-item presentation regression.

### 3. Scenario G Reliability (Unresolved Release Evidence — FR-030)
- [ ] Scenario G tracked as UNRESOLVED on serving production `clearancescout-00061-lms` (100% traffic).
- [ ] Canary test pass on `clearancescout-00062-cjq` (0% traffic) does NOT close Scenario G; T039 and FR-030 remain incomplete / open.
- [ ] Fixture verified: exact 39,078-byte Coors Light PDF fixture (`tests/fixtures/coors_light_4page.pdf`).
- [ ] Execution protocol defines isolated disposable workspace (`proj-test-g-<timestamp>`) with deterministic assertions.
- [ ] Full lifecycle verified: preview -> confirm -> 6 occurrences across 3 scenes -> 0 cleared / 1 insufficient evidence -> reload survival.
- [ ] Teardown/cleanup protocol defined; production mutation requirements identified for separate approval.

### 4. Project-Card Accessibility (Release Blocker — FR-033 / FR-028)
- [ ] Native interactive `<button>` elements in `ProjectListModal.tsx` stripped of invalid `role="option"`.
- [ ] Current/selected workspace indicated via valid ARIA state (`aria-current="true"` or `aria-pressed="true"`; never `aria-selected` without a parent listbox/tablist), reconciling FR-028 and FR-033.
- [ ] Accessible name includes production title and current indicator.
- [ ] Native keyboard Enter/Space activation preserved with visible focus outline.
- [ ] Meaningful focus restored to active workspace production heading upon dismissal.

### 5. Mobile Usability & Ergonomics (Structural Correction — FR-034)
- [ ] 375px viewport header maintains <=64px height with unclipped title and >=44px touch targets.
- [ ] Role perspective selection accessible and legibly labeled in mobile drawer/popover.
- [ ] Navigation tabs container has readable labels, visible scroll indicators, and comfortable touch padding.
- [ ] Task controls in Action Center provide uncluttered wrapping, legible dropdowns, and reachable action buttons.
- [ ] Zero document horizontal overflow preserved across 320/375/390/420/768/1280.

### 6. Project Directory Identity Ambiguity (Identity Audit — FR-035)
- [ ] Productions with identical titles ("Mountain Refuge Live QA") verified as distinct persistent entities with unique IDs and timestamps.
- [ ] Project Switcher and Directory display creation timestamp/code to disambiguate identical titles.
- [ ] Zero deletion or merging of existing project records.

### 7. Performance Observation (View Evidence Drawer)
- [ ] Non-blocking timing check specified for later VERIFY phase (drawer open <= 4000ms threshold).
- [ ] Successful drawer opening and Escape key focus restoration preserved.

### 8. Shared Neon Horizon Honest-Empty Lifecycle & Baseline Contract (Release Blocker — FR-036)
- [ ] Honest-empty in-memory lifecycle verified: `proj-default` lazily initializes with 0 scenes / 0 clearance items / 0 tasks upon container boot without synthetic demo substitution (strictly adhering to Option B, FR-030, and SC-001).
- [ ] No automatic demo data injection or auto-seeding in `InMemoryStore`.
- [ ] Explicit populate path verified: clicking "Load Sample Production" or authorized `POST /api/projects/proj-default/demo-load` correctly populates the canonical baseline.
- [ ] Populated baseline contract verified: exactly 3 scenes, 7 clearance items, 11 tasks (statuses: 3 Cleared / 2 Action Required / 2 Review Recommended; 33.3% readiness; 2 blocked scenes; 4 open tasks describes strictly the open-filter subset, never the sample total).
- [ ] In-memory store lifecycle recorded: container uptime (~19:26 UTC) separated from lazy project creation timestamp; multi-instance in-memory store uncertainty documented.
- [ ] Shared workspace isolation enforced: mutating QA and evaluation runs prohibited from targeting `proj-default` or `proj-cyberpunk`; must use isolated disposable project IDs (`proj-test-g-<timestamp>`) with isolation assertions and bounded cleanup.
- [ ] Production preservation: no unauthorized live POST demo-load executed against shared production.
