# Data Model: Feature 017 Judge-Ready 1-Click Demo & Production Workspace Rebrand

**Feature**: `017-judge-ready-demo`  
**Created**: 2026-08-19

---

## 1. Demo Automation Request & Response Schema

### `POST /api/projects/:id/script/demo`

**Request Payload**:
```typescript
export interface DemoScriptLoadRequest {
  autoEvaluate?: boolean; // Default: true in DEMO_MODE
  includeSampleRights?: boolean; // Default: true
  includeSamplePlaceholders?: boolean; // Default: true
}
```

**Response Payload**:
```typescript
export interface DemoScriptLoadResponse {
  projectId: string;
  projectTitle: string;
  projectType: 'Movie' | 'TV Show' | 'Commercial';
  scenesCount: number;
  entitiesCount: number;
  evaluationsCount: number;
  activeRightsCount: number;
  activePlaceholdersCount: number;
  openActionsCount: number;
  readinessSummary: {
    overallReadinessPercentage: number;
    finalClearScenesCount: number;
    workingClearScenesCount: number;
    redScenesCount: number;
  };
  provenance: 'DEMO_FIXTURE';
  message: string;
}
```

---

## 2. Populated Demo Entity Graph

Upon 1-click loading in `DEMO_MODE`, the project state contains:

1. **Project Entity**:
   - `id`: project ID (e.g. `proj-demo` or active ID)
   - `title`: `"The Neon Horizon"` (or active project title)
   - `projectType`: `"Movie"`
   - `productionCompany`: `"Entrant Studio Team"`

2. **Scenes (10 Scenes)**:
   - `INT. PENTHOUSE WORKSPACE - NIGHT`
   - `EXT. MIDTOWN SPIRE TOWER - NIGHT`
   - `INT. INDUSTRIAL SUB-LEVEL - NIGHT`
   - *(and subsequent scenes from demo_screenplay.txt)*

3. **Canonical Entities & Evaluated Risks**:
   - **`Summit Cola`** (`BRAND`): `NO_ISSUE_SURFACED` (Fictional brand mark / Cleared)
   - **`AeroTech Prism Laptop`** (`BRAND`): `REVIEW_RECOMMENDED` (Covered by `NovaTech Zenith` `TEMP_APPROVED` placeholder)
   - **`Veloce GT`** (`BRAND`): `NO_ISSUE_SURFACED` (Fictional automotive mark / Cleared)
   - **`Elena Vance`** (`PUBLIC_FIGURE`): `REVIEW_RECOMMENDED` (Fictional public figure / Incidental background depiction)
   - **`Nocturne of the Wild`** (`ART_MUSIC`): `NO_ISSUE_SURFACED` (Fictional background track)
   - **`Midtown Spire Tower`** (`PROPRIETARY_LOCATION`): `NO_ISSUE_SURFACED` (Fictional landmark)
   - **`Titan Industrial Hazard Placard`** (`GRAPHIC_PROP`): `NO_ISSUE_SURFACED` (Generic industrial warning prop)

4. **Rights Agreements**:
   - `Beverage Global Rights Ltd` (Active 60-day license for Beverage products)

5. **Fictional Prop Placeholders**:
   - `NovaTech Zenith` (`TEMP_APPROVED` replacement prop for `AeroTech Prism Laptop`)

6. **Action Queues**:
   - Open action items for legal review / VFX delivery tagged to `LEGAL_COUNSEL` and `ART_DEPT`
