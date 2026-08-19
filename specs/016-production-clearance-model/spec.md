# Feature Specification: Production Clearance Operating Model

**Feature Branch**: `016-production-clearance-model`  
**Created**: 2026-08-19  
**Status**: Draft  
**Input**: User description: "Production Clearance Operating Model. Encode this exact recommended next sequence as ordered phases and user stories. Later phases MUST NOT be implemented until earlier phases are specified, planned, tasked, implemented, and converged. Phase 1 P1: Project Type plus real Projects UX. Users create and land on a project of type Movie, TV Show, or Commercial, then open a project dashboard. Phase 2 P2: Occurrence-level evaluation is the fundamental assessment unit: Occurrence plus canonical research plus actual scene context. Canonical status is derived, not the primary verdict. Phase 3 P3: Upgrade entity resolution with aliases, brand/product relationships, and materially equivalent reuse. Phase 4 P4: Rights and Restrictions as first-class domain objects. Phase 5 P5: Deterministic Scene Readiness RED / WORKING CLEAR / FINAL CLEAR derived from occurrences, rights, and placeholders. Phase 6 P6: Action and Notification lists derived from state transitions. Phase 7 P7: Generalize Replacement into Replacement plus Placeholder covering music, artwork, and other categories, with temp versus final lifecycle. Phase 8 P8: Make self-clearance genuinely evidence-driven using live Parallel results, not collision fixtures. Phase 9 P9: Project Dashboard around blockers, scenes, rights, placeholders, and recent activity. Phase 10 P10: Extend the existing binder to include rights, active placeholders, unresolved actions, and working-versus-final clearance. Include a Recommended Next Sequence section listing these 10 phases in this order. Preserve 003 through 015 invariants. Do not implement code. Do not collapse later phases into Phase 1."

---

## Recommended Next Sequence

The production clearance operating model is structured into ten sequential, dependency-ordered phases. **Rule**: Later phases MUST NOT be implemented until earlier phases have been specified, planned, tasked, implemented, verified, and converged in order.

1. **Phase 1 (P1)**: **Project Type & Production Projects UX** — Users create and manage studio projects categorized by production type (`Movie`, `TV Show`, `Commercial`) and land on a dedicated project workspace.
2. **Phase 2 (P2)**: **Occurrence-Level Evaluation as Fundamental Unit** — Assessment is centered on specific scene occurrences combined with canonical research and scene context; canonical entity status is a derived roll-up rather than the primary assessment verdict.
3. **Phase 3 (P3)**: **Upgraded Entity Resolution & Material Equivalence** — Advanced disambiguation supporting aliases, brand/parent relationships, and materially equivalent asset reuse across scenes.
4. **Phase 4 (P4)**: **Rights & Restrictions as First-Class Domain Objects** — Explicit modeling of territorial, media, temporal, and contractual rights terms with clearance constraint tracking.
5. **Phase 5 (P5)**: **Deterministic Scene Readiness (`RED` / `WORKING CLEAR` / `FINAL CLEAR`)** — Objective mathematical readiness state machine derived deterministically from occurrence evaluations, active rights, and approved placeholders.
6. **Phase 6 (P6)**: **State-Transition Action & Notification Queues** — Automated clearance action items, counsel escalations, and notification queues triggered by upstream state transitions.
7. **Phase 7 (P7)**: **Generalized Replacement & Placeholder Lifecycle** — Expansion of fictional replacements into structured placeholders across music, artwork, dialogue, and props, managing temporary versus final clearance lifecycles.
8. **Phase 8 (P8)**: **Evidence-Driven Live Self-Clearance Verification** — Autonomous candidate clearance loop driven strictly by live factual search evidence and trademark grounding rather than synthetic collision fixtures.
9. **Phase 9 (P9)**: **Production Operations Dashboard** — Consolidated operational view surfacing clearance blockers, scene readiness distribution, rights expirations, active placeholders, and recent legal audit activity.
10. **Phase 10 (P10)**: **Comprehensive Production Legal Clearance Binder** — Extension of exportable legal binder to include contractual rights, placeholder approvals, unresolved action items, and working-versus-final scene clearance digests with tamper-evident cryptographic verification.

---

## User Scenarios & Testing

### User Story 1 (Phase 1) - Project Type & Production Projects UX (Priority: P1) 🎯 MVP Phase 1 Focus

