import { Router, Request, Response, NextFunction } from 'express';
import { sceneReadinessEngine } from '../workflows/sceneReadinessEngine.js';
import { sceneRepo } from '../repositories/SceneRepo.js';

export const sceneRouter = Router();

// GET /projects/:id/scenes/readiness - Project-wide scene readiness overview
sceneRouter.get('/projects/:id/scenes/readiness', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const summary = await sceneReadinessEngine.evaluateAllScenesReadiness(projectId);
    return res.json(summary);
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id/scenes/:sceneId/readiness - Specific scene readiness breakdown
sceneRouter.get('/projects/:id/scenes/:sceneId/readiness', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, sceneId } = req.params;
    const scene = await sceneRepo.getSceneById(projectId, sceneId);
    if (!scene) {
      return res.status(404).json({ error: `Scene ${sceneId} not found in project ${projectId}.` });
    }

    const assessment =
      scene.readinessDetails || (await sceneReadinessEngine.evaluateSceneReadiness(projectId, sceneId));
    return res.json(assessment);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/scenes/:sceneId/readiness/evaluate - Re-evaluate single scene readiness
sceneRouter.post('/projects/:id/scenes/:sceneId/readiness/evaluate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, sceneId } = req.params;
    const scene = await sceneRepo.getSceneById(projectId, sceneId);
    if (!scene) {
      return res.status(404).json({ error: `Scene ${sceneId} not found in project ${projectId}.` });
    }

    const assessment = await sceneReadinessEngine.evaluateSceneReadiness(projectId, sceneId);
    return res.json(assessment);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/scenes/readiness/evaluate-all - Batch evaluate all scenes in project
sceneRouter.post('/projects/:id/scenes/readiness/evaluate-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const summary = await sceneReadinessEngine.evaluateAllScenesReadiness(projectId);
    return res.json(summary);
  } catch (err) {
    next(err);
  }
});
