import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Integration: Side-by-Side Original and Replacement Comparison Workflow', () => {
  it('should support side-by-side comparison, attempt history, override reflection, and binder print export', async () => {
    // 1. Create project
    const projRes = await request(app).post('/api/projects').send({
      title: 'Comparison Integration Project',
      productionCompany: 'Entrant Studios',
      executionMode: 'DEMO_MODE',
    });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest screenplay
    const fixtureRes = await request(app).get('/api/fixtures/demo-screenplay');
    const parseRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: fixtureRes.body.scriptText, format: 'PLAINTEXT' });
    expect(parseRes.status).toBe(200);

    const initialEntities = parseRes.body.entities;
    const summitEntity = initialEntities.find((e: any) => e.canonicalName === 'Summit Cola');
    expect(summitEntity).toBeDefined();

    // 3. Attempt comparison before replacement generation -> returns 400
    const prematureCompRes = await request(app)
      .get(`/api/projects/${projectId}/entities/${summitEntity.id}/comparison`);
    expect(prematureCompRes.status).toBe(400);
    expect(prematureCompRes.body.error).toContain('does not have an attached replacement card');

    // 4. Evaluate clearance
    await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [summitEntity.id] });

    // 5. Generate replacement card
    const repRes = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({ canonicalEntityId: summitEntity.id, eraAesthetic: 'Retro 80s Synthwave' });
    expect(repRes.status).toBe(200);

    // 6. Fetch full side-by-side comparison
    const compRes = await request(app)
      .get(`/api/projects/${projectId}/entities/${summitEntity.id}/comparison`);
    expect(compRes.status).toBe(200);
    expect(compRes.body.projectId).toBe(projectId);

    // Original assertions
    expect(compRes.body.original.id).toBe(summitEntity.id);
    expect(compRes.body.original.canonicalName).toBe('Summit Cola');
    expect(compRes.body.original.entityCategory).toBe('BRAND');
    expect(compRes.body.original.citations.length).toBeGreaterThan(0);

    // Replacement assertions
    expect(compRes.body.replacement.replacementName).toBeDefined();
    expect(compRes.body.replacement.visualStyle).toBe('Retro 80s Synthwave');
    expect(compRes.body.replacement.citations.length).toBeGreaterThan(0);

    // Attempt history assertions
    expect(compRes.body.attemptHistory.length).toBeGreaterThanOrEqual(1);
    expect(compRes.body.attemptHistory[0].candidateName).toBeDefined();

    // 7. Record Counsel Override and verify reflection in comparison
    await request(app)
      .post(`/api/projects/${projectId}/entities/${summitEntity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Studio executive approved commercial placement release.',
        counselName: 'Jane Doe, Esq.',
      });

    const compResAfterOverride = await request(app)
      .get(`/api/projects/${projectId}/entities/${summitEntity.id}/comparison`);
    expect(compResAfterOverride.status).toBe(200);
    expect(compResAfterOverride.body.original.isOverridden).toBe(true);
    expect(compResAfterOverride.body.original.latestOverride.counselName).toBe('Jane Doe, Esq.');
    expect(compResAfterOverride.body.original.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');

    // 8. Export Clearance Binder and verify replacement catalog integration
    const binderRes = await request(app).get(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    expect(binderRes.body.integrityDigest).toHaveLength(64);
    expect(binderRes.body.replacementCatalog.length).toBeGreaterThanOrEqual(1);
    expect(binderRes.body.replacementCatalog[0].targetEntityName).toBe('Summit Cola');
  });
});
