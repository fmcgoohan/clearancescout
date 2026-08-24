# Data Model & API Contracts: Operations Dashboard Governance & Task Ownership

**Feature Branch**: `026-phase3-operations-governance`  
**Version**: `v0.26.0`  

---

## 1. Action Item Data Model & Audit History Schema

### `ActionAuditEvent` Schema (`server/repositories/ActionNotificationRepo.ts`)

```typescript
export type ActionAuditEventType =
  | 'CREATED'
  | 'ASSIGNED'
  | 'REASSIGNED'
  | 'DUE_DATE_CHANGED'
  | 'STATUS_CHANGED'
  | 'RESOLVED'
  | 'REOPENED';

export interface ActionAuditEvent {
  id: string;
  timestamp: string; // ISO 8601 string
  actor: string; // e.g. "Legal Counsel", "Art Director", "System Auto-Dispatcher"
  eventType: ActionAuditEventType;
  beforeState?: {
    status?: string;
    assigneeName?: string;
    assigneeRole?: string;
    dueDate?: string;
  };
  afterState?: {
    status?: string;
    assigneeName?: string;
    assigneeRole?: string;
    dueDate?: string;
  };
  description: string;
}
```

### Extended `ClearanceActionItem` Interface

```typescript
export interface ClearanceActionItem {
  id: string;
  projectId: string;
  sceneId?: string;
  sceneNumber?: number;
  canonicalEntityId?: string;
  canonicalName?: string;
  occurrenceId?: string;
  actionType: ClearanceActionType;
  targetDepartment: DepartmentTarget; // 'ART_DEPT' | 'LEGAL_COUNSEL' | 'LOCATIONS' | 'PRODUCTION_MGMT' | 'CLEARANCE_TEAM'
  title: string;
  description: string;
  priority: ActionPriority; // 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: ActionStatus; // 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
  assignee?: {
    id: string;
    name: string;
    role: string;
  };
  dueDate?: string; // ISO date string (YYYY-MM-DD or ISO 8601)
  isOverdue?: boolean; // Evaluated dynamically: dueDate < now && status !== 'RESOLVED' && status !== 'DISMISSED'
  resolutionTrigger?: string;
  resolutionReason?: string;
  resolvedAt?: string;
  activityHistory?: ActionAuditEvent[];
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. Binder Export Lifecycle Data Model

### `ClearanceBinderExportStatus` Schema (`server/repositories/BinderRepo.ts` & `src/components/BinderExportModal.tsx`)

```typescript
export type BinderExportPhase =
  | 'IDLE'
  | 'PREFLIGHT_CHECKING'
  | 'EXPORTING'
  | 'COMPLETED'
  | 'FAILED';

export interface ClearanceBinderPreflight {
  isReady: boolean;
  totalScenes: number;
  finalClearScenes: number;
  redScenesCount: number;
  unresolvedBlockersCount: number;
  warnings: string[];
}

export interface BinderExportResult {
  binderId: string;
  projectId: string;
  projectTitle: string;
  generatedFilenameJson: string;
  generatedFilenameMd: string;
  fileSizeBytes: number;
  integrityDigest: string; // SHA-256 checksum
  exportedAt: string;
  preflight: ClearanceBinderPreflight;
  downloadUrlJson: string;
  downloadUrlMd: string;
}
```

---

## 3. API Endpoint Contracts

### `PATCH /api/projects/:projectId/actions/:actionId`
- **Request Body**:
  ```json
  {
    "assignee": { "id": "user-12", "name": "Sarah Jenkins", "role": "Clearance Counsel" },
    "dueDate": "2026-09-01T17:00:00.000Z",
    "status": "IN_PROGRESS",
    "actor": "Sarah Jenkins",
    "reason": "Assigned to legal counsel for rights clearance review"
  }
  ```
- **Response (HTTP 200 OK)**: Returns updated `ClearanceActionItem` with recalculated `isOverdue` and appended `ActionAuditEvent` in `activityHistory`.

### `GET /api/projects/:projectId/dashboard`
- **Response (HTTP 200 OK)**:
  ```json
  {
    "projectId": "proj-cf44db8a",
    "projectTitle": "The Neon Horizon",
    "kpis": {
      "totalScenes": 3,
      "finalClearScenes": 1,
      "workingClearScenes": 0,
      "redScenes": 2,
      "readinessPercentage": 33.3,
      "totalEntities": 7,
      "criticalBlockersCount": 2,
      "activePlaceholdersCount": 0,
      "rightsExpiringSoonCount": 0,
      "pendingActionsCount": 11
    },
    "departmentActionsSummary": {
      "ART_DEPT": 1,
      "LEGAL_COUNSEL": 9,
      "LOCATIONS": 1,
      "PRODUCTION_MGMT": 0
    }
  }
  ```
