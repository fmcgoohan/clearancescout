import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';
import { actionNotificationRepo } from '../../server/repositories/ActionNotificationRepo.js';

describe('Contract & Invariants: Ingestion Completion Barrier & Query Synchronization (T065-T071)', () => {

  it('proves HTTP ingestion success returns ONLY when snapshot, scenes, entities, actions, and readiness are 100% queryable', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Completion Barrier Test',
        productionCompany: 'Entrant Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // Ingest bundled demo with autoEvaluate
    const ingestRes = await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({ autoEvaluate: true, includeSampleRights: true, includeSamplePlaceholders: true });

    expect(ingestRes.status).toBe(200);
    expect(ingestRes.body.scenesCount).toBe(3);
    expect(ingestRes.body.entitiesCount).toBe(7);

    // Invariant: IMMEDIATELY after HTTP success, all sub-resource GET endpoints must reflect the committed snapshot
    const [scenesRes, entitiesRes, actionsRes, readinessRes, snapshotRes, projectRes] = await Promise.all([
      request(app).get(`/api/projects/${projectId}/scenes`),
      request(app).get(`/api/projects/${projectId}/entities`),
      request(app).get(`/api/projects/${projectId}/actions?status=OPEN`),
      request(app).get(`/api/projects/${projectId}/scenes/readiness`),
      request(app).get(`/api/projects/${projectId}/snapshot`),
      request(app).get(`/api/projects/${projectId}`),
    ]);

    expect(scenesRes.status).toBe(200);
    expect(scenesRes.body.length).toBe(3);

    expect(entitiesRes.status).toBe(200);
    expect(entitiesRes.body.length).toBe(7);
    const entityNames = entitiesRes.body.map((e: any) => e.canonicalName);
    expect(entityNames).toContain('Elena Vance');
    expect(entityNames).toContain('AeroTech Prism Laptop');
    expect(entityNames).toContain('Summit Cola');
    expect(entityNames).toContain('Midtown Spire Tower');
    expect(entityNames).toContain('Nocturne of the Wild');
    expect(entityNames).toContain('Veloce GT');
    expect(entityNames).toContain('Titan Industrial Hazard Placard');

    expect(actionsRes.status).toBe(200);
    expect(actionsRes.body.length).toBeGreaterThanOrEqual(2);

    expect(readinessRes.status).toBe(200);
    expect(readinessRes.body.totalScenes).toBe(3);

    expect(snapshotRes.status).toBe(200);
    expect(snapshotRes.body.scenes.length).toBe(3);
    expect(snapshotRes.body.entities.length).toBe(7);
    expect(snapshotRes.body.project.totalActiveEntities).toBe(7);

    expect(projectRes.status).toBe(200);
    expect(projectRes.body.entityCount).toBe(7);
  });

  it('proves replacement screenplay ingestion immediately updates all queries atomically upon HTTP success', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Replace Sync Test',
        productionCompany: 'Entrant Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // 1. Initial Load
    await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({ autoEvaluate: false });

    // 2. Replace with same demo screenplay
    const replaceRes = await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({ autoEvaluate: false });

    expect(replaceRes.status).toBe(200);

    // Invariant: Immediately verify that the workspace is fully synchronized via parallel HTTP GETs
    const [scenesRes, entitiesRes, actionsRes, readinessRes, snapshotRes, projectRes] = await Promise.all([
      request(app).get(`/api/projects/${projectId}/scenes`),
      request(app).get(`/api/projects/${projectId}/entities`),
      request(app).get(`/api/projects/${projectId}/actions?status=OPEN`),
      request(app).get(`/api/projects/${projectId}/scenes/readiness`),
      request(app).get(`/api/projects/${projectId}/snapshot`),
      request(app).get(`/api/projects/${projectId}`),
    ]);

    expect(scenesRes.status).toBe(200);
    expect(scenesRes.body.length).toBe(3);

    expect(entitiesRes.status).toBe(200);
    expect(entitiesRes.body.length).toBe(7);
    const entityNames = entitiesRes.body.map((e: any) => e.canonicalName);
    expect(entityNames).toContain('Elena Vance');
    expect(entityNames).toContain('AeroTech Prism Laptop');
    expect(entityNames).toContain('Summit Cola');
    expect(entityNames).toContain('Midtown Spire Tower');
    expect(entityNames).toContain('Nocturne of the Wild');
    expect(entityNames).toContain('Veloce GT');
    expect(entityNames).toContain('Titan Industrial Hazard Placard');

    expect(actionsRes.status).toBe(200);
    expect(actionsRes.body.length).toBe(7);

    expect(readinessRes.status).toBe(200);
    expect(readinessRes.body.totalScenes).toBe(3);

    expect(snapshotRes.status).toBe(200);
    expect(snapshotRes.body.scenes.length).toBe(3);
    expect(snapshotRes.body.entities.length).toBe(7);
    expect(snapshotRes.body.actionsSummary.openActions).toBe(7);

    expect(projectRes.status).toBe(200);
    expect(projectRes.body.entityCount).toBe(7);
  });

  it('proves GET /api/projects/:id/actions, GET /snapshot, and GET /scenes/readiness are strictly side-effect free', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Side Effect Free GET Test',
        productionCompany: 'Entrant Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({ autoEvaluate: false });

    const beforeEntities = await entityRepo.getEntitiesByProject(projectId);
    const beforeActions = await actionNotificationRepo.getActionsByProject(projectId);
    const beforeScenes = await sceneRepo.getScenesByProject(projectId);
    const beforeSnapshot = await projectRepo.getProjectSnapshot(projectId);

    // Call GET endpoints multiple times
    for (let i = 0; i < 5; i++) {
      const aRes = await request(app).get(`/api/projects/${projectId}/actions`);
      expect(aRes.status).toBe(200);
      const openRes = await request(app).get(`/api/projects/${projectId}/actions?status=OPEN`);
      expect(openRes.status).toBe(200);
      const snapRes = await request(app).get(`/api/projects/${projectId}/snapshot`);
      expect(snapRes.status).toBe(200);
      const readRes = await request(app).get(`/api/projects/${projectId}/scenes/readiness`);
      expect(readRes.status).toBe(200);
    }

    const afterEntities = await entityRepo.getEntitiesByProject(projectId);
    const afterActions = await actionNotificationRepo.getActionsByProject(projectId);
    const afterScenes = await sceneRepo.getScenesByProject(projectId);
    const afterSnapshot = await projectRepo.getProjectSnapshot(projectId);

    expect(afterEntities.length).toBe(beforeEntities.length);
    expect(afterEntities.map((e) => e.id)).toEqual(beforeEntities.map((e) => e.id));
    expect(afterActions.length).toBe(beforeActions.length);
    expect(afterScenes.length).toBe(beforeScenes.length);
    expect(afterSnapshot?.project.totalActiveEntities).toBe(beforeSnapshot?.project.totalActiveEntities);
  });

  it('proves full replace sequence produces consistent 3 scenes, 7 entities, and 7 department tasks without secondary interaction', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Replace Deterministic Invariant Test',
        productionCompany: 'Entrant Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // 1. Initial Ingest
    await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({ autoEvaluate: false });

    // 2. Replace with same demo script
    const replaceRes = await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({ autoEvaluate: false });
    expect(replaceRes.status).toBe(200);

    // 3. Immediately query snapshot & open actions
    const snapshot = await projectRepo.getProjectSnapshot(projectId);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.scenes.length).toBe(3);
    expect(snapshot!.entities.length).toBe(7);
    expect(snapshot!.entities.map((e) => e.canonicalName)).toContain('Elena Vance');

    const openActions = await actionNotificationRepo.getActionsByProject(projectId, { status: 'OPEN' });
    expect(openActions.length).toBe(7);
  });
});
