# Task Breakdown: Phase 2 Workflow & Terminology Simplification

**Feature Branch**: `025-phase2-simplification`  
**Version**: `v0.25.0`  

---

## Phase 1: Foundational Components & Icons
- [x] **T001**: Add `SettingsIcon` SVG component to `src/components/icons/Icons.tsx` (clean stroke SVG, no emoji).
- [x] **T002**: Create `src/components/SettingsPopover.tsx` popover component housing Demo Access Token trigger, Execution Mode pill, Quota counter, and Activity viewer trigger.

## Phase 2: Header Streamlining & Section Navigation (User Stories 16 & 17)
- [x] **T003**: Refactor `src/components/CommandBar.tsx` to streamline the primary header: Logo/Title, Project Select, 4 Section Tabs (`Overview`, `Screenplay`, `Clearance Items`, `Tasks`), Readiness Badge, and Settings Menu Trigger.
- [x] **T004**: Add workspace section tab state (`activeTab`) in `src/pages/WorkspacePage.tsx` and structure workspace content into 4 distinct section views (`Overview`, `Screenplay`, `Clearance Items`, `Tasks`).

## Phase 3: Contextual Primary Recommendation Card (User Story 14)
- [x] **T005**: Update `src/components/RecommendedActionCard.tsx` with the deterministic state cascade (`Add Screenplay` -> `Review 2 Clearance Blockers` -> `Review 5 Recommended Items` -> `View 7 Department Tasks` -> `Export Clearance Binder`).
- [x] **T006**: Wire 1-click execution on the primary recommendation button to switch section tab and apply pre-selected status filters.

## Phase 4: Terminology & Status Vocabulary Standardization (User Story 15)
- [x] **T007**: Update primary UI chrome terminology across `WorkspacePage.tsx`, `CommandBar.tsx`, `EntityRegistryTable.tsx`, and modals (`Screenplay Intake`, `Clearance Items`, `Research`, `Activity`).
- [x] **T008**: Standardize status vocabulary badges and labels to `Cleared`, `Insufficient evidence`, `Review recommended`, `Action required`.

## Phase 5: Entity Table Preservation & Modal Contract Re-Verification (User Story 18)
- [x] **T009**: Confirm entity registry table retains low action density (1 primary action, occurrences shortcut, secondary overflow `...`, `"Showing 7 of 7 entities"`).
- [x] **T010**: Rerun and verify cross-modal accessibility and focus contract tests across all 11 major dialog surfaces.

## Phase 6: Automated Testing & Spec Verification (Verification & Acceptance Gate)
- [x] **T011**: Run `./scripts/spec-check.sh` to confirm zero static spec or emoji violations.
- [x] **T012**: Run full unit, contract, and integration test suite (`npm test`).
- [x] **T013**: Execute fresh-session Playwright verification for Phase 2 spec acceptance tests.
- [x] **T014**: Log Phase 2 findings and test evidence in `DESIGN_LOG.md`.

## Phase 7: Cross-Panel Focus Restoration & Project-Scoped Onboarding Verification (AC-18.3, AC-18.4, AC-18.5)
- [x] **T015**: Implement deterministic fallback focus resolver in `useModalFocus.ts` and `CitationDrawer.tsx` restoring focus to target entity Research button -> row heading -> Clearance Items tab upon drawer close per AC-18.3.
- [x] **T016**: Implement versioned project-namespaced onboarding dismissal keys (`clearancescout:onboarding:v1:<project-id>`) and persistent active project ID in `App.tsx` and `OnboardingBanner.tsx` per AC-18.4.
- [x] **T017**: Execute real Chromium browser validation suite (`tests/live_keyboard_focus_validation.js`) verifying focus traps, cross-panel focus restoration, and project-scoped onboarding persistence 100% green per AC-18.5.

