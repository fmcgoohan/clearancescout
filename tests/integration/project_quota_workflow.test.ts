import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';

describe('Integration: Project Research Limits Lifecycle & Exhaustion Workflow (Feature 015)', () => {
  it('enforces live quota decrementing, quota isolation across projects, and 429 exhaustion banner in CLOUD_MODE', async () => {
    // 1. Create two isolated projects in CLOUD_MODE
    const proj1Res = await request(app)
      .post('/api/projects')
      .set('x-demo-token', 'test-token')
      .send({
        title: 'Project Alpha (Quota Testing)',
        productionCompany: 'Alpha Studios',
        scriptVersion: 'v1.0',
        executionMode: 'CLOUD_MODE',
      });
    expect(proj1Res.status).toBe(201);
    const proj1Id = proj1Res.body.id;

    const proj2Res = await request(app)
      .post('/api/projects')
      .set('x-demo-token', 'test-token')
      .send({
        title: 'Project Beta (Quota Testing)',
        productionCompany: 'Beta Pictures',
        scriptVersion: 'v1.0',
        executionMode: 'CLOUD_MODE',
      });
    expect(proj2Res.status).toBe(201);
    const proj2Id = proj2Res.body.id;

    // Verify initial quota states
    const quota1Init = await projectRepo.getLiveQuota(proj1Id);
    const quota2Init = await projectRepo.getLiveQuota(proj2Id);
    expect(quota1Init.limit).toBe(25);
    expect(quota1Init.used).toBe(0);
    expect(quota1Init.remaining).toBe(25);
    expect(quota2Init.remaining).toBe(25);

    // 2. Consume quota on Project Alpha
    const consumeRes = await projectRepo.consumeLiveQuota(proj1Id, 5);
    expect(consumeRes.success).toBe(true);
    expect(consumeRes.quota.used).toBe(5);
    expect(consumeRes.quota.remaining).toBe(20);

    // Verify Project Beta quota was unaffected (isolation invariant)
    const quota2After = await projectRepo.getLiveQuota(proj2Id);
    expect(quota2After.used).toBe(0);
    expect(quota2After.remaining).toBe(25);

    // 3. Add an entity to Project Alpha and exhaust remaining quota
    const entRes = await request(app)
      .post(`/api/projects/${proj1Id}/entities`)
      .set('x-demo-token', 'test-token')
      .send({
        canonicalName: 'Neon Beverage',
        entityCategory: 'PRODUCT',
        description: 'Test product for quota',
      });
    const entityId = entRes.body.id;

    // Consume remaining 20 quota units on Project Alpha
    await projectRepo.consumeLiveQuota(proj1Id, 20);
    const quota1Exhausted = await projectRepo.getLiveQuota(proj1Id);
    expect(quota1Exhausted.remaining).toBe(0);

    // 4. Trigger evaluation on exhausted Project Alpha -> 429 Too Many Requests
    const evalRes = await request(app)
      .post(`/api/projects/${proj1Id}/clearance/evaluate`)
      .set('x-demo-token', 'test-token')
      .send({ canonicalEntityIds: [entityId] });

    expect(evalRes.status).toBe(429);
    expect(evalRes.body.error).toContain('Live research quota exceeded for this project (0/25 remaining)');
    expect(evalRes.body.quota.remaining).toBe(0);

    // 5. Trigger replacement on exhausted Project Alpha -> 429 Too Many Requests
    const repRes = await request(app)
      .post(`/api/projects/${proj1Id}/replacements/generate`)
      .set('x-demo-token', 'test-token')
      .send({ canonicalEntityId: entityId, eraAesthetic: 'Modern Cinematic' });

    expect(repRes.status).toBe(429);
    expect(repRes.body.error).toContain('Live research quota exceeded for this project');
  });
});
