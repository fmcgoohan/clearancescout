# Research: Multi-Item Clearance Research Progress & Concurrency Control

**Feature**: `specs/011-multi-item-research-progress` | **Date**: 2026-08-18

---

## 1. Concurrency Management: Client-Side Worker Pool vs. Monolithic Endpoint

### Context
When evaluating multiple entities, sending a single gigantic array to `POST /api/projects/:id/clearance/evaluate` with 20 items creates a single long-running HTTP request that blocks progress feedback, risks gateway timeouts (504), and provides no visibility if an item in the middle fails.

### Decision
- Maintain the single-item / granular `POST /api/projects/:id/clearance/evaluate` with `{ canonicalEntityIds: [id] }`.
- Manage a client-side asynchronous queue worker pool bounded to `CONCURRENCY_LIMIT = 2`.
- As each item completes:
  1. Record its individual assessment in Firestore/MemoryStore.
  2. Emit real-time timeline events for that specific entity.
  3. Update UI table state immediately.
- If one item fails, catch the error, mark it `FAILED` / `INSUFFICIENT_EVIDENCE`, and allow worker pool to immediately pull the next item from the queue.

---

## 2. Fail-Visible Error Isolation

### Context
If a search query fails or an external network error occurs on one item, failing the entire batch leaves the workspace in an undefined partial state and frustrates coordinators.

### Decision
- Wrap each item evaluation in a try/catch block within the worker pool.
- On error, transition that specific item to `FAILED` with an error note, ensure overall entity status remains `INSUFFICIENT_EVIDENCE`, and keep single-item retry active.
- The worker pool continues to exhaustion without aborting remaining items.

---

## 3. Override Preservation Invariant

### Context
Clearance coordinators may run batch research on newly added items after counsel has already signed off overrides on other items.

### Decision
- Prior to and during batch research, query existing overrides.
- Batch research only writes assessments and does NOT overwrite or delete counsel override records.
