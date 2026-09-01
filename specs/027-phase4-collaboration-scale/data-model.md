# Phase 4 Data Model & Entity Specifications

## Entity Schemas

### 1. `TaskComment`
Represents a timestamped comment posted on a department task.

```typescript
export interface TaskComment {
  id: string;                      // Unique comment ID (e.g. cmt-88f1a021)
  taskId: string;                  // Target department task ID (e.g. task-102)
  projectId: string;               // Owning project ID (e.g. proj-1fb4e9c6)
  authorId: string;                // Author user ID
  authorName: string;              // Author display name (e.g. "Sarah Jenkins")
  authorRole: UserRole;            // Author role (e.g. "CLEARANCE_COORDINATOR")
  authorDepartment: Department;    // Author department (e.g. "LEGAL_COUNSEL")
  content: string;                 // Plain text comment content
  mentions: string[];              // Extracted user or role mentions (e.g. ["LEGAL_COUNSEL", "user-44"])
  createdAt: string;               // ISO 8601 UTC timestamp
  updatedAt: string;               // ISO 8601 UTC timestamp
  isDeleted: boolean;              // Soft deletion flag
}
```

### 2. `TaskAttachment`
Represents a document or media evidence file attached to a department task.

```typescript
export interface TaskAttachment {
  id: string;                      // Unique attachment ID (e.g. att-091a2b3c)
  taskId: string;                  // Target department task ID
  projectId: string;               // Owning project ID
  fileName: string;                // Sanitized original filename (e.g. "Music_License_Signed.pdf")
  fileSizeBytes: number;           // File size in bytes (max 26,214,400 = 25 MB)
  mimeType: string;                // Validated MIME type (e.g. "application/pdf", "image/png")
  gcsStorageUri: string;           // Internal GCS URI (e.g. "gs://clearance-scout-attachments/proj-1/att-091.pdf")
  downloadUrl?: string;            // Ephemeral 15-minute signed GCS download URL
  uploaderId: string;              // User ID of uploader
  uploaderName: string;            // Display name of uploader
  uploadedAt: string;              // ISO 8601 UTC timestamp
  versionNumber: number;           // Version sequence number for file replacements
  isDeleted: boolean;              // Soft deletion flag
}
```

### 3. `UserNotification`
Represents an in-product alert delivered to a user.

```typescript
export interface NotificationItem {
  id: string;                      // Unique notification ID (e.g. notif-4412a)
  userId: string;                  // Target user ID or role string
  projectId: string;               // Associated project ID
  triggerType: NotificationTrigger; // Trigger type enum
  title: string;                   // Concise notification title
  message: string;                 // Detail text
  targetTaskId?: string;           // Optional deep-link task ID
  targetEntityId?: string;         // Optional deep-link clearance entity ID
  isRead: boolean;                 // Read status
  createdAt: string;               // ISO 8601 UTC timestamp
}

export type NotificationTrigger =
  | 'TASK_ASSIGNED'
  | 'TASK_MENTION'
  | 'DUE_DATE_APPROACHING'
  | 'TASK_OVERDUE'
  | 'RIGHTS_EXPIRING'
  | 'BLOCKER_CREATED'
  | 'COUNSEL_DECISION_CHANGED'
  | 'INGESTION_FAILED'
  | 'BINDER_EXPORT_COMPLETED'
  | 'BINDER_EXPORT_FAILED';
```

### 4. `UserSavedView`
Represents a saved filter preset created by a user.

```typescript
export interface UserSavedView {
  id: string;                      // Unique view preset ID (e.g. view-991b)
  userId: string;                  // Owner user ID
  projectId: string;               // Target project ID
  name: string;                    // Preset name (e.g. "My Overdue Blockers")
  isSharedWithTeam: boolean;       // Team sharing flag
  isDefault: boolean;              // User default view flag
  filters: FilterParams;           // Filter state dictionary
  createdAt: string;               // ISO 8601 UTC timestamp
  updatedAt: string;               // ISO 8601 UTC timestamp
}

export interface FilterParams {
  department?: Department[];
  assigneeId?: string[];
  status?: TaskStatus[];
  priority?: TaskPriority[];
  overdueOnly?: boolean;
  readinessImpact?: ReadinessImpact[];
  dueDateRange?: { start?: string; end?: string };
  searchQuery?: string;
}
```

### 5. `ProjectMember`
Represents user membership and assigned role within a studio project.

```typescript
export interface ProjectMember {
  id: string;                      // Unique membership record ID
  projectId: string;               // Target project ID
  userId: string;                  // Target user ID
  userName: string;                // User display name
  userEmail: string;               // User email address
  projectRole: UserRole;            // Role assignment
  assignedAt: string;              // ISO 8601 UTC timestamp
}

export type UserRole =
  | 'LEGAL_COUNSEL'
  | 'ART_DEPT'
  | 'LOCATIONS'
  | 'PRODUCTION_MGMT'
  | 'CLEARANCE_COORDINATOR'
  | 'ADMINISTRATOR';
```

### 6. Extended `DepartmentTask` Schema

```typescript
export interface ExtendedDepartmentTask {
  id: string;                      // Task ID (e.g. task-102)
  entityId: string;                // Owning clearance item ID
  projectId: string;               // Owning project ID
  department: Department;          // Target department
  title: string;                   // Task summary title
  description: string;             // Detail description
  status: TaskStatus;              // 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'WAIVED'
  priority: TaskPriority;          // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  assignee?: string;               // Display name of assignee
  assigneeId?: string;             // User ID of assignee
  dueDate?: string;                // YYYY-MM-DD due date
  readinessImpact: ReadinessImpact; // 'BLOCKS_SHOOTING' | 'WORKING_CLEAR' | 'FINAL_CLEAR'
  version: number;                 // Optimistic concurrency locking sequence
  commentCount: number;            // Total attached comments count
  attachmentCount: number;         // Total attached files count
  hasUnreadActivity: boolean;      // Unread flag for logged-in user
  activityHistory: AuditEvent[];   // Immutable append-only audit trail
  createdAt: string;
  updatedAt: string;
}
```
