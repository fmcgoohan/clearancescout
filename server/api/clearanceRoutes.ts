import { Router, Request, Response, NextFunction } from 'express';
import { clearanceEvaluator } from '../workflows/clearanceEvaluator.js';
import { overrideRepo } from '../repositories/OverrideRepo.js';
import { entityRepo, ClearanceStatus } from '../repositories/EntityRepo.js';
import { timelineEmitter } from '../events/timelineEmitter.js';
import { resolveEffectiveClearanceStatus } from '../workflows/effectiveStatusResolver.js';
import { sceneReadinessEngine } from '../workflows/sceneReadinessEngine.js';

export const clearanceRouter = Router();

// Evaluate Clearance Risk for Canonical Entities
clearanceRouter.post('/projects/:id/clearance/evaluate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const entityIds = req.body.canonicalEntityIds || (req.body.canonicalEntityId ? [req.body.canonicalEntityId] : []);

    if (!Array.isArray(entityIds) || entityIds.length === 0) {
      return res.status(400).json({ error: 'canonicalEntityIds array or canonicalEntityId is required.' });
    }

    const assessments = [];
    for (const entityId of entityIds) {
      const asm = await clearanceEvaluator.evaluateEntityClearance(projectId, entityId);
      assessments.push(asm);
    }

    return res.json({
      assessments,
      assessment: assessments[0],
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message, quota: err.quota });
    }
    next(err);
  }
});

// Evaluate Single Scene Occurrence (Feature 016 Phase 2)
clearanceRouter.post('/projects/:id/occurrences/:occurrenceId/evaluate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, occurrenceId } = req.params;
    const result = await clearanceEvaluator.evaluateOccurrenceClearance(projectId, occurrenceId);
    return res.json({
      ...result.occurrence,
      occurrence: result.occurrence,
      assessment: result.assessment,
      derivedCanonicalStatus: result.derivedCanonicalStatus,
      evaluatedAt: result.evaluatedAt,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message, quota: err.quota });
    }
    next(err);
  }
});

// Get Occurrences for Entity (Feature 016 Phase 2)
clearanceRouter.get('/projects/:id/entities/:entityId/occurrences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, entityId } = req.params;
    const entity = await entityRepo.getEntityById(projectId, entityId);
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const occurrences = await entityRepo.getOccurrencesByEntity(projectId, entityId);
    return res.json({
      canonicalEntityId: entity.id,
      canonicalName: entity.canonicalName,
      derivedOverallStatus: entity.overallClearanceStatus,
      occurrences,
    });
  } catch (err) {
    next(err);
  }
});

// Retry Research for Single Failed or INSUFFICIENT_EVIDENCE Entity
clearanceRouter.post('/projects/:id/entities/:entityId/retry-research', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, entityId } = req.params;
    const result = await clearanceEvaluator.retryEntityResearch(projectId, entityId);
    return res.json(result);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// Record Legal Counsel Decision Override
clearanceRouter.post('/projects/:id/entities/:entityId/override', async (req: Request, res: Response, next: NextFunction) => {
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
      return res.status(400).json({ error: 'Valid overrideStatus is required.' });
    }

    if (!rationale || typeof rationale !== 'string' || rationale.trim().length === 0) {
      return res.status(400).json({ error: 'Rationale is required for legal audit trail.' });
    }

    if (!counselName || typeof counselName !== 'string' || counselName.trim().length === 0) {
      return res.status(400).json({ error: 'counselName is required.' });
    }

    const existingEntity = await entityRepo.getEntityById(projectId, entityId);
    if (!existingEntity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    // Fetch existing overrides for this entity
    const existingOverrides = await overrideRepo.getOverridesByEntity(projectId, entityId);

    // Determine authoritative effective status before this new override is recorded
    const previousStatus = resolveEffectiveClearanceStatus(existingEntity, existingOverrides, sceneId);

    // Persist Override in OverrideRepo
    const override = await overrideRepo.recordOverride(projectId, {
      canonicalEntityId: entityId,
      sceneId: sceneId || undefined,
      previousStatus,
      overrideStatus,
      rationale: rationale.trim(),
      counselName: counselName.trim(),
      counselRole: counselRole?.trim() || 'Clearance Counsel',
    });

    let resultingEntity = existingEntity;

    if (!sceneId) {
      // Direct canonical override applied
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
    } else {
      // Scene-specific override applied: Recompute derived canonical status across all scenes
      await entityRepo.computeDerivedCanonicalStatus(projectId, entityId);
      const updated = await entityRepo.getEntityById(projectId, entityId);
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

    await sceneReadinessEngine.evaluateAllScenesReadiness(projectId);

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
clearanceRouter.get('/projects/:id/entities/:entityId/overrides', async (req: Request, res: Response, next: NextFunction) => {
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