As a studio clearance coordinator or legal administrator, I want to create and select projects designated by specific production types (`Movie`, `TV Show`, or `Commercial`) and navigate between projects seamlessly, so that project-specific clearance rules, scene structures, and metadata are properly contextualized.

**Why this priority**: Foundational entry point establishing project categorization and workspace navigation required for all subsequent production clearance operations.

**Independent Test**: Create projects of types `Movie`, `TV Show`, and `Commercial`; verify project selection loads the appropriate workspace context and metadata.

**Acceptance Scenarios**:
1. **Given** a clearance administrator creating a new project, **When** they provide a title, production company, and select a project type (`Movie`, `TV Show`, or `Commercial`), **Then** the project is persisted with its designated type and appears in the projects list.
2. **Given** multiple studio projects, **When** a user selects a project from the workspace, **Then** the application lands on that project's workspace displaying its title, production type, and active clearance state.

---

### User Story 2 (Phase 2) - Occurrence-Level Evaluation as Fundamental Unit (Priority: P2)

As a production clearance counsel, I want clearance risk to be evaluated per scene occurrence using specific scene action context rather than solely evaluating abstract global entities, so that a brand used safely in Scene 1 is not conflated with a defamatory or infringing use in Scene 4.

**Why this priority**: Aligns the core legal evaluation model with industry reality: legal clearance risk is contextual to specific scene depictions.

**Independent Test**: Ingest a script with the same entity occurring in two distinct scenes (one neutral, one defamatory); verify each occurrence receives an independent evaluation status and the canonical status is derived from occurrences.

**Acceptance Scenarios**:
1. **Given** an entity appearing in multiple scenes, **When** clearance evaluation executes, **Then** each occurrence produces an individual risk verdict based on its specific scene context and grounding research.
2. **Given** occurrence verdicts, **When** viewing the canonical entity in the registry, **Then** its overall status is deterministically derived from its most severe active occurrence status.

---

### User Story 3 (Phase 3) - Upgraded Entity Resolution & Material Equivalence (Priority: P3)

As a clearance coordinator, I want the system to resolve aliases, brand-product hierarchies, and recognize materially equivalent references, so that duplicate research is avoided and entity relationships are transparent.

**Why this priority**: Eliminates redundant research queries and standardizes entity tracking across large production screenplays.

**Independent Test**: Ingest scripts containing varied brand aliases and product lines; verify they map to unified canonical entities with tracked aliases and parent brand relationships.

**Acceptance Scenarios**:
1. **Given** varied references to the same brand or product across scenes, **When** entity extraction runs, **Then** the system maps alias variations to a canonical entity and preserves alias provenance.

---

### User Story 4 (Phase 4) - Rights & Restrictions as First-Class Domain Objects (Priority: P4)

As a studio legal counsel, I want to record and inspect contractual rights, licensed territories, media windows, and usage restrictions as structured domain records, so that clearance approvals are bounded by real legal licenses.

**Why this priority**: Bridges research issue-spotting with actual contractual rights acquisition and legal licensing tracking.

**Independent Test**: Attach a rights license with territorial and media restrictions to an entity; verify rights coverage is queryable and visible in clearance assessments.

**Acceptance Scenarios**:
1. **Given** a cleared item, **When** legal counsel enters license terms (territory, media, expiration date, contractual covenants), **Then** the rights record is linked to the entity and occurrences.

---

### User Story 5 (Phase 5) - Deterministic Scene Readiness State Machine (Priority: P5)

As an assistant director, line producer, or legal counsel, I want each scene to have a deterministic readiness status (`RED`, `WORKING CLEAR`, or `FINAL CLEAR`), so that the production team knows exactly which scenes are legally cleared for shooting.

**Why this priority**: Critical production milestone metric preventing costly shooting halts due to uncleared items.

**Independent Test**: Evaluate scenes with varying occurrence statuses and rights; verify scene readiness transitions deterministically (`RED` if any action required, `WORKING CLEAR` if placeholders/temp licenses active, `FINAL CLEAR` when all items are fully cleared and signed).

