import { TaskComment, UserRole, Department } from '../../src/types/collaboration.js';
import { userNotificationRepo } from './UserNotificationRepo.js';

class TaskCommentRepository {
  private comments: Map<string, TaskComment> = new Map();

  constructor() {
    // Seed initial demo comment for task-102 / Nocturne of the Wild
    const seedComment: TaskComment = {
      id: 'cmt-seed-001',
      taskId: 'TASK-101',
      projectId: 'proj-default',
      authorId: 'usr-coord-1',
      authorName: 'Clearance Coordinator',
      authorRole: 'CLEARANCE_COORDINATOR',
      authorDepartment: 'LEGAL_COUNSEL',
      content: '@LegalCounsel please review the trademark disclaimer on this placard before shoot date.',
      mentions: ['LEGAL_COUNSEL'],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      isDeleted: false,
    };
    this.comments.set(seedComment.id, seedComment);
  }

  public getByTaskId(taskId: string): TaskComment[] {
    return Array.from(this.comments.values())
      .filter((c) => c.taskId === taskId && !c.isDeleted)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public getById(id: string): TaskComment | undefined {
    const c = this.comments.get(id);
    return c && !c.isDeleted ? c : undefined;
  }

  public addComment(params: {
    taskId: string;
    projectId: string;
    authorId: string;
    authorName: string;
    authorRole: UserRole;
    authorDepartment: Department;
    content: string;
  }): TaskComment {
    // Parse @mentions (e.g. @LegalCounsel, @SarahJenkins)
    const mentionMatches = params.content.match(/@([A-Za-z0-9_]+)/g) || [];
    const mentions = Array.from(new Set(mentionMatches.map((m) => m.substring(1))));

    const newComment: TaskComment = {
      id: `cmt-${Math.random().toString(36).substring(2, 9)}`,
      taskId: params.taskId,
      projectId: params.projectId || 'proj-default',
      authorId: params.authorId,
      authorName: params.authorName,
      authorRole: params.authorRole,
      authorDepartment: params.authorDepartment,
      content: params.content,
      mentions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

    this.comments.set(newComment.id, newComment);

    // Auto-generate notification for @mentions
    if (mentions.length > 0) {
      mentions.forEach((m) => {
        userNotificationRepo.createNotification({
          userId: m,
          projectId: newComment.projectId,
          triggerType: 'TASK_MENTION',
          title: `Mentioned on Task (${params.taskId})`,
          message: `${params.authorName} mentioned @${m}: "${params.content.substring(0, 50)}${params.content.length > 50 ? '...' : ''}"`,
          targetTaskId: params.taskId,
          targetActivityType: 'COMMENT',
          targetActivityId: newComment.id,
        });
      });
    }

    return newComment;
  }

  public updateComment(id: string, newContent: string): TaskComment | undefined {
    const comment = this.comments.get(id);
    if (!comment || comment.isDeleted) return undefined;

    const mentionMatches = newContent.match(/@([A-Za-z0-9_]+)/g) || [];
    const mentions = Array.from(new Set(mentionMatches.map((m) => m.substring(1))));

    comment.content = newContent;
    comment.mentions = mentions;
    comment.updatedAt = new Date().toISOString();
    this.comments.set(id, comment);
    return comment;
  }

  public deleteComment(id: string): boolean {
    const comment = this.comments.get(id);
    if (!comment || comment.isDeleted) return false;
    comment.isDeleted = true;
    comment.updatedAt = new Date().toISOString();
    this.comments.set(id, comment);
    userNotificationRepo.tombstoneCommentNotifications(id);
    return true;
  }
}

export const taskCommentRepo = new TaskCommentRepository();
