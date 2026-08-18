# Quickstart Validation Guide: Per-Project Research Limits

**Feature**: `specs/015-project-research-limits` | **Date**: 2026-08-18

---

## Scenario 1: Verify Quota Display in Header

1. Start application:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:5173`.
3. Verify the header displays:
   `⚡ Live Quota: 25 / 25` (or remaining of total).

---

## Scenario 2: Verify 429 Fail-Visible Rejection on Exhaustion

1. In `CLOUD_MODE`, execute research evaluations until the 25-call quota is exhausted.
2. Trigger an additional evaluation.
3. Verify:
   - Backend returns HTTP `429 Too Many Requests`.
   - UI renders a red alert banner: `"⚠️ Live research quota exceeded for this project (0/25 remaining)."`
