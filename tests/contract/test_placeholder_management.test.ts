import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';
import { placeholderRepo } from '../../server/repositories/PlaceholderRepo.js';

describe('Contract: Generalized Replacement & Placeholder Management (Feature 016 Phase 7)', () => {
  it('FR-008: manages multi-category placeholders, category details, and TEMP_APPROVED vs FINAL_CLEARED transitions', async () => {
    // 1. Create a Movie Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Placeholder Dimension Project',
        productionCompany: 'Specter Media',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest script with music track
    const scriptText = `
INT. SOUNDSTAGE - NIGHT
The band tunes their instruments. Softly, the melody of Nocturne of the Wild echoes in the room.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const musicEntity = entities.find((e) => e.canonicalName.includes('Nocturne'));
    expect(musicEntity).toBeDefined();

    // 3. Create Music Placeholder at TEMP_APPROVED tier
    const createRes = await request(app)
      .post(`/api/projects/${projectId}/placeholders`)
      .send({
        canonicalEntityId: musicEntity!.id,
        assetCategory: 'ART_MUSIC',
        fictionalName: 'Echoes of Midnight',
        description: 'Original in-house synth rock track',
        clearanceTier: 'TEMP_APPROVED',
        creativeRationale: 'Temporary on-set track for camera sync',
        approvedBy: 'Alex Turner',
        approvedRole: 'Music Supervisor',
        categoryDetails: {
          bpm: 120,
          key: 'E Minor',
          musicalStyle: 'Synthwave Instrumental',
        },
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.fictionalName).toBe('Echoes of Midnight');
    expect(createRes.body.clearanceTier).toBe('TEMP_APPROVED');
    expect(createRes.body.categoryDetails.bpm).toBe(120);
    const placeholderId = createRes.body.id;

    // 4. Evaluate Scene 1 Readiness -> Should be WORKING_CLEAR due to TEMP_APPROVED placeholder
    const scenes = await sceneRepo.getScenesByProject(projectId);
    const scene1 = scenes[0];
    const readinessTemp = await request(app)
      .post(`/api/projects/${projectId}/scenes/${scene1.id}/readiness/evaluate`);
    expect(readinessTemp.status).toBe(200);
    expect(readinessTemp.body.status).toBe('WORKING_CLEAR');

    // 5. Query Placeholder by Entity
    const byEntityRes = await request(app).get(`/api/projects/${projectId}/entities/${musicEntity!.id}/placeholder`);
    expect(byEntityRes.status).toBe(200);
    expect(byEntityRes.body.id).toBe(placeholderId);

    // 6. Promote Placeholder to FINAL_CLEARED
    const promoteRes = await request(app)
      .patch(`/api/projects/${projectId}/placeholders/${placeholderId}/tier`)
      .send({
        clearanceTier: 'FINAL_CLEARED',
        approvedBy: 'Jane Sterling, Production Counsel',
        approvedRole: 'Lead Counsel',
      });
    expect(promoteRes.status).toBe(200);
    expect(promoteRes.body.clearanceTier).toBe('FINAL_CLEARED');

    // 7. Re-evaluate Scene 1 Readiness -> Should upgrade to FINAL_CLEAR
    const readinessFinal = await request(app)
      .post(`/api/projects/${projectId}/scenes/${scene1.id}/readiness/evaluate`);
    expect(readinessFinal.status).toBe(200);
    expect(readinessFinal.body.status).toBe('FINAL_CLEAR');

    // 8. Delete Placeholder
    const delRes = await request(app).delete(`/api/projects/${projectId}/placeholders/${placeholderId}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const deletedCheck = await placeholderRepo.getPlaceholderById(projectId, placeholderId);
    expect(deletedCheck).toBeNull();
  });
});
