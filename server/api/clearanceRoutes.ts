import { Router, Request, Response } from 'express';
import { clearanceEvaluator } from '../workflows/clearanceEvaluator.js';

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