**Acceptance Scenarios**:
1. **Given** a scene with uncleared items, **When** evaluated, **Then** its readiness is computed as `RED`.
2. **Given** all occurrences in a scene have approved placeholders or temporary licenses, **When** evaluated, **Then** its readiness is `WORKING CLEAR`.
3. **Given** all occurrences in a scene have final legal approval and signed overrides, **When** evaluated, **Then** its readiness is `FINAL CLEAR`.

---

### User Story 6 (Phase 6) - State-Transition Action & Notification Queues (Priority: P6)

As a clearance coordinator, I want actionable tasks and counsel escalation notifications to be generated automatically upon clearance state transitions, so that clearance bottlenecks are promptly addressed by the responsible department.

**Why this priority**: Operational workflow automation ensuring zero clearance items stall unnoticed.

**Independent Test**: Trigger a state transition requiring replacement or counsel review; verify a corresponding action item is appended to the project action queue.

**Acceptance Scenarios**:
1. **Given** an occurrence evaluated with `ACTION_REQUIRED`, **When** the assessment completes, **Then** a clearance action task is automatically queued for legal counsel or production design.

---

### User Story 7 (Phase 7) - Generalized Replacement & Placeholder Lifecycle (Priority: P7)

As a production designer or music supervisor, I want to generate and track temporary and final cleared placeholders across brands, music tracks, artworks, and dialogue, so that pre-production and post-production workflows remain unblocked.

**Why this priority**: Extends replacement generation beyond brand names to cover all clearance asset categories (music synchronization, background artwork, props).

**Independent Test**: Request a placeholder for an uncleared music track or artwork; verify the placeholder tracks temporary vs. final clearance status and visual/auditory metadata.

**Acceptance Scenarios**:
1. **Given** an uncleared asset in any category (art, music, prop, brand), **When** a replacement or placeholder is requested, **Then** the system creates a placeholder record with lifecycle state (`TEMP_APPROVED`, `FINAL_CLEARED`, or `REJECTED`).

---

### User Story 8 (Phase 8) - Evidence-Driven Live Self-Clearance Verification (Priority: P8)

As a studio legal counsel, I want autonomous replacement candidate self-clearance to be grounded exclusively in live web and trademark search evidence, so that fictional brand and asset approvals reflect actual current market clearance.

**Why this priority**: Ensures production clearance integrity in live deployments without synthetic fixture dependency.

**Independent Test**: Generate replacement candidates in live mode; verify candidate self-clearance evaluates live search queries and records verifiable citations.

**Acceptance Scenarios**:
1. **Given** live research mode, **When** replacement self-clearance executes, **Then** clearance verdicts are computed from live search evidence with full citation provenance.

---

### User Story 9 (Phase 9) - Production Operations Dashboard (Priority: P9)

As a production executive or legal department head, I want a consolidated dashboard summarizing scene readiness, active blockers, pending actions, rights expirations, and recent audit activity, so that I have complete operational visibility over the entire production.

**Why this priority**: Executive-level visibility and coordination hub across legal, production, and art departments.

**Independent Test**: Load project dashboard; verify blocker counts, scene readiness metrics, rights status, and activity feeds accurately reflect underlying project data.

**Acceptance Scenarios**:
1. **Given** an active project with varied clearance states, **When** accessing the dashboard, **Then** metrics for scene readiness breakdown, unresolved blockers, and upcoming expirations are rendered clearly.

---

### User Story 10 (Phase 10) - Comprehensive Production Legal Clearance Binder (Priority: P10)

As a production legal counsel and studio distributor, I want to export an expanded legal clearance binder containing occurrence-level verdicts, contractual rights schedules, approved placeholder records, unresolved action logs, and scene readiness summaries with a verifiable cryptographic digest, so that the production satisfies distributor legal delivery requirements.

**Why this priority**: Final legal delivery artifact required for film/TV distribution, insurance underwriting, and copyright chain-of-title compliance.

**Independent Test**: Export the comprehensive binder; verify all sections (occurrences, rights, placeholders, actions, scene readiness) are compiled with a valid SHA-256 integrity digest.

