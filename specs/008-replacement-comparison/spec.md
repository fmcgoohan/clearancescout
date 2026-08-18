# Feature Specification: Side-by-Side Original and Replacement Comparison

**Feature Branch**: `008-replacement-comparison`  
**Created**: 2026-08-18  
**Status**: Clarified  
**Input**: User description: "Side-by-Side Original and Replacement Comparison: when a replacement card exists, show the original entity and the accepted or escalated fictional replacement together with name, category, status, citations, and attempt history. Preserve 003 through 007 invariants. Do not add unrelated scope."

---

## Clarifications

### Session 2026-08-18
- Q: When is the comparison view enabled for an entity? → A: Comparison is available only when a replacement card exists.
- Q: What specific attributes must be presented side by side? → A: Show original and replacement side by side with name, category, status, citations, and attempt history.
- Q: How are 3rd candidate escalated replacements labeled in comparison? → A: Escalated replacements show a counsel review banner, not a cleared badge.
- Q: Does viewing comparison perform any mutations on overrides or assessments? → A: Comparison is strictly read-only and does not mutate overrides or assessments.
- Q: Where should the side-by-side comparison be included in exported deliverables? → A: Include the comparison in the binder print view.

---

## User Scenarios & Testing

### User Story 1 - Side-by-Side Entity Comparison View (Priority: P1) 🎯 MVP

As a studio clearance coordinator or production designer, when a fictional replacement card has been generated for a flagged entity, I want to inspect a side-by-side comparative modal showing the original flagged item and the proposed replacement asset together so that I can immediately evaluate thematic alignment, trademark risk differences, and clearance viability before approval.

**Why this priority**: Coordinators and designers make high-stakes creative and clearance decisions. Seeing the original asset and its fictional replacement side-by-side with clear risk badges and rationale eliminates guesswork and streamlines sign-offs.

**Independent Test**: Ingest a script, generate a replacement for a high-risk entity (`Coca-Cola` or `Summit Cola`), open the comparison view, and verify that both the original entity and the replacement asset render side-by-side with matching names, categories, clearance statuses, and risk rationales.

**Acceptance Scenarios**:
1. **Given** an entity with an attached replacement card in the registry table, **When** the user clicks "View Comparison" (or clicks the replacement card chip), **Then** a side-by-side modal opens displaying the original entity on the left and the replacement asset on the right.
2. **Given** an entity with no replacement card yet generated, **When** viewed in the registry table, **Then** the comparison action is not available (only "Generate Replacement" is shown).
3. **Given** the side-by-side comparison modal, **When** rendered, **Then** the original column displays canonical name, category, clearance risk status, risk score, and legal rationale.
4. **Given** the side-by-side comparison modal, **When** rendered, **Then** the replacement column displays replacement name, category, evaluated clearance status, design style/prompt, and replacement visual artwork card.

---

### User Story 2 - Research Citations & Attempt History Breakdown (Priority: P2)

As a studio legal counsel and clearance auditor, when viewing the side-by-side comparison, I want to inspect the grounded research citations and candidate attempt history ($1 \le \text{attempts} \le 3$) so that I can verify that prior rejected candidates were properly evaluated and negative constraints were applied.

**Why this priority**: Legal counsel requires full auditability of why a specific fictional candidate was accepted and how prior attempts failed automated self-clearance checks.

**Independent Test**: Generate a replacement for an entity that requires retry attempts, open the comparison modal, and verify that both the original citations, replacement citations, and sequential candidate attempts (showing candidate names, rejection rationales, and final verdict) are clearly itemized.

**Acceptance Scenarios**:
1. **Given** an entity with multi-attempt candidate history, **When** the comparison modal is opened, **Then** an "Attempt History" accordion/timeline displays each candidate generated ($\le 3$), their clearance verdicts, and negative constraints injected.
2. **Given** the comparison modal, **When** viewing citation provenance, **Then** both original and replacement citations retain authentic provenance badges (`PARALLEL_LIVE`, `DEMO_FIXTURE`, or `FALLBACK_FIXTURE`).
3. **Given** user interactions inside the comparison modal, **When** opening or closing the view, **Then** no entity assessments, counsel overrides, or citation records are mutated (strictly read-only).

---

### User Story 3 - Counsel Escalation Banner & Binder Print Integration (Priority: P3)

As a studio legal counsel and clearance director, when reviewing an escalated 3rd candidate or exporting the final project binder, I want the comparison to display a prominent counsel review banner for escalated candidates and be embedded directly within the clearance binder print view.

