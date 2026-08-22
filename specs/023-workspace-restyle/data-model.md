# Phase 1 Data Model & Tokens: Feature 023 Workspace Restyle

**Feature**: Workspace Restyle (All Five Surfaces)  
**Spec**: [`spec.md`](spec.md)  
**Oracle**: `mockup-v3.html` (local visual reference)

---

## Design System Tokens & Custom Properties (`src/index.css`)

```css
:root {
  /* Surfaces & Borders */
  --bg: #0E1116;
  --panel: #151B23;
  --panel2: #111721;
  --border: #242E3A;
  --border-soft: #1C2530;

  /* Typography Colors */
  --text: #E7EDF4;
  --muted: #8B97A7;
  --faint: #5C6878;

  /* Single Permitted Brand Accent */
  --accent: #7C9CFF;             /* Periwinkle Accent */
  --accent-dim: #7C9CFF33;

  /* Sacred Status Colors (Article 1) */
  --ok: #4CC38A;                 /* Cleared / Green */
  --ok-bg: #4CC38A1A;

  --warn: #E5B454;               /* Review Recommended / Amber */
  --warn-bg: #E5B4541A;

  --crit: #E5646E;               /* Action Required / Red */
  --crit-bg: #E5646E1F;

  /* Typography Scale (Article 2) */
  --font-sans: 'Archivo', system-ui, -apple-system, sans-serif;
  --mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* Keyframe Motion Rules & Reduced Motion Collapse */
@keyframes rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

@keyframes pop {
  from { opacity: 0; transform: translateY(18px) scale(0.97); }
  to { opacity: 1; transform: none; }
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  50% { box-shadow: 0 0 0 4px var(--crit-bg); }
}

@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
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
