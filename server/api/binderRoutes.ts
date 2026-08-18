import { Router, Request, Response } from 'express';
import { binderExportWorkflow } from '../workflows/binderExportWorkflow.js';
import { binderRepo } from '../repositories/BinderRepo.js';

export const binderRouter = Router();

// Export / Compile Project Clearance Binder (Supports both GET and POST)
const handleBinderExport = async (req: Request, res: Response, next: any) => {
  try {
    const projectId = req.params.id;
    const binder = await binderExportWorkflow.compileAndExportBinder(projectId);
    return res.json(binder);
  } catch (err) {
    next(err);
  }
};

binderRouter.get('/projects/:id/binder/export', handleBinderExport);
binderRouter.post('/projects/:id/binder/export', handleBinderExport);

// Get Latest Exported Binder
binderRouter.get('/projects/:id/binder/latest', async (req: Request, res: Response, next) => {
  try {
    const projectId = req.params.id;
    const binder = await binderRepo.getLatestBinderExport(projectId);
    if (!binder) {
      return res.status(404).json({ error: 'No exported binder found for project' });
    }
    return res.json(binder);
  } catch (err) {
    next(err);
  }
});
