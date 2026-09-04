import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';
import { overrideRepo } from '../../server/repositories/OverrideRepo.js';

describe('Contract: Scene Readiness State Machine (Feature 016 Phase 5)', () => {
  it('FR-006: evaluates scene readiness across RED, WORKING_CLEAR, and FINAL_CLEAR state transitions', async () => {
    // 1. Create a Movie Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Scene Readiness Protocol',
        productionCompany: 'Vanguard Pictures',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest screenplay with Scene 1 (copyrighted song) and Scene 2 (clean dialogue)
    const scriptText = `
INT. RECORDING STUDIO - NIGHT
Elena listens intently as Nocturne of the Wild plays through high-end studio monitors.

EXT. CITY PARK - DAY
Alex and Elena walk along the paved path discussing their future plans under the sunny sky.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    const scenes = await sceneRepo.getScenesByProject(projectId);
    expect(scenes).toHaveLength(2);
    const scene1Id = scenes[0].id;
    const scene2Id = scenes[1].id;

    // Evaluate clearance for Scene 1 entity
    const entities = await entityRepo.getEntitiesByProject(projectId);
    const musicEntity = entities.find((e) => e.entityCategory === 'ART_MUSIC');
    expect(musicEntity).toBeDefined();

    await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [musicEntity!.id] });

    // 3. Initial Scene Readiness Evaluation
    const evalScene1Res = await request(app)
      .post(`/api/projects/${projectId}/scenes/${scene1Id}/readiness/evaluate`);
    expect(evalScene1Res.status).toBe(200);
    expect(evalScene1Res.body.status).toBe('RED');
    expect(evalScene1Res.body.blockersCount).toBe(1);
    expect(evalScene1Res.body.blockingRationale).toContain('Nocturne of the Wild');

    const evalScene2Res = await request(app)
      .post(`/api/projects/${projectId}/scenes/${scene2Id}/readiness/evaluate`);
    expect(evalScene2Res.status).toBe(200);
    expect(evalScene2Res.body.status).toBe('PENDING_REVIEW');
    expect(evalScene2Res.body.totalOccurrences).toBe(0);

    // 4. Query Project-Wide Readiness Summary
    const summaryRes = await request(app).get(`/api/projects/${projectId}/scenes/readiness`);
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.totalScenes).toBe(2);
    expect(summaryRes.body.redScenesCount).toBe(1);
    expect(summaryRes.body.pendingReviewScenesCount).toBe(1);
    expect(summaryRes.body.finalClearScenesCount).toBe(0);

    // 5. Attach Fictional Replacement Card -> Should transition Scene 1 to WORKING_CLEAR
    await request(app)
      .post(`/api/projects/${projectId}/replacements`)
      .send({
        canonicalEntityId: musicEntity!.id,
        fictionalBrandName: 'Starlight Symphony',
        visualDescription: 'Original orchestral electronic melody',
        creativeRationale: 'Bespoke commissioned track',
      });

    const evalWorkingRes = await request(app)
      .post(`/api/projects/${projectId}/scenes/${scene1Id}/readiness/evaluate`);
    expect(evalWorkingRes.status).toBe(200);
    expect(evalWorkingRes.body.status).toBe('WORKING_CLEAR');
    expect(evalWorkingRes.body.blockersCount).toBe(0);
    expect(evalWorkingRes.body.workingClearCount).toBe(1);

    // 6. Sign Legal Counsel Override -> Should transition Scene 1 to FINAL_CLEAR
    await overrideRepo.createOverride(projectId, {
      canonicalEntityId: musicEntity!.id,
      sceneId: scene1Id,
      status: 'NO_ISSUE_SURFACED',
      counselName: 'Sarah Jenkins, Lead Production Counsel',
      rationale: 'Synchronization license fully executed and on file with studio legal.',
    });

    const evalFinalRes = await request(app)
      .post(`/api/projects/${projectId}/scenes/${scene1Id}/readiness/evaluate`);
    expect(evalFinalRes.status).toBe(200);
    expect(evalFinalRes.body.status).toBe('FINAL_CLEAR');
    expect(evalFinalRes.body.blockersCount).toBe(0);
    expect(evalFinalRes.body.finalClearCount).toBe(1);
  });
});
