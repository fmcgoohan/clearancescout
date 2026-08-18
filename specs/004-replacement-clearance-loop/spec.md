# Feature Specification: Replacement Self-Clearance Loop

**Feature Branch**: `004-replacement-clearance-loop`  
**Created**: 2026-08-18  
**Status**: Draft  
**Input**: User description: "Replacement Self-Clearance Loop: after a fictional replacement brand is generated, automatically run that candidate through the same live Parallel Search research pipeline used for original entities. Accept the replacement only when evidence policy allows; otherwise generate or request another candidate up to a deterministic maximum attempt limit. Show every attempt, accept, and reject in the action timeline. Never invent evidence. Preserve existing 003 counsel-review, scene-override isolation, hierarchical resolver, and binder invariants. Do not add unrelated scope."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Autonomous Candidate Self-Clearance Verification Loop (Priority: P1) 🎯 MVP

When a clearance coordinator or legal counsel requests an era-authentic fictional replacement brand for an uncleared or high-risk entity (e.g. replacing "Coca-Cola" with a 1950s soda or "Rolex" with a modern luxury timepiece), the system must not merely generate a plausible name; it must automatically submit the generated candidate name to the same grounded trademark and web clearance research pipeline used for original script entities. The system automatically accepts the candidate only if the research assessment satisfies the clearance policy (status `NO_ISSUE_SURFACED`). If a conflict or existing real-world trademark collision is spotted, the candidate is rejected, and a new alternative is generated and tested in a closed loop.

**Why this priority**: Prevents productions from inadvertently adopting fictional replacement brand names that unknowingly infringe on real-world registered trademarks or active commercial brands, providing automated risk verification before presenting options to production teams.

**Independent Test**: Request a replacement brand for an entity; verify that the system generates candidate names, executes search research for each candidate, rejects any candidate with simulated or real trademark collisions, accepts the clean candidate, and displays the research citations in the replacement card modal.

**Acceptance Scenarios**:

1. **Given** an uncleared script entity (e.g., "Coca-Cola" with status `ACTION_REQUIRED`), **When** the user clicks "Generate Replacement", **Then** the system generates candidate replacement 1, executes clearance research on candidate 1, and if candidate 1 returns `NO_ISSUE_SURFACED`, accepts candidate 1 and displays the cleared replacement card with attached research citations.
2. **Given** candidate 1 research results surface an existing registered trademark or commercial brand conflict (status `ACTION_REQUIRED` or `REVIEW_RECOMMENDED`), **When** candidate 1 is evaluated, **Then** the system automatically records a rejection with the specific collision rationale and triggers generation of candidate 2 with negative prompt constraints avoiding the conflicted term.
3. **Given** candidate 2 research returns `NO_ISSUE_SURFACED`, **When** evaluated, **Then** candidate 2 is accepted, finalized, and saved to the project registry as the active replacement card.

---

### User Story 2 - Observable Action Timeline of Candidate Attempts & Clearance Decisions (Priority: P2)

Production teams and studio counsel must have full visibility into the autonomous clearance loop rather than observing a black-box spinner. Every candidate generation attempt, trademark search query, clearance risk assessment, rejection event with specific collision reasoning, and final acceptance verdict must be streamed to the Observable Action Timeline via Server-Sent Events (SSE).

**Why this priority**: Guarantees transparency and verifiable auditability of the AI clearance agent's reasoning and search queries, adhering to constitution principles requiring observable actions without exposing raw chain-of-thought.

**Independent Test**: Monitor the action timeline drawer during a multi-attempt replacement generation loop; verify that events for `REPLACEMENT_ATTEMPT`, `RESEARCH_QUERY_SUBMITTED`, `REPLACEMENT_REJECTED`, and `REPLACEMENT_ACCEPTED` appear in chronological order with human-readable diagnostic metadata.

**Acceptance Scenarios**:

1. **Given** an active replacement generation loop, **When** candidate 1 is generated, **Then** an action timeline event `REPLACEMENT_ATTEMPT` is emitted with `candidateName`, `eraAesthetic`, and `attemptNumber: 1`.
2. **Given** candidate 1 is rejected due to a trademark collision, **When** rejection occurs, **Then** an action timeline event `REPLACEMENT_REJECTED` is emitted detailing `rejectedName`, `collisionReason`, and `attemptNumber: 1`.
3. **Given** candidate 2 clears research evaluation, **When** accepted, **Then** an action timeline event `REPLACEMENT_ACCEPTED` is emitted detailing `acceptedName`, `attemptNumber: 2`, `totalAttempts: 2`, and `clearanceStatus: 'NO_ISSUE_SURFACED'`.

---

### User Story 3 - Deterministic Bounding & Counsel Escalation Fallback (Priority: P3)

In scenarios where multiple candidate names in a crowded commercial product category fail clearance research, the autonomous generation loop must be strictly bounded to a deterministic maximum attempt limit (default: 3 attempts). If the maximum attempt limit is reached without obtaining a `NO_ISSUE_SURFACED` verdict, the system must terminate the loop gracefully, present the highest-scoring candidate alongside all research findings, and flag the card with status `REVIEW_RECOMMENDED` or `INSUFFICIENT_EVIDENCE` for manual studio legal review, rather than hallucinating clearance or looping infinitely.

**Why this priority**: Enforces bounded resource expenditure, operational predictability, and safe escalation to human legal counsel when automated clearance cannot find an unencumbered fictional name.

**Independent Test**: Simulate an entity category where all candidates return trademark collisions; verify that the loop halts exactly after 3 attempts, records all 3 rejection/attempt logs, and presents the candidate with clear escalation notice to counsel.

