import { Router, Request, Response } from 'express';
import multer from 'multer';
import { projectRepo } from '../repositories/ProjectRepo.js';
import { sceneRepo } from '../repositories/SceneRepo.js';
import { entityRepo } from '../repositories/EntityRepo.js';
import { canonicalRegistryWorkflow } from '../workflows/canonicalRegistryWorkflow.js';

const upload = multer({ storage: multer.memoryStorage() });
export const projectRouter = Router();

// Create Project
projectRouter.post('/', async (req: Request, res: Response, next) => {
  try {
    const { title, productionCompany, scriptVersion, executionMode } = req.body;
    if (!title || !productionCompany) {
      return res.status(400).json({ error: 'Title and productionCompany are required.' });
    }

    const project = await projectRepo.createProject({
      title,
      productionCompany,
      scriptVersion: scriptVersion || 'v1.0',
      executionMode: executionMode || 'DEMO_MODE',
    });

    const quota = await projectRepo.getLiveQuota(project.id);

    return res.status(201).json({
      ...project,
      liveQuotaLimit: quota.limit,
      liveQuotaUsed: quota.used,
      liveQuotaRemaining: quota.remaining,
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
    const quota = await projectRepo.getLiveQuota(project.id);
    return res.json({
      ...project,
      liveQuotaLimit: quota.limit,
      liveQuotaUsed: quota.used,
      liveQuotaRemaining: quota.remaining,
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
