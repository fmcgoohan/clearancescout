import { Router, Request, Response, NextFunction } from 'express';
import { entityRepo, EntityCategory, EntityRelationshipType } from '../repositories/EntityRepo.js';
import { entityResolutionEngine } from '../workflows/entityResolutionEngine.js';
import { clearanceEvaluator } from '../workflows/clearanceEvaluator.js';
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

const VALID_RELATIONSHIPS: EntityRelationshipType[] = [
  'BRAND_PRODUCT',
  'SUBSIDIARY',
  'PARENT_COMPANY',
  'PRODUCT_LINE',
  'VARIATION',
];

// POST /projects/:id/entities - Manually add new clearance item
entityMutationRouter.post('/projects/:id/entities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const { canonicalName, entityCategory, description, aliases, sceneId, scriptLineNumber, usageContext } = req.body;

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
      aliases: Array.isArray(aliases) ? aliases.map((a: string) => a.trim()).filter(Boolean) : [],
      origin: 'MANUALLY_ADDED',
    });

    if (sceneId) {
      await entityRepo.createOccurrence(projectId, {
        sceneId,
        canonicalEntityId: created.id,
        scriptLineNumber: Number(scriptLineNumber) || 1,
        excerptText: usageContext || `Manual placement of ${canonicalName.trim()}`,
        usageContext: usageContext || `Scene placement: ${canonicalName.trim()}`,
        surfaceMention: canonicalName.trim(),
        matchedVia: 'MANUAL_ENTRY',
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

// POST /projects/:id/entities/resolve - Disambiguate/resolve candidate mention against registry (Phase 3)
entityMutationRouter.post('/projects/:id/entities/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const { mention, category } = req.body;

    if (!mention || typeof mention !== 'string' || mention.trim().length === 0) {
      return res.status(400).json({ error: 'mention string is required.' });
    }

    const result = await entityResolutionEngine.resolveEntityMention(
      projectId,
      mention.trim(),
      category as EntityCategory | undefined
    );

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/entities/merge - Merge two canonical entities (Phase 3)
entityMutationRouter.post('/projects/:id/entities/merge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const { targetCanonicalEntityId, sourceCanonicalEntityId } = req.body;

    if (!targetCanonicalEntityId || !sourceCanonicalEntityId) {
      return res.status(400).json({ error: 'Both targetCanonicalEntityId and sourceCanonicalEntityId are required.' });
    }

    const result = await entityRepo.mergeEntities(projectId, targetCanonicalEntityId, sourceCanonicalEntityId);
    if (!result) {
      return res.status(404).json({ error: 'One or both entities not found in project.' });
    }

    timelineEmitter.emit(
      projectId,
      'STATE_TRANSITION',
      `Merged Entity "${sourceCanonicalEntityId}" into "${result.targetEntity.canonicalName}"`,
      {
        targetEntityId: result.targetEntity.id,
        sourceEntityId: result.sourceEntityId,
        transferredOccurrencesCount: result.transferredOccurrencesCount,
        combinedAliases: result.combinedAliases,
      }
    );

    return res.json(result);
  } catch (err: any) {
    if (err.message && err.message.includes('Cannot merge')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// POST /projects/:id/entities/:entityId/aliases - Add alias to canonical entity (Phase 3)
entityMutationRouter.post('/projects/:id/entities/:entityId/aliases', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, entityId } = req.params;
    const { alias } = req.body;

    if (!alias || typeof alias !== 'string' || alias.trim().length === 0) {
      return res.status(400).json({ error: 'alias string is required.' });
    }

    const updated = await entityRepo.addAlias(projectId, entityId, alias.trim());
    if (!updated) {
      return res.status(404).json({ error: `Entity ${entityId} not found.` });
    }

    timelineEmitter.emit(projectId, 'STATE_TRANSITION', `Added Alias "${alias.trim()}" to ${updated.canonicalName}`, {
      entityId: updated.id,
      canonicalName: updated.canonicalName,
      aliases: updated.aliases,
    });

    return res.json({
      success: true,
      canonicalEntityId: updated.id,
      canonicalName: updated.canonicalName,
      aliases: updated.aliases || [],
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /projects/:id/entities/:entityId/aliases/:alias - Remove alias (Phase 3)
entityMutationRouter.delete('/projects/:id/entities/:entityId/aliases/:alias', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, entityId, alias } = req.params;
    const decodedAlias = decodeURIComponent(alias);

    const updated = await entityRepo.removeAlias(projectId, entityId, decodedAlias);
    if (!updated) {
      return res.status(404).json({ error: `Entity ${entityId} not found.` });
    }

    timelineEmitter.emit(projectId, 'STATE_TRANSITION', `Removed Alias "${decodedAlias}" from ${updated.canonicalName}`, {
      entityId: updated.id,
      canonicalName: updated.canonicalName,
      aliases: updated.aliases,
    });

    return res.json({
      success: true,
      canonicalEntityId: updated.id,
      aliases: updated.aliases || [],
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id/entities/:entityId/relationship - Set parent brand / hierarchy relationship (Phase 3)
entityMutationRouter.patch('/projects/:id/entities/:entityId/relationship', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, entityId } = req.params;
    const { parentEntityId, relationshipType } = req.body;

    if (!parentEntityId || typeof parentEntityId !== 'string') {
      return res.status(400).json({ error: 'parentEntityId is required.' });
    }

    if (!relationshipType || !VALID_RELATIONSHIPS.includes(relationshipType)) {
      return res.status(400).json({
        error: `Invalid relationshipType. Must be one of: ${VALID_RELATIONSHIPS.join(', ')}`,
      });
    }

    const updated = await entityRepo.setEntityRelationship(projectId, entityId, parentEntityId, relationshipType);
    if (!updated) {
      return res.status(404).json({ error: `Child entity ${entityId} not found.` });
    }

    timelineEmitter.emit(
      projectId,
      'STATE_TRANSITION',
      `Configured Brand Hierarchy: ${updated.canonicalName} (${relationshipType}) -> ${updated.parentEntityName}`,
      {
        entityId: updated.id,
        parentEntityId: updated.parentEntityId,
        parentEntityName: updated.parentEntityName,
        relationshipType: updated.relationshipType,
      }
    );

    return res.json(updated);
  } catch (err: any) {
    if (err.message && err.message.includes('Parent entity')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

// PATCH /projects/:id/entities/:entityId - Edit clearance item details
entityMutationRouter.patch('/projects/:id/entities/:entityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, entityId } = req.params;
    const { canonicalName, entityCategory, description, aliases, parentEntityId, relationshipType, usageContext, sceneId } = req.body;

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

    let parentEntityName: string | undefined = undefined;
    if (parentEntityId) {
      const parent = await entityRepo.getEntityById(projectId, parentEntityId);
      if (parent) {
        parentEntityName = parent.canonicalName;
      }
    }

    const result = await entityRepo.updateCanonicalEntity(projectId, entityId, {
      canonicalName,
      entityCategory,
      description,
      aliases,
      parentEntityId,
      parentEntityName,
      relationshipType,
      origin: 'USER_EDITED',
    });

    if (!result) {
      return res.status(404).json({ error: `Entity ${entityId} not found.` });
    }

    if (result.assessmentInvalidated) {
      clearanceEvaluator.invalidateGroundingCache(projectId, entityId);
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
