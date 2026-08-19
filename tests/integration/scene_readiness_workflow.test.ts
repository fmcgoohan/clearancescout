import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';
import { rightsRepo } from '../../server/repositories/RightsRepo.js';

describe('Integration: Multi-Scene Shooting Readiness Workflow (Feature 016 Phase 5)', () => {
  it('computes end-to-end scene readiness across complex production script with mixed status, replacement cards, and rights agreements', async () => {
    // 1. Create a Commercial Production Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Summit Cola Campaign 2026',
        productionCompany: 'Apex Commercials',
        projectType: 'Commercial',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest 3-scene commercial script:
    //    Scene 1: High-risk brand mention ("Summit Cola" depicted in neutral/positive context)
    //    Scene 2: Living public figure / high risk mark ("Elena Vance" keynote)
    //    Scene 3: Generic background landscape dialogue (Clean Scene)
    const scriptText = `
INT. SKYLINE CAFE - DAY
Alex drinks a cold Summit Cola while gazing across the city skyline.

INT. CONFERENCE HALL - DAY
Elena Vance takes the stage to present the keynote speech to hundreds of attendees.

EXT. SUNNY MEADOW - DAY
Two hikers walk along the quiet dirt trail admiring the distant snow-capped mountains.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    const scenes = await sceneRepo.getScenesByProject(projectId);
    expect(scenes).toHaveLength(3);
    const [scene1, scene2, scene3] = scenes;

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const summitCola = entities.find((e) => e.canonicalName.toLowerCase().includes('summit cola'));
    const elenaVance = entities.find((e) => e.canonicalName.toLowerCase().includes('elena vance'));

    expect(summitCola).toBeDefined();
    expect(elenaVance).toBeDefined();

    // 3. Evaluate initial clearance for entities
    await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [summitCola!.id, elenaVance!.id] });

    // 4. Batch Evaluate All Scene Readiness
    const batchReadinessRes = await request(app)
      .post(`/api/projects/${projectId}/scenes/readiness/evaluate-all`);
    expect(batchReadinessRes.status).toBe(200);
    expect(batchReadinessRes.body.totalScenes).toBe(3);
    expect(batchReadinessRes.body.finalClearScenesCount).toBeGreaterThanOrEqual(1);

    // Scene 3 (Clean Scene) must be FINAL_CLEAR
    const scene3Readiness = await request(app).get(`/api/projects/${projectId}/scenes/${scene3.id}/readiness`);
    expect(scene3Readiness.body.status).toBe('FINAL_CLEAR');
    expect(scene3Readiness.body.totalOccurrences).toBe(0);

    // 5. Attach Rights agreement for Summit Cola -> Scene 1 becomes FINAL_CLEAR
    await request(app)
      .post(`/api/projects/${projectId}/rights`)
      .send({
        canonicalEntityId: summitCola!.id,
        licensorName: 'Summit Beverage Corporation',
        grantType: 'EXCLUSIVE',
        territory: 'WORLDWIDE',
        mediaWindow: 'ALL_MEDIA_IN_PERPETUITY',
        effectiveDate: '2026-01-01',
        isPerpetual: true,
        covenants: ['Featured placement permitted in TV Commercial'],
        status: 'ACTIVE',
      });

    // Re-evaluate Scene 1
    const scene1Eval = await request(app)
      .post(`/api/projects/${projectId}/scenes/${scene1.id}/readiness/evaluate`);
    expect(scene1Eval.status).toBe(200);
    expect(scene1Eval.body.status).toBe('FINAL_CLEAR');

    // 6. Overall Project Summary reflects updated status
    const finalSummary = await request(app).get(`/api/projects/${projectId}/scenes/readiness`);
    expect(finalSummary.status).toBe(200);
    expect(finalSummary.body.totalScenes).toBe(3);
    expect(finalSummary.body.finalClearScenesCount).toBeGreaterThanOrEqual(2);
  });
});
