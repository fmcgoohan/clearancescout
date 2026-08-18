# Quickstart Validation Guide: Binder Jump to Evidence & Timeline Context

**Feature**: `specs/010-binder-jump-evidence` | **Date**: 2026-08-18

---

## Scenario 1: Jump from Binder Preview to Citation Evidence Drawer

1. Ingest the bundled demo screenplay and evaluate clearance.
2. Open the Clearance Binder preview modal.
3. In the Canonical Entity section or Replacement Catalog, locate `Summit Cola`.
4. Click `"🔍 View Evidence"`.
5. Verify the `CitationDrawer` opens displaying:
   - Entity name `Summit Cola`
   - Risk status `ACTION_REQUIRED` and legal rationale
   - Grounded citations list with provenance badge (`DEMO_FIXTURE` or `PARALLEL_LIVE`)
6. Close the citation drawer and verify you return to the binder preview modal.

---

## Scenario 2: Jump from Binder Preview to Timeline Context

1. In the Clearance Binder preview modal, locate an entity (e.g. `Summit Cola` or `AeroTech Prism Laptop`).
2. Click `"📜 View Timeline"`.
3. Verify the `TimelineDrawer` opens with timeline events focused/highlighted for that entity.
4. Verify no raw chain-of-thought is displayed (only observable tool calls and status transitions).
5. Close the timeline drawer and verify the binder preview remains open with its SHA-256 digest unchanged.
