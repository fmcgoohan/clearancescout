import { Router, Request, Response, NextFunction } from 'express';
import { entityRepo, EntityCategory } from '../repositories/EntityRepo.js';
import { timelineEmitter } from '../events/timelineEmitter.js';

export const entityMutationRouter = Router();

const VALID_CATEGORIES: EntityCategory[] = [
  'BRAND',
  'ART_MUSIC',
  'PUBLIC_FIGURE',
  'PROPRIETARY_LOCATION',
  'GRAPHIC_PROP',
  'TRADEMARK',
  'PRODUCT',
  'LOGO',
  'LOCATION',
  'CHARACTER_NAME',
];

// POST /projects/:id/entities - Manually add new clearance item
entityMutationRouter.post('/projects/:id/entities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const { canonicalName, entityCategory, description, sceneId, scriptLineNumber, usageContext } = req.body;

    if (!canonicalName || typeof canonicalName !== 'string' || canonicalName.trim().length === 0) {
      return res.status(400).json({ error: 'canonicalName is required and cannot be empty.' });
    }

    if (!entityCategory || !VALID_CATEGORIES.includes(entityCategory)) {
      return res.status(400).json({ error: `Invalid entityCategory. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    const created = await entityRepo.createCanonicalEntity({
      projectId,
      canonicalName: canonicalName.trim(),
      entityCategory,
      description: description?.trim() || `Manually added clearance item: ${canonicalName.trim()}`,
      overallClearanceStatus: 'INSUFFICIENT_EVIDENCE',
      origin: 'MANUALLY_ADDED',
    });

    if (sceneId) {
      await entityRepo.createOccurrence(projectId, {
        sceneId,
        canonicalEntityId: created.id,
        scriptLineNumber: Number(scriptLineNumber) || 1,
        excerptText: usageContext || `Manual placement of ${canonicalName.trim()}`,
        usageContext: usageContext || `Scene placement: ${canonicalName.trim()}`,
      });
    }

    timelineEmitter.emit(projectId, 'ITEM_ADDED', `Manual Item Added: ${created.canonicalName}`, {
      entityId: created.id,
      canonicalName: created.canonicalName,
      entityCategory: created.entityCategory,
      sceneId: sceneId || null,
      origin: 'MANUALLY_ADDED',
    });

    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id/entities/:entityId - Edit clearance item details
entityMutationRouter.patch('/projects/:id/entities/:entityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, entityId } = req.params;
    const { canonicalName, entityCategory, description, usageContext, sceneId } = req.body;

    if (canonicalName !== undefined && (typeof canonicalName !== 'string' || canonicalName.trim().length === 0)) {
      return res.status(400).json({ error: 'canonicalName cannot be empty string.' });
    }

    if (entityCategory !== undefined && !VALID_CATEGORIES.includes(entityCategory)) {
      return res.status(400).json({ error: `Invalid entityCategory. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    const previous = await entityRepo.getEntityById(projectId, entityId);
    if (!previous) {
      return res.status(404).json({ error: `Entity ${entityId} not found.` });
    }

    const result = await entityRepo.updateCanonicalEntity(projectId, entityId, {
      canonicalName,
      entityCategory,
      description,
      origin: 'USER_EDITED',
    });

    if (!result) {
      return res.status(404).json({ error: `Entity ${entityId} not found.` });
    }

    if (usageContext && sceneId) {
      await entityRepo.createOccurrence(projectId, {
        sceneId,
        canonicalEntityId: entityId,
        scriptLineNumber: 1,
        excerptText: usageContext,
        usageContext,
      });
    }

    timelineEmitter.emit(projectId, 'ITEM_EDITED', `Clearance Item Edited: ${result.entity.canonicalName}`, {
      entityId: result.entity.id,
      previousName: previous.canonicalName,
      newName: result.entity.canonicalName,
      previousCategory: previous.entityCategory,
      newCategory: result.entity.entityCategory,
      assessmentInvalidated: result.assessmentInvalidated,
      origin: 'USER_EDITED',
    });

    return res.json(result.entity);
  } catch (err) {
    next(err);
  }
});

// DELETE /projects/:id/entities/:entityId - Remove clearance item
entityMutationRouter.delete('/projects/:id/entities/:entityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, entityId } = req.params;
    const entity = await entityRepo.getEntityById(projectId, entityId);
    if (!entity) {
      return res.status(404).json({ error: `Entity ${entityId} not found.` });
    }

    const deleted = await entityRepo.deleteCanonicalEntity(projectId, entityId);
    if (!deleted) {
      return res.status(404).json({ error: `Entity ${entityId} not found.` });
    }

    timelineEmitter.emit(projectId, 'ITEM_REMOVED', `Clearance Item Removed: ${entity.canonicalName}`, {
      entityId: entity.id,
      canonicalName: entity.canonicalName,
      entityCategory: entity.entityCategory,
    });

    return res.json({ deleted: true, entityId });
  } catch (err) {
    next(err);
  }
});
