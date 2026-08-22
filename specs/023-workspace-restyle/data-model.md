# Phase 1 Data Model & Tokens: Feature 023 Workspace Restyle

**Feature**: Workspace Restyle (All Five Surfaces)
**Spec**: [`spec.md`](spec.md)

---

## Design System Tokens & Custom Properties (`src/index.css`)

```css
:root {
  /* Sacred Status Colors (Article 1) */
  --status-no-issue: #10b981;          /* Cleared / Green */
  --status-no-issue-bg: rgba(16, 185, 129, 0.15);
  --status-no-issue-border: rgba(16, 185, 129, 0.4);

  --status-review: #f59e0b;            /* Review Recommended / Amber */
  --status-review-bg: rgba(245, 158, 11, 0.15);
  --status-review-border: rgba(245, 158, 11, 0.4);

  --status-action: #ef4444;            /* Action Required / Red */
  --status-action-bg: rgba(239, 68, 68, 0.15);
  --status-action-border: rgba(239, 68, 68, 0.4);

  /* Single Permitted Brand Accent */
  --accent-cyan: #06b6d4;              /* Brand Accent / Cyan */
  --accent-cyan-bg: rgba(6, 182, 212, 0.15);
  --accent-cyan-border: rgba(6, 182, 212, 0.4);

  /* Typography Scale (Article 2) */
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Courier Prime', 'JetBrains Mono', monospace;

  /* Spacing & Borders */
  --border-color: rgba(255, 255, 255, 0.1);
  --card-bg: rgba(15, 23, 42, 0.75);
}
```

---

## Component Surface Data Contracts

### 1. Command Bar State (`src/App.tsx`)
- `projectTitle`: `string`
- `quotaUsed`: `number`
- `quotaLimit`: `number`
- `openTasksCount`: `number`

### 2. Readiness Band State (`src/pages/WorkspacePage.tsx`)
- `readinessIndex`: `number` (0–100)
- `overallStatus`: `'CLEARED' | 'REVIEW_RECOMMENDED' | 'BLOCKS_SHOOTING'`
- `scenes`: `Array<{ id: string; sceneNumber: string; location: string; timeOfDay: string; status: string; plainLanguageReason: string }>`

### 3. Screenplay Panel State (`src/components/ScriptViewer.tsx`)
- `scriptText`: `string`
- `occurrences`: `Array<{ entityId: string; textSpan: string; status: string }>`

### 4. Entity Registry State (`src/components/EntityRegistryTable.tsx`)
- `entities`: `Array<{ id: string; name: string; category: string; status: string; occurrenceCount: number }>`

### 5. Dashboard & Task Center State (`src/components/ProductionDashboardModal.tsx`, `src/components/ActionListModal.tsx`)
- `kpiData`: `{ readiness: number; blocking: number; placeholders: number; expiringRights: number; openTasks: number }`
- `departmentTasks`: `Array<{ id: string; department: string; status: 'OPEN' | 'RESOLVED'; severity: string; text: string }>`
