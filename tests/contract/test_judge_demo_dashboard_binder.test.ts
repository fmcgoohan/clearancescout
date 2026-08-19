import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Feature 017 Populated Operations Dashboard & Legal Clearance Binder after Demo Ingest', () => {
  it('should immediately return populated dashboard KPIs and audit-grade binder with SHA-256 digest following 1-click demo load', async () => {
    // 1. Create project in DEMO_MODE
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Cyberpunk Studio Demo',
        productionCompany: 'Entrant Media Labs',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Execute 1-Click Demo Ingestion & Auto-Evaluation
    const demoRes = await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({
        autoEvaluate: true,
        includeSampleRights: true,
        includeSamplePlaceholders: true,
      });
    expect(demoRes.status).toBe(200);

    // 3. Verify Populated Operations Dashboard (Phase 9)
    const dashRes = await request(app).get(`/api/projects/${projectId}/dashboard`);
    expect(dashRes.status).toBe(200);
    const dashboard = dashRes.body;

    expect(dashboard.projectId).toBe(projectId);
    expect(dashboard.projectTitle).toBe('Cyberpunk Studio Demo');
    expect(dashboard.projectType).toBe('Movie');
    expect(dashboard.kpis.readinessPercentage).toBeGreaterThanOrEqual(25);
    expect(dashboard.kpis.totalScenes).toBeGreaterThanOrEqual(3);
    expect(dashboard.activePlaceholders.length).toBeGreaterThanOrEqual(1);
    expect(dashboard.departmentActionsSummary).toBeDefined();

    // 4. Verify Extended Legal Clearance Binder Export (Phase 10)
    const binderRes = await request(app).post(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    const binder = binderRes.body;

    expect(binder.id).toMatch(/^bnd-/);
    expect(binder.projectId).toBe(projectId);
    expect(binder.integrityDigest).toBeDefined();
    expect(binder.integrityDigest.length).toBe(64);
    expect(binder.rightsAgreements.length).toBeGreaterThanOrEqual(1);
    expect(binder.placeholders.length).toBeGreaterThanOrEqual(1);
    expect(binder.sceneReadinessSchedule.length).toBeGreaterThanOrEqual(3);
    expect(binder.provenanceSummary).toBeDefined();
    expect(binder.provenanceSummary.dominantProvenance).toBe('DEMO_FIXTURE');

    // 5. Verify Downloadable Markdown Route
    const mdRes = await request(app).get(`/api/projects/${projectId}/binder/markdown`);
    expect(mdRes.status).toBe(200);
    expect(mdRes.headers['content-type']).toContain('text/markdown');
    expect(mdRes.text).toContain('# Production Legal Clearance Binder');
    expect(mdRes.text).toContain(binder.integrityDigest);
  });
});
