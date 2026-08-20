import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Clearance Binder Compilation & Export', () => {
  let projectId: string;
  let entityId: string;

  beforeEach(async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Binder Export Feature Film',
        productionCompany: 'Universal Clearance Corp',
        scriptVersion: 'v1.0',
        executionMode: 'TEST_MODE',
      });
    projectId = projRes.body.id;

    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: 'INT. OFFICE - DAY\nCharacter holds an Apple iPad and a can of Coca-Cola.',
        format: 'PLAINTEXT',
      });
    expect(scriptRes.status).toBe(200);

    const entities =
      scriptRes.body.entities ||
      (await request(app).get(`/api/projects/${projectId}/entities`)).body ||
      [];
    const entityList = Array.isArray(entities) ? entities : (entities as any).entities || [];
    entityId = entityList[0]?.id;

    if (entityId) {
      await request(app)
        .post(`/api/projects/${projectId}/clearance/evaluate`)
        .send({ canonicalEntityIds: [entityId] });
    }
  });

  it('should compile, hash, and export a complete project clearance binder with SHA-256 integrity digest and mixed provenance summary', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/binder/export`);

    expect(res.status).toBe(200);
    expect(res.body.id).toMatch(/^bnd-/);
    expect(res.body.projectId).toBe(projectId);
    expect(res.body.projectSummary.title).toBe('Binder Export Feature Film');
    expect(res.body.projectSummary.overallReadinessPercentage).toBeDefined();
    expect(res.body.integrityDigest).toBeDefined();
    expect(res.body.integrityDigest.length).toBe(64); // SHA-256 hex string
    expect(res.body.provenanceSummary).toBeDefined();
    expect(res.body.provenanceSummary.dominantProvenance).toBeDefined();
    expect(res.body.scenes.length).toBe(1);
    expect(res.body.sceneReadinessSchedule).toBeDefined();
    expect(res.body.rightsAgreements).toBeDefined();
    expect(res.body.placeholders).toBeDefined();
    expect(res.body.unresolvedActions).toBeDefined();
    expect(res.body.canonicalEntities.length).toBeGreaterThanOrEqual(1);
    expect(res.body.disclaimer).toContain('does NOT render formal legal advice');
  });

  it('should download a formatted Markdown clearance binder with tables and SHA-256 seal', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/binder/markdown`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
    expect(res.text).toContain('# Production Legal Clearance Binder');
    expect(res.text).toContain('Binder Export Feature Film');
    expect(res.text).toContain('Cryptographic Integrity Digest (SHA-256)');
    expect(res.text).toContain('## 1. Executive Clearance & Shooting Readiness Summary');
    expect(res.text).toContain('## 2. Scene-by-Scene Shooting Readiness Schedule');
  });
});
