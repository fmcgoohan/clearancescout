# Research: Workspace Registry Multi-Dimension Filters

**Feature**: `specs/009-workspace-registry-filters` | **Date**: 2026-08-18

---

## 1. Filter Execution: Client-Side State vs Server Query

### Context
In screenplay clearance workflows, a project typically has 10–200 canonical entities. Fast, instantaneous filtering across Status, Category, and Scene is needed while reviewing script occurrences.

### Decision
Implement filtering purely on the client side inside `EntityRegistryTable.tsx`:
- Zero latency ($< 16\text{ms}$ 60 FPS re-renders).
- Zero network requests.
- Strictly non-destructive; eliminates any possibility of accidental server mutations.

---

## 2. Scene Dimension Mapping

### Context
Entities occur within specific scenes (mapped via `sceneOccurrences` or `scenes[].occurrences[].canonicalEntityId`). When filtering by a specific scene:
- An entity matches if at least one of its scene occurrences belongs to the selected `sceneId`.
- If `sceneId === 'ALL'`, all entities match the scene dimension.

### Decision
`EntityRegistryTable` accepts `scenes?: { id: string; sceneNumber: number; heading: string; occurrences?: any[] }[]`. For scene filtering:
- If an entity's ID appears in the selected scene's occurrences (or matches `sceneId`), it passes the scene filter.

---

## 3. Empty State UX Pattern

### Context
When active filters yield zero results, users must immediately understand why the table is empty and have a frictionless way to recover.

### Decision
- When total entities $> 0$ and filtered entities $= 0$:
  - Render a clear message: `"No entities match the active filters: [Category: {category}] [Status: {status}] [Scene: {scene}]"`.
  - Render a prominent `"🔄 Clear All Filters"` button that resets all three dimensions to `ALL`.
