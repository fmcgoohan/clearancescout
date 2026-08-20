import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { sceneReadinessEngine } from '../../server/workflows/sceneReadinessEngine.js';

describe('Feature 019: Full End-to-End Live Runtime & Integrity Workflow Integration', () => {
  let projectId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({
        title: 'Feature 019 Integrity Showcase',
        productionCompany: 'Antigravity Pictures',
        scriptVersion: 'v1.0',
        projectType: 'Movie',
        executionMode: 'TEST_MODE',
      });
    expect(res.status).toBe(201);
    projectId = res.body.id;
  });

  it('executes full lifecycle: multipart upload -> entity detection -> quota management -> clearance evaluation -> fail-closed replacement -> draft replacement', async () => {
    // 1. Health check verification
    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('HEALTHY');

    // 2. Screenplay multipart upload
    const screenplay = `INT. COFFEE SHOP - DAY\n\nALEX drinks Summit Cola while working on an AeroTech Prism Laptop.\n\nEXT. CITY STREET - DAY\n\nAlex accelerates in a Porsche 911.`;
    const uploadRes = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .attach('file', Buffer.from(screenplay), 'the_neon_horizon.fountain');

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.scenesParsed).toBe(2);
    expect(uploadRes.body.canonicalEntitiesExtracted).toBeGreaterThanOrEqual(2);

    // 3. Verify Quota Balance
    const quotaRes = await projectRepo.getLiveQuota(projectId);
    expect(quotaRes.limit).toBe(25);
    expect(quotaRes.remaining).toBe(25);

    // 4. Evaluate Clearance for detected entities
    const entities = await entityRepo.getEntitiesByProject(projectId);
    expect(entities.length).toBeGreaterThanOrEqual(2);

    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityId: entities[0].id });

    expect(evalRes.status).toBe(200);
    expect(evalRes.body.assessment).toBeDefined();

    // 5. Evaluate Scene Shooting Readiness
    const scenes = await request(app).get(`/api/projects/${projectId}/scenes`);
    expect(scenes.status).toBe(200);
    expect(scenes.body.length).toBe(2);

    const readinessRes = await sceneReadinessEngine.evaluateSceneReadiness(projectId, scenes.body[0].id);
    expect(readinessRes.status).toBeDefined();

    // 6. Draft Re-upload (clean replacement)
    const draft2 = `INT. COFFEE SHOP - DAY\n\nALEX drinks Summit Cola.`;
    const reuploadRes = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .attach('file', Buffer.from(draft2), 'the_neon_horizon_revised.fountain');

    expect(reuploadRes.status).toBe(200);
    expect(reuploadRes.body.scenesParsed).toBe(1);

    const updatedScenes = await request(app).get(`/api/projects/${projectId}/scenes`);
    expect(updatedScenes.body.length).toBe(1);
  });
});
