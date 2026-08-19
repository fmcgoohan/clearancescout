import { Router, Request, Response, NextFunction } from 'express';
import {
  actionNotificationRepo,
  DepartmentTarget,
  ActionStatus,
} from '../repositories/ActionNotificationRepo.js';
import { actionDispatcher } from '../workflows/actionDispatcher.js';
import { timelineEmitter } from '../events/timelineEmitter.js';

export const actionRouter = Router();

// GET /projects/:id/actions - List action items for project (with optional department and status filters)
actionRouter.get('/projects/:id/actions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const { department, status, canonicalEntityId, sceneId } = req.query;

    const actions = await actionNotificationRepo.getActionsByProject(projectId, {
      department: department as DepartmentTarget,
      status: status as ActionStatus,
      canonicalEntityId: canonicalEntityId as string,
      sceneId: sceneId as string,
    });

    return res.json(actions);
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id/actions/:actionId - Update action status (e.g. mark IN_PROGRESS, RESOLVED, DISMISSED)
actionRouter.patch('/projects/:id/actions/:actionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, actionId } = req.params;
    const { status, resolutionTrigger } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required.' });
    }

    const updated = await actionNotificationRepo.updateActionStatus(
      projectId,
      actionId,
      status as ActionStatus,
      resolutionTrigger
    );

    if (!updated) {
      return res.status(404).json({ error: `Action item ${actionId} not found.` });
    }

    timelineEmitter.emit(projectId, 'STATE_TRANSITION', `Action Item Status: ${updated.status}`, {
      actionId: updated.id,
      status: updated.status,
      title: updated.title,
      targetDepartment: updated.targetDepartment,
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id/notifications - List notifications for project
actionRouter.get('/projects/:id/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const { isRead } = req.query;

    const notifs = await actionNotificationRepo.getNotificationsByProject(
      projectId,
      isRead !== undefined ? isRead === 'true' : undefined
    );

    return res.json(notifs);
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id/notifications/:notifId/read - Mark notification as read
actionRouter.patch('/projects/:id/notifications/:notifId/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, notifId } = req.params;
    const success = await actionNotificationRepo.markNotificationRead(projectId, notifId);
    if (!success) {
      return res.status(404).json({ error: `Notification ${notifId} not found.` });
    }
    return res.json({ id: notifId, isRead: true });
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/actions/sync - Re-sync and generate derived action items from current project state
actionRouter.post('/projects/:id/actions/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const result = await actionDispatcher.syncProjectActions(projectId);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});
