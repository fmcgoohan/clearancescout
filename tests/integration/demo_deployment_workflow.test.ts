import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Integration: Judge-Ready Demo Screenplay, Health & Deployment Workflow', () => {
  it('should execute end-to-end judge evaluation: health check, 1-click fictional screenplay ingestion, clearance evaluation, and binder export', async () => {
    // 1. Health & Readiness Endpoint Verification
    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('HEALTHY');
    expect(healthRes.body.credentials).toHaveProperty('geminiConfigured');
    expect(healthRes.body.credentials).toHaveProperty('parallelWebConfigured');

    // 2. Fetch Bundled Fictional Demo Screenplay
    const fixtureRes = await request(app).get('/api/fixtures/demo-screenplay');
    expect(fixtureRes.status).toBe(200);
    expect(fixtureRes.body.title).toBe('The Neon Horizon');
    const demoScriptText = fixtureRes.body.scriptText;
    expect(demoScriptText.length).toBeGreaterThan(100);

    // 3. Create Project & Ingest Fictional Demo Screenplay
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'The Neon Horizon Demo Project',
        productionCompany: 'Judge Review Studios',
        scriptVersion: 'v1.0-final',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: demoScriptText,
        format: 'PLAINTEXT',
      });
    expect(scriptRes.status).toBe(200);
    expect(scriptRes.body.scenesParsed).toBeGreaterThanOrEqual(3);
    expect(scriptRes.body.entities.length).toBeGreaterThanOrEqual(5);

    // Verify all 5 clearance categories are represented by fictional entities
    const extractedNames = scriptRes.body.entities.map((e: any) => e.canonicalName);
    expect(extractedNames).toContain('Summit Cola');
    expect(extractedNames).toContain('Veloce GT');
    expect(extractedNames).toContain('Nocturne of the Wild');
    expect(extractedNames).toContain('Elena Vance');
    expect(extractedNames).toContain('Midtown Spire Tower');
    expect(extractedNames).toContain('Titan Industrial Hazard Placard');

    // 4. Evaluate Clearance for an Entity
    const summitColaEntity = scriptRes.body.entities.find((e: any) => e.canonicalName === 'Summit Cola');
    expect(summitColaEntity).toBeDefined();

    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [summitColaEntity.id] });
    expect(evalRes.status).toBe(200);
    expect(evalRes.body.assessments).toBeDefined();
    expect(evalRes.body.assessments.length).toBe(1);
    expect(evalRes.body.assessments[0].riskStatus).toBe('NO_ISSUE_SURFACED');
    expect(evalRes.body.assessments[0].citations.length).toBeGreaterThanOrEqual(1);

    // 5. Generate Replacement Brand Asset for a Prop (e.g. Titan Industrial Hazard Placard)
    const hazardEntity = scriptRes.body.entities.find((e: any) => e.canonicalName.includes('Titan Industrial'));
    expect(hazardEntity).toBeDefined();

    const repRes = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({
        canonicalEntityId: hazardEntity.id,
        eraAesthetic: 'Cyberpunk Industrial',
      });
    expect(repRes.status).toBe(200);
    expect(repRes.body.selfClearanceResult).toBe('ACCEPTED');
    expect(repRes.body.fictionalBrandName).toBeDefined();

    // 6. Compile & Export Auditable Clearance Binder
    const binderRes = await request(app)
      .post(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    expect(binderRes.body.integrityDigest).toBeDefined();
    expect(binderRes.body.integrityDigest).toHaveLength(64); // SHA-256
    expect(binderRes.body.projectSummary.totalEntities).toBeGreaterThanOrEqual(5);
    expect(binderRes.body.disclaimer).toContain('does NOT render formal legal advice');
  });
});
