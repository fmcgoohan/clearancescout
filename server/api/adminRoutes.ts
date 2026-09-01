import { Router, Request, Response } from 'express';
import { projectMemberRepo } from '../repositories/ProjectMemberRepo.js';

export const adminRouter = Router();

// GET project members
adminRouter.get('/admin/members', (req: Request, res: Response) => {
  const projectId = (req.query.projectId as string) || 'proj-default';
  const members = projectMemberRepo.getByProjectId(projectId);
  res.json({ members });
});

// POST assign user role (admin only)
adminRouter.post('/admin/members/assign-role', (req: Request, res: Response) => {
  const { projectId, userId, userName, userEmail, projectRole, requesterRole } = req.body;

  if (requesterRole && !['ADMINISTRATOR', 'PRODUCTION_MGMT'].includes(requesterRole)) {
    return res.status(403).json({ error: 'Access Denied: Only Administrators or Production Management can modify user roles.' });
  }

  if (!userId || !projectRole) {
    return res.status(400).json({ error: 'userId and projectRole are required' });
  }

  const member = projectMemberRepo.assignRole({
    projectId: projectId || 'proj-default',
    userId,
    userName: userName || userId,
    userEmail: userEmail || `${userId}@studio.com`,
    projectRole,
  });

  res.json({ success: true, member });
});
