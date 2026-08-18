import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Side-by-Side Original and Replacement Comparison API', () => {
  it('should reject comparison with 400 if entity has no replacement card', async () => {
    const projRes = await request(app).post('/api/projects').send({
      title: 'No Replacement Project',
      productionCompany: 'Entrant Studios',
      executionMode: 'DEMO_MODE',
    });
    const projectId = projRes.body.id;

    const entRes = await request(app).post(`/api/projects/${projectId}/entities`).send({
      canonicalName: 'Generic Beverage',
      entityCategory: 'BRAND',
    });
    const entityId = entRes.body.id;

    const compRes = await request(app).get(`/api/projects/${projectId}/entities/${entityId}/comparison`);
    expect(compRes.status).toBe(400);
    expect(compRes.body.error).toContain('does not have an attached replacement card');
  });

  it('should return complete side-by-side comparison payload when replacement card exists', async () => {
    const projRes = await request(app).post('/api/projects').send({
      title: 'Comparison Contract Project',
      productionCompany: 'Entrant Studios',
      executionMode: 'DEMO_MODE',
    });
    const projectId = projRes.body.id;

    const entRes = await request(app).post(`/api/projects/${projectId}/entities`).send({
      canonicalName: 'Summit Cola',
      entityCategory: 'BRAND',
      description: 'Refreshing carbonated soft drink on desk',
    });
    const entityId = entRes.body.id;

    // Evaluate clearance
    await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [entityId] });

    // Generate replacement
    const repRes = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({ canonicalEntityId: entityId, eraAesthetic: 'Cyberpunk Neon' });
    expect(repRes.status).toBe(200);

    // Fetch comparison
    const compRes = await request(app).get(`/api/projects/${projectId}/entities/${entityId}/comparison`);
    expect(compRes.status).toBe(200);

    // Original entity assertions
    expect(compRes.body.original).toBeDefined();
    expect(compRes.body.original.canonicalName).toBe('Summit Cola');
    expect(compRes.body.original.entityCategory).toBe('BRAND');
    expect(compRes.body.original.overallClearanceStatus).toBeDefined();
    expect(compRes.body.original.citations.length).toBeGreaterThan(0);

    // Replacement assertions
    expect(compRes.body.replacement).toBeDefined();
    expect(compRes.body.replacement.replacementName).toBeDefined();
    expect(compRes.body.replacement.visualStyle).toBe('Cyberpunk Neon');
    expect(compRes.body.replacement.clearanceStatus).toBeDefined();
    expect(compRes.body.replacement.citations.length).toBeGreaterThan(0);

    // Attempt history assertions
    expect(compRes.body.attemptHistory).toBeDefined();
    expect(Array.isArray(compRes.body.attemptHistory)).toBe(true);
    expect(compRes.body.attemptHistory.length).toBeGreaterThanOrEqual(1);
    expect(compRes.body.attemptHistory[0].attemptNumber).toBe(1);
    expect(compRes.body.attemptHistory[0].candidateName).toBeDefined();
  });

  it('should be strictly read-only and preserve counsel overrides without mutations', async () => {
    const projRes = await request(app).post('/api/projects').send({
      title: 'Override Comparison Project',
      productionCompany: 'Entrant Studios',
      executionMode: 'DEMO_MODE',
    });
    const projectId = projRes.body.id;

    const entRes = await request(app).post(`/api/projects/${projectId}/entities`).send({
      canonicalName: 'Vintage Radio Prop',
      entityCategory: 'GRAPHIC_PROP',
    });
    const entityId = entRes.body.id;

    // Generate replacement
    await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({ canonicalEntityId: entityId });

    // Record counsel override
    await request(app)
      .post(`/api/projects/${projectId}/entities/${entityId}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Prop custom fabricated in-house by studio prop shop.',
        counselName: 'Jane Doe, Esq.',
      });

    // Fetch comparison
    const compRes = await request(app).get(`/api/projects/${projectId}/entities/${entityId}/comparison`);
    expect(compRes.status).toBe(200);
    expect(compRes.body.original.isOverridden).toBe(true);
    expect(compRes.body.original.latestOverride.counselName).toBe('Jane Doe, Esq.');
    expect(compRes.body.original.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');
  });
});
