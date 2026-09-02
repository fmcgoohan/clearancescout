import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';

export type ClearanceActionType =
  | 'ART_DEPT_REPLACEMENT'
  | 'LEGAL_COUNSEL_RELEASE'
  | 'LOCATIONS_PERMIT'
  | 'PRODUCTION_REVIEW'
  | 'COUNSEL_OVERRIDE_REVIEW'
  | 'RETRY_RESEARCH';

export type DepartmentTarget =
  | 'ART_DEPT'
  | 'LEGAL_COUNSEL'
  | 'LOCATIONS'
  | 'PRODUCTION_MGMT'
  | 'CLEARANCE_TEAM';

export type ActionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
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
  timestamp: string;
  actor: string;
  eventType: ActionAuditEventType;
  beforeState?: string;
  afterState?: string;
  description: string;
}

export interface ActionAssignee {
  id: string;
  name: string;
  role: string;
}

export interface ClearanceActionItem {
  id: string;
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
  assignee?: ActionAssignee;
  dueDate?: string;
  isOverdue?: boolean;
  activityHistory?: ActionAuditEvent[];
  resolutionTrigger?: string;
  resolutionReason?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function decorateActionOverdue(action: ClearanceActionItem): ClearanceActionItem {
  let isOverdue = false;
  if (action.dueDate && action.status !== 'RESOLVED' && action.status !== 'DISMISSED') {
    const dueMs = new Date(action.dueDate).getTime();
    if (!isNaN(dueMs) && dueMs < Date.now()) {
      isOverdue = true;
    }
  }
  return {
    ...action,
    isOverdue,
  };
}

export interface ClearanceNotification {
  id: string;
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

export interface ActionFilter {
  status?: ActionStatus;
  department?: DepartmentTarget;
  canonicalEntityId?: string;
  sceneId?: string;
}

export class ActionNotificationRepo {
  private db = getDb();

  private async getActionsCollection(projectId: string) {
    return await this.db.collection(`projects/${projectId}/actions`);
  }

  private async getNotificationsCollection(projectId: string) {
    return await this.db.collection(`projects/${projectId}/notifications`);
  }

  // --- Action Item Methods ---

