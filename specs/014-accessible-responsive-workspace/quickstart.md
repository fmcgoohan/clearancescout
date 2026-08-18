# Quickstart Validation Guide: Accessible Responsive Workspace

**Feature**: `specs/014-accessible-responsive-workspace` | **Date**: 2026-08-18

---

## Scenario 1: Keyboard Navigation & Escape Dismissal

1. Start application:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:5173`.
3. Press `Tab` repeatedly to cycle through header actions, filter dropdowns, and table buttons.
4. Press `Enter` on any `"🔍 View Evidence"` button to open the Citation Drawer.
5. Press `Escape`; verify the drawer closes and focus returns to the table.

---

## Scenario 2: Mobile Responsive Layout (< 768px)

1. Open DevTools and set viewport width to `375px` (e.g. iPhone SE / 14).
2. Verify:
   - Header controls and navigation links wrap cleanly into a vertical flex layout.
   - Script workspace and entity table stack vertically without horizontal page overflowing.
   - Table columns can be scrolled horizontally without clipping action buttons.
   - Opening the Citation Drawer expands to full width with a touch-accessible close button.
