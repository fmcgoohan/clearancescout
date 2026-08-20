import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { sceneReadinessEngine } from '../../server/workflows/sceneReadinessEngine.js';

describe('Contract: Feature 018 Scoped Placeholders & Tight WORKING_CLEAR Scene Readiness', () => {
  it('should scope placeholders to specific scenes/occurrences and enforce strict WORKING_CLEAR requirements', async () => {
    // 1. Create project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Scoped Placeholders Project',
        productionCompany: 'Strict Readiness Productions',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Upload script with two scenes referencing an action-required brand mark in high-risk context
    const scriptText = `SCENE 1 - INT. OFFICE - DAY
Alex types on a hazardous AeroTech Prism Laptop that exploded with toxic smoke on the desk.

SCENE 2 - EXT. ROOFTOP - NIGHT
Alex throws the hazardous AeroTech Prism Laptop that exploded with toxic sparks into the street.`;

    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });

    expect(scriptRes.status).toBe(200);

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const laptop = entities.find((e) => e.canonicalName.includes('AeroTech'));
    expect(laptop).toBeDefined();

    const scenesRes = await request(app).get(`/api/projects/${projectId}/scenes`);
    const scenes = scenesRes.body;
    expect(scenes.length).toBe(2);
    const scene1 = scenes[0];
    const scene2 = scenes[1];

    // Evaluate occurrences for both scenes (sets them to ACTION_REQUIRED or REVIEW_RECOMMENDED)
    const occsRes = await request(app).get(`/api/projects/${projectId}/entities/${laptop!.id}/occurrences`);
    const occs = occsRes.body.occurrences;
    expect(occs.length).toBe(2);

    await request(app).post(`/api/projects/${projectId}/occurrences/${occs[0].id}/evaluate`);
    await request(app).post(`/api/projects/${projectId}/occurrences/${occs[1].id}/evaluate`);

    // 3. Before placeholder: Both scenes should be RED (blockers)
    const initialReadiness = await sceneReadinessEngine.evaluateAllScenesReadiness(projectId);
    expect(initialReadiness.redScenesCount).toBe(2);
    expect(initialReadiness.workingClearScenesCount).toBe(0);

    // 4. Create a TEMP_APPROVED placeholder scoped strictly to Scene 1
    const plRes = await request(app)
      .post(`/api/projects/${projectId}/placeholders`)
      .send({
        canonicalEntityId: laptop!.id,
        suggestedName: 'NovaTech Zenith Scoped',
        placeholderTier: 'TEMP_APPROVED',
        visualDescription: 'Matte titanium notebook prop',
        rationale: 'Temporary prop clearance strictly for scene 1 interior',
        scopeType: 'SELECTED_SCENES',
        sceneIds: [scene1.id],
        isProjectWide: false,
      });

    expect(plRes.status).toBe(201);
    expect(plRes.body.scopeType).toBe('SELECTED_SCENES');
    expect(plRes.body.sceneIds).toContain(scene1.id);

    // 5. Re-evaluate Scene Readiness
    const updatedReadiness = await sceneReadinessEngine.evaluateAllScenesReadiness(projectId);
    const assessedScene1 = updatedReadiness.scenes.find((s) => s.sceneId === scene1.id);
    const assessedScene2 = updatedReadiness.scenes.find((s) => s.sceneId === scene2.id);

    // Scene 1 has an active TEMP_APPROVED placeholder covering its occurrence -> WORKING_CLEAR
    expect(assessedScene1?.status).toBe('WORKING_CLEAR');
    expect(assessedScene1?.interimMitigations?.length).toBeGreaterThanOrEqual(1);

    // Scene 2 does NOT have a placeholder covering it -> RED
    expect(assessedScene2?.status).toBe('RED');
  });
});
