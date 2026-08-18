# Research: Accessible Responsive Workspace

**Feature**: `specs/014-accessible-responsive-workspace` | **Date**: 2026-08-18

---

## 1. Keyboard Navigation & Overlay Stack Management

### Context
When multiple overlays (e.g. Comparison Modal, Citation Drawer, Demo Token Modal, Timeline Drawer) can be triggered, pressing `Escape` must dismiss only the topmost overlay and restore focus to its launching element without closing underlying views prematurely.

### Decision
- Maintain an active overlay priority stack in `App.tsx` and window `keydown` event listeners in overlay components.
- When `Escape` is pressed:
  1. If Comparison Modal is open, close Comparison Modal.
  2. Else if Citation Drawer is open, close Citation Drawer.
  3. Else if Timeline Drawer is open, close Timeline Drawer.
  4. Else if Demo Token Modal is open, close Demo Token Modal.
  5. Else if Add Entity Modal is open, close Add Entity Modal.
- Provide visible `:focus-visible` outline rings (`2px solid var(--accent-cyan)` with `outline-offset: 2px`).

---

## 2. WCAG AA Contrast Compliance

### Context
Dark-themed interfaces with glowing accents must ensure sufficient luminosity contrast for all foreground text and status badges against their container backgrounds.

### Decision
- Normal body and table text: `#f1f5f9` (Slate 100) on `#0a0d14` / `#121824` provides a contrast ratio $> 13:1$ (exceeding $4.5:1$ threshold).
- Muted labels and secondary text: `#94a3b8` (Slate 400) on `#121824` provides a contrast ratio $> 5.5:1$.
- Status chips:
  - `NO_ISSUE_SURFACED`: `#34d399` on `rgba(16, 185, 129, 0.15)`
  - `REVIEW_RECOMMENDED`: `#fbbf24` on `rgba(245, 158, 11, 0.15)`
  - `ACTION_REQUIRED`: `#f87171` on `rgba(239, 68, 68, 0.15)`
  - `INSUFFICIENT_EVIDENCE`: `#a78bfa` on `rgba(139, 92, 246, 0.15)`

---

## 3. Responsive Layout Strategy (< 768px)

### Context
Screenplay clearance workflows involve multi-column tables, script viewers, and side drawers that must remain fully functional on tablet and mobile viewports.

### Decision
- Use CSS Flexbox and Grid with `@media (max-width: 768px)` breakpoints.
- Header controls wrap smoothly into responsive flex stacks.
- Entity Registry Table is wrapped in an `overflow-x: auto` container with minimum cell widths so data columns remain aligned without text clipping.
- Slide-over drawers expand to `100vw` / `100% width` on screens $< 768\text{px}$ with a prominent touch-friendly close button ($\ge 44\times 44\text{px}$).
