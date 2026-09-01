# Implementation Plan: Enterprise Collaboration, Departmental Workflows & High-Scale Production Management (Phase 4)

**Branch**: `027-phase4-collaboration-scale` | **Date**: 2026-08-26 | **Spec**: [`specs/027-phase4-collaboration-scale/spec.md`](./spec.md)

**Input**: Approved Feature Specification from [`specs/027-phase4-collaboration-scale/spec.md`](./spec.md)

---

## Executive Summary

This plan outlines the architecture, data schemas, API contracts, delivery phases, and verification protocols for Phase 4 implementation. Phase 4 transforms ClearanceScout into an enterprise multi-department production-control platform supporting threaded task discussions, file evidence attachments, bulk task management, saved filter views, role-based workspace perspectives, in-product notifications, cross-project portfolio tracking, high-scale performance ($\ge 1,000$ department tasks), server-enforced RBAC, and WCAG 2.2 AA accessibility.

---

## Technical Context & Stack Decisions

### Reused Technical Stack & Patterns
- **Runtime & Language**: Node.js v20 (ESM/TypeScript) backend (`server/`), React v18 + Vite frontend (`src/`).
- **Backend Isolation**: All route handlers, repositories, agents, storage integrations, and security middleware MUST reside in `server/`.
- **Identity & Authentication (D-01)**: Reuses existing Bearer JWT / `x-demo-token` / Cloud Identity authorization flow in `server/middleware/auth.ts`. Zero duplicate auth systems introduced.
- **Database & Repositories**: Reuses Firestore + in-memory fallback repository pattern (`server/repositories/`). Single source of truth for all projects, tasks, counts, rights, readiness, and audit histories.
- **AI Runtime & Models**: Always use `gemini-3.6-flash` for agent reasoning and document analysis per `AGENTS.md`.

### New Architecture & Component Additions
- **Attachment Storage Engine (D-06)**: Google Cloud Storage (`@google-cloud/storage`) bucket integration generating 15-minute signed download/upload URLs. Max file size limit: 25 MB.
- **Project Membership & Access Control (D-03)**: `ProjectMemberRepo.ts` managing explicit `ProjectMember` mappings (`projectId`, `userId`, `projectRole`).
- **Role-Based Workspace Perspectives (D-02)**: 6 discrete role perspectives (`LEGAL_COUNSEL`, `ART_DEPT`, `LOCATIONS`, `PRODUCTION_MGMT`, `COORDINATOR`, `ADMINISTRATOR`) defined as UI filter perspectives over single backend task/entity data model.
- **Optimistic Concurrency & Partial Failure (D-07)**: Task entity `version` field for optimistic locking, returning structured partial-failure payloads (`{ succeeded: [...], failed: [...] }`) during bulk updates.
- **Notification Engine (D-05)**: In-product notification collection (`UserNotificationRepo.ts`) with Server-Sent Events (SSE) stream (`GET /api/notifications/stream`).
- **Scale & Virtualization**: Client-side list virtualization (`VirtualTaskList.tsx`) maintaining $\ge 60$ FPS frame rate for lists with $\ge 1,000$ department tasks.

---

## Constitution & Invariant Checks

*GATE: All Phase 1–3 invariants preserved without exception.*

- **Rule 1 (Code Isolation)**: `server/` contains all storage, repository, and auth logic; `src/` contains UI components and API client hooks. Passed.
- **Rule 2 (Model Standards)**: `gemini-3.6-flash` used for all agent operations. Passed.
- **Rule 3 (Deterministic Math)**: All readiness percentages, task counts, and date deltas computed mathematically prior to agent reasoning. Mapped dynamically to $1 + 9 + 1 + 0 = 11$ baseline. Passed.
- **Rule 4 (Observable Timeline)**: All mutations emit observable execution events; zero raw model chain-of-thought logged or exposed. Passed.
- **Rule 5 (Server Mode Authoritative)**: Server mode enforces strict authorization; requests cannot downgrade runtime to test mode. Passed.

---

## Project Directory Structure

```text
server/
├── middleware/
│   └── auth.ts                       # Server-side RBAC & project membership check
├── repositories/
│   ├── ActionNotificationRepo.ts     # Extended with versioning & audit trail
│   ├── TaskCommentRepo.ts            # New: Task discussion comments
│   ├── TaskAttachmentRepo.ts         # New: Attachment metadata & GCS references
│   ├── UserNotificationRepo.ts       # New: In-product notifications
│   ├── UserSavedViewRepo.ts          # New: Saved filter view presets
│   └── ProjectMemberRepo.ts          # New: Project user membership & roles
├── routes/
│   ├── commentRoutes.ts              # New: Comment CRUD & @mention parsing
│   ├── attachmentRoutes.ts           # New: Signed GCS URL generation & metadata
│   ├── bulkActionRoutes.ts           # New: Batch task mutation & partial failure
│   ├── viewRoutes.ts                 # New: Saved view preset CRUD
│   ├── notificationRoutes.ts         # New: In-product notifications & SSE stream
│   ├── portfolioRoutes.ts            # New: Cross-project studio portfolio
│   └── adminRoutes.ts                # New: User role administration
└── integrations/
    └── storage/
        └── gcsStorage.ts             # Google Cloud Storage signed URL helper

src/
├── components/
│   ├── TaskCommentThread.tsx         # Threaded comments & @mention input
│   ├── TaskAttachmentList.tsx        # File list, upload dropzone, preview modal
│   ├── BulkActionBar.tsx             # Multi-select action bar & bulk confirm modal
│   ├── SavedViewSelector.tsx         # Presets dropdown & save view modal
│   ├── RoleWorkspaceSwitcher.tsx     # Role perspective workspace switcher
│   ├── NotificationDrawer.tsx        # In-product notification drawer & badge
│   ├── VirtualTaskList.tsx           # High-scale virtualized list renderer
│   └── PortfolioDashboard.tsx        # Cross-project executive dashboard
└── pages/
    └── PortfolioPage.tsx             # Studio portfolio page
```

