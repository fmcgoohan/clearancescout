# Research: Manual Clearance Item Correction

**Feature**: `specs/006-manual-item-correction` | **Date**: 2026-08-18

---

## 1. Technical Context & Clarifications

### Research Topic 1: Entity Mutation API Design & REST Semantics
- **Decision**: Provide dedicated endpoints under `/api/projects/:id/entities`:
  - `POST /api/projects/:id/entities`: Manually create a new clearance item (specifying name, category, optional sceneId, usageContext).
  - `PATCH /api/projects/:id/entities/:entityId`: Edit canonical entity metadata (name, category, description, context).
  - `DELETE /api/projects/:id/entities/:entityId`: Permanently remove an entity and its associated scene occurrences.
- **Rationale**: Follows standard REST conventions with granular resource endpoints and aligns with existing `EntityRepo` and Firestore subcollections.
- **Alternatives Considered**: Multi-entity batch mutation payload (overcomplicated for individual user edits; individual atomic endpoints are cleaner for real-time optimistic UI).

### Research Topic 2: Invalidation vs. Counsel Override Preservation
- **Decision**: When an entity's `canonicalName` or `entityCategory` changes:
  1. The automated assessment (research risk category, citations) is invalidated (reset to `INSUFFICIENT_EVIDENCE` or pending evaluation).
  2. Any existing `replacementCard` is cleared.
  3. Existing signed counsel overrides (`isOverridden`, `latestOverride`, scene-level overrides in `OverrideRepo`) are **strictly preserved** without mutation.
- **Rationale**: Counsel overrides represent legal sign-offs. If counsel has signed off on a scene use, changing the name/category prompts new research for the automated baseline without erasing legal audit trails.
- **Alternatives Considered**: Automatically deleting counsel overrides on edit (violates legal provenance invariants; counsel must explicitly modify overrides if needed).

### Research Topic 3: Observable Action Timeline Streaming
- **Decision**: Emit structured SSE events via `timelineEmitter`:
  - `ITEM_ADDED`: `{ entityId, canonicalName, entityCategory, sceneId, origin: 'MANUAL' }`
  - `ITEM_EDITED`: `{ entityId, previousName, newName, previousCategory, newCategory, fieldsChanged }`
  - `ITEM_REMOVED`: `{ entityId, canonicalName, entityCategory }`
- **Rationale**: Complies with Constitution Observable Action Timeline standard without leaking internal chain-of-thought.
- **Alternatives Considered**: Polling workspace state (SSE provides instantaneous UI synchronization across open browser tabs).

### Research Topic 4: Frontend UI Modals & Interaction Flow
- **Decision**:
  - Add "Add Clearance Item" button in `EntityRegistryTable.tsx` toolbar.
  - Add inline "✏️ Edit" and "🗑️ Delete" action buttons in the entity row actions.
  - Render an accessible modal dialog (`ItemEditModal.tsx`) for editing name, category dropdown (5 options), and usage notes.
- **Rationale**: Minimal friction, $< 3$ clicks to edit, immediate feedback.
- **Alternatives Considered**: In-place cell editing (modal provides better validation and confirmation for deletion/category change).
