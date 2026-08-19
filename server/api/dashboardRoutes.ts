import { Router, Request, Response, NextFunction } from 'express';
import { dashboardEngine } from '../workflows/dashboardEngine.js';

export const dashboardRouter = Router();

// Get Consolidated Production Operations Dashboard Data
dashboardRouter.get('/projects/:id/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const summary = await dashboardEngine.getDashboardSummary(projectId);
    return res.json(summary);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});
