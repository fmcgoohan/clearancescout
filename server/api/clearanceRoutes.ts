import { Router, Request, Response } from 'express';
import { clearanceEvaluator } from '../workflows/clearanceEvaluator.js';
import { overrideRepo } from '../repositories/OverrideRepo.js';
import { entityRepo, ClearanceStatus } from '../repositories/EntityRepo.js';
import { timelineEmitter } from '../events/timelineEmitter.js';
import { resolveEffectiveClearanceStatus } from '../workflows/effectiveStatusResolver.js';

export const clearanceRouter = Router();

// Evaluate Clearance Risk for Canonical Entities
clearanceRouter.post('/projects/:id/clearance/evaluate', async (req: Request, res: Response, next) => {
  try {
    const projectId = req.params.id;
    const { canonicalEntityIds } = req.body;

    if (!canonicalEntityIds || !Array.isArray(canonicalEntityIds) || canonicalEntityIds.length === 0) {
      return res.status(400).json({ error: 'canonicalEntityIds array is required.' });
    }

    const assessments = [];
    for (const entityId of canonicalEntityIds) {
      const asm = await clearanceEvaluator.evaluateEntityClearance(projectId, entityId);
      assessments.push(asm);
    }

    return res.json({ assessments });
  } catch (err) {
    next(err);
  }
});

// Record Legal Counsel Decision Override
clearanceRouter.post('/projects/:id/entities/:entityId/override', async (req: Request, res: Response, next) => {
  try {
    const { id: projectId, entityId } = req.params;
    const { overrideStatus, rationale, counselName, counselRole, sceneId } = req.body;

    const validStatuses: ClearanceStatus[] = [
      'NO_ISSUE_SURFACED',
      'REVIEW_RECOMMENDED',
      'ACTION_REQUIRED',
      'INSUFFICIENT_EVIDENCE',
    ];

    if (!overrideStatus || !validStatuses.includes(overrideStatus)) {
      return res.status(400).json({ error: 'A valid overrideStatus is required.' });
    }

    if (!rationale || typeof rationale !== 'string' || rationale.trim().length === 0) {
      return res.status(400).json({ error: 'A non-empty legal counsel rationale is mandatory for audit logging.' });
    }

    if (!counselName || typeof counselName !== 'string' || counselName.trim().length === 0) {
      return res.status(400).json({ error: 'counselName is required.' });
    }

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const existingEntity = entities.find((e) => e.id === entityId);
    if (!existingEntity) {
      return res.status(404).json({ error: `Entity ${entityId} not found.` });
    }

    // Compute previousStatus as the effective status immediately before this override
    const existingOverrides = await overrideRepo.getOverridesByEntity(projectId, entityId);
    const previousStatus = resolveEffectiveClearanceStatus(existingEntity, existingOverrides, sceneId || undefined);

    // Record override audit log in OverrideRepo
    const override = await overrideRepo.recordOverride(projectId, {
      canonicalEntityId: entityId,
      sceneId: sceneId || undefined,
      previousStatus,
      overrideStatus,
      rationale: rationale.trim(),
      counselName: counselName.trim(),
      counselRole: counselRole?.trim() || 'Studio Production Counsel',
    });

    // Invariant: Scene-specific overrides MUST NEVER mutate canonical entity state
    let resultingEntity = existingEntity;
    if (!sceneId) {
      const updated = await entityRepo.updateCanonicalEntityOverride(
        projectId,
        entityId,
        overrideStatus,
        {
          overrideId: override.id,
          rationale: override.rationale,
          counselName: override.counselName,
          timestamp: override.timestamp,
        }
      );
      if (updated) resultingEntity = updated;
    }

    timelineEmitter.emit(projectId, 'OVERRIDE_RECORDED', `Legal Counsel Override: ${existingEntity.canonicalName}`, {
      overrideId: override.id,
      canonicalEntityId: entityId,
      canonicalName: existingEntity.canonicalName,
      sceneId: sceneId || undefined,
      previousStatus,
      overrideStatus,
      counselName: override.counselName,
      rationale: override.rationale,
    });

    return res.json({
      success: true,
      override,
      entity: resultingEntity,
    });
  } catch (err) {
    next(err);
  }
});

// Get Override History for Entity
clearanceRouter.get('/projects/:id/entities/:entityId/overrides', async (req: Request, res: Response, next) => {
  try {
    const { id: projectId, entityId } = req.params;
    const overrides = await overrideRepo.getOverridesByEntity(projectId, entityId);
    return res.json({
      canonicalEntityId: entityId,
      overrides,
    });
  } catch (err) {
    next(err);
  }
});
