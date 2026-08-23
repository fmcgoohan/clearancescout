# Research & Design Findings: Feature 024 UX Redesign

**Feature**: `024-ux-redesign` | **Spec**: [`spec.md`](spec.md) | **Plan**: [`plan.md`](plan.md)

---

## Technical & UX Analysis

### 1. Contextual Recommended Next Action Engine
- **Finding**: Operators previously spent time scanning table rows to locate unresolved blockers.
- **Solution**: A deterministic recommendation algorithm selects the highest-priority item in `ProjectState`:
  1. Filters entities with status `ACTION_REQUIRED` / `BLOCKS_SHOOTING`.
  2. Sorts by count of scene blocking occurrences descending.
  3. Formulates a human-readable recommendation string: e.g. *"2 clearance items require action. Start with Nocturne of the Wild."*
  4. Provides a direct 1-click action button that opens the item's research or mitigation modal.

### 2. Terminology Simplification
- **Finding**: Specialist backend terms like `"Ground"` and `"Canonical Entity Registry"` confused first-time users.
- **Solution**: Replaced primary button and table labels:
  - `"Ground"` $\rightarrow$ `"Research"` or `"Verify Evidence"`
  - `"Canonical Entity Registry"` $\rightarrow$ `"Clearance Items"`
  - `"Multi-Format Script Ingestion"` $\rightarrow$ `"Screenplay Intake & Clearance"`
  - `"Department Tasks"` $\rightarrow$ Assigned work
  - `"Blocking Occurrences"` $\rightarrow$ Scene appearances preventing shoot readiness

### 3. Responsive Breakpoints & Split Pane Collapsibility
- **Finding**: At medium tablet widths (768px-1199px), side-by-side equal columns caused entity names or action buttons to truncate.
- **Solution**: Introduced an interactive panel toggle (`[Collapse Script]` / `[Expand Script]`) and min-width column constraints (`180px` for actions). On mobile (<768px), layout transitions to a vertical stack with card views.

### 4. Accessibility & Live Region Feedback
- **Finding**: Screen readers announced timers every second during upload, overwhelming speech synthesis.
- **Solution**: Timer announcements suppressed in live region. Live stage updates (*"Parsing text"*, *"Extracting entities"*) are announced using `<div role="status" aria-live="polite">`, and completion summaries use `aria-atomic="true"`.
