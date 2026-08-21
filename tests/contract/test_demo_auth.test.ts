import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { config } from '../../server/config.js';
import { getDb } from '../../server/repositories/firestoreClient.js';

describe('Contract Test: Demo Access Token Protection', () => {
  const originalToken = config.demoAccessToken;

  beforeEach(async () => {
    const db = getDb();
    if (db.reset) {
      await db.reset();
    }
  });

  afterEach(() => {
    config.demoAccessToken = undefined;
    delete process.env.DEMO_ACCESS_TOKEN;
    delete process.env.DEMO_TOKEN;
  });

  it('T003: rejects mutation requests with 401 when DEMO_ACCESS_TOKEN is configured and token is missing or invalid', async () => {
    config.demoAccessToken = 'judge-pass-2026';

    // 1. Missing Token -> 401 Unauthorized
    const missingRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Unauthorized Test Script',
        productionCompany: 'Rogue Productions',
      });

    expect(missingRes.status).toBe(401);
    expect(missingRes.body).toEqual({
      error: 'Unauthorized: Invalid or missing demo access token.',
    });
    // Ensure configured secret is NEVER leaked in response
    expect(JSON.stringify(missingRes.body)).not.toContain('judge-pass-2026');

    // 2. Invalid Token -> 401 Unauthorized
    const invalidRes = await request(app)
      .post('/api/projects')
      .set('x-demo-token', 'wrong-token-abc')
      .send({
        title: 'Unauthorized Test Script',
        productionCompany: 'Rogue Productions',
      });

    expect(invalidRes.status).toBe(401);
    expect(invalidRes.body).toEqual({
      error: 'Unauthorized: Invalid or missing demo access token.',
    });
  });

  it('T003: accepts valid token across x-demo-token header, Authorization Bearer header, and query parameter', async () => {
    config.demoAccessToken = 'judge-pass-2026';

    // 1. Via x-demo-token header
    const headerRes = await request(app)
      .post('/api/projects')
      .set('x-demo-token', 'judge-pass-2026')
      .send({
        title: 'Header Authorized Project',
        productionCompany: 'SpecKit Studio',
      });
    expect(headerRes.status).toBe(201);
    expect(headerRes.body.title).toBe('Header Authorized Project');

    // 2. Via Authorization Bearer header
    const bearerRes = await request(app)
      .post('/api/projects')
      .set('Authorization', 'Bearer judge-pass-2026')
      .send({
        title: 'Bearer Authorized Project',
        productionCompany: 'SpecKit Studio',
      });
    expect(bearerRes.status).toBe(201);

    // 3. Via query parameter ?token=
    const queryRes = await request(app)
      .post('/api/projects?token=judge-pass-2026')
      .send({
        title: 'Query Authorized Project',
        productionCompany: 'SpecKit Studio',
      });
    expect(queryRes.status).toBe(201);
  });

  it('T003: permits open mutation access when DEMO_ACCESS_TOKEN is unset or empty (local dev default)', async () => {
    config.demoAccessToken = undefined;

    const res = await request(app)
      .post('/api/projects')
      .send({
        title: 'Open Local Dev Project',
        productionCompany: 'Local Studio',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Open Local Dev Project');
  });

  it('T005: keeps GET /api/health and GET /api/fixtures/* public and unauthenticated even when token is configured', async () => {
    config.demoAccessToken = 'judge-pass-2026';

    // 1. GET /api/health probe
    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('HEALTHY');
    expect(healthRes.body.executionMode).toBeDefined();

    // 2. GET /api/fixtures/demo-screenplay
    const fixtureRes = await request(app).get('/api/fixtures/demo-screenplay');
    expect(fixtureRes.status).toBe(200);
    expect(fixtureRes.body.title).toBe('The Neon Horizon');
  });

  describe('Feature 019: CLOUD_MODE Production Auth & Data Protection', () => {
    const originalExecutionMode = config.executionMode;
    const originalEnvMode = process.env.EXECUTION_MODE;

    afterEach(() => {
      config.executionMode = originalExecutionMode;
      config.demoAccessToken = originalToken;
      if (originalEnvMode === undefined) {
        delete process.env.EXECUTION_MODE;
      } else {
        process.env.EXECUTION_MODE = originalEnvMode;
      }
    });

    it('fails closed in CLOUD_MODE with 401 when DEMO_ACCESS_TOKEN is unset for both POST and GET project endpoints', async () => {
      config.executionMode = 'CLOUD_MODE';
      process.env.EXECUTION_MODE = 'CLOUD_MODE';
      config.demoAccessToken = undefined;

      // 1. POST /api/projects fails closed with 401
      const postRes = await request(app)
        .post('/api/projects')
        .send({
          title: 'Cloud Mode Unconfigured Token Test',
          productionCompany: 'Test Studio',
        });

      expect(postRes.status).toBe(401);
      expect(postRes.body.error).toContain('CLOUD_MODE requires a configured DEMO_ACCESS_TOKEN');

      // 2. GET /api/projects/:id fails closed with 401
      const getRes = await request(app).get('/api/projects/proj-12345');
      expect(getRes.status).toBe(401);
      expect(getRes.body.error).toContain('CLOUD_MODE requires a configured DEMO_ACCESS_TOKEN');
    });

    it('rejects random Bearer token with 401 in CLOUD_MODE when a token is configured', async () => {
      config.executionMode = 'CLOUD_MODE';
      process.env.EXECUTION_MODE = 'CLOUD_MODE';
      config.demoAccessToken = 'valid-production-secret-999';

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer invalid-random-token-888')
        .send({
          title: 'Tampered Request',
          productionCompany: 'Test Studio',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid or missing demo access token');
    });

    it('allows GET /api/projects/:id when valid token is supplied in CLOUD_MODE', async () => {
      config.executionMode = 'CLOUD_MODE';
      process.env.EXECUTION_MODE = 'CLOUD_MODE';
      config.demoAccessToken = 'valid-production-secret-999';

      // First create a project using the valid token
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid-production-secret-999')
        .send({
          title: 'Cloud Authorized Project',
          productionCompany: 'Authorized Studio',
        });

      expect(createRes.status).toBe(201);
      const projectId = createRes.body.id;

      // GET with valid token succeeds
      const getRes = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', 'Bearer valid-production-secret-999');

      expect(getRes.status).toBe(200);
      expect(getRes.body.title).toBe('Cloud Authorized Project');
    });

    it('keeps GET /api/health and POST /api/projects/:id/script/demo public in CLOUD_MODE', async () => {
      config.executionMode = 'CLOUD_MODE';
      process.env.EXECUTION_MODE = 'CLOUD_MODE';
      config.demoAccessToken = 'valid-production-secret-999';

      // Health is public and reachable without requiring demo token (does not return 401)
      const healthRes = await request(app).get('/api/health');
      expect([200, 503]).toContain(healthRes.status);
      expect(healthRes.body.executionMode).toBe('CLOUD_MODE');

      // Create a project using valid authorization
      const projRes = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid-production-secret-999')
        .send({
          title: 'Judge Demo Project',
          productionCompany: 'Judge Review Co',
        });
      expect(projRes.status).toBe(201);
      const projectId = projRes.body.id;

      // Demo script load endpoint is public for judges (no token provided) -> reaches handler without 401 Unauthorized
      const demoRes = await request(app).post(`/api/projects/${projectId}/script/demo`);
      expect(demoRes.status).not.toBe(401);
      expect([200, 502]).toContain(demoRes.status);
    });

    it('T014: authorizes SSE stream /api/projects/:id/timeline/stream with query token parameter in CLOUD_MODE', async () => {
      config.executionMode = 'CLOUD_MODE';
      process.env.EXECUTION_MODE = 'CLOUD_MODE';
      config.demoAccessToken = 'valid-production-secret-999';

      const projRes = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid-production-secret-999')
        .send({
          title: 'SSE Query Auth Project',
          productionCompany: 'Stream Studios',
        });
      expect(projRes.status).toBe(201);
      const projectId = projRes.body.id;

      // 1. Missing token query param -> 401
      const unauthStream = await request(app)
        .get(`/api/projects/${projectId}/timeline/stream`);
      expect(unauthStream.status).toBe(401);

      // 2. Invalid token query param -> 401
      const invalidStream = await request(app)
        .get(`/api/projects/${projectId}/timeline/stream?token=wrong-secret`);
      expect(invalidStream.status).toBe(401);

      // 3. Valid token query param on timeline -> 200 OK (does not 401)
      const authTimeline = await request(app)
        .get(`/api/projects/${projectId}/timeline?token=valid-production-secret-999`);
      expect(authTimeline.status).toBe(200);
      expect(Array.isArray(authTimeline.body.events)).toBe(true);
    });
  });
});
