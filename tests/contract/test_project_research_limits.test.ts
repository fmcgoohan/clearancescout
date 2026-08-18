import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';

describe('Contract: Per-Project Research Limits & Quota Isolation (Feature 015)', () => {
  it('FR-001 & FR-002: initializes project with default liveQuotaLimit = 25 and liveQuotaUsed = 0', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({
        title: 'Quota Tracking Test Project',
        productionCompany: 'Quota Labs',
        scriptVersion: 'v1.0',
        executionMode: 'CLOUD_MODE',
      });

    expect(res.status).toBe(201);
    expect(res.body.liveQuotaLimit).toBe(25);
    expect(res.body.liveQuotaUsed).toBe(0);
    expect(res.body.liveQuotaRemaining).toBe(25);

    const getRes = await request(app).get(`/api/projects/${res.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.liveQuotaLimit).toBe(25);
    expect(getRes.body.liveQuotaUsed).toBe(0);
    expect(getRes.body.liveQuotaRemaining).toBe(25);
  });

  it('FR-004 & FR-005: returns HTTP 429 when live quota is exhausted in CLOUD_MODE', async () => {
    // 1. Create CLOUD_MODE project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Exhausted Quota Project',
        productionCompany: 'Limits Studio',
        scriptVersion: 'v1.0',
        executionMode: 'CLOUD_MODE',
      });
    const projectId = projRes.body.id;

    // 2. Add entity
    const addRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Exhaustion Brand',
        entityCategory: 'BRAND',
        description: 'Brand used to test quota exhaustion',
      });
    const entityId = addRes.body.id;

    // 3. Manually consume remaining quota in repo
    const consumeRes = await projectRepo.consumeLiveQuota(projectId, 25);
    expect(consumeRes.success).toBe(true);
    expect(consumeRes.quota.remaining).toBe(0);

    // 4. Trigger clearance evaluation; verify 429 Too Many Requests
    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [entityId] });

    expect(evalRes.status).toBe(429);
    expect(evalRes.body.error).toContain('Live research quota exceeded for this project');
    expect(evalRes.body.quota.remaining).toBe(0);
  });

  it('FR-006: TEST_MODE and DEMO_MODE evaluations never consume live quota', async () => {
    // 1. Create DEMO_MODE project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Demo Mode Quota Bypass Project',
        productionCompany: 'Demo Studio',
        scriptVersion: 'v1.0',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // 2. Ingest script and evaluate
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: 'INT. OFFICE - DAY\nAlex drinks Summit Cola.' });
    const entityId = scriptRes.body.entities[0].id;

    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [entityId] });

    expect(evalRes.status).toBe(200);

    // 3. Check quota in repo; must remain 0 used and 25 remaining
    const quota = await projectRepo.getLiveQuota(projectId);
    expect(quota.used).toBe(0);
    expect(quota.remaining).toBe(25);
  });
});
