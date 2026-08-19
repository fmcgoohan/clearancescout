import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';
import { actionNotificationRepo } from '../../server/repositories/ActionNotificationRepo.js';

describe('Contract: Action & Notification Lists (Feature 016 Phase 6)', () => {
  it('FR-007: routes department action items, broadcasts shoot alerts, and auto-resolves on mitigation', async () => {
    // 1. Create a Movie Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Action Dispatcher Protocol',
        productionCompany: 'Centurion Studios',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest screenplay with GRAPHIC_PROP and ART_MUSIC
    const scriptText = `
INT. LAB - NIGHT
On the wall hangs a bold warning sign: Titan Hazard Placard with flashing amber lights.

INT. LOUNGE - NIGHT
Elena sits near the window as the melody of Nocturne of the Wild fills the quiet room.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const graphicProp = entities.find((e) => e.entityCategory === 'GRAPHIC_PROP');
    const musicEntity = entities.find((e) => e.entityCategory === 'ART_MUSIC');
    expect(graphicProp).toBeDefined();
    expect(musicEntity).toBeDefined();

    // 3. Evaluate clearance for entities
    await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [graphicProp!.id, musicEntity!.id] });

    // 4. Query All Actions
    const allActionsRes = await request(app).get(`/api/projects/${projectId}/actions`);
    expect(allActionsRes.status).toBe(200);
    expect(allActionsRes.body.length).toBeGreaterThanOrEqual(2);

    // 5. Query Filtered by Department: ART_DEPT
    const artActionsRes = await request(app).get(`/api/projects/${projectId}/actions?department=ART_DEPT`);
    expect(artActionsRes.status).toBe(200);
    expect(artActionsRes.body).toHaveLength(1);
    expect(artActionsRes.body[0].actionType).toBe('ART_DEPT_REPLACEMENT');
    const artActionId = artActionsRes.body[0].id;

    // 6. Query Filtered by Department: LEGAL_COUNSEL
    const legalActionsRes = await request(app).get(`/api/projects/${projectId}/actions?department=LEGAL_COUNSEL`);
    expect(legalActionsRes.status).toBe(200);
    expect(legalActionsRes.body.some((a: any) => a.actionType === 'LEGAL_COUNSEL_RELEASE')).toBe(true);

    // 7. Update Action Status to IN_PROGRESS
    const patchActionRes = await request(app)
      .patch(`/api/projects/${projectId}/actions/${artActionId}`)
      .send({ status: 'IN_PROGRESS' });
    expect(patchActionRes.status).toBe(200);
    expect(patchActionRes.body.status).toBe('IN_PROGRESS');

    // 8. Trigger Scene Readiness -> Scene with uncleared item becomes RED and creates PRODUCTION_MGMT alert
    const scenes = await sceneRepo.getScenesByProject(projectId);
    await request(app).post(`/api/projects/${projectId}/scenes/${scenes[0].id}/readiness/evaluate`);
    await request(app).post(`/api/projects/${projectId}/actions/sync`);

    const notifsRes = await request(app).get(`/api/projects/${projectId}/notifications`);
    expect(notifsRes.status).toBe(200);
    expect(notifsRes.body.length).toBeGreaterThanOrEqual(1);
    const notifId = notifsRes.body[0].id;

    // 9. Mark Notification Read
    const markReadRes = await request(app).patch(`/api/projects/${projectId}/notifications/${notifId}/read`);
    expect(markReadRes.status).toBe(200);
    expect(markReadRes.body.isRead).toBe(true);

    // 10. Auto-Resolve on Replacement: Attach Replacement Card for Graphic Prop
    await request(app)
      .post(`/api/projects/${projectId}/replacements`)
      .send({
        canonicalEntityId: graphicProp!.id,
        fictionalBrandName: 'AeroShield Danger Sign',
        visualDescription: 'Fictionalized industrial warning label',
        creativeRationale: 'In-house created hazard prop',
      });

    await request(app).post(`/api/projects/${projectId}/actions/sync`);

    const updatedArtAction = await actionNotificationRepo.getActionById(projectId, artActionId);
    expect(updatedArtAction?.status).toBe('RESOLVED');
  });
});
