# Research: Per-Project Research Limits

**Feature**: `specs/015-project-research-limits` | **Date**: 2026-08-18

---

## 1. Live Quota Scope & Accounting Strategy

### Context
In `CLOUD_MODE`, live queries to the Parallel Search API and live reasoning prompts to `@google/genai` (Gemini 3.6 Flash) incur latency and API resource consumption. Projects need a deterministic limit to safeguard budgets.

### Decision
- Track live calls on a **per-project** basis (not global) via `ProjectData.liveQuotaLimit` (default `25`) and `ProjectData.liveQuotaUsed` (default `0`).
- Increment `liveQuotaUsed` strictly when live API calls are dispatched in `CLOUD_MODE`.
- When `liveQuotaUsed >= liveQuotaLimit`, any further live research attempt in `CLOUD_MODE` immediately fails with HTTP `429 Too Many Requests` (`"Live research quota exceeded for this project (0/25 remaining)"`).

---

## 2. Offline Mode Quota Bypass

### Context
Automated contract/integration tests run in `TEST_MODE` and judge demos run in `DEMO_MODE`. These environments rely on deterministic repository record-replay fixtures.

### Decision
- `TEST_MODE` and `DEMO_MODE` bypass live quota consumption entirely.
- Quota is neither checked nor incremented for fixture-based replays.

---

## 3. UI Header Indicator & Fail-Visible Error Presentation

### Context
Users must have continuous visibility into their remaining live quota and receive explicit, actionable feedback if quota runs out.

### Decision
- Workspace header renders a pill badge: `⚡ Live Quota: {remaining} / {limit}`.
- If an API mutation returns 429, `App.tsx` sets `authError` / `quotaError` to display a fail-visible banner: `"⚠️ Live research quota exceeded for this project (0/25 remaining)."`
