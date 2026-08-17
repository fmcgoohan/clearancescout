import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Clearance Binder Compilation & Export', () => {
  let projectId: string;

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

    await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: 'INT. OFFICE - DAY\nCharacter holds an Apple iPad and a can of Coca-Cola.',
        format: 'PLAINTEXT',
      });
  });

  it('should compile, sign, and export a complete project clearance binder', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/binder/export`);

    expect(res.status).toBe(200);
    expect(res.body.id).toMatch(/^bnd-/);
    expect(res.body.projectId).toBe(projectId);
    expect(res.body.projectSummary.title).toBe('Binder Export Feature Film');
    expect(res.body.auditSignature).toBeDefined();
    expect(res.body.auditSignature.length).toBe(64); // SHA-256 hex string
    expect(res.body.scenes.length).toBe(1);
    expect(res.body.canonicalEntities.length).toBeGreaterThanOrEqual(1);
    expect(res.body.disclaimer).toContain('does NOT render formal legal advice');
  });
});
