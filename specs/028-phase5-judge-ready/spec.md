# Feature Specification: Phase 5 - Judge-Ready Final Wrap & Submission Packaging

**Feature Branch**: `028-phase5-judge-ready`

**Created**: 2026-09-01

**Status**: Ready for Planning

**Input**: User description: "Phase 5 = judge-ready wrap before 7 Sep 2026 submission, not a new collaboration architecture. MUST preserve: Phase 1–3 Neon Horizon 3/7/11, 33.3%, 2 blocked; Phase 4 two real portfolio cards proj-default / proj-cyberpunk; no user-facing PRJ-DEFAULT; Gemini/ADK + Parallel Search only; no LangChain/OpenAI/Claude. IN SCOPE: 1) 375 filter-tab width balance (All / Needs Attention / Fully Ready). 2) Independent proof of 1,000-task virtualization budgets from 027 US-P4-16 if still unproven. 3) Judge demo path: token judge-pass-2026, two-project fixture, Open Production isolation, Action Center notification deep-link. 4) Submission package checklist: README live URL, PROVENANCE, <=3 min video, MIT already present. OUT OF SCOPE: email/SMS, Jira, native apps, treating DOM aria as VoiceOver, reopening P0/P1 routing."

---

## Executive Summary

Phase 5 delivers the final judge-ready hardening, verification, and packaging milestone for **ClearanceScout** prior to the September 7, 2026 competition submission deadline. This phase ensures complete end-to-end verification of all user journeys across desktop and mobile, guarantees strict adherence to hackathon submission requirements (README live deployment URL, PROVENANCE architecture disclosure, demo video script, MIT license verification), proves high-scale task list performance budgets ($\ge 1,000$ department tasks), and refines mobile tap target ergonomics (375px filter tab balance).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Flawless Judge Demo Walkthrough & Token Authentication (Priority: P1)

As a hackathon judge evaluating ClearanceScout against the competition rubric, I want to authenticate into the live deployment using the demo access token, explore multi-project portfolio oversight, switch production workspaces without state contamination, and inspect contextual clearance tasks so that I can evaluate the product's innovation, technical architecture, and user experience.

**Why this priority**: Directly impacts the judging outcome. The evaluation experience must be instant, robust, and free of authentication barriers or visual glitches.

**Independent Test**: Can be validated by opening the live application, entering the demo token `judge-pass-2026` via the Settings modal, verifying immediate authenticated access to `The Neon Horizon` (33.3% / 2 blocked / 3 scenes / 7 items / 11 tasks), opening the Portfolio Dashboard, switching to `Cyberpunk Odyssey` (100% / 0 blocked), and verifying zero transient hybrid states.

**Acceptance Scenarios**:
1. **Given** a judge entering `judge-pass-2026` via the Settings access token input, **When** the token is saved, **Then** the client persists the token in local session storage, attaches it as an authorization header on API requests, and renders `The Neon Horizon` with exact baseline metrics: 33.3% readiness, 2 blocked scenes, 3 screenplay scenes, 7 clearance items, and 11 department tasks.
2. **Given** the active workspace on `The Neon Horizon`, **When** the judge clicks the Portfolio button in the header, **Then** the Studio Production Portfolio dashboard renders two distinct project cards: `The Neon Horizon` (`[PRJ-NEON-HORIZON]`) and `Cyberpunk Odyssey` (`[PRJ-CYBERPUNK]`), with aggregate metrics (2 Active Projects, 2 Blocked Scenes, 11 Overdue Tasks, 66.7% Studio Avg Readiness).
3. **Given** the Portfolio Dashboard, **When** the judge clicks Open Production on `Cyberpunk Odyssey`, **Then** the workspace transitions atomically with a full-viewport loading overlay covering header, summary, and content, landing on `Cyberpunk Odyssey` with 100% readiness and 0 blocked scenes.
4. **Given** any workspace view, **When** the judge opens the notification drawer and clicks the mention notification for `TASK-101`, **Then** the Action Center modal opens, screen readers announce the navigation event via an accessible live region, and keyboard focus moves directly to the targeted task card heading without flashing uninitialized task counts or resetting focus to secondary controls.

