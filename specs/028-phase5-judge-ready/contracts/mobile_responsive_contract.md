# Contract: Mobile 375px Responsive Layout & Sticky Header Non-Intersection

**Contract Type**: Responsive Layout & Bounding Box Contract
**Target Viewports**: `375x667` (iPhone SE/8), `375x812` (iPhone X/12/13 mini)
**Test Harness**: `tests/repro_live.js` / `tests/repro_local.js`

---

## 1. Layout & Overflow Constraints

1. **Document Horizontal Overflow**:
   ```javascript
   document.documentElement.scrollWidth <= document.documentElement.clientWidth; // Must be true (375px max)
   ```
2. **Project Code Badges Single-Line**:
   ```javascript
   // All [data-testid="workspace-project-code"] and [data-project-code="true"]
   element.getClientRects().length === 1; // Exactly 1 client rect (no line break)
   ```
3. **Portfolio Title Single-Line**:
   ```javascript
   // [data-testid="portfolio-dashboard"] h2
   element.getClientRects().length === 1 && element.offsetHeight <= 32; // Exactly 1 line
   ```

---

## 2. Filter Tabs Proportional Balance Contract

1. **Layout**: Proportional, balanced tap targets with visible $\ge 8$px horizontal and vertical gaps.
2. **Styling & Flex**:
   - `[data-filter-tab="all"]`: `flex: 1 1 80px; min-width: 80px; text-align: center; white-space: nowrap;`
   - `[data-filter-tab="blocked"]`: `flex: 1 1 110px; min-width: 110px; text-align: center; white-space: nowrap;`
   - `[data-filter-tab="ready"]`: `flex: 1 1 95px; min-width: 95px; text-align: center; white-space: nowrap;`
3. **Accessible Touch Targets**: Minimum touch target height $\ge 36$px with visible `:focus-visible` outline.

---

## 3. Sticky Header Non-Intersection Contract

For every portfolio card (`card`) and its Open Production button (`btn`):
```javascript
// After card.scrollIntoView({ behavior: 'instant', block: 'start' })
card.getBoundingClientRect().top >= header.getBoundingClientRect().bottom - 1;

// After btn.scrollIntoView({ behavior: 'instant', block: 'nearest' })
btn.getBoundingClientRect().top >= header.getBoundingClientRect().bottom - 1;
```
