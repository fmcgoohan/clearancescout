# Contract: Judge Demo Walkthrough & Project Isolation Assertions

**Contract Type**: Behavioral & End-to-End State Machine Contract
**Target Endpoints**: `/api/projects/:id/summary`, `/api/projects/:id/actions`, `/api/projects/:id/notifications`
**Header Contract**: `x-demo-token: judge-pass-2026` or `Authorization: Bearer judge-pass-2026`

---

## 1. Baseline State Invariants

### 1.1 `The Neon Horizon` (`proj-default`)
```json
{
  "projectId": "proj-default",
  "projectTitle": "The Neon Horizon",
  "projectCode": "PRJ-NEON-HORIZON",
  "shootingReadiness": 33.3,
  "blockedSceneCount": 2,
  "sceneCount": 3,
  "clearanceItemCount": 7,
  "departmentTaskCount": 11,
  "summary": {
    "clearedCount": 3,
    "actionRequiredCount": 2,
    "reviewRecommendedCount": 2,
    "totalEntities": 7
  }
}
```

### 1.2 `Cyberpunk Odyssey` (`proj-cyberpunk`)
```json
{
  "projectId": "proj-cyberpunk",
  "projectTitle": "Cyberpunk Odyssey",
  "projectCode": "PRJ-CYBERPUNK",
  "shootingReadiness": 100.0,
  "blockedSceneCount": 0,
  "sceneCount": 0,
  "clearanceItemCount": 0,
  "departmentTaskCount": 0,
  "summary": {
    "clearedCount": 0,
    "actionRequiredCount": 0,
    "reviewRecommendedCount": 0,
    "totalEntities": 0
  }
}
```

---

## 2. Zero-Hybrid Project Switching Contract

During transition from Project A to Project B:
1. **Pre-Transition**: Workspace displays Project A state completely.
2. **Transition Active (`isSwitchingProject = true`)**:
   - Visual overlay `[data-testid="switching-production-overlay"]` MUST cover the viewport (`position: fixed; inset: 0; z-index: >= 100;`).
   - Title MUST render `"Switching production..."`.
   - Zero transient frames showing Project A header/summary combined with Project B empty tabs/content are permitted without the overlay covering the screen.
3. **Post-Transition (`isSwitchingProject = false`)**:
   - Workspace MUST display Project B title, code, readiness, tabs, and content simultaneously.

---

## 3. Notification Deep-Link & Focus Contract

1. **Trigger**: User activates notification item with `targetTaskId = "TASK-101"`.
2. **Modal Invocation**: `ActionListModal` opens (`isOpen = true`).
3. **Live Region Announcement**: Container element with `role="status"` and `aria-live="polite"` announces `"Navigated to task: Create Fictional Prop Graphic: Titan Industrial Hazard Placard"`.
4. **Active Focus**: Keyboard focus MUST land directly on `<h4 id="task-heading-TASK-101">`.
5. **No Flash**: Header task count badge MUST NOT display `"0 of 0"` during initial load.