---

### User Story 2 - Independent Proof & Verification of 1,000-Task Virtualization Budgets (Priority: P1)

As a technical lead and performance auditor, I want an automated, reproducible benchmark test that validates client-side list virtualization under high-scale production loads ($\ge 1,000$ department tasks) so that the application is proven to meet strict memory and 60 FPS frame-rate budgets.

**Why this priority**: Validates enterprise scale readiness requirement (US-P4-16) and prevents browser thread exhaustion during high-volume production operations.

**Independent Test**: Can be validated by executing the automated performance benchmark suite (`tests/local_1000_task_virtualization.js`) that injects a 1,000-task synthetic dataset into the virtualized task list and asserts DOM node count, scroll frame rate, and filter execution time.

**Acceptance Scenarios**:
1. **Given** a project containing 1,000 department tasks, **When** the task center list is opened, **Then** initial render latency is $\le 500$ms.
2. **Given** the 1,000-task list open in the viewport, **When** DOM tree inspection is performed, **Then** total active rendered task card DOM elements are strictly clamped to $\le 30$ elements regardless of total list length.
3. **Given** rapid continuous scrolling through the 1,000-task list, **When** scroll performance is sampled via animation frame timing, **Then** average frame rate is maintained at $\ge 60$ FPS with zero dropped frame jank ($>33$ms frame spikes $< 1\%$).
4. **Given** the 1,000-task dataset, **When** applying department or status filters, **Then** filtered re-render completes in $\le 50$ms.

---

### User Story 3 - Mobile 375px Filter-Tab Visual Balance & Ergonomics (Priority: P2)

As a mobile production coordinator using a smartphone (375x667 or 375x812 viewport), I want the Portfolio Dashboard filter tabs (`All`, `Needs Attention`, `Fully Ready`) to display in a balanced, comfortable layout with equal-enough tap targets and no awkward text wrapping so that I can easily filter productions on mobile devices.

**Why this priority**: Refines mobile UI ergonomics on narrow viewports while maintaining complete WCAG 2.2 touch-target guidelines.

**Independent Test**: Can be validated by loading the Portfolio Dashboard at 375x667 and 375x812, asserting that filter tabs render with balanced tap widths, visible gaps ($\ge 8$px), single-line text, zero horizontal scroll overflow, and sticky header clearance after scrolling.

**Acceptance Scenarios**:
1. **Given** a viewport width of 375px, **When** viewing the Portfolio Dashboard filter controls, **Then** the filter tabs display with balanced, proportional widths and comfortable tap targets with $\ge 8$px spacing.
2. **Given** the 375px viewport, **When** inspecting button text and counts, **Then** each tab displays its full label and count on a single line (e.g., `All (2)`, `Needs Attention (1)`, `Fully Ready (1)`).
3. **Given** keyboard navigation on mobile, **When** cycling through the filter tabs, **Then** each tab displays a distinct visible focus outline without layout shift.
4. **Given** the 375px mobile viewport, **When** scrolling to cards, **Then** document horizontal scroll width does not exceed 375px and all portfolio cards clear the sticky header after scrolling into view.

---

### User Story 4 - Hackathon Submission Package Compliance & Provenance (Priority: P1)

As a hackathon organizer and compliance reviewer, I want all required submission artifacts (`README.md`, `PROVENANCE.md`, video demo walkthrough, `LICENSE`) to be verified, accurate, and aligned with competition rules so that ClearanceScout meets 100% of eligibility criteria.

**Why this priority**: Mandatory release gate for official submission before the September 7, 2026 deadline.

**Independent Test**: Can be validated by executing a submission checklist script that checks: (1) live Cloud Run deployment URL in `README.md`, (2) Google ADK and Parallel Search SDK provenance in `PROVENANCE.md`, (3) demo video script ($\le 3$ min), and (4) MIT License integrity.

