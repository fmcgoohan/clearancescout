# Data Model & Architecture Contracts: Feature 024 UX Redesign

**Feature**: `024-ux-redesign` | **Spec**: [`spec.md`](spec.md) | **Plan**: [`plan.md`](plan.md)

---

## Authoritative State Model (`ProjectWorkspace`)

The application state model relies on a single canonical `ProjectState` interface defined in `src/types/workspace.ts`:

```typescript
export interface ProjectState {
  id: string;
  name: string;
  scriptVersion: string;
  scenes: Scene[];
  entities: CanonicalEntity[];
  departmentTasks: DepartmentTask[];
  shootingReadiness: ShootingReadinessIndex;
  executionMode: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
  ingestionStatus: IngestionProgressState;
  recommendedAction: RecommendedNextAction | null;
}

export interface RecommendedNextAction {
  id: string;
  entityId: string;
  entityName: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  message: string;        // e.g. "2 clearance items require action. Start with Nocturne of the Wild."
  rationale: string;      // e.g. "Blocks Scene 1 (Interior Lab) shoot readiness"
  actionType: 'RESEARCH' | 'MITIGATE' | 'RIGHTS' | 'COUNSEL_OVERRIDE';
  actionLabel: string;     // e.g. "Research Nocturne of the Wild"
}

export interface IngestionProgressState {
  stage: 'IDLE' | 'UPLOADING' | 'PARSING' | 'EXTRACTING' | 'EVALUATING' | 'COMPLETE' | 'ERROR';
  progressPercentage: number;
  currentStageMessage: string;
  errorDetails?: string;
  backupState?: ProjectState | null; // Used for atomic rollback on cancellation/error
}
```

---

## Count Semantics & Formulas

```typescript
// 1. Scenes Count
export const selectSceneCount = (state: ProjectState): number => 
  state.scenes.length;

// 2. Canonical Entities Count
export const selectEntityCount = (state: ProjectState): number => 
  state.entities.length;

// 3. Blocking Occurrences Count
export const selectBlockingOccurrencesCount = (state: ProjectState): number =>
  state.entities.reduce((total, entity) => {
    const blockingInEntity = entity.occurrences.filter(occ => occ.riskLevel === 'BLOCKS_SHOOTING').length;
    return total + blockingInEntity;
  }, 0);

// 4. Department Tasks Count
export const selectOpenTasksCount = (state: ProjectState): number =>
  state.departmentTasks.filter(task => task.status === 'OPEN').length;
```

---

## CSS Token Data Contract (`src/index.css`)

All components consume tokens defined in `src/index.css` (Constitution Article 1 & Article 6):

```css
:root {
  /* Canvas & Surfaces */
  --bg-canvas: #0a0d12;
  --bg-surface: #121824;
  --bg-surface-hover: #1b2333;
  --border-subtle: #232d42;

  /* Typography */
  --font-sans: 'Archivo', system-ui, -apple-system, sans-serif;
  --font-mono: 'IBM Plex Mono', 'Courier New', monospace;

  /* Sacred Status Colors */
  --status-cleared: #22c55e;        /* Green */
  --status-review: #f59e0b;         /* Amber */
  --status-action: #ef4444;         /* Red */
  
  /* Single Brand Accent */
  --brand-accent: #7c9cff;         /* Periwinkle */
}
```
