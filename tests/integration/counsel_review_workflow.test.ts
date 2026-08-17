import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Integration: Clearance Binder Export & Studio Counsel Review Workflow', () => {
  it('should execute full counsel review workflow: override status, hierarchical scene resolution, anti-overwrite protection, and export binder with integrity digest', async () => {
    // 1. Create Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Neon Horizon',
        productionCompany: 'Paramount Studios',
        scriptVersion: 'v3.0-ProductionShootingDraft',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest Multi-Category Script
    const scriptText = `
INT. RESTAURANT - NIGHT
Jordan drinks Coca-Cola while listening to Bohemian Rhapsody on the speaker.
Alex wears a Rolex Submariner.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });

    expect(scriptRes.status).toBe(200);
    const cokeEntity = scriptRes.body.entities.find((e: any) => e.canonicalName.toLowerCase().includes('coca-cola'));
    expect(cokeEntity).toBeDefined();

    // 3. Ground risk evaluation (baseline: ACTION_REQUIRED)
    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [cokeEntity.id] });

    expect(evalRes.status).toBe(200);
    expect(evalRes.body.assessments[0].riskStatus).toBe('ACTION_REQUIRED');
    expect(evalRes.body.assessments[0].provenance).toBe('DEMO_FIXTURE');

    // 4. Counsel Overrides Status to NO_ISSUE_SURFACED (Canonical baseline)
    const overrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${cokeEntity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Executed global product placement integration agreement #PP-2026-PARAMOUNT with brand owner.',
        counselName: 'Jane Doe, Esq.',
        counselRole: 'Executive Vice President, Production Legal',
      });

    expect(overrideRes.status).toBe(200);
    expect(overrideRes.body.success).toBe(true);
    expect(overrideRes.body.entity.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');
    expect(overrideRes.body.entity.isOverridden).toBe(true);

    // 5. Invariant Test: Batch re-evaluation must NOT overwrite active counsel override
    const reEvalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [cokeEntity.id] });
    expect(reEvalRes.status).toBe(200);

    const entitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    expect(entitiesRes.status).toBe(200);
    const refreshedCoke = entitiesRes.body.find((e: any) => e.id === cokeEntity.id);
    expect(refreshedCoke.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');
    expect(refreshedCoke.isOverridden).toBe(true);

    // 6. Verify Overrides Query API
    const historyRes = await request(app).get(`/api/projects/${projectId}/entities/${cokeEntity.id}/overrides`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.overrides.length).toBe(1);
    expect(historyRes.body.overrides[0].overrideStatus).toBe('NO_ISSUE_SURFACED');
    expect(historyRes.body.overrides[0].counselName).toBe('Jane Doe, Esq.');

    // 7. Export Signed Clearance Binder & Verify Integrity Digest
    const binderRes = await request(app).get(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    expect(binderRes.body.projectSummary.overridesCount).toBe(1);
    expect(binderRes.body.overridesHistory.length).toBe(1);
    expect(binderRes.body.overridesHistory[0].counselName).toBe('Jane Doe, Esq.');
    expect(binderRes.body.integrityDigest).toBeDefined();
    expect(binderRes.body.integrityDigest.length).toBe(64);
  });
});
