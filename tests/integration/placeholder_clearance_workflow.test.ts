import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';
import { placeholderRepo } from '../../server/repositories/PlaceholderRepo.js';

describe('Integration: Multi-Category Generalized Replacement & Placeholder Workflow (Feature 016 Phase 7)', () => {
  it('handles multi-domain placeholders across brands, music, dialogue, and props with TEMP_APPROVED vs FINAL_CLEARED lifecycle', async () => {
    // 1. Create a Movie Production Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Neon Odyssey Feature',
        productionCompany: 'Horizon Productions',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest 3-scene script covering multiple domains:
    //    Scene 1: Music Track ("Nocturne of the Wild")
    //    Scene 2: Graphic Prop ("Titan Industrial Hazard Placard")
    //    Scene 3: Brand ("Summit Cola")
    const scriptText = `
INT. NIGHTCLUB - NIGHT
The band performs on stage as the synths of Nocturne of the Wild pulse through the crowd.

INT. BOILER ROOM - NIGHT
Along the wall, a bold warning sign reads Titan Industrial Hazard Placard.

INT. APARTMENT - DAY
Alex sits by the window sipping a cold Summit Cola.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    const scenes = await sceneRepo.getScenesByProject(projectId);
    expect(scenes).toHaveLength(3);
    const [scene1, scene2, scene3] = scenes;

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const musicEntity = entities.find((e) => e.canonicalName.includes('Nocturne'));
    const propEntity = entities.find((e) => e.canonicalName.includes('Titan'));
    const brandEntity = entities.find((e) => e.canonicalName.includes('Summit'));

    expect(musicEntity).toBeDefined();
    expect(propEntity).toBeDefined();
    expect(brandEntity).toBeDefined();

    // 3. Evaluate initial clearance -> All 3 items evaluated
    await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [musicEntity!.id, propEntity!.id, brandEntity!.id] });

    // Initial Scene 1 Readiness -> Should be RED
    const scene1Initial = await request(app).post(`/api/projects/${projectId}/scenes/${scene1.id}/readiness/evaluate`);
    expect(scene1Initial.body.status).toBe('RED');

    // 4. Attach Music Placeholder with TEMP_APPROVED tier -> Scene 1 becomes WORKING_CLEAR
    const musicPhRes = await request(app)
      .post(`/api/projects/${projectId}/placeholders`)
      .send({
        canonicalEntityId: musicEntity!.id,
        assetCategory: 'ART_MUSIC',
        fictionalName: 'Horizon Midnight Synth',
        description: 'Original in-house score cue',
        clearanceTier: 'TEMP_APPROVED',
        approvedBy: 'Alex Turner',
        approvedRole: 'Music Supervisor',
        categoryDetails: {
          bpm: 115,
          key: 'A Minor',
          musicalStyle: 'Synthwave Ambient',
        },
      });
    expect(musicPhRes.status).toBe(201);
    const musicPlaceholderId = musicPhRes.body.id;

    const scene1Working = await request(app).post(`/api/projects/${projectId}/scenes/${scene1.id}/readiness/evaluate`);
    expect(scene1Working.body.status).toBe('WORKING_CLEAR');

    // 5. Attach Prop Placeholder with FINAL_CLEARED tier -> Scene 2 becomes FINAL_CLEAR
    const propPhRes = await request(app)
      .post(`/api/projects/${projectId}/placeholders`)
      .send({
        canonicalEntityId: propEntity!.id,
        assetCategory: 'GRAPHIC_PROP',
        fictionalName: 'Titan Industrial Danger Placard (Fictionalized)',
        description: 'Original vector artwork warning graphic',
        clearanceTier: 'FINAL_CLEARED',
        approvedBy: 'Prop Master Gary & Legal Counsel',
        approvedRole: 'Art Dept Lead',
        categoryDetails: {
          physicalSpecs: '24x36 matte finish aluminum sign',
        },
      });
    expect(propPhRes.status).toBe(201);

    const scene2Final = await request(app).post(`/api/projects/${projectId}/scenes/${scene2.id}/readiness/evaluate`);
    expect(scene2Final.body.status).toBe('FINAL_CLEAR');

    // 6. Promote Music Placeholder from TEMP_APPROVED to FINAL_CLEARED -> Scene 1 upgrades to FINAL_CLEAR
    await request(app)
      .patch(`/api/projects/${projectId}/placeholders/${musicPlaceholderId}/tier`)
      .send({
        clearanceTier: 'FINAL_CLEARED',
        approvedBy: 'Jane Sterling, Production Counsel',
      });

    const scene1Final = await request(app).post(`/api/projects/${projectId}/scenes/${scene1.id}/readiness/evaluate`);
    expect(scene1Final.body.status).toBe('FINAL_CLEAR');

    // 7. Query All Placeholders
    const allPhRes = await request(app).get(`/api/projects/${projectId}/placeholders`);
    expect(allPhRes.status).toBe(200);
    expect(allPhRes.body.length).toBeGreaterThanOrEqual(2);
    expect(allPhRes.body.every((p: any) => p.clearanceTier === 'FINAL_CLEARED')).toBe(true);
  });
});
