# Feature Specification: Per-Project Research Limits

**Feature Branch**: `015-project-research-limits`  
**Created**: 2026-08-18  
**Status**: Draft  
**Input**: User description: "Per-Project Research Limits: cap live Parallel and Gemini calls per project with a visible remaining-quota indicator. When the limit is reached, fail visibly and do not silently continue. TEST_MODE and DEMO_MODE fixtures do not consume live quota. Preserve 003 through 014 invariants. Do not add unrelated scope."

---

## User Scenarios & Testing

### User Story 1 - Live Quota Tracking & Real-Time Remaining Indicator (Priority: P1) 🎯 MVP

As a studio production administrator or clearance coordinator in `CLOUD_MODE`, I want live Parallel Search and Gemini model API calls to be tracked per project against a defined quota limit, with a real-time remaining quota badge displayed in the workspace header, so that I can monitor API consumption and budget predictability.

**Why this priority**: Core quota protection requirement ensuring studio projects do not exceed live research allocations.

**Independent Test**: Execute live research calls in `CLOUD_MODE`; verify that the remaining quota counter decrements accurately and updates the UI indicator.

**Acceptance Scenarios**:
1. **Given** an active project in `CLOUD_MODE`, **When** live Parallel Search or Gemini API calls are made, **Then** the project's consumed quota increments and the remaining quota indicator reflects the updated balance.
2. **Given** the workspace header is displayed, **When** rendered on desktop or mobile, **Then** an explicit high-contrast badge displays the remaining quota (e.g. `⚡ Live Quota: 45 / 50`).

---

### User Story 2 - Fail-Visible Rejection on Quota Exhaustion (Priority: P2)

As a studio legal counsel or clearance coordinator, I want research and replacement generation requests to fail visibly with an explicit error when a project's live quota is exhausted, rather than silently succeeding or returning ungrounded mocks.

**Why this priority**: Critical integrity invariant ensuring the system never falsifies live research or silently continues when API limits are breached.

**Independent Test**: Exhaust a project's live quota limit; trigger a subsequent clearance evaluation or replacement generation in `CLOUD_MODE`; verify the API returns a `429 Too Many Requests` error with an explicit message and the UI displays a fail-visible banner.

**Acceptance Scenarios**:
1. **Given** a project with 0 remaining live quota in `CLOUD_MODE`, **When** a clearance evaluation, retry, or replacement generation is requested, **Then** the backend rejects the request with HTTP status `429` (`"Live research quota exceeded for this project"`).
2. **Given** a 429 quota exhaustion rejection, **When** received by the frontend, **Then** a prominent, dismissible error alert informs the user that the project quota limit has been reached.

---

### User Story 3 - Offline TEST_MODE & DEMO_MODE Exemption (Priority: P3)

As a judge, evaluator, or developer running automated test suites or evaluating demo screenplays in `TEST_MODE` or `DEMO_MODE`, I want offline record-replay fixtures to execute without consuming live project quota.

**Why this priority**: Guarantees that automated testing and offline judge demos never deplete production API quota.

**Independent Test**: Ingest scripts and evaluate clearance in `TEST_MODE` and `DEMO_MODE`; verify that live quota consumption remains 0.

**Acceptance Scenarios**:
1. **Given** an evaluation executed in `TEST_MODE` or `DEMO_MODE`, **When** clearance research is run using repository record-replay fixtures, **Then** the project's live quota consumption is not incremented.

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST track live Parallel Search and Gemini API call consumption on a per-project basis.
- **FR-002**: Each project MUST have a defined live quota cap (`liveQuotaLimit`, defaulting to a configurable limit such as 50 calls).
- **FR-003**: The workspace UI MUST display an explicit, accessible remaining-quota indicator in the header (e.g. `⚡ Live Quota: X / Y`).
- **FR-004**: When a project reaches its live quota cap (remaining quota equals 0), subsequent live API calls in `CLOUD_MODE` MUST fail immediately with HTTP `429 Too Many Requests`.
- **FR-005**: Quota exhaustion rejections MUST fail visibly with an explicit error message (`"Live research quota exceeded for this project"`) and MUST NOT silently continue or fake live results.
- **FR-006**: Evaluations and replacement generations executed in `TEST_MODE` or `DEMO_MODE` using local record-replay fixtures MUST NOT consume live project quota.
- **FR-007**: The system MUST preserve all 003 invariants (scene-specific counsel override isolation, hierarchical status resolution, and SHA-256 binder integrity digests).
- **FR-008**: The system MUST preserve all 004 invariants (autonomous candidate self-clearance loop ceiling $\le 3$, negative constraints, and 4-event SSE timeline).
- **FR-009**: The system MUST preserve all 005 invariants (bundled fictional demo screenplay, secret-masked health API, fail-visible `CLOUD_MODE`).
- **FR-010**: The system MUST preserve all 006 invariants (manual clearance item addition, editing with assessment invalidation, and clean deletion).
- **FR-011**: The system MUST preserve all 007 invariants (single-item failed research retry with eligibility gating and sibling isolation).
- **FR-012**: The system MUST preserve all 008 invariants (side-by-side original and replacement comparison modal and binder print view).
- **FR-013**: The system MUST preserve all 009 invariants (multi-dimension workspace registry filters across Status, Category, and Scene with empty recovery).
- **FR-014**: The system MUST preserve all 010 invariants (read-only binder jump to evidence citation drawer and observable action timeline context).
- **FR-015**: The system MUST preserve all 011 invariants (bounded concurrency batch research with live per-item progress and fail-visible isolation).
- **FR-016**: The system MUST preserve all 012 invariants (configurable shared demo access token with public health/fixture exemptions and client modal).
- **FR-017**: The system MUST preserve all 013 invariants (newly captured repository record-replay fixtures, mode-locked cloud isolation, and universal provenance badges).
- **FR-018**: The system MUST preserve all 014 invariants (accessible responsive workspace, keyboard navigation, visible focus, and mobile stacking).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of live `CLOUD_MODE` calls decrement project quota, while 0% of `TEST_MODE` or `DEMO_MODE` fixture calls consume quota.
- **SC-002**: 100% of requests exceeding the live quota limit are rejected with HTTP 429 and fail visibly in the UI.
- **SC-003**: The remaining quota indicator is visible in the workspace header across desktop and mobile viewports.
- **SC-004**: Automated test suite maintains 100% pass rate across all contract and integration suites with 0 regressions.

---

## Assumptions

- Default project live quota cap is 50 live calls per project, configurable via server environment variables (`PROJECT_LIVE_QUOTA_LIMIT`).
- Quota usage is persisted in `ProjectRepo` and returned with project metadata (`GET /api/projects/:id` or header updates).
