# Phase 0 Research & Technical Decisions: Phase 5 Judge-Ready Wrap

**Feature**: [`specs/028-phase5-judge-ready/spec.md`](./spec.md)
**Date**: 2026-09-01
**Status**: Completed

---

## 1. Mobile Filter-Tab Proportional Balance & 375px Ergonomics (Decision D-01)

### Context & Problem
On narrow mobile screens (375x667 and 375x812), the three portfolio filter tabs (`All (2)`, `Needs Attention (1)`, `Fully Ready (1)`) require balanced, proportional tap widths. QA requested equal-enough tap targets with visible $\ge 8$px spacing, single-line text formatting, and zero horizontal scroll overflow, rather than forcing a full-width second row.

### Decision
- Configure flex distribution in `src/components/PortfolioDashboard.tsx` and `src/index.css`:
  - `[data-testid="portfolio-filter-tabs"]`: `display: flex; align-items: center; gap: 8px; flex-wrap: wrap; width: 100%;`
  - `[data-filter-tab="all"]`: `flex: 1 1 80px; min-width: 80px; text-align: center; white-space: nowrap;`
  - `[data-filter-tab="blocked"]`: `flex: 1 1 110px; min-width: 110px; text-align: center; white-space: nowrap;`
  - `[data-filter-tab="ready"]`: `flex: 1 1 95px; min-width: 95px; text-align: center; white-space: nowrap;`
- Preserves desktop 1280 multi-column grid: on viewports $> 768$px, all three tabs sit side-by-side with `gap: 8px`.

### Alternatives Considered
- *Forced full-width 2nd row for Fully Ready*: Rejected because independent QA preferred proportional, balanced tap targets that flow naturally across viewports.
- *Native `<select>` dropdown*: Rejected because segmented buttons provide immediate visual visibility of aggregate counts and single-tap switching.

---

## 2. 1,000-Task Virtualization Harness Convergence (Decision D-02)

### Context & Problem
Phase 4 introduced `src/components/VirtualTaskList.tsx` and the test harness `tests/local_1000_task_virtualization.js`. To avoid parallel script sprawl, Phase 5 converges strictly on the existing `tests/local_1000_task_virtualization.js` harness.

### Decision
- Utilize the existing `tests/local_1000_task_virtualization.js` performance suite.
- Verification Criteria:
  1. **Dataset Volume**: 1,000 synthetic `ClearanceActionItem` objects across 6 departments.
  2. **Mount Budget**: Initial virtual window rendered in $\le 500$ms.
  3. **DOM Clamping Budget**: Active rendered card DOM elements clamped to $\le 30$ elements in the scroll window.
  4. **Scroll Frame Rate**: Continuous scrolling maintains $\ge 60$ FPS (average frame duration $\le 16.6$ms).
  5. **Filter Latency**: Department filter update completes in $\le 50$ms.

### Alternatives Considered
- *Creating a parallel `tests/perf_virtualization.js`*: Rejected in favor of maintaining and executing the single authoritative `tests/local_1000_task_virtualization.js` test.

---

## 3. Judge Demo Path & Token Authentication Standard (Decision D-03)

### Context & Problem
Judges require seamless evaluation using demo credentials. The existing authentication architecture utilizes `localStorage` / `sessionStorage` (`clearancescout_demo_token`), the Settings `DemoTokenModal.tsx`, and the `x-demo-token` HTTP request header.

### Decision
- Spec the existing authentication path:
  - Judges enter `judge-pass-2026` via the Settings popover (`DemoTokenModal.tsx`).
  - Token is persisted in `localStorage` / `sessionStorage` via `src/utils/apiClient.ts`.
  - Authenticated `apiFetch()` wrapper attaches `x-demo-token: judge-pass-2026` and `Authorization: Bearer judge-pass-2026` to all backend requests.
  - Server-side `server/middleware/auth.ts` validates the token and authorizes demo session access.
- Note on URL query params: URL-parameter auto-authentication (`?demo_token=...`) is explicitly OUT OF SCOPE as it does not exist in the current client architecture.

### Invariants Preserved
- `The Neon Horizon` baseline: 3 scenes, 7 items, 11 tasks, 33.3% readiness, 2 blocked scenes.
- `Cyberpunk Odyssey` baseline: 100% readiness, 0 blocked scenes.
- Zero user-facing `PRJ-DEFAULT` identifiers.

---

## 4. Submission Package Checklist & Documentation Standards (Decision D-04)

### Context & Problem
Hackathon submissions require verifiable documentation demonstrating compliance with competition rules: live Cloud Run URL, AI framework compliance (Google ADK + Gemini 3.6 Flash only), live web search grounding (Parallel Search SDK only), video walkthrough script ($\le 3$ min), and open-source license.

### Decision
- Verify and standardize the following submission artifacts in the repository:
  1. `README.md`: Primary entry point containing live service URL, judge token instructions, architecture overview, key features, and local development instructions.
  2. `PROVENANCE.md`: Detailed architecture statement confirming Google ADK, `@google/genai` (`gemini-3.6-flash`), and `parallel-web` SDK usage, with explicit confirmation of zero disallowed frameworks.
  3. `DEMO_SCRIPT.md`: Timed 3-minute video presentation guide with timestamps, visual cues, and narration points.
  4. `LICENSE`: Verified standard MIT license.

---

## Summary of Decisions & Outputs

| Decision | Area | Chosen Approach | Verification Method |
|:---|:---|:---|:---|
| **D-01** | Mobile UI | Proportional, balanced flex tap targets at 375px (`flex: 1 1 80px / 110px / 95px`) | Playwright 375x667 & 375x812 visual tests (`tests/repro_live.js`) |
| **D-02** | Scale Budget | Converge on existing harness `tests/local_1000_task_virtualization.js` | Performance mark timings ($\le 500$ms, $\le 30$ DOM nodes, $\ge 60$ FPS) |
| **D-03** | Judge Demo | Existing Settings token modal + `localStorage` + `x-demo-token` header | Playwright live audit `tests/repro_live.js` |
| **D-04** | Packaging | Standardized `README.md`, `PROVENANCE.md`, `DEMO_SCRIPT.md`, `LICENSE` | Static audit checklist |
