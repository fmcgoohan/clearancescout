import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Integration: Clearance Binder Export & Studio Counsel Review Workflow', () => {
  it('should execute full counsel review workflow: scene override isolation, hierarchical resolution, anti-overwrite protection, and export binder with mixed provenance summary', async () => {
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

    // 2. Ingest Multi-Scene Script
    const scriptText = `
INT. RESTAURANT - NIGHT
Jordan drinks Coca-Cola while listening to Bohemian Rhapsody on the speaker.

EXT. ALLEY - NIGHT
Alex drinks Coca-Cola while checking a Rolex Submariner.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });

    expect(scriptRes.status).toBe(200);
    const cokeEntity = scriptRes.body.entities.find((e: any) => e.canonicalName.toLowerCase().includes('coca-cola'));
    expect(cokeEntity).toBeDefined();

    const scenesRes = await request(app).get(`/api/projects/${projectId}/scenes`);
    expect(scenesRes.status).toBe(200);
    const scene1 = scenesRes.body.find((s: any) => s.sceneNumber === 1);
    expect(scene1).toBeDefined();

    // 3. Ground risk evaluation (baseline: ACTION_REQUIRED)
    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [cokeEntity.id] });

    expect(evalRes.status).toBe(200);
    expect(evalRes.body.assessments[0].riskStatus).toBe('ACTION_REQUIRED');
    expect(evalRes.body.assessments[0].provenance).toBe('DEMO_FIXTURE');

    // 4. Test Scene-Specific Override Isolation (with NO prior canonical override)
    const scene1OverrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${cokeEntity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        sceneId: scene1.id,
        rationale: 'Scene 1 featured product placement permitted under agreement #PP-2026-PARAMOUNT.',
        counselName: 'Jane Doe, Esq.',
        counselRole: 'Executive Vice President, Production Legal',
      });

    expect(scene1OverrideRes.status).toBe(200);
    expect(scene1OverrideRes.body.success).toBe(true);
    // Invariant: Canonical entity state must NOT be mutated by scene-specific override
    expect(scene1OverrideRes.body.entity.isOverridden).toBe(false);
    expect(scene1OverrideRes.body.entity.overallClearanceStatus).toBe('ACTION_REQUIRED');

    // 5. Invariant Test: Batch re-evaluation must retain baseline on canonical entity and preserve scene override in repo
    const reEvalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [cokeEntity.id] });
    expect(reEvalRes.status).toBe(200);

    const entitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    expect(entitiesRes.status).toBe(200);
    const refreshedCoke = entitiesRes.body.find((e: any) => e.id === cokeEntity.id);
    expect(refreshedCoke.overallClearanceStatus).toBe('ACTION_REQUIRED');
    expect(refreshedCoke.isOverridden).toBe(false);

    // 6. Verify Overrides Query API
    const historyRes = await request(app).get(`/api/projects/${projectId}/entities/${cokeEntity.id}/overrides`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.overrides.length).toBe(1);
    expect(historyRes.body.overrides[0].overrideStatus).toBe('NO_ISSUE_SURFACED');
    expect(historyRes.body.overrides[0].sceneId).toBe(scene1.id);
    expect(historyRes.body.overrides[0].counselName).toBe('Jane Doe, Esq.');

    // 7. Export Signed Clearance Binder & Verify Provenance Summary & Scene Effective Statuses
    const binderRes = await request(app).get(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    expect(binderRes.body.projectSummary.overridesCount).toBe(1);
    expect(binderRes.body.overridesHistory.length).toBe(1);
    expect(binderRes.body.overridesHistory[0].counselName).toBe('Jane Doe, Esq.');
    expect(binderRes.body.integrityDigest).toBeDefined();
    expect(binderRes.body.integrityDigest.length).toBe(64);
    expect(binderRes.body.provenanceSummary).toBeDefined();
    expect(binderRes.body.provenanceSummary.demoCount).toBeGreaterThanOrEqual(1);

    // Verify scene 1 occurrence has effectiveStatus: 'NO_ISSUE_SURFACED' while scene 2 has 'ACTION_REQUIRED'
    const binderScene1 = binderRes.body.scenes.find((s: any) => s.sceneNumber === 1);
    const binderScene2 = binderRes.body.scenes.find((s: any) => s.sceneNumber === 2);
    expect(binderScene1).toBeDefined();
    expect(binderScene2).toBeDefined();
    const cokeOccScene1 = binderScene1.occurrences.find((o: any) => o.canonicalEntityId === cokeEntity.id);
    const cokeOccScene2 = binderScene2.occurrences.find((o: any) => o.canonicalEntityId === cokeEntity.id);
    expect(cokeOccScene1.effectiveStatus).toBe('NO_ISSUE_SURFACED');
    expect(cokeOccScene2.effectiveStatus).toBe('ACTION_REQUIRED');
  });
});