**Acceptance Scenarios**:

1. **Given** a replacement loop where candidates 1, 2, and 3 all fail clearance evaluation, **When** attempt 3 completes, **Then** the loop halts immediately without making a 4th attempt.
2. **Given** a loop reaching the maximum attempt limit without full clearance, **When** presenting the card, **Then** the UI displays an amber alert banner indicating maximum attempts were reached with attached collision citations for counsel manual review.

---

### Edge Cases

- **Search API Outage / Network Failure during Loop**: If the research tool encounters a network failure during candidate verification in `CLOUD_MODE`, the system must fail visibly or fall back to designated fallback fixtures with explicit provenance `FALLBACK_FIXTURE`, never silently assuming a candidate is clear.
- **Identical Candidate Generation**: If the generation model repeats a previously rejected candidate name within the same loop session, the system must immediately reject the duplicate without re-executing search and request a distinct name.
- **Counsel Override Preservation**: If an existing entity has a canonical or scene-specific legal counsel override, generating a replacement card must NOT mutate or overwrite the active counsel override or its audit trail.
- **Clearance Binder Integration**: When the project clearance binder is exported, replacement cards generated via the self-clearance loop must include their full attempt history, clearance status, and grounded research citations.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically subject every generated fictional replacement brand candidate to grounded trademark and web clearance research using the standard clearance research pipeline before presenting it as an accepted replacement.
- **FR-002**: System MUST evaluate the clearance research assessment of each candidate against a deterministic evidence policy: candidate is accepted if and only if its risk status is `NO_ISSUE_SURFACED`.
- **FR-003**: System MUST reject any candidate whose clearance research returns `ACTION_REQUIRED` or `REVIEW_RECOMMENDED`, capturing the specific collision reason and conflicting trademark/brand name.
- **FR-004**: System MUST automatically iterate and generate a subsequent replacement candidate when a candidate is rejected, feeding previous collisions as negative constraints into the generator prompt.
- **FR-005**: System MUST enforce a deterministic maximum attempt ceiling (maximum 3 attempts per replacement request) to prevent unbounded execution loops and runaway API costs.
- **FR-006**: System MUST terminate the loop and escalate to studio legal counsel if the maximum attempt limit is reached without a clean clearance verdict, assigning status `REVIEW_RECOMMENDED` or `INSUFFICIENT_EVIDENCE` and displaying all collision evidence.
- **FR-007**: System MUST record and emit discrete observable action timeline events via SSE for every phase of the self-clearance loop: `REPLACEMENT_ATTEMPT`, `REPLACEMENT_RESEARCH_STARTED`, `REPLACEMENT_REJECTED`, and `REPLACEMENT_ACCEPTED`.
- **FR-008**: System MUST attach verified research citations and actual result provenance (`PARALLEL_LIVE`, `DEMO_FIXTURE`, `FALLBACK_FIXTURE`) to the accepted replacement card data structure.
- **FR-009**: System MUST never fabricate, hallucinate, or mock external web or trademark clearance evidence.
- **FR-010**: System MUST preserve all existing 003 invariants: canonical and scene-specific counsel overrides, hierarchical status resolution, anti-overwrite protection during automated re-evaluations, and unkeyed SHA-256 integrity digests during binder export.
- **FR-011**: Replacement Card UI (`ReplacementCardModal`) MUST display the self-clearance verification badge, attempt count, research citations, and attempt history breakdown.
- **FR-012**: Clearance Binder Export MUST incorporate the replacement self-clearance verification metadata and attached citations in both JSON export and `@media print` layouts.

---

### Key Entities

- **ReplacementCandidate**: Represents a generated fictional brand proposal containing `proposedName`, `tagline`, `eraAesthetic`, `visualPrompt`, and `fictionalBackstory`.
- **ReplacementAttemptRecord**: Represents an individual attempt in the self-clearance loop, capturing `attemptNumber`, `candidateName`, `clearanceStatus`, `collisionRationale`, `citations`, and `timestamp`.
- **SelfClearanceResult**: Represents the final result of the self-clearance loop, containing `status` (`ACCEPTED` | `ESCALATED_TO_COUNSEL`), `totalAttempts`, `acceptedCard` (if cleared), `attemptHistory`, and `provenanceSummary`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of generated replacement brand cards presented as cleared have undergone automated clearance research evaluation and achieved a `NO_ISSUE_SURFACED` verdict.
- **SC-002**: Automated loop termination occurs in $\le 3$ attempts for 100% of replacement generation requests.
- **SC-003**: 100% of candidate generation attempts, rejections, and acceptances emit corresponding observable timeline events received by the frontend within 200ms of event emission.
- **SC-004**: Zero regressions across existing 003 test suites (counsel overrides, scene isolation, hierarchical resolver, binder integrity digest).
- **SC-005**: 100% test pass rate across unit, contract, and integration test suites validating single-attempt acceptance, multi-attempt loop rejection/acceptance, and max-attempt escalation flows.

---

## Assumptions

- Fictional replacement candidates are generated in the context of the parent entity's category (e.g. food/beverage, luxury timepiece, proprietary landmark) and specified era aesthetic.
- The research tool uses `ParallelSearch` (in `CLOUD_MODE`) or deterministic test/demo fixtures (in `TEST_MODE`/`DEMO_MODE`) to query trademark registries and commercial entity indexes.
- Default maximum attempts limit is fixed at 3 iterations.
- If an entity was manually cleared or overridden by human legal counsel, generating a replacement is optional and does not invalidate existing legal overrides.
