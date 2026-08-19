# Data Model: Production Clearance Operating Model (Phase 6)

**Feature**: `specs/016-production-clearance-model` (Phase 6 Focus)  
**Date**: 2026-08-19  
**Status**: Completed  

---

## 1. Action Items Domain Model

### `ClearanceActionType` & `DepartmentTarget`
```typescript
export type ClearanceActionType =
  | 'ART_DEPT_REPLACEMENT'
  | 'LEGAL_COUNSEL_RELEASE'
  | 'LOCATIONS_PERMIT'
  | 'PRODUCTION_REVIEW'
  | 'COUNSEL_OVERRIDE_REVIEW';

export type DepartmentTarget =
  | 'ART_DEPT'
  | 'LEGAL_COUNSEL'
  | 'LOCATIONS'
  | 'PRODUCTION_MGMT'
  | 'CLEARANCE_TEAM';

export type ActionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
```

### `ClearanceActionItem`
Stored in Firestore at `projects/{projectId}/actions/{actionId}`.

```typescript
export interface ClearanceActionItem {
  id: string;                      // e.g. 'act-a1b2c3d4'
  projectId: string;
  sceneId?: string;
  sceneNumber?: number;
  canonicalEntityId?: string;
  canonicalName?: string;
  occurrenceId?: string;
  actionType: ClearanceActionType;
  targetDepartment: DepartmentTarget;
  title: string;
  description: string;
  priority: ActionPriority;
  status: ActionStatus;
  resolutionTrigger?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. Notification Model

### `ClearanceNotification`
Stored in Firestore at `projects/{projectId}/notifications/{notifId}`.

```typescript
export interface ClearanceNotification {
  id: string;                      // e.g. 'notif-98765432'
  projectId: string;
  sceneId?: string;
  sceneNumber?: number;
  targetDepartment: DepartmentTarget;
  headline: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';
  isRead: boolean;
  createdAt: string;
}
```