**Acceptance Scenarios**:
1. **Given** `README.md`, **When** reviewed, **Then** it prominently features the live Cloud Run URL (`https://clearancescout-n3tcx4jcbq-uc.a.run.app`), demo token instructions (`judge-pass-2026`), feature overview, architecture diagram, and local run instructions.
2. **Given** `PROVENANCE.md`, **When** reviewed, **Then** it accurately documents:
   - Primary AI framework: Google Agent Development Kit (ADK) & `@google/genai` (`gemini-3.6-flash`).
   - Grounding engine: `parallel-web` SDK for live web search and trademark clearance.
   - Code isolation and repository history (including the cleave from DiligenceCloser on 2026-08-21 for hackathon compliance).
   - Zero use of prohibited frameworks (LangChain, CrewAI, AutoGen, OpenAI, Claude).
3. **Given** `DEMO_SCRIPT.md`, **When** reviewed, **Then** it provides a timed, step-by-step $\le 3$-minute video recording script covering the 4 key judge milestones: Intake -> Real-time Research -> Department Task Delegation -> Portfolio Oversight.
4. **Given** `LICENSE`, **When** inspected, **Then** it contains the valid standard open-source MIT License text.

---

## Edge Cases

- **Invalid Demo Token**: When an invalid token is entered in Settings, the system displays an inline validation message and retains read-only demo mode without throwing unhandled runtime exceptions.
- **Rapid Switch Spamming**: Rapidly clicking between Open Production buttons on adjacent cards during an active transition cancels in-flight transition timers cleanly and completes on the latest requested project without state corruption.
- **Dynamic Task Addition at 1,000 Scale**: Adding a 1,001st task dynamically updates total counts (`1,001 Tasks`) and scroll container bounds without resetting user scroll position or breaking virtualizer indices.
- **Extreme Font Scaling (200% Zoom)**: At 200% browser zoom on a 375px viewport, filter tabs and card badges wrap cleanly without overlapping sticky headers or breaking table column layouts.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST maintain the authoritative baseline state for `The Neon Horizon` (`proj-default` / `[PRJ-NEON-HORIZON]`): 3 screenplay scenes, 7 clearance items, 11 department tasks, 33.3% shooting readiness, and 2 blocked scenes.
- **FR-002**: System MUST maintain the second production fixture `Cyberpunk Odyssey` (`proj-cyberpunk` / `[PRJ-CYBERPUNK]`): 100% shooting readiness, 0 blocked scenes, and isolated workspace context.
- **FR-003**: System MUST NEVER expose the internal identifier `PRJ-DEFAULT` to the user interface; all user-visible codes MUST render as `[PRJ-NEON-HORIZON]` and `[PRJ-CYBERPUNK]`.
- **FR-004**: System MUST execute project switching atomically, displaying a full-viewport loading overlay covering identity, summary bar, navigation tabs, and workspace content until the selected project state is confirmed.
- **FR-005**: System MUST support deep-linking from Notification drawer items directly to target task headings, trapping focus correctly and announcing the transition via an accessible live region (`aria-live="polite"`).
- **FR-006**: System MUST clamp active task card DOM elements in the Action Center to $\le 30$ elements when rendering lists of 1,000+ tasks via client-side list windowing.
- **FR-007**: System MUST maintain $\ge 60$ FPS virtualized scrolling and $\le 500$ms initial render time under 1,000 synthetic tasks.
- **FR-008**: System MUST render Portfolio Dashboard filter tabs on 375px mobile viewports with balanced, proportional widths, $\ge 8$px spacing, and single-line text formatting.
- **FR-009**: System MUST prevent all horizontal document overflow on 375x667 and 375x812 mobile viewports (`document.documentElement.scrollWidth <= 375`).
- **FR-010**: System MUST ensure that every portfolio card and its Open Production button remain fully visible below the sticky header after scrolling into view.
- **FR-011**: System MUST authenticate users via the `judge-pass-2026` demo access token entered via the Settings modal or sent via the `x-demo-token` HTTP header.
- **FR-012**: Repository MUST contain complete, verified submission documentation: `README.md` with active Cloud Run URL, `PROVENANCE.md` detailing architectural history and Google ADK / Parallel Search usage, `DEMO_SCRIPT.md` for a $\le 3$-minute video recording, `VOICE_OVER_PROTOCOL.md` for manual screen reader verification, and a valid `LICENSE` (MIT).
- **FR-013**: System MUST display the active serving Cloud Run revision (injected via `K_REVISION`) in the Settings menu in a user-visible, copyable format with zero invented SHAs.
- **FR-014**: System MUST NEVER silently remap missing or malformed task references to `TASK-101`; deleted or missing task targets MUST render as disabled/tombstone notifications with clear explanation.
- **FR-015**: System MUST provide end-to-end regression validation covering screenplay ingestion, 3/7/11 baseline, multi-project isolation, task status updates, attachment lists, clearance binder export, and 375 mobile layout.

