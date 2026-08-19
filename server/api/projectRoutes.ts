import { Router, Request, Response } from 'express';
import multer from 'multer';
import { projectRepo } from '../repositories/ProjectRepo.js';
import { sceneRepo } from '../repositories/SceneRepo.js';
import { entityRepo } from '../repositories/EntityRepo.js';
import { canonicalRegistryWorkflow } from '../workflows/canonicalRegistryWorkflow.js';
import { demoAutomationWorkflow } from '../workflows/demoAutomationWorkflow.js';

const upload = multer({ storage: multer.memoryStorage() });
export const projectRouter = Router();

// List All Projects
projectRouter.get('/', async (_req: Request, res: Response, next) => {
  try {
    const rawProjects = await projectRepo.listProjects();
    const projects = await Promise.all(
      rawProjects.map(async (proj) => {
        const [quota, entities] = await Promise.all([
          projectRepo.getLiveQuota(proj.id),
          entityRepo.getEntitiesByProject(proj.id),
        ]);
        const entityCount = entities.length;
        const clearedCount = entities.filter((e) => e.overallClearanceStatus === 'NO_ISSUE_SURFACED').length;
        const actionRequiredCount = entities.filter((e) => e.overallClearanceStatus === 'ACTION_REQUIRED').length;
        const reviewRecommendedCount = entities.filter((e) => e.overallClearanceStatus === 'REVIEW_RECOMMENDED').length;

        return {
          ...proj,
          liveQuotaLimit: quota.limit,
          liveQuotaUsed: quota.used,
          liveQuotaRemaining: quota.remaining,
          entityCount,
          clearedCount,
          actionRequiredCount,
          reviewRecommendedCount,
        };
      })
    );

    return res.json({ projects });
  } catch (err) {
    next(err);
  }
});

// Create Project
projectRouter.post('/', async (req: Request, res: Response, next) => {
  try {
    const { title, productionCompany, scriptVersion, projectType, executionMode } = req.body;
    if (!title || !productionCompany) {
      return res.status(400).json({ error: 'Title and productionCompany are required.' });
    }

    const validTypes = ['Movie', 'TV Show', 'Commercial'];
    if (projectType && !validTypes.includes(projectType)) {
      return res.status(400).json({ error: 'Invalid projectType. Must be Movie, TV Show, or Commercial.' });
    }

    const project = await projectRepo.createProject({
      title,
      productionCompany,
      scriptVersion: scriptVersion || 'v1.0',
      projectType: projectType || 'Movie',
      executionMode: executionMode || 'DEMO_MODE',
    });

    const quota = await projectRepo.getLiveQuota(project.id);

    return res.status(201).json({
      ...project,
      liveQuotaLimit: quota.limit,
      liveQuotaUsed: quota.used,
      liveQuotaRemaining: quota.remaining,
      entityCount: 0,
      clearedCount: 0,
      actionRequiredCount: 0,
      reviewRecommendedCount: 0,
    });
  } catch (err) {
    next(err);
  }
});

// Get Project Details
projectRouter.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const project = await projectRepo.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const [quota, entities] = await Promise.all([
      projectRepo.getLiveQuota(project.id),
      entityRepo.getEntitiesByProject(project.id),
    ]);

    const entityCount = entities.length;
    const clearedCount = entities.filter((e) => e.overallClearanceStatus === 'NO_ISSUE_SURFACED').length;
    const actionRequiredCount = entities.filter((e) => e.overallClearanceStatus === 'ACTION_REQUIRED').length;
    const reviewRecommendedCount = entities.filter((e) => e.overallClearanceStatus === 'REVIEW_RECOMMENDED').length;

    return res.json({
      ...project,
      liveQuotaLimit: quota.limit,
      liveQuotaUsed: quota.used,
      liveQuotaRemaining: quota.remaining,
      entityCount,
      clearedCount,
      actionRequiredCount,
      reviewRecommendedCount,
    });
  } catch (err) {
    next(err);
  }
});

// Upload & Parse Script
projectRouter.post('/:id/script', upload.single('script'), async (req: Request, res: Response, next) => {
  try {
    const projectId = req.params.id;
    const project = await projectRepo.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    let scriptText = '';
    let format: 'PLAINTEXT' | 'FOUNTAIN' | 'PDF' = req.body.format || 'PLAINTEXT';

    if (req.file) {
      const origName = req.file.originalname.toLowerCase();
      if (origName.endsWith('.fountain')) {
        format = 'FOUNTAIN';
      } else if (origName.endsWith('.pdf')) {
        format = 'PDF';
      }
      scriptText = req.file.buffer.toString('utf-8');
    } else if (req.body.scriptText) {
      scriptText = req.body.scriptText;
    } else {
      return res.status(400).json({ error: 'Script file or scriptText payload is required.' });
    }

    const result = await canonicalRegistryWorkflow.processScriptUpload(projectId, scriptText, format);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// 1-Click Demo Screenplay Ingestion & Auto-Evaluation (Feature 017)
projectRouter.post('/:id/script/demo', async (req: Request, res: Response, next) => {
  try {
    const projectId = req.params.id;
    const { autoEvaluate, includeSampleRights, includeSamplePlaceholders } = req.body || {};
    const result = await demoAutomationWorkflow.loadDemoScreenplay(projectId, {
      autoEvaluate: autoEvaluate !== false,
      includeSampleRights: includeSampleRights !== false,
      includeSamplePlaceholders: includeSamplePlaceholders !== false,
    });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get Canonical Entity Registry
projectRouter.get('/:id/entities', async (req: Request, res: Response, next) => {
  try {
    const entities = await entityRepo.getEntitiesByProject(req.params.id);
    return res.json(entities);
  } catch (err) {
    next(err);
  }
});

// Get Scenes List
projectRouter.get('/:id/scenes', async (req: Request, res: Response, next) => {
  try {
    const scenes = await sceneRepo.getScenesByProject(req.params.id);
    const scenesWithOccurrences = await Promise.all(
      scenes.map(async (s) => ({
        ...s,
        occurrences: await entityRepo.getOccurrencesByScene(req.params.id, s.id),
      }))
    );
    return res.json(scenesWithOccurrences);
  } catch (err) {
    next(err);
  }
});
