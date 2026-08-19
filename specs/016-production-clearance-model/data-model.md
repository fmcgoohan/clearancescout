# Data Model: Production Clearance Operating Model (Phase 9)

**Feature**: `specs/016-production-clearance-model` (Phase 9 Focus)  
**Date**: 2026-08-19  
**Status**: Completed  

---

## 1. Production Dashboard Data Schema

### `ProductionDashboardData`
Returned by `GET /api/projects/:id/dashboard`.

```typescript
export interface ProductionDashboardKPIs {
  totalScenes: number;
  finalClearScenes: number;
  workingClearScenes: number;
  redScenes: number;
  readinessPercentage: number;
  totalEntities: number;
  criticalBlockersCount: number;
  activePlaceholdersCount: number;
  rightsExpiringSoonCount: number;
  pendingActionsCount: number;
}

export interface BlockerItemDetail {
  sceneId: string;
  sceneNumber: number;
  heading: string;
  occurrenceId: string;
  canonicalEntityId: string;
  canonicalName: string;
  clearanceStatus: string;
  riskRationale: string;
}

export interface ExpiringRightsDetail {
  rightsId: string;
  canonicalEntityId: string;
  canonicalName: string;
  agreementName: string;
  licensor: string;
  expirationDate: string;
  daysRemaining: number;
}

export interface ActivePlaceholderDetail {
  id: string;
  canonicalEntityId: string;
  canonicalName: string;
  fictionalName: string;
  assetCategory: string;
  clearanceTier: 'TEMP_APPROVED' | 'FINAL_CLEARED';
  approvedBy: string;
}

export interface ProductionDashboardData {
  projectId: string;
  projectTitle: string;
  projectType: string;
  kpis: ProductionDashboardKPIs;
  sceneReadinessDistribution: Array<{
    sceneId: string;
    sceneNumber: number;
    heading: string;
    status: 'FINAL_CLEAR' | 'WORKING_CLEAR' | 'RED';
    blockerCount: number;
    workingCount: number;
    totalOccurrences: number;
  }>;
  shootBlockers: BlockerItemDetail[];
  expiringRights: ExpiringRightsDetail[];
  activePlaceholders: ActivePlaceholderDetail[];
  departmentActionsSummary: {
    ART_DEPT: number;
    LEGAL_COUNSEL: number;
    LOCATIONS: number;
    PRODUCTION_MGMT: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    label: string;
    timestamp: string;
  }>;
}
```
