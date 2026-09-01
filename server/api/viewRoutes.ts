import { Router, Request, Response } from 'express';
import { userSavedViewRepo } from '../repositories/UserSavedViewRepo.js';

export const viewRouter = Router();

// GET saved filter view presets
viewRouter.get('/views', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr-default';
  const projectId = (req.query.projectId as string) || 'proj-default';
  const views = userSavedViewRepo.getByUserId(userId, projectId);
  res.json({ views });
});

// POST create saved view preset
viewRouter.post('/views', (req: Request, res: Response) => {
  const { name, isSharedWithTeam, isDefault, isDefaultView, filters, userId, projectId } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Preset name is required' });
  }

  const view = userSavedViewRepo.saveView({
    userId: userId || 'usr-default',
    projectId: projectId || 'proj-default',
    name,
    isSharedWithTeam: !!isSharedWithTeam,
    isDefaultView: !!(isDefaultView ?? isDefault),
    filters: filters || {},
  });

  res.status(201).json({ view });
});

// DELETE saved view preset
viewRouter.delete('/views/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req.query.userId as string) || 'usr-default';
  const success = userSavedViewRepo.deleteView(id, userId);
  if (!success) {
    return res.status(404).json({ error: 'Saved view not found or unauthorized' });
  }
  res.json({ success: true });
});
