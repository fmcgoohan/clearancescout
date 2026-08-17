import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Studio Legal Counsel Override API', () => {
  it('should record an authoritative legal counsel override with mandatory rationale', async () => {
    // 1. Create Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Studio Legal Review Project',
        productionCompany: 'Warner Bros. Discovery',
        scriptVersion: 'v2.0-CounselDraft',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest Script
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: 'INT. BAR - NIGHT\nJohn sips a cold Coca-Cola at the bar.',
        format: 'PLAINTEXT',
      });
    expect(scriptRes.status).toBe(200);
    const entity = scriptRes.body.entities[0];
    expect(entity).toBeDefined();

    // 3. Reject override without rationale
    const invalidRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: '   ',
        counselName: 'Morgan Vance, Esq.',
      });
    expect(invalidRes.status).toBe(400);

    // 4. Submit valid counsel override
    const overrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Direct paid product placement contract executed under #PP-2026-WB.',
        counselName: 'Morgan Vance, Esq.',
        counselRole: 'Senior Vice President, Production Legal',
      });
    expect(overrideRes.status).toBe(200);
    expect(overrideRes.body.success).toBe(true);
    expect(overrideRes.body.override.overrideStatus).toBe('NO_ISSUE_SURFACED');
    expect(overrideRes.body.override.rationale).toBe('Direct paid product placement contract executed under #PP-2026-WB.');
    expect(overrideRes.body.entity.isOverridden).toBe(true);
    expect(overrideRes.body.entity.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');

    // 5. Get override audit history
    const historyRes = await request(app).get(`/api/projects/${projectId}/entities/${entity.id}/overrides`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.overrides.length).toBe(1);
    expect(historyRes.body.overrides[0].counselName).toBe('Morgan Vance, Esq.');
  });
});
