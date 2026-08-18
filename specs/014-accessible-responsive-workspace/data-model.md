# Data Model & Accessibility State: Accessible Responsive Workspace

**Feature**: `specs/014-accessible-responsive-workspace` | **Date**: 2026-08-18

---

## 1. UI Overlay Priority Stack

```typescript
export type OverlayType = 
  | 'NONE'
  | 'DEMO_TOKEN_MODAL'
  | 'TIMELINE_DRAWER'
  | 'CITATION_DRAWER'
  | 'COMPARISON_MODAL'
  | 'ADD_ENTITY_MODAL'
  | 'EDIT_ENTITY_MODAL';

export interface OverlayState {
  activeOverlays: OverlayType[];
  topmostOverlay: OverlayType;
}
```

---

## 2. Responsive Breakpoints

| Breakpoint | Viewport Width | Target Devices | Layout Behavior |
|:---|:---:|:---:|:---|
| **Mobile** | $< 768\text{px}$ | Phones, Small Displays | Single-column stacked panels, 100% width drawers, scrollable tables |
| **Tablet** | $768\text{px} - 1023\text{px}$ | Tablets, iPads | Fluid responsive grid, 500px overlay drawers |
| **Desktop** | $\ge 1024\text{px}$ | Laptops, Large Monitors | Side-by-side workspace panels, multi-column tables, full drawer overlays |
