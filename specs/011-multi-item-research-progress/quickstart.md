# Quickstart Validation Guide: Multi-Item Clearance Research Progress & Concurrency Control

**Feature**: `specs/011-multi-item-research-progress` | **Date**: 2026-08-18

---

## Scenario 1: Multi-Item Batch Clearance Evaluation with Live Progress

1. Ingest the bundled demo screenplay ("The Neon Horizon") into the workspace.
2. In the Canonical Entity Registry toolbar, verify the `"🔍 Research All Pending (4)"` button is enabled.
3. Click `"🔍 Research All Pending"`.
4. Observe the batch progress bar appear:
   - Max 2 concurrent items researching at any time.
   - Status indicators on each row transition from `QUEUED` to `RESEARCHING` to `COMPLETED`.
   - As each item completes, its status badge (e.g. `ACTION_REQUIRED` or `NO_ISSUE_SURFACED`) immediately renders without waiting for the full batch.
5. Verify all 4 entities complete successfully and the progress banner shows `4 of 4 completed`.

---

## Scenario 2: Fail-Visible Isolation in Batch Processing

1. Ingest a script with multiple entities.
2. Simulate a failure on one specific entity (e.g. network interruption).
3. Verify that the failing item displays `⚠️ Failed` / `INSUFFICIENT_EVIDENCE`.
4. Verify the remaining queued items in the batch continue processing without interruption.
