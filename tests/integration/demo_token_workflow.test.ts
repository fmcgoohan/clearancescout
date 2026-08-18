import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { config } from '../../server/config.js';
import { getDb } from '../../server/repositories/firestoreClient.js';

describe('Integration Test: Demo Access Token Protection End-to-End Workflow', () => {
  const originalToken = config.demoAccessToken;
  const demoSecret = 'judge-competition-token-2026';

  beforeEach(async () => {
    const db = getDb();
    if (db.reset) {
      await db.reset();
    }
  });

  afterEach(() => {
    config.demoAccessToken = originalToken;
  });

  it('T009: verifies complete protected project lifecycle, mutation rejections without token, and public endpoint exemptions', async () => {
    // 1. Enable Demo Access Token on server
    config.demoAccessToken = demoSecret;

    // 2. Public health check probe is accessible without credentials
    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('HEALTHY');

    // 3. Public fixture loading is accessible without credentials
    const fixtureRes = await request(app).get('/api/fixtures/demo-screenplay');
    expect(fixtureRes.status).toBe(200);
    expect(fixtureRes.body.title).toBe('The Neon Horizon');

    // 4. Project creation WITHOUT token fails visibly with 401
    const unauthProjectRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Unauthorized Project',
        productionCompany: 'Rogue Productions',
      });
    expect(unauthProjectRes.status).toBe(401);
    expect(unauthProjectRes.body.error).toContain('Unauthorized');
    expect(JSON.stringify(unauthProjectRes.body)).not.toContain(demoSecret);

    // 5. Project creation WITH valid token succeeds
    const projectRes = await request(app)
      .post('/api/projects')
      .set('x-demo-token', demoSecret)
      .send({
        title: 'Demo Protected Screenplay',
        productionCompany: 'SpecKit Productions',
        scriptVersion: 'v1.0',
      });
    expect(projectRes.status).toBe(201);
    const projectId = projectRes.body.id;

    // 6. Script ingestion WITHOUT token fails with 401
    const scriptContent = `
SCENE 1 - INT. COFFEE SHOP - DAY
ALEX drinks Summit Cola and works on an AeroTech Laptop.
`;
    const unauthScriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: scriptContent, format: 'PLAINTEXT' });
    expect(unauthScriptRes.status).toBe(401);

    // 7. Script ingestion WITH token succeeds
    const authScriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .set('x-demo-token', demoSecret)
      .send({ scriptText: scriptContent, format: 'PLAINTEXT' });
    expect(authScriptRes.status).toBe(200);
    expect(authScriptRes.body.scenesParsed).toBe(1);

    // 8. Read-only entity query is accessible without token
    const entitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    expect(entitiesRes.status).toBe(200);
    expect(entitiesRes.body.length).toBeGreaterThan(0);
    const targetEntity = entitiesRes.body[0];

    // 9. Clearance evaluation WITHOUT token fails with 401
    const unauthEvalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [targetEntity.id] });
    expect(unauthEvalRes.status).toBe(401);

    // 10. Clearance evaluation WITH token succeeds
    const authEvalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .set('x-demo-token', demoSecret)
      .send({ canonicalEntityIds: [targetEntity.id] });
    expect(authEvalRes.status).toBe(200);
    expect(authEvalRes.body.assessments).toBeDefined();

    // 11. Counsel override WITHOUT token fails with 401
    const unauthOverrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${targetEntity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Pre-approved placement.',
        counselName: 'Jane Doe, Esq.',
      });
    expect(unauthOverrideRes.status).toBe(401);

    // 12. Counsel override WITH token succeeds
    const authOverrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${targetEntity.id}/override`)
      .set('x-demo-token', demoSecret)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Pre-approved placement.',
        counselName: 'Jane Doe, Esq.',
      });
    expect(authOverrideRes.status).toBe(200);

    // 13. Replacement generation WITHOUT token fails with 401
    const unauthReplRes = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({ canonicalEntityId: targetEntity.id, eraAesthetic: 'Cyberpunk 2090' });
    expect(unauthReplRes.status).toBe(401);

    // 14. Replacement generation WITH token succeeds
    const authReplRes = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .set('x-demo-token', demoSecret)
      .send({ canonicalEntityId: targetEntity.id, eraAesthetic: 'Cyberpunk 2090' });
    expect(authReplRes.status).toBe(200);
    expect(authReplRes.body.fictionalBrandName).toBeDefined();

    // 15. Binder export is accessible without token (read-only)
    const binderRes = await request(app).get(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    expect(binderRes.body.integrityDigest).toBeDefined();
    expect(binderRes.body.integrityDigest.length).toBe(64);
  });
});
