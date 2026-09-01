import { Router, Request, Response } from 'express';
import { taskCommentRepo } from '../repositories/TaskCommentRepo.js';
import { userNotificationRepo } from '../repositories/UserNotificationRepo.js';
import { actionNotificationRepo } from '../repositories/ActionNotificationRepo.js';

export const commentRouter = Router();

// GET comments for task
commentRouter.get('/tasks/:taskId/comments', (req: Request, res: Response) => {
  const { taskId } = req.params;
  const comments = taskCommentRepo.getByTaskId(taskId);
  res.json({ comments });
});

// POST new comment
commentRouter.post('/tasks/:taskId/comments', (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { content, authorId, authorName, authorRole, authorDepartment, projectId } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty' });
  }

  const comment = taskCommentRepo.addComment({
    taskId,
    projectId: projectId || 'proj-default',
    authorId: authorId || 'usr-coord-1',
    authorName: authorName || 'Clearance Coordinator',
    authorRole: authorRole || 'CLEARANCE_COORDINATOR',
    authorDepartment: authorDepartment || 'LEGAL_COUNSEL',
    content,
  });

  // Log audit event on action notification repository
  actionNotificationRepo.recordAuditEvent({
    taskId,
    actorName: comment.authorName,
    actorRole: comment.authorRole,
    actionType: 'COMMENT_ADDED',
    details: `Added comment: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
    previousValue: undefined,
    newValue: content,
  });

  // Trigger in-product notifications for mentions
  comment.mentions.forEach((mentionTarget) => {
    userNotificationRepo.createNotification({
      userId: mentionTarget,
      projectId: comment.projectId,
      triggerType: 'TASK_MENTION',
      title: `Mentioned on Task: ${taskId}`,
      message: `${comment.authorName} mentioned @${mentionTarget} in a comment.`,
      targetTaskId: taskId,
    });
  });

  res.status(201).json({ comment });
});

// DELETE comment
commentRouter.delete('/comments/:commentId', (req: Request, res: Response) => {
  const { commentId } = req.params;
  const success = taskCommentRepo.deleteComment(commentId);
  if (!success) {
    return res.status(404).json({ error: 'Comment not found or already deleted' });
  }
  res.json({ success: true, message: 'Comment deleted successfully' });
});