---

### Key Entities *(include if feature involves data)*

- **`ProductionProject`**: Core project entity representing a film/TV production (`id`, `title`, `code`, `type`, `shootingReadinessPercentage`, `blockedSceneCount`, `overdueTaskCount`, `owner`).
- **`ClearanceActionItem`**: Canonical department task (`id`, `projectId`, `targetDepartment`, `title`, `status`, `assignedRole`, `versionNumber`).
- **`ClearanceNotification`**: In-product alert (`id`, `projectId`, `targetTaskId`, `headline`, `message`, `isRead`, `createdAt`, `targetCommentDeleted`).
- **`SubmissionPackage`**: Metadata record verifying submission readiness (`liveDeploymentUrl`, `demoAccessToken`, `adkModelStandard`, `parallelSearchGrounding`, `provenanceDocStatus`, `mitLicenseStatus`, `videoScriptStatus`, `voiceOverProtocolStatus`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Judge demo walkthrough flow (Settings Token Auth -> Portfolio -> Open Cyberpunk -> Return Neon Horizon -> Deep-link Notification -> Task Modal Focus) executes with **0 errors**, **0 transient hybrid states**, and **0 unhandled exceptions**.
- **SC-002**: 1,000-task virtualization benchmark passes with **$\le 500$ms initial render latency**, **$\le 30$ active DOM card nodes**, and **$\ge 60$ FPS average scroll frame rate**.
- **SC-003**: 375px mobile viewport audit passes with **0 horizontal scroll overflow** (`scrollWidth <= 375`), **0 header-card bounding intersections** after `scrollIntoView`, **0 filter-tab bounding collisions**, **0 filter-tab text overflows** (`scrollWidth <= clientWidth`), and computed font-size $\ge 12$px.
- **SC-004**: Submission package audit verifies **100% completeness** of `README.md`, `PROVENANCE.md`, `DEMO_SCRIPT.md`, `VOICE_OVER_PROTOCOL.md`, and `LICENSE` against competition requirements before the September 7, 2026 deadline.
- **SC-005**: Provenance audit verifies that the revision displayed in the Settings menu matches `gcloud run services describe` output with **100% exact equality**.
- **SC-006**: Notification integrity audit confirms **0 silent fallbacks to TASK-101** across all repository read paths and notification links.

---

## Assumptions

- **Target Hosting**: Google Cloud Run (`us-central1`) with container image deployment.
- **Demo Access Protocol**: Demo token `judge-pass-2026` entered in Settings or transmitted via `x-demo-token` provides immediate evaluator access. URL-param auto-authentication is out of scope.
- **Model Invariant**: Live AI operations use `gemini-3.6-flash` via `@google/genai` and live web grounding uses the `parallel-web` SDK.
- **Accessibility Invariant**: VoiceOver testing is defined as a manual verification protocol; automated tools must never claim a VoiceOver PASS based purely on DOM aria attributes.
- **Scope Boundaries**: Third-party external integrations (Jira, Slack, Email/SMS) and native mobile apps are explicitly out of scope for Phase 5.
