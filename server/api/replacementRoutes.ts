import { Router, Request, Response } from 'express';
import { entityRepo } from '../repositories/EntityRepo.js';
import { replacementRepo } from '../repositories/ReplacementRepo.js';
import { replacementAgent } from '../agents/ReplacementAgent.js';
import { artworkTool } from '../tools/artworkTool.js';
import { timelineEmitter } from '../events/timelineEmitter.js';

export const replacementRouter = Router();

// Generate Replacement Brand Concept Card
replacementRouter.post('/projects/:id/replacements/generate', async (req: Request, res: Response, next) => {
  try {
    const projectId = req.params.id;
    const { canonicalEntityId } = req.body;

    if (!canonicalEntityId) {
      return res.status(400).json({ error: 'canonicalEntityId is required.' });
    }

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const entity = entities.find((e) => e.id === canonicalEntityId);

    if (!entity) {
      return res.status(404).json({ error: `Canonical entity ${canonicalEntityId} not found.` });
    }

    timelineEmitter.emit(projectId, 'REPLACEMENT_GEN', `Generating Fictional Replacement Brand for ${entity.canonicalName}`, {
      canonicalEntityId,
    });

    // Step 1: Generate fictional brand name & design brief via Gemini 3.6 Flash agent
    const brandData = await replacementAgent.generateFictionalBrand(entity.canonicalName, entity.entityCategory);

    // Step 2: Generate visual concept artwork card via Imagen 3 tool
    const artworkImageUrl = await artworkTool.generateArtworkCard(brandData.fictionalBrandName, brandData.designBrief);

    // Step 3: Persist Replacement Card
    const card = await replacementRepo.createReplacement({
      canonicalEntityId,
      fictionalBrandName: brandData.fictionalBrandName,
      designBrief: brandData.designBrief,
      artworkImageUrl,
      nonInfringementRationale: brandData.nonInfringementRationale,
      status: 'PROPOSED',
    });

    timelineEmitter.emit(projectId, 'REPLACEMENT_GEN', `Replacement Concept Created: ${card.fictionalBrandName}`, {
      replacementId: card.id,
      fictionalBrandName: card.fictionalBrandName,
    });

    return res.json(card);
  } catch (err) {
    next(err);
  }
});
