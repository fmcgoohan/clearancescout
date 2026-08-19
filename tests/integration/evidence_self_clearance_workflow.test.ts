import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { replacementRepo } from '../../server/repositories/ReplacementRepo.js';

describe('Integration: Evidence-Driven Live Self-Clearance Workflow (Feature 016 Phase 8)', () => {
  it('verifies 1-attempt clean clearance, 2-attempt negative constraint progression, and 3-attempt bounded counsel escalation', async () => {
    // 1. Create a Movie Production Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Cyberpunk Odyssey Live Project',
        productionCompany: 'Specter Media Corp',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest script with multi-attempt test brand ("Coca-Cola" -> simulated collisions on "atomic cola", "radiant pop")
    const scriptText = `
INT. CYBER CAFE - NIGHT
Leo sits under neon lights drinking from a bottle of Coca-Cola.
On the counter rests a vintage Rolex watch.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const cokeEntity = entities.find((e) => e.canonicalName.includes('Coca-Cola'));
    const rolexEntity = entities.find((e) => e.canonicalName.includes('Rolex'));

    expect(cokeEntity).toBeDefined();
    expect(rolexEntity).toBeDefined();

    // 3. Generate Replacement for Coca-Cola in 80s Retro Neon style (triggers multi-attempt loop)
    const cokeGenRes = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({
        canonicalEntityId: cokeEntity!.id,
        eraAesthetic: '80s Retro Neon',
      });

    expect(cokeGenRes.status).toBe(200);
    const cokeCard = cokeGenRes.body;
    expect(cokeCard.totalAttempts).toBeGreaterThanOrEqual(1);
    expect(cokeCard.totalAttempts).toBeLessThanOrEqual(3);
    expect(cokeCard.attemptHistory.length).toBe(cokeCard.totalAttempts);
    expect(cokeCard.status).toBe('APPROVED');

    // 4. Test Multi-Collision Entity Ceiling (hits hard ceiling of 3 attempts)
    const collisionScript = `
INT. LAB - NIGHT
Warning sign: [COLLISION] Danger Unit.
`;
    await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: collisionScript, format: 'PLAINTEXT' });

    const updatedEntities = await entityRepo.getEntitiesByProject(projectId);
    const collisionEntity = updatedEntities.find((e) => e.canonicalName.includes('COLLISION'));
    expect(collisionEntity).toBeDefined();

    const collGenRes = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({
        canonicalEntityId: collisionEntity!.id,
        eraAesthetic: 'Cyberpunk Industrial',
      });

    expect(collGenRes.status).toBe(200);
    const collCard = collGenRes.body;
    expect(collCard.totalAttempts).toBe(3);
    expect(collCard.selfClearanceResult).toBe('ESCALATED_TO_COUNSEL');
    expect(collCard.status).toBe('PROPOSED');

    // Verify negative constraints applied
    expect(collCard.attemptHistory[1].negativeConstraintsApplied).toContain(collCard.attemptHistory[0].candidateName);
    expect(collCard.attemptHistory[2].negativeConstraintsApplied).toContain(collCard.attemptHistory[1].candidateName);

    // 5. Query Replacement Comparison View Model
    const compRes = await request(app).get(`/api/projects/${projectId}/entities/${collisionEntity!.id}/comparison`);
    expect(compRes.status).toBe(200);
    expect(compRes.body.attemptHistory).toHaveLength(3);
    expect(compRes.body.original.canonicalName).toContain('COLLISION');
  });
});