**Why this priority**: When autonomous candidate self-clearance exhausts 3 attempts without achieving `NO_ISSUE_SURFACED`, counsel needs unmistakable visibility into the un-cleared status, and production teams need side-by-side comparison prints in the final binder.

**Independent Test**: Generate a 3rd-attempt escalated candidate, open comparison, verify that a "⚖️ Counsel Review Required" banner appears (not a cleared badge), and verify that exporting the binder includes the side-by-side comparison section.

**Acceptance Scenarios**:
1. **Given** a 3rd attempt replacement that did not achieve `NO_ISSUE_SURFACED`, **When** viewed in the comparison modal, **Then** an "Escalated to Legal Counsel" / "Counsel Review Required" banner is rendered instead of a cleared badge.
2. **Given** an active clearance binder export (`GET /api/projects/:id/binder/export` and binder viewer), **When** replacement cards exist, **Then** the binder print view includes the side-by-side comparison layout for all cleared/escalated replacements.

---

### Edge Cases

- **Read-Only Invariant**: Opening, navigating, or closing the comparison view never dispatches mutation requests, preserving audit log integrity.
- **Replacement Generated Post-Item-Edit**: If an entity was manually edited and re-generated, the comparison modal shows the updated entity name and its newly generated replacement card.
- **Single Attempt Success**: If the 1st candidate immediately achieves `NO_ISSUE_SURFACED`, the attempt history displays Attempt 1 of 1 as "Accepted on 1st Attempt".

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST make the side-by-side comparison view available exclusively when a replacement card exists for a clearance entity.
- **FR-002**: The comparison view MUST display the original entity on the left with canonical name, entity category, clearance status badge, risk score, and risk rationale.
- **FR-003**: The comparison view MUST display the replacement asset on the right with replacement name, category, clearance status badge, design prompt/style, and artwork visual card.
- **FR-004**: The comparison view MUST render authentic research citations for both the original entity and the proposed replacement asset.
- **FR-005**: The comparison view MUST render the sequential candidate self-clearance attempt history ($1 \le \text{attempts} \le 3$), including candidate names, clearance verdicts, and injected negative constraints.
- **FR-006**: The comparison view MUST display a prominent "⚖️ Counsel Review Required" / "Escalated to Legal Counsel" banner (and NOT a cleared badge) for escalated 3rd attempt candidates.
- **FR-007**: The comparison view MUST be strictly read-only and MUST NOT mutate, modify, or erase existing assessments or counsel overrides.
- **FR-008**: The system MUST include the side-by-side original and replacement comparison in the clearance binder print view (`BinderViewer.tsx` / `binderExportWorkflow.ts`).
- **FR-009**: The frontend entity registry table MUST surface a "🔍 Compare" button on any row that has an attached replacement card.
- **FR-010**: The system MUST preserve all 003 invariants (scene-specific counsel override isolation, hierarchical status resolution, and SHA-256 binder integrity digests).
- **FR-011**: The system MUST preserve all 004 invariants (autonomous candidate self-clearance loop ceiling $\le 3$, negative constraints, and 4-event SSE timeline).
- **FR-012**: The system MUST preserve all 005 invariants (bundled fictional demo screenplay, secret-masked health API, fail-visible `CLOUD_MODE`).
- **FR-013**: The system MUST preserve all 006 invariants (manual clearance item addition, editing with assessment invalidation, and clean deletion).
- **FR-014**: The system MUST preserve all 007 invariants (single-item failed research retry with eligibility gating and sibling isolation).

### Key Entities

- **Comparison View Model**: Compound payload combining `CanonicalEntityData`, `ClearanceRiskAssessmentData`, `ReplacementCardData`, and `CandidateAttemptHistory`.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: The comparison modal renders in $< 100\text{ms}$ upon clicking "View Comparison" without issuing additional blocking server round-trips.
- **SC-002**: 100% of generated replacement cards display complete side-by-side attribute comparisons (name, category, status, citations, attempt history).
- **SC-003**: 100% of citations displayed in the comparison modal retain authentic provenance badges (`PARALLEL_LIVE`, `DEMO_FIXTURE`, or `FALLBACK_FIXTURE`).
- **SC-004**: 100% of escalated replacements render the "Counsel Review Required" banner rather than false cleared badges.
- **SC-005**: Automated regression test suite maintains 100% pass rate across all existing 001–007 test suites.

---

## Assumptions

- Replacement cards are stored on the `CanonicalEntityData` record under `replacementCard` and in `ReplacementRepo`.
- Clearance coordinators, production designers, and counsel can view comparisons at any point after generation.
- Counsel overrides remain the supreme authority and are clearly displayed on the comparison view.
