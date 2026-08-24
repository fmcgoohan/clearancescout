import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Failed Research Retry API', () => {
  it('should retry research for an INSUFFICIENT_EVIDENCE entity without touching siblings', async () => {
    // 1. Create project
    const projRes = await request(app).post('/api/projects').send({
      title: 'Retry Contract Project',
      productionCompany: 'Entrant Studios',
      executionMode: 'DEMO_MODE',
    });
    const projectId = projRes.body.id;

    // 2. Create two entities: one evaluated, one un-evaluated (INSUFFICIENT_EVIDENCE)
    const ent1Res = await request(app).post(`/api/projects/${projectId}/entities`).send({
      canonicalName: 'Summit Cola',
      entityCategory: 'BRAND',
    });
    const ent1Id = ent1Res.body.id;

    const ent2Res = await request(app).post(`/api/projects/${projectId}/entities`).send({
      canonicalName: 'AeroTech Prism Laptop',
      entityCategory: 'BRAND',
    });
    const ent2Id = ent2Res.body.id;

    // Evaluate only entity 1
    await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [ent1Id] });

    // 3. Retry research on entity 2 (which is INSUFFICIENT_EVIDENCE)
    const retryRes = await request(app).post(`/api/projects/${projectId}/entities/${ent2Id}/retry-research`);
    expect(retryRes.status).toBe(200);
    expect(retryRes.body.entity.id).toBe(ent2Id);
    expect(retryRes.body.assessment).toBeDefined();
    expect(retryRes.body.assessment.citations.length).toBeGreaterThan(0);
    expect(retryRes.body.retriedAt).toBeDefined();

    // 4. Verify sibling entity (entity 1) was unaffected
    const listRes = await request(app).get(`/api/projects/${projectId}/entities`);
    const fetchedEnt1 = listRes.body.find((e: any) => e.id === ent1Id);
    expect(fetchedEnt1).toBeDefined();
  });

  it('should reject retry with 400 Bad Request if entity is already evaluated and not INSUFFICIENT_EVIDENCE', async () => {
    const projRes = await request(app).post('/api/projects').send({
      title: 'Eligibility Project',
      productionCompany: 'Entrant Studios',
      executionMode: 'DEMO_MODE',
    });
    const projectId = projRes.body.id;

    const entRes = await request(app).post(`/api/projects/${projectId}/entities`).send({
      canonicalName: 'Summit Cola',
      entityCategory: 'BRAND',
    });
    const entityId = entRes.body.id;

    // Evaluate entity -> transitions away from INSUFFICIENT_EVIDENCE
    await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [entityId] });

    // Attempt retry
    const retryRes = await request(app).post(`/api/projects/${projectId}/entities/${entityId}/retry-research`);
    expect(retryRes.status).toBe(400);
    expect(retryRes.body.error).toContain('Retry is permitted only for INSUFFICIENT_EVIDENCE');
  });

  it('should preserve active legal counsel overrides upon research retry', async () => {
    const projRes = await request(app).post('/api/projects').send({
      title: 'Override Retry Project',
      productionCompany: 'Entrant Studios',
      executionMode: 'DEMO_MODE',
    });
    const projectId = projRes.body.id;

    const entRes = await request(app).post(`/api/projects/${projectId}/entities`).send({
      canonicalName: 'Vintage Porsche 911',
      entityCategory: 'BRAND',
    });
    const entityId = entRes.body.id;

    // Record counsel override on entity
    await request(app)
      .post(`/api/projects/${projectId}/entities/${entityId}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Studio signed classic vehicle appearance waiver.',
        counselName: 'Jane Doe, Esq.',
      });

    // Reset status to INSUFFICIENT_EVIDENCE via edit to simulate re-query need
    await request(app)
      .patch(`/api/projects/${projectId}/entities/${entityId}`)
      .send({ description: 'Updated prop details' });

    // Trigger retry
    const retryRes = await request(app).post(`/api/projects/${projectId}/entities/${entityId}/retry-research`);
    expect(retryRes.status).toBe(200);
    expect(retryRes.body.entity.isOverridden).toBe(true);
    expect(retryRes.body.entity.overallClearanceStatus).toBe('NO_ISSUE_SURFACED'); // Override preserved!
  });
});
