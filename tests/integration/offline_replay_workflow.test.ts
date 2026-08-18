import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Integration Test: Offline Record Replay Workflow End-to-End', () => {
  it('T009: verifies complete zero-network offline project lifecycle with record-replay fixtures and visible provenance', async () => {
    // 1. Create project in TEST_MODE
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Offline Sci-Fi Production',
        productionCompany: 'Autonomous Studio Corp',
        scriptVersion: 'v1.0-Offline',
        executionMode: 'TEST_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest screenplay containing known test fixture entities
    const scriptContent = `INT. CYBER DINER - NIGHT
MAYA orders a cold Summit Cola and checks her AeroTech Prism Laptop.

EXT. METROPOLIS SKYWAY - NIGHT
Maya speeds away in her Veloce GT beneath the Empire State Building.`;

    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: scriptContent, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);
    expect(scriptRes.body.scenesParsed).toBe(2);
    expect(scriptRes.body.entities.length).toBeGreaterThanOrEqual(3);

    const entitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    expect(entitiesRes.status).toBe(200);
    const entities = entitiesRes.body;
    expect(entities.length).toBeGreaterThanOrEqual(3);

    // 3. Trigger Clearance Research (offline record-replay fixtures)
    const entityIds = entities.map((e: any) => e.id);
    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: entityIds });
    expect(evalRes.status).toBe(200);
    expect(evalRes.body.assessments.length).toBe(entityIds.length);

    // Verify all assessments carry DEMO_FIXTURE provenance
    evalRes.body.assessments.forEach((assess: any) => {
      expect(assess.citations.length).toBeGreaterThanOrEqual(1);
      assess.citations.forEach((cit: any) => {
        expect(cit.provenance).toBe('DEMO_FIXTURE');
      });
    });

    // 4. Generate Brand Replacement for Summit Cola
    const summitCola = entities.find((e: any) => e.canonicalName.toLowerCase().includes('summit cola')) || entities[0];
    const replRes = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({ canonicalEntityId: summitCola.id, eraAesthetic: 'Cyberpunk Neon' });
    expect(replRes.status).toBe(200);
    expect(replRes.body.fictionalBrandName).toBeDefined();
    expect(replRes.body.selfClearanceResult).toBe('ACCEPTED');
    expect(replRes.body.citations[0].provenance).toBe('DEMO_FIXTURE');

    // 5. Compile Clearance Binder Export with SHA-256 integrity digest and mixed provenance
    const binderRes = await request(app).get(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    expect(binderRes.body.integrityDigest).toBeDefined();
    expect(binderRes.body.integrityDigest.length).toBe(64);
    expect(binderRes.body.provenanceSummary.demoCount).toBeGreaterThanOrEqual(1);
    expect(binderRes.body.provenanceSummary.dominantProvenance).toBe('DEMO_FIXTURE');
    expect(binderRes.body.disclaimer).toContain('does NOT render formal legal advice');
  });
});
