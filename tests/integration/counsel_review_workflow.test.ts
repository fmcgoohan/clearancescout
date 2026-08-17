import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Integration: Clearance Binder Export & Studio Counsel Review Workflow', () => {
  it('should execute full counsel review workflow: override status, log rationale, emit timeline event, and export signed binder with override history', async () => {
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

    // 4. Counsel Overrides Status to NO_ISSUE_SURFACED
    const overrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${cokeEntity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Executed global product placement integration agreement #PP-2026-PARAMOUNT with brand owner.',
        counselName: 'Morgan Vance, Esq.',
        counselRole: 'Executive Vice President, Production Legal',
      });

    expect(overrideRes.status).toBe(200);
    expect(overrideRes.body.success).toBe(true);
    expect(overrideRes.body.entity.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');
    expect(overrideRes.body.entity.isOverridden).toBe(true);

    // 5. Verify Overrides Query API
    const historyRes = await request(app).get(`/api/projects/${projectId}/entities/${cokeEntity.id}/overrides`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.overrides.length).toBe(1);
    expect(historyRes.body.overrides[0].overrideStatus).toBe('NO_ISSUE_SURFACED');

    // 6. Export Signed Clearance Binder & Verify Overrides History
    const binderRes = await request(app).get(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    expect(binderRes.body.projectSummary.overridesCount).toBe(1);
    expect(binderRes.body.overridesHistory.length).toBe(1);
    expect(binderRes.body.overridesHistory[0].counselName).toBe('Morgan Vance, Esq.');
    expect(binderRes.body.auditSignature).toBeDefined();
    expect(binderRes.body.auditSignature.length).toBe(64);
  });
});
