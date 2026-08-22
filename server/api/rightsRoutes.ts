import { Router, Request, Response, NextFunction } from 'express';
import { rightsRepo, GrantType, TerritoryType, MediaWindowType, RightsStatus } from '../repositories/RightsRepo.js';
import { timelineEmitter } from '../events/timelineEmitter.js';
import { sceneReadinessEngine } from '../workflows/sceneReadinessEngine.js';

export const rightsRouter = Router();

const VALID_GRANT_TYPES: GrantType[] = [
  'EXCLUSIVE',
  'NON_EXCLUSIVE',
  'FAIR_USE',
  'PUBLIC_DOMAIN',
  'PROD_MADE',
];

const VALID_TERRITORIES: TerritoryType[] = [
  'WORLDWIDE',
  'NORTH_AMERICA',
  'EUROPE',
  'US_ONLY',
  'SPECIFIED_COUNTRIES',
];

const VALID_MEDIA_WINDOWS: MediaWindowType[] = [
  'ALL_MEDIA_IN_PERPETUITY',
  'THEATRICAL_SVOD',
  'THEATRICAL_ONLY',
  'LINEAR_TV',
  'FESTIVAL_ONLY',
  'DIGITAL_PROMO',
];

const VALID_STATUSES: RightsStatus[] = [
  'ACTIVE',
  'PENDING_SIGNATURE',
  'EXPIRED',
  'REVOKED',
];

// POST /projects/:id/rights - Register new rights license record
rightsRouter.post('/projects/:id/rights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const {
      canonicalEntityId,
      canonicalEntityName,
      occurrenceIds,
      licensorName,
      grantType,
      territory,
      territoryDetails,
      mediaWindow,
      effectiveDate,
      expirationDate,
      isPerpetual,
      covenants,
      feeAmount,
      currency,
      documentReferenceUrl,
      status,
    } = req.body;

    if (!canonicalEntityId || typeof canonicalEntityId !== 'string') {
      return res.status(400).json({ error: 'canonicalEntityId is required.' });
    }

    if (!licensorName || typeof licensorName !== 'string' || licensorName.trim().length === 0) {
      return res.status(400).json({ error: 'licensorName is required.' });
    }

    if (grantType && !VALID_GRANT_TYPES.includes(grantType)) {
      return res.status(400).json({ error: `Invalid grantType. Must be one of: ${VALID_GRANT_TYPES.join(', ')}` });
    }

    if (territory && !VALID_TERRITORIES.includes(territory)) {
      return res.status(400).json({ error: `Invalid territory. Must be one of: ${VALID_TERRITORIES.join(', ')}` });
    }

    if (mediaWindow && !VALID_MEDIA_WINDOWS.includes(mediaWindow)) {
      return res.status(400).json({ error: `Invalid mediaWindow. Must be one of: ${VALID_MEDIA_WINDOWS.join(', ')}` });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const created = await rightsRepo.createRightsRecord(projectId, {
      canonicalEntityId,
      canonicalEntityName,
      occurrenceIds: Array.isArray(occurrenceIds) ? occurrenceIds : [],
      licensorName: licensorName.trim(),
      grantType: grantType || 'NON_EXCLUSIVE',
      territory: territory || 'WORLDWIDE',
      territoryDetails: territoryDetails?.trim(),
      mediaWindow: mediaWindow || 'ALL_MEDIA_IN_PERPETUITY',
      effectiveDate: effectiveDate || new Date().toISOString().slice(0, 10),
      expirationDate: expirationDate || undefined,
      isPerpetual: isPerpetual !== undefined ? Boolean(isPerpetual) : !expirationDate,
      covenants: Array.isArray(covenants) ? covenants.map((c: string) => c.trim()).filter(Boolean) : [],
      feeAmount: feeAmount !== undefined ? Number(feeAmount) : undefined,
      currency: currency || 'USD',
      documentReferenceUrl: documentReferenceUrl?.trim(),
      status: status || 'ACTIVE',
    });

    timelineEmitter.emit(
      projectId,
      'STATE_TRANSITION',
      `Rights License Registered: ${created.licensorName} -> ${created.canonicalEntityName || created.canonicalEntityId}`,
      {
        rightsId: created.id,
        canonicalEntityId: created.canonicalEntityId,
        licensorName: created.licensorName,
        grantType: created.grantType,
        territory: created.territory,
        status: created.status,
      }
    );

    await sceneReadinessEngine.evaluateAllScenesReadiness(projectId);

    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id/rights - List all rights records in project
rightsRouter.get('/projects/:id/rights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const records = await rightsRepo.getRightsByProject(projectId);
    return res.json(records);
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id/entities/:entityId/rights - List rights records for specific entity
rightsRouter.get('/projects/:id/entities/:entityId/rights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, entityId } = req.params;
    const records = await rightsRepo.getRightsByEntity(projectId, entityId);
    return res.json(records);
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id/rights/:rightsId - Get single rights record
rightsRouter.get('/projects/:id/rights/:rightsId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, rightsId } = req.params;
    const record = await rightsRepo.getRightsRecordById(projectId, rightsId);
    if (!record) {
      return res.status(404).json({ error: `Rights record ${rightsId} not found.` });
    }
    return res.json(record);
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id/rights/:rightsId - Update rights record
rightsRouter.patch('/projects/:id/rights/:rightsId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, rightsId } = req.params;
    const updates = req.body;

    const existing = await rightsRepo.getRightsRecordById(projectId, rightsId);
    if (!existing) {
      return res.status(404).json({ error: `Rights record ${rightsId} not found.` });
    }

    const updated = await rightsRepo.updateRightsRecord(projectId, rightsId, updates);
    if (!updated) {
      return res.status(404).json({ error: `Rights record ${rightsId} not found.` });
    }

    timelineEmitter.emit(projectId, 'STATE_TRANSITION', `Rights License Updated: ${updated.licensorName}`, {
      rightsId: updated.id,
      canonicalEntityId: updated.canonicalEntityId,
      status: updated.status,
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /projects/:id/rights/:rightsId - Delete / revoke rights record
rightsRouter.delete('/projects/:id/rights/:rightsId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, rightsId } = req.params;
    const existing = await rightsRepo.getRightsRecordById(projectId, rightsId);
    if (!existing) {
      return res.status(404).json({ error: `Rights record ${rightsId} not found.` });
    }

    await rightsRepo.deleteRightsRecord(projectId, rightsId);

    timelineEmitter.emit(projectId, 'STATE_TRANSITION', `Rights License Revoked: ${existing.licensorName}`, {
      rightsId,
      canonicalEntityId: existing.canonicalEntityId,
    });

    return res.json({ deleted: true, rightsId });
  } catch (err) {
    next(err);
  }
});
