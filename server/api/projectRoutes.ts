import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { projectRepo } from '../repositories/ProjectRepo.js';
import { sceneRepo } from '../repositories/SceneRepo.js';
import { entityRepo } from '../repositories/EntityRepo.js';
import { canonicalRegistryWorkflow } from '../workflows/canonicalRegistryWorkflow.js';
import { demoAutomationWorkflow } from '../workflows/demoAutomationWorkflow.js';
import { config } from '../config.js';
import { extractTextFromPdfBuffer } from '../agents/ScriptParserAgent.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB Max
});

export const projectRouter = Router();

// Middleware helper to accept 'file' or 'script' field
const scriptUploadMiddleware = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'script', maxCount: 1 },
]);

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
        const researchRequiredCount = entities.filter((e) => e.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE').length;

        return {
          ...proj,
          liveQuotaLimit: quota.limit,
          liveQuotaUsed: quota.used,
          liveQuotaRemaining: quota.remaining,
          entityCount,
          clearedCount,
          actionRequiredCount,
          reviewRecommendedCount,
          researchRequiredCount,
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
      executionMode:
        config.executionMode === 'CLOUD_MODE' ? 'CLOUD_MODE' : executionMode || 'DEMO_MODE',
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
      researchRequiredCount: 0,
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
    const researchRequiredCount = entities.filter((e) => e.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE').length;

    return res.json({
      ...project,
      liveQuotaLimit: quota.limit,
      liveQuotaUsed: quota.used,
      liveQuotaRemaining: quota.remaining,
      entityCount,
      clearedCount,
      actionRequiredCount,
      reviewRecommendedCount,
      researchRequiredCount,
    });
  } catch (err) {
    next(err);
  }
});

// Get Complete Project Workspace Snapshot (Feature 021 Atomic Refresh)
projectRouter.get('/:id/snapshot', async (req: Request, res: Response, next) => {
  try {
    const snapshot = await projectRepo.getProjectSnapshot(req.params.id);
    if (!snapshot) {
      return res.status(404).json({ error: 'Project not found' });
    }
    return res.json(snapshot);
  } catch (err) {
    next(err);
  }
});

const handleScriptUpload = async (req: Request, res: Response, next: any) => {
  try {
    const projectId = req.params.id;
    const project = await projectRepo.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    let scriptText = '';
    let filename = 'screenplay.txt';
    let format: 'PLAINTEXT' | 'FOUNTAIN' | 'PDF' = req.body.format || 'PLAINTEXT';

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const uploadedFile = (files?.['file']?.[0] || files?.['script']?.[0] || req.file) as Express.Multer.File | undefined;

    if (uploadedFile) {
      filename = uploadedFile.originalname;
      if (uploadedFile.size === 0 || uploadedFile.buffer.length === 0) {
        return res.status(400).json({
          error: 'Uploaded screenplay file is empty (0 bytes).',
          code: 'EMPTY_FILE',
        });
      }

      const origLower = filename.toLowerCase();
      if (origLower.endsWith('.fountain') || origLower.includes('.fountain.') || origLower.endsWith('.fountain.txt')) {
        format = 'FOUNTAIN';
        scriptText = uploadedFile.buffer.toString('utf-8');
      } else if (origLower.endsWith('.pdf') || uploadedFile.mimetype === 'application/pdf') {
        format = 'PDF';
        try {
          scriptText = extractTextFromPdfBuffer(uploadedFile.buffer);
        } catch (err: any) {
          return res.status(400).json({
            error:
              err.message ||
              'Unable to extract text from PDF. The document may be a scanned image or encrypted. Please provide a text-based PDF, Fountain, or Plaintext screenplay.',
            code: err.code || 'PDF_EXTRACTION_FAILED',
          });
        }
      } else if (origLower.endsWith('.txt') || origLower.endsWith('.text') || uploadedFile.mimetype.startsWith('text/')) {
        format = 'PLAINTEXT';
        scriptText = uploadedFile.buffer.toString('utf-8');
      } else {
        return res.status(400).json({
          error: `Unsupported file format '${filename}'. Supported formats: .fountain, .txt, .pdf`,
          code: 'UNSUPPORTED_FORMAT',
        });
      }
    } else if (req.body.scriptText) {
      scriptText = req.body.scriptText;
      filename = req.body.filename || 'manual_input.txt';
      if (!scriptText.trim()) {
        return res.status(400).json({
          error: 'Provided screenplay text is empty.',
          code: 'EMPTY_FILE',
        });
      }
      if (format === 'PDF' && scriptText.startsWith('%PDF')) {
        try {
          scriptText = extractTextFromPdfBuffer(Buffer.from(scriptText, 'latin1'));
        } catch (err: any) {
          return res.status(400).json({
            error: err.message || 'Unable to extract text from PDF.',
            code: err.code || 'PDF_EXTRACTION_FAILED',
          });
        }
      }
    } else {
      return res.status(400).json({
        error: 'Screenplay file or scriptText payload is required.',
        code: 'MISSING_PAYLOAD',
      });
    }

    if (!scriptText.trim()) {
      return res.status(400).json({
        error: 'Extracted screenplay text is empty.',
        code: 'EMPTY_FILE',
      });
    }

    const checksumSha256 = crypto.createHash('sha256').update(scriptText).digest('hex');
    const result = await canonicalRegistryWorkflow.processScriptUpload(projectId, scriptText, format);

    return res.json({
      success: true,
      projectId,
      filename,
      format,
      draftVersion: 1,
      characterCount: scriptText.length,
      scenesParsed: result.scenesParsed,
      scenesCount: result.scenesParsed,
      canonicalEntitiesExtracted: result.canonicalEntitiesExtracted,
      entitiesCount: result.canonicalEntitiesExtracted,
      entities: result.entities,
      snapshot: result.snapshot,
      checksumSha256,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Screenplay file exceeds maximum allowed size of 25MB.',
        code: 'FILE_TOO_LARGE',
      });
    }
    next(err);
  }
};

// Upload & Parse Script Endpoints (Support both /:id/script/upload and /:id/script)
projectRouter.post('/:id/script/upload', scriptUploadMiddleware, handleScriptUpload);
projectRouter.post('/:id/script', scriptUploadMiddleware, handleScriptUpload);

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
