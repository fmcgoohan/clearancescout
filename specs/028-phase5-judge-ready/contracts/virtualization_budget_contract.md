# Contract: 1,000-Task Virtualization Performance Budget

**Contract Type**: Non-Functional Performance & Resource Clamping Contract
**Test Harness**: `tests/local_1000_task_virtualization.js`
**Target Component**: `src/components/VirtualTaskList.tsx`

---

## 1. Metric Targets & Verification Budgets

| Metric | Target Budget | Verification Tool / API | Failure Condition |
|:---|:---|:---|:---|
| **Synthetic Dataset Size** | $\ge 1,000$ items | `tasks.length` | $< 1,000$ items |
| **Initial Render Time** | $\le 500$ms | `performance.now()` | $> 500$ms from mount to first row render |
| **Active Rendered DOM Cards** | $\le 30$ elements | `document.querySelectorAll('.task-card').length` | $> 30$ active DOM nodes in list container |
| **Scroll Frame Rate** | $\ge 60$ FPS (avg frame $\le 16.6$ms) | `requestAnimationFrame` timing | Long frame spikes ($>33$ms) $> 1\%$ |
| **Filter Execution Time** | $\le 50$ms | `performance.now()` | $> 50$ms for department/status filter update |

---

## 2. DOM Virtualization Clamping Invariant

```typescript
// Window calculation formula enforced by VirtualTaskList
const ITEM_HEIGHT = 70; // px
const CONTAINER_HEIGHT = 500; // px
const BUFFER_ITEMS = 2;

const visibleCount = Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT); // ~8 items
const maxRenderedNodes = visibleCount + (BUFFER_ITEMS * 2); // ~12 items (hard clamped <= 30)
```
