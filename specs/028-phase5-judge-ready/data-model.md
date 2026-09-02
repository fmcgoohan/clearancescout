# Phase 1 Data Model: Phase 5 Judge-Ready Wrap & Submission Packaging

**Feature**: [`specs/028-phase5-judge-ready/spec.md`](./spec.md)
**Date**: 2026-09-01
**Status**: Completed

---

## 1. Core Entity Schemas

### 1.1 `ProductionProject`
Represents an isolated film or television production workspace.

```typescript
export interface ProductionProject {
  id: string;                          // e.g. "proj-default", "proj-cyberpunk"
  title: string;                       // e.g. "The Neon Horizon", "Cyberpunk Odyssey"
  code: string;                        // e.g. "PRJ-NEON-HORIZON", "PRJ-CYBERPUNK"
  productionType: 'Movie' | 'TV Show' | 'Commercial';
  studioOwner: string;                 // e.g. "Apex Entertainment", "Vanguard Studios"
  shootingReadinessPercentage: number; // e.g. 33.3, 100.0
  blockedSceneCount: number;           // e.g. 2, 0
  overdueTaskCount: number;            // e.g. 11, 0
  totalSceneCount: number;             // e.g. 3, 0
  totalClearanceItemCount: number;     // e.g. 7, 0
  totalTaskCount: number;              // e.g. 11, 0
  summaryBreakdown: {
    clearedCount: number;              // e.g. 3, 0
    actionRequiredCount: number;       // e.g. 2, 0
    reviewRecommendedCount: number;    // e.g. 2, 0
    totalEntities: number;             // e.g. 7, 0
  };
  lastSyncedAt: string;                // ISO 8601 Timestamp
}
```

### 1.2 `ClearanceActionItem`
Represents a canonical department clearance task.

```typescript
export interface ClearanceActionItem {
  id: string;                          // e.g. "TASK-101", "TASK-1000"
  projectId: string;                   // e.g. "proj-default"
  targetDepartment: 'ART_DEPT' | 'LEGAL_COUNSEL' | 'LOCATIONS' | 'PRODUCTION_MGMT';
  title: string;                       // Task headline
  description: string;                 // Contextual instructions
  status: 'OPEN' | 'RESOLVED';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignedRole: string;                // e.g. "Legal Counsel", "Art Director"
  entityId?: string;                   // Canonical entity reference
  sceneNumber?: number;                // Associated scene
  versionNumber: number;               // Optimistic locking version
  commentCount: number;                // Discussion thread counter
  attachmentCount: number;             // File attachment counter
  createdAt: string;                   // ISO 8601 Timestamp
  updatedAt: string;                   // ISO 8601 Timestamp
}
```

### 1.3 `ClearanceNotification`
Represents an in-product alert or user mention.

```typescript
export interface ClearanceNotification {
  id: string;                          // e.g. "notif-01"
  projectId: string;                   // e.g. "proj-default"
  targetTaskId: string;                // e.g. "TASK-101"
  targetDepartment: string;            // e.g. "LEGAL_COUNSEL"
  headline: string;                    // e.g. "Mentioned on Task TASK-101"
  message: string;                     // e.g. "Clearance Coordinator mentioned @LegalCounsel..."
  severity: 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';
  isRead: boolean;
  createdAt: string;                   // ISO 8601 Timestamp
}
```

### 1.4 `SubmissionPackageManifest`
Represents the compliance status of all required hackathon deliverables.

```typescript
export interface SubmissionPackageManifest {
  submissionDeadline: '2026-09-07T23:59:59Z';
  liveDeployment: {
    serviceUrl: 'https://clearancescout-n3tcx4jcbq-uc.a.run.app';
    platform: 'Google Cloud Run';
    region: 'us-central1';
    demoToken: 'judge-pass-2026';
    executionMode: 'DEMO_MODE' | 'CLOUD_MODE';
  };
  provenance: {
    adkFramework: 'Google Agent Development Kit (ADK)';
    model: 'gemini-3.6-flash';
    imageModel: 'Google Imagen 3 / Gemini Image Generation';
    groundingSdk: 'parallel-web';
    prohibitedFrameworksPresent: false;
    sisterWorkspaceSplitDate: '2026-08-21';
  };
  documentation: {
    readmeVerified: boolean;
    provenanceVerified: boolean;
    demoScriptVerified: boolean;
    mitLicenseVerified: boolean;
  };
}
```

---

## 2. State Invariants & Virtualization Clamping

### 2.1 Atomic Project Switching State Machine
```
[Active Project: A]
       |
       | User clicks "Open Production (Project B)"
       v
[State: isSwitchingProject = true]
  - Full viewport overlay rendered ("Switching production...")
  - Header, tabs, and content obscured
  - API request dispatched: GET /api/projects/{id}/summary
       |
       | Payload received & applied atomically
       v
[Active Project: B]
  - Workspace state updated simultaneously (title, code, readiness, tabs, items)
  - Overlay unmounted: isSwitchingProject = false
```

### 2.2 Virtualization Clamping Rule
- Total tasks in state: $N \ge 1,000$.
- Viewport capacity: $\text{height} = 500\text{px}$, row height $= 70\text{px}$.
- Visible rows $= \lceil 500 / 70 \rceil = 8$ rows.
- Buffer rows $= 2$ (top) $+ 2$ (bottom).
- Maximum active DOM nodes in list container $= 8 + 2 + 2 = \mathbf{12 \le 30}$.

---

## 3. Storage & Repository Layout

- `server/repositories/ProjectMemberRepo.ts` -> Project memberships & roles
- `server/repositories/ActionNotificationRepo.ts` -> ClearanceActionItems & audit events
- `server/repositories/UserNotificationRepo.ts` -> ClearanceNotifications
- `fixtures/two_project_fixture.json` -> Deterministic demo data for `proj-default` & `proj-cyberpunk`
