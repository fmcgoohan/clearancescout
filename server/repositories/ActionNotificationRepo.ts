import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';

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
  resolutionTrigger?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
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
    input: Omit<ClearanceActionItem, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
  ): Promise<ClearanceActionItem> {
    const id = `act-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const actionItem: ClearanceActionItem = {
      id,
      projectId,
      ...input,
      status: input.status || 'OPEN',
      createdAt: now,
      updatedAt: now,
    };

    const col = await this.getActionsCollection(projectId);
    await col.doc(id).set(actionItem);
    return actionItem;
  }

  async getActionById(projectId: string, actionId: string): Promise<ClearanceActionItem | null> {
    const col = await this.getActionsCollection(projectId);
    const snap = await col.doc(actionId).get();
    if (!snap.exists) return null;
    return snap.data() as ClearanceActionItem;
  }

  async getActionsByProject(projectId: string, filter?: ActionFilter): Promise<ClearanceActionItem[]> {
    const col = await this.getActionsCollection(projectId);
    const snap = await col.get();
    let actions: ClearanceActionItem[] = snap.docs.map((doc: any) => doc.data() as ClearanceActionItem);

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

  async updateActionStatus(
    projectId: string,
    actionId: string,
    status: ActionStatus,
    resolutionTrigger?: string
  ): Promise<ClearanceActionItem | null> {
    const col = await this.getActionsCollection(projectId);
    const docRef = col.doc(actionId);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const current = snap.data() as ClearanceActionItem;
    const now = new Date().toISOString();
    const updated: ClearanceActionItem = {
      ...current,
      status,
      resolutionTrigger: resolutionTrigger || current.resolutionTrigger,
      resolvedAt: status === 'RESOLVED' ? now : current.resolvedAt,
      updatedAt: now,
    };

    await docRef.set(updated);
    return updated;
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
}

export const actionNotificationRepo = new ActionNotificationRepo();
