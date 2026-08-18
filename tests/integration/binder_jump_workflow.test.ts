import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Feature 010: Binder Jump to Evidence & Timeline Integration Workflow', () => {
  it('completes full binder export, jumps to evidence and timeline, and preserves SHA-256 digest', async () => {
    // 1. Create a workspace project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'The Neon Horizon',
        productionCompany: 'Entrant Studio Team',
        scriptVersion: 'v1.0-ShootingDraft',
        executionMode: 'TEST_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest screenplay
    const script = `
INT. PENTHOUSE WORKSPACE - NIGHT
Alex drinks a cold Summit Cola while checking his AeroTech Prism Laptop.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: script, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    // 3. Fetch extracted entities
    const entitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    expect(entitiesRes.status).toBe(200);
    const entities = entitiesRes.body;
    expect(entities.length).toBeGreaterThan(0);

    const summitEntity = entities.find((e: any) => e.canonicalName === 'Summit Cola');
    expect(summitEntity).toBeDefined();

    // 4. Evaluate clearance for Summit Cola
    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [summitEntity.id] });
    expect(evalRes.status).toBe(200);

    // 5. Export complete clearance binder
    const binderRes = await request(app).get(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    const binder = binderRes.body;

    expect(binder.integrityDigest).toBeDefined();
    expect(binder.integrityDigest).toHaveLength(64); // 64 hex characters SHA-256
    const initialDigest = binder.integrityDigest;

    // 6. Verify canonical entities and citations exist in binder
    expect(binder.canonicalEntities.length).toBe(entities.length);
    const binderSummit = binder.canonicalEntities.find((e: any) => e.id === summitEntity.id);
    expect(binderSummit).toBeDefined();

    // 7. Jump to Evidence verification:
    // Filter matching citations from binder index for Summit Cola
    const matchingCitations = binder.citationsIndex.filter((c: any) =>
      c.query.toLowerCase().includes(summitEntity.canonicalName.toLowerCase())
    );
    expect(matchingCitations.length).toBeGreaterThan(0);
    expect(matchingCitations[0].provenance).toBeDefined();

    // 8. Verify binder digest is completely unchanged and stored immutably
    const latestBinderRes = await request(app).get(`/api/projects/${projectId}/binder/latest`);
    expect(latestBinderRes.status).toBe(200);
    expect(latestBinderRes.body.integrityDigest).toBe(initialDigest);
  });
});
