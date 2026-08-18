import { Router, Request, Response } from 'express';
import { entityRepo } from '../repositories/EntityRepo.js';
import { replacementGenerator } from '../workflows/replacementGenerator.js';

export const replacementRouter = Router();

// Generate Cleared Replacement Brand Concept Card via Self-Clearance Loop
replacementRouter.post('/projects/:id/replacements/generate', async (req: Request, res: Response, next) => {
  try {
    const projectId = req.params.id;
    const { canonicalEntityId, eraAesthetic } = req.body;

    if (!canonicalEntityId) {
      return res.status(400).json({ error: 'canonicalEntityId is required.' });
    }

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const entity = entities.find((e) => e.id === canonicalEntityId);

    if (!entity) {
      return res.status(404).json({ error: `Canonical entity ${canonicalEntityId} not found.` });
    }

    const card = await replacementGenerator.generateClearedReplacement(
      projectId,
      canonicalEntityId,
      eraAesthetic || 'Modern Cinematic'
    );

    return res.json(card);
  } catch (err) {
    next(err);
  }
});
