import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';

describe('Integration: Occurrence Clearance Workflow (Feature 016 Phase 2)', () => {
  it('evaluates multi-scene occurrences with distinct context, rolls up canonical status, and preserves 003 scene override hierarchy', async () => {
    // 1. Create a Movie Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Velocity Night: Feature',
        productionCompany: 'Summit Studio',
        scriptVersion: 'v2.0-Final',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Create canonical brand entity
    const entRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Volt Fuel',
        entityCategory: 'BRAND',
        description: 'Racing fuel brand appearing across multiple scenes.',
      });
    expect(entRes.status).toBe(201);
    const entityId = entRes.body.id;

    // 3. Create Scene 1 Occurrence (Incidental safe context)
    const occ1 = await entityRepo.createOccurrence(projectId, {
      sceneId: 'scene-1',
      canonicalEntityId: entityId,
      scriptLineNumber: 12,
      excerptText: 'Mechanic holds a shiny can of Volt Fuel beside the engine.',
      usageContext: 'Incidental pit garage prop',
    });

    // 4. Create Scene 2 Occurrence (Tarnishing hazardous context)
    const occ2 = await entityRepo.createOccurrence(projectId, {
      sceneId: 'scene-2',
      canonicalEntityId: entityId,
      scriptLineNumber: 84,
      excerptText: 'Volt Fuel container leaked toxic volatile chemicals causing a deadly explosion.',
      usageContext: 'Weaponized defective fuel canister',
    });

    // 5. Evaluate Occurrence 1 individually
    const eval1Res = await request(app)
      .post(`/api/projects/${projectId}/occurrences/${occ1.id}/evaluate`)
      .send({});
    expect(eval1Res.status).toBe(200);
    expect(eval1Res.body.clearanceStatus).toBe('NO_ISSUE_SURFACED');
    expect(eval1Res.body.riskScore).toBe(15);
    expect(eval1Res.body.derivedCanonicalStatus).toBe('NO_ISSUE_SURFACED');

    // 6. Evaluate Occurrence 2 individually
    const eval2Res = await request(app)
      .post(`/api/projects/${projectId}/occurrences/${occ2.id}/evaluate`)
      .send({});
    expect(eval2Res.status).toBe(200);
    expect(eval2Res.body.clearanceStatus).toBe('ACTION_REQUIRED');
    expect(eval2Res.body.riskScore).toBe(90);
    expect(eval2Res.body.derivedCanonicalStatus).toBe('ACTION_REQUIRED');

    // 7. Verify Canonical Entity has rolled up to ACTION_REQUIRED
    const entityAfterOccs = await entityRepo.getEntityById(projectId, entityId);
    expect(entityAfterOccs?.overallClearanceStatus).toBe('ACTION_REQUIRED');

    // 8. Query Entity Occurrences Endpoint
    const occsListRes = await request(app)
      .get(`/api/projects/${projectId}/entities/${entityId}/occurrences`);
    expect(occsListRes.status).toBe(200);
    expect(occsListRes.body.derivedOverallStatus).toBe('ACTION_REQUIRED');
    expect(occsListRes.body.occurrences).toHaveLength(2);

    // 9. Preserving 003 Scene Override: Apply counsel sign-off specifically to Scene 2
    const overrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entityId}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Legal release signed by Volt Fuel brand operations permitting depicted stunt scene.',
        counselName: 'Marcus Vance, Esq.',
        counselRole: 'Senior Production Counsel',
        sceneId: 'scene-2',
      });
    expect(overrideRes.status).toBe(200);

    // 10. Verify that after Scene 2 override is applied, canonical rolled-up effective status updates to NO_ISSUE_SURFACED
    const entityAfterOverride = await entityRepo.getEntityById(projectId, entityId);
    expect(entityAfterOverride?.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');
  });
});
