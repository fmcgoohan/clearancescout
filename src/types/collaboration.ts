export type UserRole =
  | 'LEGAL_COUNSEL'
  | 'ART_DEPT'
  | 'LOCATIONS'
  | 'PRODUCTION_MGMT'
  | 'CLEARANCE_COORDINATOR'
  | 'ADMINISTRATOR';

export type Department =
  | 'LEGAL_COUNSEL'
  | 'ART_DEPT'
  | 'LOCATIONS'
  | 'PRODUCTION_MGMT';

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'WAIVED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReadinessImpact = 'BLOCKS_SHOOTING' | 'WORKING_CLEAR' | 'FINAL_CLEAR';

export interface TaskComment {
  id: string;
  taskId: string;
  projectId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorDepartment: Department;
  content: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  projectId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  gcsStorageUri: string;
  downloadUrl?: string;
  uploaderId: string;
  uploaderName: string;
  uploadedAt: string;
  versionNumber: number;
  isDeleted: boolean;
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

export interface UserNotification {
  id: string;
  userId: string;
  projectId: string;
  triggerType: NotificationTrigger;
  title: string;
  message: string;
  targetTaskId?: string;
  targetEntityId?: string;
  targetActivityType?: 'COMMENT' | 'ASSIGNMENT' | 'MENTION' | 'ATTACHMENT' | 'STATUS';
  targetActivityId?: string;
  targetCommentDeleted?: boolean;
  isRead: boolean;
  createdAt: string;
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

export interface UserSavedView {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  filters: FilterParams;
  isSharedWithTeam: boolean;
  isDefaultView: boolean;
  createdBy: string;
  createdAt: string;
}

export interface ProjectPortfolioSummary {
  projectId: string;
  title: string;
  owner: string;
  readinessPercentage: number;
  blockedSceneCount: number;
  overdueTaskCount: number;
  rightsExpirationWarningsCount: number;
  scriptVersion: string;
  lastSyncTimestamp: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  projectRole: UserRole;
  assignedAt: string;
}
