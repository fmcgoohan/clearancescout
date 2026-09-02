import { UserNotification, NotificationTrigger } from '../../src/types/collaboration.js';

class UserNotificationRepository {
  private notifications: Map<string, UserNotification> = new Map();

  constructor() {
    // Seed initial demo notification for Legal Counsel mention with deep link
    const seedNotification: UserNotification = {
      id: 'notif-seed-001',
      userId: 'LEGAL_COUNSEL',
      projectId: 'proj-default',
      triggerType: 'TASK_MENTION',
      title: 'Mentioned on Task: Create Fictional Prop Graphic: Titan Industrial Hazard Placard',
      message: 'Clearance Coordinator mentioned @LegalCounsel on comment cmt-seed-01.',
      targetTaskId: 'TASK-101',
      targetEntityId: 'ent-061bb002',
      targetActivityType: 'MENTION',
      targetActivityId: 'cmt-seed-01',
      isRead: false,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    };
    this.notifications.set(seedNotification.id, seedNotification);
  }

  public getByUserId(userId: string): UserNotification[] {
    return Array.from(this.notifications.values())
      .filter((n) => n.userId === userId || n.userId === 'LEGAL_COUNSEL' || n.userId === 'ALL')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getUnreadCount(userId: string): number {
    return this.getByUserId(userId).filter((n) => !n.isRead).length;
  }

  public createNotification(params: {
    userId: string;
    projectId: string;
    triggerType: NotificationTrigger;
    title: string;
    message: string;
    targetTaskId?: string;
    targetEntityId?: string;
    targetActivityType?: 'COMMENT' | 'ASSIGNMENT' | 'MENTION' | 'ATTACHMENT' | 'STATUS';
    targetActivityId?: string;
  }): UserNotification {
    const notification: UserNotification = {
      id: `notif-${Math.random().toString(36).substring(2, 9)}`,
      userId: params.userId,
      projectId: params.projectId || 'proj-default',
      triggerType: params.triggerType,
      title: params.title,
      message: params.message,
      targetTaskId: params.targetTaskId,
      targetEntityId: params.targetEntityId,
      targetActivityType: params.targetActivityType,
      targetActivityId: params.targetActivityId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  public tombstoneCommentNotifications(commentId: string): void {
    for (const [id, notif] of this.notifications.entries()) {
      if (notif.targetActivityId === commentId) {
        this.notifications.set(id, {
          ...notif,
          targetCommentDeleted: true,
          message: `${notif.message} (Referenced comment was deleted)`,
        });
      }
    }
  }

  public markAsRead(id: string): boolean {
    const n = this.notifications.get(id);
    if (!n) return false;
    n.isRead = true;
    this.notifications.set(id, n);
    return true;
  }

  public markAllAsRead(userId: string): void {
    this.getByUserId(userId).forEach((n) => {
      n.isRead = true;
      this.notifications.set(n.id, n);
    });
  }

  public deleteNotification(id: string): boolean {
    return this.notifications.delete(id);
  }
}

export const userNotificationRepo = new UserNotificationRepository();