  async createActionItem(
    projectId: string,
    input: Omit<ClearanceActionItem, 'id' | 'projectId' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<ClearanceActionItem> {
    const id = input.id || `act-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const initialStatus = input.status || 'OPEN';

    const initialAuditEvent: ActionAuditEvent = {
      id: `audit-${uuidv4().slice(0, 8)}`,
      timestamp: now,
      actor: input.assignee?.name ? `${input.assignee.name} (${input.assignee.role})` : 'System Dispatcher',
      eventType: 'CREATED',
      afterState: initialStatus,
      description: `Task created for ${input.targetDepartment || 'department'}: "${input.title}"`,
    };

    const actionItem: ClearanceActionItem = {
      id,
      projectId,
      ...input,
      status: initialStatus,
      activityHistory: input.activityHistory && input.activityHistory.length > 0 ? input.activityHistory : [initialAuditEvent],
      createdAt: now,
      updatedAt: now,
    };

    const col = await this.getActionsCollection(projectId);
    await col.doc(id).set(actionItem);
    return decorateActionOverdue(actionItem);
  }

  async createAction(
    projectIdOrInput: string | any,
    maybeInput?: any
  ): Promise<ClearanceActionItem> {
    const projectId = typeof projectIdOrInput === 'string' ? projectIdOrInput : projectIdOrInput.projectId;
    const input = typeof projectIdOrInput === 'string' ? maybeInput : projectIdOrInput;
    return await this.createActionItem(projectId, {
      title: input.title || `Action for ${input.entityName || 'IP Item'}`,
      targetDepartment: input.targetDepartment || input.department || 'LEGAL_COUNSEL',
      actionType: input.actionType || 'PRODUCTION_REVIEW',
      priority: input.priority || 'HIGH',
      description: input.description || 'Action item',
      status: input.status || 'OPEN',
      ...input,
    });
  }

  async getActionById(projectId: string, actionId: string): Promise<ClearanceActionItem | null> {
    const col = await this.getActionsCollection(projectId);
    const snap = await col.doc(actionId).get();
    if (!snap.exists) return null;
    return decorateActionOverdue(snap.data() as ClearanceActionItem);
  }

  async getActionsByProject(projectId: string, filter?: ActionFilter): Promise<ClearanceActionItem[]> {
    const col = await this.getActionsCollection(projectId);
    const snap = await col.get();
    let actions: ClearanceActionItem[] = snap.docs.map((doc: any) => decorateActionOverdue(doc.data() as ClearanceActionItem));

    if (filter) {
      if (filter.status) {
        actions = actions.filter((a: ClearanceActionItem) => a.status === filter.status);
      }
      if (filter.department) {
        actions = actions.filter((a: ClearanceActionItem) => a.targetDepartment === filter.department);
      }
      if (filter.canonicalEntityId) {
        actions = actions.filter((a: ClearanceActionItem) => a.canonicalEntityId === filter.canonicalEntityId);
      }
      if (filter.sceneId) {
        actions = actions.filter((a: ClearanceActionItem) => a.sceneId === filter.sceneId);
      }
    }

    // Sort by priority (CRITICAL > HIGH > MEDIUM > LOW) and date
    const priorityWeight: Record<ActionPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return actions.sort((a: ClearanceActionItem, b: ClearanceActionItem) => {
      const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async updateActionItem(
    projectId: string,
    actionId: string,
    updates: {
      assignee?: ActionAssignee | null;
      dueDate?: string | null;
      status?: ActionStatus;
      resolutionTrigger?: string;
      actor?: string;
      reason?: string;
      activityHistory?: ActionAuditEvent[];
    }
  ): Promise<ClearanceActionItem | null> {
    const col = await this.getActionsCollection(projectId);
    const docRef = col.doc(actionId);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const current = snap.data() as ClearanceActionItem;
    const now = new Date().toISOString();
    const actorName = updates.actor || 'Legal Operations';
    const newAuditEvents: ActionAuditEvent[] = [];
    const existingHistory: ActionAuditEvent[] = current.activityHistory && current.activityHistory.length > 0
      ? current.activityHistory
      : [
          {
            id: `audit-${uuidv4().slice(0, 8)}`,
            timestamp: current.createdAt || now,
            actor: 'System Dispatcher',
            eventType: 'CREATED',
            afterState: current.status,
            description: `Task created: "${current.title}"`,
          },
        ];

    let nextAssignee = current.assignee;
    if (updates.assignee !== undefined) {
      const prevAssigneeStr = current.assignee ? `${current.assignee.name} (${current.assignee.role})` : 'Unassigned';
      if (updates.assignee === null) {
        nextAssignee = undefined;
        newAuditEvents.push({
          id: `audit-${uuidv4().slice(0, 8)}`,
          timestamp: now,
          actor: actorName,
          eventType: 'REASSIGNED',
          beforeState: prevAssigneeStr,
          afterState: 'Unassigned',
          description: `Unassigned task (previously ${prevAssigneeStr})`,
        });
      } else {
        nextAssignee = updates.assignee;
        const newAssigneeStr = `${nextAssignee.name} (${nextAssignee.role})`;
        if (!current.assignee) {
          newAuditEvents.push({
            id: `audit-${uuidv4().slice(0, 8)}`,
            timestamp: now,
            actor: actorName,
            eventType: 'ASSIGNED',
            beforeState: 'Unassigned',
            afterState: newAssigneeStr,
            description: `Assigned task to ${newAssigneeStr}`,
          });
        } else if (
          current.assignee.id !== nextAssignee.id ||
          current.assignee.name !== nextAssignee.name ||
          current.assignee.role !== nextAssignee.role
        ) {
          newAuditEvents.push({
            id: `audit-${uuidv4().slice(0, 8)}`,
            timestamp: now,
            actor: actorName,
            eventType: 'REASSIGNED',
            beforeState: prevAssigneeStr,
            afterState: newAssigneeStr,
            description: `Reassigned task from ${prevAssigneeStr} to ${newAssigneeStr}`,
          });
        }
      }
    }

    let nextDueDate = current.dueDate;
    if (updates.dueDate !== undefined) {
      const prevDue = current.dueDate || 'None';
      const newDue = updates.dueDate || 'None';
      if (prevDue !== newDue) {
        nextDueDate = updates.dueDate || undefined;
        newAuditEvents.push({
          id: `audit-${uuidv4().slice(0, 8)}`,
          timestamp: now,
          actor: actorName,
          eventType: 'DUE_DATE_CHANGED',
          beforeState: prevDue,
          afterState: newDue,
          description: updates.reason
            ? `Updated due date from ${prevDue} to ${newDue} (${updates.reason})`
            : `Updated due date from ${prevDue} to ${newDue}`,
        });
      }
    }

    let nextStatus = current.status;
    if (updates.status !== undefined && updates.status !== current.status) {
      const prevStatus = current.status;
      nextStatus = updates.status;
      let eventType: ActionAuditEventType = 'STATUS_CHANGED';
      if (nextStatus === 'RESOLVED') {
        eventType = 'RESOLVED';
      } else if (prevStatus === 'RESOLVED' && (nextStatus === 'OPEN' || nextStatus === 'IN_PROGRESS')) {
        eventType = 'REOPENED';
      }

      const desc = updates.resolutionTrigger || updates.reason
        ? `Status changed from ${prevStatus} to ${nextStatus}: ${updates.resolutionTrigger || updates.reason}`
        : `Status changed from ${prevStatus} to ${nextStatus}`;

      newAuditEvents.push({
        id: `audit-${uuidv4().slice(0, 8)}`,
        timestamp: now,
        actor: actorName,
        eventType,
        beforeState: prevStatus,
        afterState: nextStatus,
        description: desc,
      });
    }

    const updatedHistory = [...existingHistory, ...newAuditEvents];

    const updated: ClearanceActionItem = {
      ...current,
      status: nextStatus,
      assignee: nextAssignee,
      dueDate: nextDueDate,
      resolutionTrigger: updates.resolutionTrigger || current.resolutionTrigger,
      resolutionReason: updates.resolutionTrigger || updates.reason || current.resolutionReason,
      resolvedAt: nextStatus === 'RESOLVED' ? (current.resolvedAt || now) : (nextStatus !== current.status ? undefined : current.resolvedAt),
      activityHistory: updatedHistory,
      updatedAt: now,
    };

    await docRef.set(updated);
    return decorateActionOverdue(updated);
  }

  async updateActionStatus(
    projectId: string,
    actionId: string,
    status: ActionStatus,
    resolutionTrigger?: string
  ): Promise<ClearanceActionItem | null> {
    return await this.updateActionItem(projectId, actionId, {
      status,
      resolutionTrigger,
      actor: 'System / Coordinator',
    });
  }

  async resolveActionsForEntity(
    projectId: string,
    canonicalEntityId: string,
    resolutionTrigger: string
  ): Promise<number> {
    const actions = await this.getActionsByProject(projectId, { canonicalEntityId });
    const openActions = actions.filter((a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS');

    let count = 0;
    for (const act of openActions) {
      await this.updateActionStatus(projectId, act.id, 'RESOLVED', resolutionTrigger);
      count++;
    }
    return count;
  }

  async resolveActionsForPlaceholder(
    projectId: string,
    canonicalEntityId: string,
    placeholder: {
      isProjectWide?: boolean;
      scopeType?: 'PROJECT_WIDE' | 'SELECTED_SCENES' | 'SINGLE_OCCURRENCE' | 'SELECTED_OCCURRENCES';
      sceneIds?: string[];
      occurrenceIds?: string[];
      clearanceTier?: string;
    }
  ): Promise<number> {
    const trigger = `PLACEHOLDER_ATTACHED_${placeholder.clearanceTier || 'TEMP_APPROVED'}`;
    const actions = await this.getActionsByProject(projectId, { canonicalEntityId });
    const openActions = actions.filter((a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS');

    let count = 0;
    for (const act of openActions) {
      const isProjectWide = placeholder.isProjectWide || placeholder.scopeType === 'PROJECT_WIDE';
      if (isProjectWide) {
        await this.updateActionStatus(projectId, act.id, 'RESOLVED', trigger);
        count++;
      } else if (
        placeholder.scopeType === 'SELECTED_SCENES' &&
        act.sceneId &&
        placeholder.sceneIds?.includes(act.sceneId)
      ) {
        await this.updateActionStatus(projectId, act.id, 'RESOLVED', trigger);
        count++;
      } else if (
        (placeholder.scopeType === 'SINGLE_OCCURRENCE' || placeholder.scopeType === 'SELECTED_OCCURRENCES') &&
        act.occurrenceId &&
        placeholder.occurrenceIds?.includes(act.occurrenceId)
      ) {
        await this.updateActionStatus(projectId, act.id, 'RESOLVED', trigger);
        count++;
      }
    }
    return count;
  }

  async resolveActionsForScene(
    projectId: string,
    sceneId: string,
    resolutionTrigger: string
  ): Promise<number> {
    const actions = await this.getActionsByProject(projectId, { sceneId });
    const openActions = actions.filter(
      (a) => (a.status === 'OPEN' || a.status === 'IN_PROGRESS') && a.actionType === 'PRODUCTION_REVIEW'
    );

    let count = 0;
    for (const act of openActions) {
      await this.updateActionStatus(projectId, act.id, 'RESOLVED', resolutionTrigger);
      count++;
    }
    return count;
  }

  async deleteActionItem(projectId: string, actionId: string): Promise<boolean> {
    const col = await this.getActionsCollection(projectId);
    const docRef = col.doc(actionId);
    const snap = await docRef.get();
    if (!snap.exists) return false;
    await docRef.delete();
    return true;
  }

  // --- Notification Methods ---

  async createNotification(
    projectId: string,
    input: Omit<ClearanceNotification, 'id' | 'projectId' | 'isRead' | 'createdAt'>
  ): Promise<ClearanceNotification> {
    const id = `notif-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const notif: ClearanceNotification = {
      id,
      projectId,
      ...input,
      isRead: false,
      createdAt: now,
    };

    const col = await this.getNotificationsCollection(projectId);
    await col.doc(id).set(notif);
    return notif;
  }

  async getNotificationsByProject(projectId: string, isRead?: boolean): Promise<ClearanceNotification[]> {
    const col = await this.getNotificationsCollection(projectId);
    const snap = await col.get();
    let notifs: ClearanceNotification[] = snap.docs.map((doc: any) => doc.data() as ClearanceNotification);

    if (isRead !== undefined) {
      notifs = notifs.filter((n: ClearanceNotification) => n.isRead === isRead);
    }

    return notifs.sort((a: ClearanceNotification, b: ClearanceNotification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markNotificationRead(projectId: string, notifId: string): Promise<boolean> {
    const col = await this.getNotificationsCollection(projectId);
    const docRef = col.doc(notifId);
    const snap = await docRef.get();
    if (!snap.exists) return false;

    const current = snap.data() as ClearanceNotification;
    await docRef.set({ ...current, isRead: true });
    return true;
  }

  async getTaskById(taskId: string, projectId: string = 'proj-default'): Promise<ClearanceActionItem | null> {
    const actions = await this.getActionsByProject(projectId);
    const found = actions.find((a) => a.id === taskId);
    if (found) return found;
    // Fallback to checking default project
    const defaultActions = await this.getActionsByProject('proj-default');
    return defaultActions.find((a) => a.id === taskId) || null;
  }

  async recordAuditEvent(params: {
    taskId: string;
    actorName: string;
    actorRole: string;
    actionType: string;
    details: string;
    previousValue?: string;
    newValue?: string;
    projectId?: string;
  }): Promise<void> {
    const projectId = params.projectId || 'proj-default';
    const task = await this.getTaskById(params.taskId, projectId);
    if (!task) return;

    const history = task.activityHistory || [];
    history.push({
      id: `evt-${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      actor: params.actorName,
      eventType: 'ASSIGNED',
      description: params.details,
      beforeState: params.previousValue,
      afterState: params.newValue,
    });

    await this.updateActionItem(projectId, params.taskId, {
      activityHistory: history,
    });
  }
}

export const actionNotificationRepo = new ActionNotificationRepo();
