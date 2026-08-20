import { Router, Request, Response, NextFunction } from 'express';
import {
  placeholderRepo,
  PlaceholderAssetCategory,
  PlaceholderClearanceTier,
} from '../repositories/PlaceholderRepo.js';
import { entityRepo } from '../repositories/EntityRepo.js';
import { actionNotificationRepo } from '../repositories/ActionNotificationRepo.js';
import { timelineEmitter } from '../events/timelineEmitter.js';

export const placeholderRouter = Router();

// GET /projects/:id/placeholders - List placeholders for project
placeholderRouter.get('/projects/:id/placeholders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const { category, tier, canonicalEntityId } = req.query;

    const placeholders = await placeholderRepo.getPlaceholdersByProject(projectId, {
      assetCategory: category as PlaceholderAssetCategory,
      clearanceTier: tier as PlaceholderClearanceTier,
      canonicalEntityId: canonicalEntityId as string,
    });

    return res.json(placeholders);
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id/entities/:entityId/placeholder - Get placeholder by entity
placeholderRouter.get('/projects/:id/entities/:entityId/placeholder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, entityId } = req.params;
    const placeholder = await placeholderRepo.getPlaceholderByEntity(projectId, entityId);
    if (!placeholder) {
      return res.status(404).json({ error: `No placeholder attached to entity ${entityId}` });
    }
    return res.json(placeholder);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/placeholders - Create or attach generalized replacement placeholder
placeholderRouter.post('/projects/:id/placeholders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const {
      canonicalEntityId,
      assetCategory,
      fictionalName,
      suggestedName,
      description,
      clearanceTier,
      placeholderTier,
      creativeRationale,
      rationale,
      visualDescription,
      approvedBy,
      approvedRole,
      approvalDate,
      categoryDetails,
      scopeType,
      occurrenceIds,
      sceneIds,
      isProjectWide,
    } = req.body;

    const resolvedName = fictionalName || suggestedName;
    if (!canonicalEntityId || !resolvedName) {
      return res.status(400).json({ error: 'canonicalEntityId and fictionalName/suggestedName are required.' });
    }

    const entity = await entityRepo.getEntityById(projectId, canonicalEntityId);
    if (!entity) {
      return res.status(404).json({ error: `Entity ${canonicalEntityId} not found.` });
    }

    const placeholder = await placeholderRepo.createPlaceholder(projectId, {
      canonicalEntityId,
      canonicalName: entity.canonicalName,
      assetCategory: assetCategory || (entity.entityCategory as any) || 'BRAND',
      fictionalName: resolvedName.trim(),
      description: description?.trim() || visualDescription?.trim() || '',
      clearanceTier: clearanceTier || placeholderTier || 'TEMP_APPROVED',
      creativeRationale: creativeRationale?.trim() || rationale?.trim() || 'Fictional replacement asset',
      approvedBy: approvedBy?.trim() || 'Production Clearance Team',
      approvedRole: approvedRole?.trim(),
      approvalDate: approvalDate || new Date().toISOString(),
      categoryDetails,
      scopeType:
        scopeType ||
        (sceneIds?.length
          ? 'SELECTED_SCENES'
          : occurrenceIds?.length
          ? 'SELECTED_OCCURRENCES'
          : isProjectWide === false
          ? 'SINGLE_OCCURRENCE'
          : 'PROJECT_WIDE'),
      occurrenceIds: occurrenceIds || [],
      sceneIds: sceneIds || [],
      isProjectWide: Boolean(
        isProjectWide ||
          scopeType === 'PROJECT_WIDE' ||
          (!scopeType && !sceneIds?.length && !occurrenceIds?.length && isProjectWide !== false)
      ),
    });

    // Auto-resolve pending action items for this entity
    await actionNotificationRepo.resolveActionsForEntity(
      projectId,
      canonicalEntityId,
      `PLACEHOLDER_ATTACHED_${placeholder.clearanceTier}`
    );

    timelineEmitter.emit(
      projectId,
      'STATE_TRANSITION',
      `Placeholder Attached: ${placeholder.fictionalName} (${placeholder.clearanceTier})`,
      {
        placeholderId: placeholder.id,
        canonicalEntityId,
        fictionalName: placeholder.fictionalName,
        assetCategory: placeholder.assetCategory,
        clearanceTier: placeholder.clearanceTier,
      }
    );

    return res.status(201).json(placeholder);
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id/placeholders/:placeholderId/tier - Promote or demote placeholder clearance tier
placeholderRouter.patch('/projects/:id/placeholders/:placeholderId/tier', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, placeholderId } = req.params;
    const { clearanceTier, approvedBy, approvedRole } = req.body;

    if (!clearanceTier || !['TEMP_APPROVED', 'FINAL_CLEARED'].includes(clearanceTier)) {
      return res.status(400).json({ error: 'Valid clearanceTier (TEMP_APPROVED | FINAL_CLEARED) is required.' });
    }

    const updated = await placeholderRepo.updatePlaceholderTier(
      projectId,
      placeholderId,
      clearanceTier as PlaceholderClearanceTier,
      approvedBy || 'Production Clearance Counsel',
      approvedRole
    );

    if (!updated) {
      return res.status(404).json({ error: `Placeholder ${placeholderId} not found.` });
    }

    timelineEmitter.emit(
      projectId,
      'STATE_TRANSITION',
      `Placeholder Tier Updated: ${updated.fictionalName} -> ${updated.clearanceTier}`,
      {
        placeholderId: updated.id,
        clearanceTier: updated.clearanceTier,
        approvedBy: updated.approvedBy,
      }
    );

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /projects/:id/placeholders/:placeholderId - Remove placeholder
placeholderRouter.delete('/projects/:id/placeholders/:placeholderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, placeholderId } = req.params;
    const success = await placeholderRepo.deletePlaceholder(projectId, placeholderId);
    if (!success) {
      return res.status(404).json({ error: `Placeholder ${placeholderId} not found.` });
    }
    return res.json({ success: true, id: placeholderId });
  } catch (err) {
    next(err);
  }
});