---

## Data Model & Schema Summary

1. **`TaskComment`**: `{ id, taskId, projectId, authorId, authorName, authorRole, authorDepartment, content, mentions: string[], createdAt, updatedAt, isDeleted }`
2. **`TaskAttachment`**: `{ id, taskId, projectId, fileName, fileSizeBytes, mimeType, gcsStorageUri, downloadUrl, uploaderId, uploaderName, uploadedAt, versionNumber, isDeleted }`
3. **`UserNotification`**: `{ id, userId, projectId, triggerType, title, message, targetTaskId, targetEntityId, isRead, createdAt }`
4. **`UserSavedView`**: `{ id, userId, projectId, name, isSharedWithTeam, isDefault, filters: FilterParams, createdAt, updatedAt }`
5. **`ProjectMember`**: `{ id, projectId, userId, userName, userEmail, projectRole: UserRole, assignedAt }`
6. **`DepartmentTask` (Extended)**: Added `version: number`, `commentCount: number`, `attachmentCount: number`, `unreadActivity: boolean`.

---

## Plan Phase & Delivery Slice Mapping

```
+-----------------------------------------------------------------------------------+
| Phase 1 (Slice 1 - P1): Task Discussion, Attachments, Notifications & Binder Index|
| - TaskCommentRepo, TaskAttachmentRepo, UserNotificationRepo                       |
| - commentRoutes, attachmentRoutes, notificationRoutes, gcsStorage.ts              |
| - TaskCommentThread.tsx, TaskAttachmentList.tsx, NotificationDrawer.tsx           |
| - Binder Export attachment index integration (US-P4-01 to US-P4-03, US-P4-15)    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Phase 2 (Slice 2 - P1): Bulk Operations, Saved Views & Role Workspaces             |
| - BulkActionRoutes, viewRoutes, UserSavedViewRepo                                 |
| - BulkActionBar.tsx, SavedViewSelector.tsx, RoleWorkspaceSwitcher.tsx             |
| - Partial failure reporting & optimistic concurrency control (US-P4-04 to 10)    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Phase 3 (Slice 3 - P2): Studio Portfolio & High-Scale Virtualization              |
| - portfolioRoutes.ts, PortfolioDashboard.tsx, PortfolioPage.tsx                   |
| - VirtualTaskList.tsx with @tanstack/react-virtual / custom virtualizer           |
| - 1,000-task performance budget verification (US-P4-06, US-P4-16)                 |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Phase 4 (Slice 4 - P2): Server RBAC, Accessibility & Mobile Reflow                |
| - adminRoutes.ts, auth.ts server-side permission enforcement                       |
| - WCAG 2.2 AA keyboard focus, live regions, 200%/400% zoom reflow                 |
| - Mobile responsive card reflow (US-P4-11 to US-P4-14)                             |
+-----------------------------------------------------------------------------------+
```

---

## Measurable Performance Budgets & Verification Methods

- **Page Initialization Budget**: Initial workspace load $\le 1.5$s (Measured via Chrome DevTools Performance Trace & Playwright `performance.mark()`).
- **Filter/Search Response Budget**: Multi-parameter filter execution $\le 100$ms.
- **Bulk Operation Commit Budget**: 100-item bulk update server response $\le 500$ms.
- **Scroll Frame Rate Budget**: Virtualized task list scrolling $\ge 60$ FPS.
- **Accessibility Verification Protocol**:
  - Automated axe-core static analysis gate (`0` violations).
  - Playwright DOM ARIA tree contract assertions (`role="status"`, `aria-live="polite"`, `aria-setsize`).
  - Manual macOS VoiceOver verification procedure (`Cmd+F5`, `VO+Down`, `VO+Right`, `VO+Space`).

---

## Unresolved Decision Matrix Carry-Over

| # | Unresolved Decision | Recommended Default | Viable Alternative | Impact of Deferral | Approval Required Before TASKS? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **D-01** | User Identity & Auth Engine | Firebase Auth / Cloud Identity Bearer JWT tokens | Custom session cookies / auth headers | Auth security enforcement delayed until Slice 4 | **YES** |
| **D-02** | Role & Permission Model | 6 discrete roles (`LEGAL_COUNSEL`, `ART_DEPT`, `LOCATIONS`, `PRODUCTION_MGMT`, `COORDINATOR`, `ADMINISTRATOR`) | Fine-grained permission strings (`task:edit`, `override:create`) | Coarse authorization boundaries in early implementation | **YES** |
| **D-03** | Project Membership Model | Explicit `ProjectMember` mapping table in Firestore (`projectId`, `userId`, `projectRole`) | Open organization-wide access with domain restriction | Inability to restrict confidential studio projects | **YES** |
| **D-06** | Attachment Storage & Scanning | Google Cloud Storage (GCS) bucket with 15-min signed URLs; 25 MB limit; Cloud Storage Scanner | Local server filesystem (`server/uploads/`); client MIME validation only | Storage non-scalable across Cloud Run instances | **YES** |
| **D-07** | Concurrency Strategy | Optimistic concurrency control (`version` field) + transactional partial-failure result array | Last-write-wins with appended conflict audit event | Overwriting concurrent edits in multi-user sessions | **YES** |
| **D-09** | Portfolio Access Authorization | Restricted to users with `PRODUCTION_MGMT` or `ADMINISTRATOR` project role | Open to all authenticated studio members | Executive portfolio metrics visible to sub-contractors | **YES** |
