# Quickstart Validation Guide: Workspace Registry Multi-Dimension Filters

**Feature**: `specs/009-workspace-registry-filters` | **Date**: 2026-08-18

---

## Scenario 1: Multi-Dimension Filtering

1. Ingest the bundled demo screenplay into a project.
2. Evaluate clearance for entities.
3. In the Entity Registry table:
   - Select Status: `ACTION_REQUIRED`
   - Select Category: `BRAND`
   - Select Scene: `Scene 1`
4. Verify only matching entities (e.g. `Summit Cola` in Scene 1) are displayed.
5. Verify header counter reads `1 of 6 Entities Displayed` (or actual matching count).

---

## Scenario 2: Zero-Match Empty State and Reset

1. In the Entity Registry table:
   - Select Status: `ACTION_REQUIRED`
   - Select Category: `PUBLIC_FIGURE`
   - Select Scene: `Scene 2`
2. Verify zero-match empty state appears:
   - "No entities match the active filters: [Category: PUBLIC_FIGURE] [Status: ACTION_REQUIRED] [Scene: Scene 2]"
   - Action button: "🔄 Clear Filters"
3. Click "🔄 Clear Filters".
4. Verify all filters reset to `ALL` and all 6 entities reappear.
