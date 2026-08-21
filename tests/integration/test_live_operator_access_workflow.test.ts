import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { config } from '../../server/config.js';
import { getDb } from '../../server/repositories/firestoreClient.js';
import { scriptParserAgent } from '../../server/agents/ScriptParserAgent.js';

describe('Integration: Feature 020 Live Operator Access & First-Run Workflow', () => {
  const originalToken = config.demoAccessToken;
  const originalMode = config.executionMode;
  const originalGemini = config.geminiApiKey;
  const originalParallel = config.parallelWebApiKey;
  let parserSpy: any;

  beforeEach(async () => {
    const db = getDb();
    if (db.reset) {
      await db.reset();
    }
    parserSpy = vi.spyOn(scriptParserAgent, 'parseScriptText').mockImplementation(async (text: string) => {
      return (scriptParserAgent as any).parseScriptFallback(text);
    });
  });

  afterEach(() => {
    parserSpy.mockRestore();
    config.demoAccessToken = undefined;
    config.executionMode = 'DEMO_MODE';
    config.geminiApiKey = originalGemini;
    config.parallelWebApiKey = originalParallel;
    delete process.env.EXECUTION_MODE;
    delete process.env.DEMO_ACCESS_TOKEN;
    delete process.env.DEMO_TOKEN;
  });

  it('T002: executes complete unauthenticated 401 gate -> token configuration -> bootstrap & 1-click demo workflow in CLOUD_MODE', async () => {
    config.executionMode = 'CLOUD_MODE';
    config.demoAccessToken = 'judge-pass-2026';

    // Step 1: Health check remains public and accessible
    const healthRes = await request(app).get('/api/health');
    expect([200, 503]).toContain(healthRes.status);
    expect(healthRes.body.executionMode).toBe('CLOUD_MODE');

    // Step 2: Unauthenticated initial bootstrap fails closed with 401
    const unauthBootstrap = await request(app).get('/api/projects');
    expect(unauthBootstrap.status).toBe(401);
    expect(unauthBootstrap.body.error).toContain('Unauthorized');

    // Step 3: Operator supplies configured judge token -> bootstrap succeeds
    const token = 'judge-pass-2026';
    const authBootstrap = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);
    expect(authBootstrap.status).toBe(200);

    // Step 4: Operator creates new clearance workspace project
    const createProjectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'The Neon Horizon Live Assessment',
        productionCompany: 'Entrant Studio Team',
        scriptVersion: 'v1.0-ShootingDraft',
        projectType: 'Movie',
        executionMode: 'CLOUD_MODE',
      });
    expect(createProjectRes.status).toBe(201);
    const projectId = createProjectRes.body.id;
    expect(projectId).toBeDefined();

    // Step 5: Operator triggers 1-Click Demo screenplay loading
    const demoRes = await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    
    expect(demoRes.status).toBe(200);
    expect(demoRes.body.scenesCount).toBeGreaterThan(0);
    expect(demoRes.body.entitiesCount).toBeGreaterThan(0);
    expect(demoRes.body.evaluationsCount).toBeGreaterThan(0);

    // Step 6: Operator inspects Dashboard and Binder exports with credentials
    const dashRes = await request(app)
      .get(`/api/projects/${projectId}/dashboard`)
      .set('Authorization', `Bearer ${token}`);
    expect(dashRes.status).toBe(200);

    const binderRes = await request(app)
      .get(`/api/projects/${projectId}/binder/markdown`)
      .set('Authorization', `Bearer ${token}`);
    expect(binderRes.status).toBe(200);
    expect(binderRes.text).toContain('Clearance');
  });
});
