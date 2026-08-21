import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('Contract: Truthful Demo Provenance Labeling (Feature 021)', () => {
  it('P0-6 & FR-019: fixture and sample ingestion explicitly labels The Neon Horizon (Bundled Fictional Demo)', async () => {
    // 1. Check fixture route
    const fixtureRes = await request(app).get('/api/fixtures/demo-screenplay');
    expect(fixtureRes.status).toBe(200);
    expect(fixtureRes.body.sourceLabel).toBe('The Neon Horizon (Bundled Fictional Demo)');
    expect(fixtureRes.body.sourceType).toBe('DEMO_FIXTURE');

    // 2. Check demo screenplay ingestion
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Demo Provenance Test',
        productionCompany: 'Entrant Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    const demoRes = await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({
        autoEvaluate: true,
        includeSampleRights: true,
        includeSamplePlaceholders: true,
      });

    expect(demoRes.status).toBe(200);
    expect(demoRes.body.provenance).toBe('DEMO_FIXTURE');
    expect(demoRes.body.snapshot).toBeDefined();
    expect(demoRes.body.snapshot.scenes.length).toBeGreaterThan(0);
  });
});
