import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Studio Legal Counsel Override API & Hierarchical Invariant', () => {
  it('should record an authoritative legal counsel override and strictly protect it against automated re-evaluation overwrite', async () => {
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

    // 3. Reject override without counsel name
    const noNameRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Valid rationale here',
        counselName: '   ',
      });
    expect(noNameRes.status).toBe(400);

    // 4. Reject override without rationale
    const invalidRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: '   ',
        counselName: 'Jane Doe, Esq.',
      });
    expect(invalidRes.status).toBe(400);

    // 5. Submit valid canonical counsel override
    const overrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Direct paid product placement contract executed under #PP-2026-WB.',
        counselName: 'Jane Doe, Esq.',
        counselRole: 'Senior Vice President, Production Legal',
      });
    expect(overrideRes.status).toBe(200);
    expect(overrideRes.body.success).toBe(true);
    expect(overrideRes.body.override.overrideStatus).toBe('NO_ISSUE_SURFACED');
    expect(overrideRes.body.override.rationale).toBe('Direct paid product placement contract executed under #PP-2026-WB.');
    expect(overrideRes.body.entity.isOverridden).toBe(true);
    expect(overrideRes.body.entity.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');

    // 6. Invariant check: Automated batch re-evaluation MUST NOT overwrite active counsel override
    const reEvalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [entity.id] });
    expect(reEvalRes.status).toBe(200);

    const entitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    expect(entitiesRes.status).toBe(200);
    const updatedEntity = entitiesRes.body.find((e: any) => e.id === entity.id);
    expect(updatedEntity.isOverridden).toBe(true);
    expect(updatedEntity.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');

    // 7. Submit a scene-specific override exception
    const sceneOverrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entity.id}/override`)
      .send({
        overrideStatus: 'REVIEW_RECOMMENDED',
        sceneId: 'scene-1',
        rationale: 'Special review needed for scene 1 brand placement lighting.',
        counselName: 'Jane Doe, Esq.',
        counselRole: 'Senior Vice President, Production Legal',
      });
    expect(sceneOverrideRes.status).toBe(200);
    expect(sceneOverrideRes.body.override.sceneId).toBe('scene-1');
    expect(sceneOverrideRes.body.override.overrideStatus).toBe('REVIEW_RECOMMENDED');

    // 8. Get override audit history
    const historyRes = await request(app).get(`/api/projects/${projectId}/entities/${entity.id}/overrides`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.overrides.length).toBe(2);
  });
});
