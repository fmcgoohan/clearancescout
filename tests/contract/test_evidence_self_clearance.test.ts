import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { replacementRepo } from '../../server/repositories/ReplacementRepo.js';

describe('Contract: Evidence-Driven Live Self-Clearance (Feature 016 Phase 8)', () => {
  it('FR-009: iterates autonomously with negative constraints and enforces <= 3 attempt ceiling', async () => {
    // 1. Create a Movie Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Evidence Clearance Project',
        productionCompany: 'Specter Media',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest script with branded entity
    const scriptText = `
INT. DINER - DAY
Alex sets down a bottle of [COLLISION] Test Beverage on the table.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const targetEntity = entities.find((e) => e.canonicalName.includes('COLLISION'));
    expect(targetEntity).toBeDefined();

    // 3. Generate Replacement for multi-collision entity (should hit ceiling of 3 attempts)
    const genRes = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({
        canonicalEntityId: targetEntity!.id,
        eraAesthetic: '80s Retro Neon',
      });

    expect(genRes.status).toBe(200);
    const card = genRes.body;
    expect(card.totalAttempts).toBe(3);
    expect(card.selfClearanceResult).toBe('ESCALATED_TO_COUNSEL');
    expect(card.status).toBe('PROPOSED');
    expect(card.attemptHistory).toHaveLength(3);

    // Verify negative constraints recorded in attempts 2 and 3
    expect(card.attemptHistory[1].negativeConstraintsApplied).toBeDefined();
    expect(card.attemptHistory[1].negativeConstraintsApplied).toContain(card.attemptHistory[0].candidateName);

    expect(card.attemptHistory[2].negativeConstraintsApplied).toBeDefined();
    expect(card.attemptHistory[2].negativeConstraintsApplied).toContain(card.attemptHistory[0].candidateName);
    expect(card.attemptHistory[2].negativeConstraintsApplied).toContain(card.attemptHistory[1].candidateName);

    // 4. Test Clean Entity (Attempt 1 acceptance)
    const cleanScript = `
INT. DINER - DAY
Maria opens a cold can of Summit Cola.
`;
    await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: cleanScript, format: 'PLAINTEXT' });

    const updatedEntities = await entityRepo.getEntitiesByProject(projectId);
    const cleanEntity = updatedEntities.find((e) => e.canonicalName.includes('Summit Cola'));
    expect(cleanEntity).toBeDefined();

    const cleanGenRes = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({
        canonicalEntityId: cleanEntity!.id,
        eraAesthetic: 'Modern Minimalist',
      });

    expect(cleanGenRes.status).toBe(200);
    const cleanCard = cleanGenRes.body;
    expect(cleanCard.totalAttempts).toBe(1);
    expect(cleanCard.selfClearanceResult).toBe('ACCEPTED');
    expect(cleanCard.status).toBe('APPROVED');
    expect(cleanCard.clearanceStatus).toBe('NO_ISSUE_SURFACED');
  });
});
