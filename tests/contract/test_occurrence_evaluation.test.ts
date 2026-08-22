import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';

describe('Contract: Occurrence-Level Evaluation & Canonical Roll-up (Feature 016 Phase 2)', () => {
  it('FR-002: evaluates occurrence with scene context and updates derived canonical status', async () => {
    // 1. Create a project
    const projectRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Project Apex Velocity',
        productionCompany: 'Speed Films',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projectRes.status).toBe(201);
    const projectId = projectRes.body.id;

    // 2. Create a canonical brand entity
    const entityRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'HyperFuel Nitro',
        entityCategory: 'BRAND',
        description: 'High energy fuel brand featured in racing scenes.',
      });
    expect(entityRes.status).toBe(201);
    const entityId = entityRes.body.id;

    // 3. Create Scene 1 Occurrence (Incidental casual use)
    const occ1 = await entityRepo.createOccurrence(projectId, {
      sceneId: 'scene-1',
      canonicalEntityId: entityId,
      scriptLineNumber: 15,
      excerptText: 'Driver sips HyperFuel Nitro calmly in the pit lane.',
      usageContext: 'Incidental background beverage placement',
    });

    // 4. Create Scene 4 Occurrence (Defamatory / tarnishing defect use)
    const occ2 = await entityRepo.createOccurrence(projectId, {
      sceneId: 'scene-4',
      canonicalEntityId: entityId,
      scriptLineNumber: 95,
      excerptText: 'HyperFuel Nitro can explodes with toxic fumes causing a catastrophic disaster.',
      usageContext: 'Defamatory defective product depiction',
    });

    // 5. Evaluate Occurrence 1 -> Expect NO_ISSUE_SURFACED
    const eval1Res = await request(app)
      .post(`/api/projects/${projectId}/occurrences/${occ1.id}/evaluate`)
      .send({});
    expect(eval1Res.status).toBe(200);
    expect(eval1Res.body.clearanceStatus).toBe('NO_ISSUE_SURFACED');
    // Unresolved occ2 holds canonical status at INSUFFICIENT_EVIDENCE (Feature 019 FR-012)
    expect(eval1Res.body.derivedCanonicalStatus).toBe('INSUFFICIENT_EVIDENCE');

    // 6. Evaluate Occurrence 2 -> Expect ACTION_REQUIRED and derived canonical status rolls up to ACTION_REQUIRED
    const eval2Res = await request(app)
      .post(`/api/projects/${projectId}/occurrences/${occ2.id}/evaluate`)
      .send({});
    expect(eval2Res.status).toBe(200);
    expect(eval2Res.body.clearanceStatus).toBe('ACTION_REQUIRED');
    expect(eval2Res.body.riskScore).toBe(90);
    expect(eval2Res.body.derivedCanonicalStatus).toBe('ACTION_REQUIRED');

    // 7. Query GET /api/projects/:id/entities/:entityId/occurrences
    const getOccsRes = await request(app)
      .get(`/api/projects/${projectId}/entities/${entityId}/occurrences`);
    expect(getOccsRes.status).toBe(200);
    expect(getOccsRes.body.derivedOverallStatus).toBe('ACTION_REQUIRED');
    expect(getOccsRes.body.occurrences).toHaveLength(2);

    const retrievedOcc1 = getOccsRes.body.occurrences.find((o: any) => o.id === occ1.id);
    expect(retrievedOcc1.clearanceStatus).toBe('NO_ISSUE_SURFACED');

    const retrievedOcc2 = getOccsRes.body.occurrences.find((o: any) => o.id === occ2.id);
    expect(retrievedOcc2.clearanceStatus).toBe('ACTION_REQUIRED');
  });

  it('FR-013: preserves 003 scene override in occurrence roll-up calculation', async () => {
    const projectRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Override Rollup Test',
        productionCompany: 'Legal Test Co',
        projectType: 'Commercial',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projectRes.body.id;

    const entityRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Volt Spark',
        entityCategory: 'BRAND',
        description: 'Brand with scene-level override.',
      });
    const entityId = entityRes.body.id;

    // 1. Create a scene for this project
    const scene = await sceneRepo.createScene({
      projectId,
      sceneNumber: 1,
      heading: 'INT. HAZARD LAB - NIGHT',
      locationType: 'INT',
      timeOfDay: 'NIGHT',
      rawText: 'Volt Spark battery dangerous and toxic fault.',
      characterActionSummary: 'Testing faulty battery',
    });

    // 2. Create occurrence with high risk defect
    const occ = await entityRepo.createOccurrence(projectId, {
      sceneId: scene.id,
      canonicalEntityId: entityId,
      scriptLineNumber: 42,
      excerptText: 'Volt Spark battery dangerous and toxic fault.',
      usageContext: 'Disparaging context',
    });

    // Evaluate occurrence -> ACTION_REQUIRED
    await request(app).post(`/api/projects/${projectId}/occurrences/${occ.id}/evaluate`);

    const beforeOverride = await entityRepo.getEntityById(projectId, entityId);
    expect(beforeOverride?.overallClearanceStatus).toBe('ACTION_REQUIRED');

    // Apply scene-specific legal counsel override to NO_ISSUE_SURFACED
    const overrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entityId}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Written producer release obtained specifically for scene.',
        counselName: 'Jane Doe, Esq.',
        sceneId: scene.id,
      });
    expect(overrideRes.status).toBe(200);

    // Derived canonical status rolled up from effective occurrence status should now be NO_ISSUE_SURFACED
    const afterOverride = await entityRepo.getEntityById(projectId, entityId);
    expect(afterOverride?.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');
  });
});
