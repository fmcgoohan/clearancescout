import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';
import { actionNotificationRepo } from '../../server/repositories/ActionNotificationRepo.js';

describe('Integration: Multi-Department Action & Notification Workflow (Feature 016 Phase 6)', () => {
  it('dispatches department actions on script ingestion, broadcasts shoot blockers, and auto-resolves on replacement/counsel override', async () => {
    // 1. Create a TV Show Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Cyberpunk Odyssey Series',
        productionCompany: 'Streamline Originals',
        projectType: 'TV Show',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest 2-scene script:
    //    Scene 1: Graphic Prop ("Titan Industrial Hazard Placard") + Music Track ("Nocturne of the Wild")
    //    Scene 2: Living Public Figure ("Elena Vance")
    const scriptText = `
INT. CYBERPUNK WAREHOUSE - NIGHT
Jordan inspects the high-voltage breaker under the Titan Industrial Hazard Placard.
In the background, the atmospheric synth melody of Nocturne of the Wild plays.

INT. KEYNOTE AUDITORIUM - DAY
Elena Vance addresses the audience on next-generation energy distribution.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const titanProp = entities.find((e) => e.canonicalName.includes('Titan'));
    const nocturneMusic = entities.find((e) => e.canonicalName.includes('Nocturne'));
    const elenaFigure = entities.find((e) => e.canonicalName.includes('Elena'));

    expect(titanProp).toBeDefined();
    expect(nocturneMusic).toBeDefined();
    expect(elenaFigure).toBeDefined();

    // 3. Evaluate clearance for entities -> Dispatches department actions
    await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [titanProp!.id, nocturneMusic!.id, elenaFigure!.id] });

    // 4. Verify Art Department Action created for Titan Prop
    const artActions = await request(app).get(`/api/projects/${projectId}/actions?department=ART_DEPT`);
    expect(artActions.status).toBe(200);
    expect(artActions.body.length).toBeGreaterThanOrEqual(1);
    expect(artActions.body[0].actionType).toBe('ART_DEPT_REPLACEMENT');
    const artActionId = artActions.body[0].id;

    // 5. Verify Legal Counsel Action created for Music
    const legalActions = await request(app).get(`/api/projects/${projectId}/actions?department=LEGAL_COUNSEL`);
    expect(legalActions.status).toBe(200);
    expect(legalActions.body.length).toBeGreaterThanOrEqual(1);
    const musicAction = legalActions.body.find((a: any) => a.actionType === 'LEGAL_COUNSEL_RELEASE');
    expect(musicAction).toBeDefined();

    // 6. Evaluate Scene 1 Readiness -> Blocked (RED) -> Creates Production Management Action & Alert
    const scenes = await sceneRepo.getScenesByProject(projectId);
    const scene1 = scenes[0];
    await request(app).post(`/api/projects/${projectId}/scenes/${scene1.id}/readiness/evaluate`);
    await request(app).post(`/api/projects/${projectId}/actions/sync`);

    const prodActions = await request(app).get(`/api/projects/${projectId}/actions?department=PRODUCTION_MGMT`);
    expect(prodActions.status).toBe(200);
    expect(prodActions.body.length).toBeGreaterThanOrEqual(1);
    expect(prodActions.body[0].priority).toBe('CRITICAL');

    const notifs = await request(app).get(`/api/projects/${projectId}/notifications`);
    expect(notifs.status).toBe(200);
    expect(notifs.body.some((n: any) => n.severity === 'CRITICAL')).toBe(true);

    // 7. Auto-Resolve Art Dept Action by attaching Replacement Card
    await request(app)
      .post(`/api/projects/${projectId}/replacements`)
      .send({
        canonicalEntityId: titanProp!.id,
        fictionalBrandName: 'Aegis Dynamic Warning Sign',
        visualDescription: 'Original fictional caution placard',
        creativeRationale: 'Custom designed in-house prop graphic',
      });

    await request(app).post(`/api/projects/${projectId}/actions/sync`);

    const updatedArt = await actionNotificationRepo.getActionById(projectId, artActionId);
    expect(updatedArt?.status).toBe('RESOLVED');

    // 8. Auto-Resolve Legal Action by submitting Signed Counsel Override
    await request(app)
      .post(`/api/projects/${projectId}/entities/${nocturneMusic!.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Synchronization license fully executed with publisher.',
        counselName: 'Jane Sterling, Lead Production Counsel',
      });

    await request(app).post(`/api/projects/${projectId}/actions/sync`);

    const updatedLegal = await actionNotificationRepo.getActionById(projectId, musicAction.id);
    expect(updatedLegal?.status).toBe('RESOLVED');
  });
});
