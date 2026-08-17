import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { resolveEffectiveClearanceStatus } from '../../server/workflows/effectiveStatusResolver.js';

describe('Contract: Studio Legal Counsel Override API & Scene Isolation Invariant', () => {
  it('should record a scene-specific override with no prior canonical override without mutating canonical entity state, proving other scenes retain automated status', async () => {
    // 1. Create Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Scene Override Isolation Test',
        productionCompany: 'Universal Studios',
        scriptVersion: 'v1.0',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest Script with multi-scene occurrences
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: 'INT. BAR - NIGHT\nJohn sips a cold Coca-Cola at the bar.\n\nEXT. STREET - NIGHT\nJohn throws the empty can of Coca-Cola.',
        format: 'PLAINTEXT',
      });
    expect(scriptRes.status).toBe(200);
    const entity = scriptRes.body.entities[0];
    expect(entity).toBeDefined();
    expect(entity.isOverridden).toBe(false);

    // 3. Evaluate automated risk baseline (baseline status: ACTION_REQUIRED)
    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [entity.id] });
    expect(evalRes.status).toBe(200);
    expect(evalRes.body.assessments[0].riskStatus).toBe('ACTION_REQUIRED');

    // 4. Submit Scene-Specific Override for scene-1 only (NO prior canonical override)
    const sceneOverrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        sceneId: 'scene-1',
        rationale: 'Scene 1 background placement permitted under producer agreement.',
        counselName: 'Jane Doe, Esq.',
        counselRole: 'Senior Production Legal Counsel',
      });
    expect(sceneOverrideRes.status).toBe(200);
    expect(sceneOverrideRes.body.override.sceneId).toBe('scene-1');
    expect(sceneOverrideRes.body.override.overrideStatus).toBe('NO_ISSUE_SURFACED');
    
    // Invariant: Canonical entity state must NOT be mutated by scene-specific override
    expect(sceneOverrideRes.body.entity.isOverridden).toBe(false);
    expect(sceneOverrideRes.body.entity.overallClearanceStatus).toBe('ACTION_REQUIRED');

    // 5. Verify Canonical Entity in database still has isOverridden === false
    const entitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    expect(entitiesRes.status).toBe(200);
    const dbEntity = entitiesRes.body.find((e: any) => e.id === entity.id);
    expect(dbEntity.isOverridden).toBe(false);
    expect(dbEntity.overallClearanceStatus).toBe('ACTION_REQUIRED');

    // 6. Test Hierarchical Effective Status Resolver:
    // Scene 1 MUST resolve to scene override (NO_ISSUE_SURFACED)
    // Scene 2 MUST resolve to automated baseline (ACTION_REQUIRED)
    const allOverrides = (await request(app).get(`/api/projects/${projectId}/entities/${entity.id}/overrides`)).body.overrides;
    
    const scene1Effective = resolveEffectiveClearanceStatus(dbEntity, allOverrides, 'scene-1');
    expect(scene1Effective).toBe('NO_ISSUE_SURFACED');

    const scene2Effective = resolveEffectiveClearanceStatus(dbEntity, allOverrides, 'scene-2');
    expect(scene2Effective).toBe('ACTION_REQUIRED');

    const projectWideEffective = resolveEffectiveClearanceStatus(dbEntity, allOverrides);
    expect(projectWideEffective).toBe('ACTION_REQUIRED');
  });

  it('should record a canonical override, protect it from automated re-evaluation, and allow scene-specific overrides on top', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Hierarchical Override Stack Test',
        productionCompany: 'Warner Bros. Discovery',
        scriptVersion: 'v2.0',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: 'INT. BAR - NIGHT\nJohn sips a cold Coca-Cola at the bar.',
        format: 'PLAINTEXT',
      });
    const entity = scriptRes.body.entities[0];

    // Submit project-wide canonical override
    const overrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Direct paid product placement contract executed under #PP-2026-WB.',
        counselName: 'Jane Doe, Esq.',
        counselRole: 'Senior Vice President, Production Legal',
      });
    expect(overrideRes.status).toBe(200);
    expect(overrideRes.body.entity.isOverridden).toBe(true);
    expect(overrideRes.body.entity.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');

    // Automated re-evaluation must NOT overwrite canonical override
    await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [entity.id] });

    const entitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    const updatedEntity = entitiesRes.body.find((e: any) => e.id === entity.id);
    expect(updatedEntity.isOverridden).toBe(true);
    expect(updatedEntity.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');

    // Submit scene-specific exception on top
    const sceneExceptionRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entity.id}/override`)
      .send({
        overrideStatus: 'REVIEW_RECOMMENDED',
        sceneId: 'scene-1',
        rationale: 'Special review needed for scene 1 brand placement lighting.',
        counselName: 'Jane Doe, Esq.',
        counselRole: 'Senior Vice President, Production Legal',
      });
    expect(sceneExceptionRes.status).toBe(200);
    expect(sceneExceptionRes.body.override.sceneId).toBe('scene-1');
  });
});
