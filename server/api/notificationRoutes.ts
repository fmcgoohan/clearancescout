import { Router, Request, Response } from 'express';
import { userNotificationRepo } from '../repositories/UserNotificationRepo.js';

export const notificationRouter = Router();

// GET notifications for active user role
notificationRouter.get('/notifications', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'LEGAL_COUNSEL';
  const notifications = userNotificationRepo.getByUserId(userId);
  const unreadCount = userNotificationRepo.getUnreadCount(userId);

  res.json({
    notifications,
    unreadCount,
  });
});

// POST mark single notification as read
notificationRouter.post('/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = userNotificationRepo.markAsRead(id);
  res.json({ success });
});

notificationRouter.patch('/projects/:projectId/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = userNotificationRepo.markAsRead(id);
  res.json({ success, isRead: true });
});

// POST mark all as read
notificationRouter.post('/notifications/mark-all-read', (req: Request, res: Response) => {
  const userId = (req.body.userId as string) || 'LEGAL_COUNSEL';
  userNotificationRepo.markAllAsRead(userId);
  res.json({ success: true });
});

// GET Notification SSE stream stub
notificationRouter.get('/notifications/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'HEARTBEAT', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(interval);
  });
});