**Acceptance Scenarios**:
1. **Given** an active production project, **When** legal binder export is initiated, **Then** a comprehensive document is generated incorporating occurrence evidence, rights schedules, placeholders, actions, and scene readiness digests.
2. **Given** exported binder data, **When** verified, **Then** an immutable SHA-256 digest guarantees evidentiary integrity.

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST support project creation and categorization by `projectType` (`Movie`, `TV Show`, `Commercial`) with seamless switching between projects in the workspace.
- **FR-002**: Occurrence-level evaluation MUST serve as the fundamental unit of clearance assessment, evaluating each specific scene occurrence against canonical research and scene action context.
- **FR-003**: Canonical entity clearance status MUST be deterministically derived as a roll-up of its underlying occurrence evaluations.
- **FR-004**: The system MUST support entity resolution with aliases, brand/product hierarchies, and material equivalence matching across scenes.
- **FR-005**: Rights and restrictions MUST be represented as first-class domain records defining territory, media windows, expiration dates, and covenants.
- **FR-006**: Scene readiness MUST be deterministically computed as `RED`, `WORKING CLEAR`, or `FINAL CLEAR` based on occurrence statuses, active rights, and approved placeholders.
- **FR-007**: The system MUST automatically generate action items and notifications upon clearance state transitions.
- **FR-008**: Fictional replacements MUST be generalized to structured placeholders covering brands, music, artwork, dialogue, and props, managing temporary versus final lifecycle states.
- **FR-009**: Candidate self-clearance loops in live mode MUST be grounded strictly in live search evidence with complete citation provenance.
- **FR-010**: The project dashboard MUST surface scene readiness distributions, active blockers, pending actions, rights milestones, and timeline activity.
- **FR-011**: The clearance binder MUST compile occurrence evidence, contractual rights, placeholders, unresolved actions, and scene readiness with a verifiable SHA-256 digest.
- **FR-012**: Implementation MUST strictly follow the ordered 10-phase sequence without implementing later phases until earlier phases are converged.
- **FR-013**: The system MUST preserve all 003 invariants (scene-specific counsel override isolation, hierarchical status resolution, and SHA-256 binder integrity digests).
- **FR-014**: The system MUST preserve all 004 invariants (autonomous candidate self-clearance loop ceiling $\le 3$, negative constraints, and 4-event SSE timeline).
- **FR-015**: The system MUST preserve all 005 invariants (bundled fictional demo screenplay, secret-masked health API, fail-visible `CLOUD_MODE`).
- **FR-016**: The system MUST preserve all 006 invariants (manual clearance item addition, editing with assessment invalidation, and clean deletion).
- **FR-017**: The system MUST preserve all 007 invariants (single-item failed research retry with eligibility gating and sibling isolation).
- **FR-018**: The system MUST preserve all 008 invariants (side-by-side original and replacement comparison modal and binder print view).
- **FR-019**: The system MUST preserve all 009 invariants (multi-dimension workspace registry filters across Status, Category, and Scene with empty recovery).
- **FR-020**: The system MUST preserve all 010 invariants (read-only binder jump to evidence citation drawer and observable action timeline context).
- **FR-021**: The system MUST preserve all 011 invariants (bounded concurrency batch research with live per-item progress and fail-visible isolation).
- **FR-022**: The system MUST preserve all 012 invariants (configurable shared demo access token with public health/fixture exemptions and client modal).
- **FR-023**: The system MUST preserve all 013 invariants (newly captured repository record-replay fixtures, mode-locked cloud isolation, and universal provenance badges).
- **FR-024**: The system MUST preserve all 014 invariants (accessible responsive workspace, keyboard navigation, visible focus, and mobile stacking).
- **FR-025**: The system MUST preserve all 015 invariants (per-project live research quota tracking, header indicator, and 429 exhaustion fail-visible guard).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create, classify (`Movie`, `TV Show`, `Commercial`), and switch between projects with zero data collision or leakage.
- **SC-002**: 100% of occurrence evaluations accurately reflect scene context without overwriting sibling occurrences of the same canonical entity.
- **SC-003**: Scene readiness statuses (`RED`, `WORKING CLEAR`, `FINAL CLEAR`) are 100% deterministically reproducible from underlying occurrences and rights.
- **SC-004**: Exported binders include complete multi-section clearance records with valid SHA-256 cryptographic integrity verification.
- **SC-005**: All test suites maintain 100% pass rate across contract and integration tests with zero regressions.

---

## Assumptions

- Each phase in the 10-phase sequence will undergo dedicated `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`, and `/speckit-converge` execution cycles.
- Phase 1 focuses on project type selection, multi-project navigation, and project workspace landing.
- Phase-to-phase dependencies are strictly sequential.
