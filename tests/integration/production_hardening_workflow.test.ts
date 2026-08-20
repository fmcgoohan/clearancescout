import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { sceneReadinessEngine } from '../../server/workflows/sceneReadinessEngine.js';

describe('Integration: Feature 018 Production Hardening & Live Evidence End-to-End Workflow', () => {
  it('should execute full clearance and shooting readiness lifecycle adhering to fail-closed and scoped evidence integrity', async () => {
    // 1. Create project in CLOUD_MODE
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Feature 018 Hardened Production Lifecycle',
        productionCompany: 'Autonomous Studio Legal',
        projectType: 'Movie',
        executionMode: 'CLOUD_MODE',
      });

    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Upload screenplay with two distinct scenes featuring a brand mark
    const scriptText = `SCENE 1 - INT. EXECUTIVE BOARDROOM - DAY
Taylor places the AeroTech Prism Laptop onto the mahogany table during the pitch.

SCENE 2 - EXT. RAINY STREET - NIGHT
Taylor runs past the building carrying the damaged AeroTech Prism Laptop in the rain.`;

    const uploadRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });

    expect(uploadRes.status).toBe(200);

    // 3. Fetch scenes and entities
    const scenesRes = await request(app).get(`/api/projects/${projectId}/scenes`);
    expect(scenesRes.status).toBe(200);
    const scenes = Array.isArray(scenesRes.body) ? scenesRes.body : scenesRes.body.scenes || [];
    expect(scenes.length).toBe(2);
    const scene1 = scenes[0];
    const scene2 = scenes[1];

    const entitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    expect(entitiesRes.status).toBe(200);
    const entities = Array.isArray(entitiesRes.body) ? entitiesRes.body : entitiesRes.body.entities || [];
    const aerotech = entities.find((e: any) => e.canonicalName.includes('AeroTech'));
    expect(aerotech).toBeDefined();

    // 4. In CLOUD_MODE without live API key, evaluate occurrence -> fail closed to INSUFFICIENT_EVIDENCE
    const occsRes = await request(app).get(`/api/projects/${projectId}/entities/${aerotech.id}/occurrences`);
    expect(occsRes.status).toBe(200);
    const occs = Array.isArray(occsRes.body) ? occsRes.body : occsRes.body.occurrences || [];
    expect(occs.length).toBe(2);

    const eval1Res = await request(app).post(`/api/projects/${projectId}/occurrences/${occs[0].id}/evaluate`);
    expect(eval1Res.status).toBe(200);
    expect(eval1Res.body.clearanceStatus).toBe('INSUFFICIENT_EVIDENCE');
    expect(eval1Res.body.assessment.riskStatus).toBe('INSUFFICIENT_EVIDENCE');
    expect(eval1Res.body.assessment.provenance).toBe('FALLBACK_FIXTURE');

    const eval2Res = await request(app).post(`/api/projects/${projectId}/occurrences/${occs[1].id}/evaluate`);
    expect(eval2Res.status).toBe(200);
    expect(eval2Res.body.clearanceStatus).toBe('INSUFFICIENT_EVIDENCE');

    // 5. Scene Readiness before mitigation: Both scenes must be RED (blockers)
    const readinessBefore = await sceneReadinessEngine.evaluateAllScenesReadiness(projectId);
    expect(readinessBefore.redScenesCount).toBe(2);
    expect(readinessBefore.workingClearScenesCount).toBe(0);

    // 6. Create a scoped TEMP_APPROVED placeholder strictly for Scene 1
    const plRes = await request(app)
      .post(`/api/projects/${projectId}/placeholders`)
      .send({
        canonicalEntityId: aerotech.id,
        suggestedName: 'SkyTech Zenith Prop Card',
        placeholderTier: 'TEMP_APPROVED',
        visualDescription: 'Matte composite prop laptop',
        rationale: 'Temporary interim prop clearance for boardroom scene only',
        scopeType: 'SELECTED_SCENES',
        sceneIds: [scene1.id],
      });

    expect(plRes.status).toBe(201);
    expect(plRes.body.scopeType).toBe('SELECTED_SCENES');

    // 7. Verify Scene 1 becomes WORKING_CLEAR while Scene 2 remains RED
    const readinessMid = await sceneReadinessEngine.evaluateAllScenesReadiness(projectId);
    const s1Eval = readinessMid.scenes.find((s) => s.sceneId === scene1.id);
    const s2Eval = readinessMid.scenes.find((s) => s.sceneId === scene2.id);

    expect(s1Eval?.status).toBe('WORKING_CLEAR');
    expect(s1Eval?.interimMitigations?.length).toBe(1);
    expect(s2Eval?.status).toBe('RED');

    // 8. Mitigate Scene 2 with signed counsel approval
    const overrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${aerotech.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Legal counsel fair use approval for exterior incidental rainy street scene.',
        counselName: 'Morgan Davis, Esq.',
        counselRole: 'LEAD_PRODUCTION_COUNSEL',
        sceneId: scene2.id,
      });

    expect(overrideRes.status).toBe(200);

    // 9. Verify Scene 2 is now FINAL_CLEAR
    const readinessFinal = await sceneReadinessEngine.evaluateAllScenesReadiness(projectId);
    const s2FinalEval = readinessFinal.scenes.find((s) => s.sceneId === scene2.id);
    expect(s2FinalEval?.status).toBe('FINAL_CLEAR');
    expect(readinessFinal.redScenesCount).toBe(0);
  });
});
