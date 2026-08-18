# UI & Accessibility Contract: Accessible Responsive Workspace

**Feature**: `specs/014-accessible-responsive-workspace` | **Date**: 2026-08-18

---

## 1. Keyboard Navigation Contract

| Action / Shortcut | Target Component | Expected Behavior |
|:---|:---|:---|
| `Tab` / `Shift+Tab` | All interactive elements | Sequential navigation with visible `:focus-visible` outline ring |
| `Enter` / `Space` | Buttons, Tabs, Dropdowns | Activates button, selects tab, or toggles control |
| `Escape` | Active Modal or Drawer | Closes topmost active modal/drawer, restores focus to trigger |

---

## 2. ARIA Attribute Contract

| Component | Element | Required ARIA Attributes |
|:---|:---|:---|
| Filter Select | `<select>` | `aria-label="Filter by [Dimension]"` |
| Reset Filters Button | `<button>` | `aria-label="Reset all active filters"` |
| Citation Drawer | `<aside>` / `<div>` | `role="dialog"`, `aria-modal="true"`, `aria-label="Research Evidence Drawer"` |
| Comparison Modal | `<div>` | `role="dialog"`, `aria-modal="true"`, `aria-label="Replacement Comparison Modal"` |
| Close Button | `<button>` | `aria-label="Close dialog"` |
