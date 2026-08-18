# Research: Binder Jump to Evidence & Timeline Context

**Feature**: `specs/010-binder-jump-evidence` | **Date**: 2026-08-18

---

## 1. Interaction Flow: Modal and Drawer Coordination

### Context
`BinderExportModal` is a full-screen or large modal overlay (`zIndex: 1200`). When a user triggers "🔍 View Evidence" or "📜 View Timeline", they need to view the drawer without destroying the binder modal's compiled state or scroll position.

### Decision
- Keep `BinderExportModal` open (or render drawer at `zIndex: 1300` / overlay) or provide seamless dismissal with binder state cached in `WorkspacePage`.
- Setting `CitationDrawer` / `TimelineDrawer` `zIndex: 1300` allows the drawer to slide over the binder preview smoothly.
- Closing the drawer returns the user directly to their active place in the binder preview.

---

## 2. Timeline Entity Focus & Chain-of-Thought Absence

### Context
Compliance auditors need to see chronological tool invocations, web searches, risk verdicts, and counsel overrides for a specific entity. Displaying raw model chain-of-thought is strictly forbidden by workspace invariants.

### Decision
- In `TimelineDrawer.tsx`, support an optional `targetEntityName?: string` or `targetEntityId?: string` prop.
- When set, filter or highlight events whose `description` or `payload` matches the target entity.
- Events displayed are limited to `TOOL_CALL`, `DOCUMENT_QUERY`, `RISK_EVAL`, `CITATION_ADDED`, `REPLACEMENT_ATTEMPT`, `REPLACEMENT_ACCEPTED`, `REPLACEMENT_REJECTED`, `OVERRIDE_RECORDED`, and `BINDER_EXPORT`. Zero chain-of-thought tokens.

---

## 3. Explicit Empty Evidence State

### Context
If a coordinator clicks "🔍 View Evidence" on an un-researched entity (`INSUFFICIENT_EVIDENCE` or 0 citations), they should not see a blank drawer or broken table.

### Decision
- When `citations.length === 0`, render an explicit empty state box:
  - `"No grounded research citations surfaced for this entity."`
  - Advice: `"Evaluate clearance in the workspace registry to execute search grounding."`
