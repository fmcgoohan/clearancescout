import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { config } from '../../server/config.js';
import { getDb } from '../../server/repositories/firestoreClient.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';

describe('Contract: Feature 020 Live Operator Access & Client Network Auth', () => {
  const originalToken = config.demoAccessToken;
  const originalMode = config.executionMode;

  beforeEach(async () => {
    const db = getDb();
    if (db.reset) {
      await db.reset();
    }
  });

  afterEach(() => {
    config.demoAccessToken = originalToken;
    config.executionMode = originalMode;
    delete process.env.EXECUTION_MODE;
  });

  it('T001: verifies unauthenticated client requests fail closed with 401 in CLOUD_MODE across dashboard, binder, and projects', async () => {
    config.executionMode = 'CLOUD_MODE';
    config.demoAccessToken = 'judge-pass-2026';

    const project = await projectRepo.createProject({
      title: 'Neon Operator Test',
      productionCompany: 'Apex Productions',
      scriptVersion: 'v1.0',
      executionMode: 'CLOUD_MODE',
    });

    // 1. GET /api/projects without credentials -> 401
    const projectsRes = await request(app).get('/api/projects');
    expect(projectsRes.status).toBe(401);
    expect(projectsRes.body.error).toContain('Unauthorized');

    // 2. GET /api/projects/:id/dashboard without credentials -> 401
    const dashRes = await request(app).get(`/api/projects/${project.id}/dashboard`);
    expect(dashRes.status).toBe(401);

    // 3. GET /api/projects/:id/binder/markdown without credentials -> 401
    const mdRes = await request(app).get(`/api/projects/${project.id}/binder/markdown`);
    expect(mdRes.status).toBe(401);

    // 4. Authenticated requests with Bearer header -> 200
    const authProjectsRes = await request(app)
      .get('/api/projects')
      .set('Authorization', 'Bearer judge-pass-2026');
    expect(authProjectsRes.status).toBe(200);

    const authDashRes = await request(app)
      .get(`/api/projects/${project.id}/dashboard`)
      .set('Authorization', 'Bearer judge-pass-2026');
    expect(authDashRes.status).toBe(200);

    const authMdRes = await request(app)
      .get(`/api/projects/${project.id}/binder/markdown`)
      .set('Authorization', 'Bearer judge-pass-2026');
    expect(authMdRes.status).toBe(200);
  });

  it('T001: accepts query parameter token for SSE timeline stream in CLOUD_MODE', async () => {
    config.executionMode = 'CLOUD_MODE';
    config.demoAccessToken = 'judge-pass-2026';

    const project = await projectRepo.createProject({
      title: 'SSE Stream Auth Test',
      productionCompany: 'Apex Productions',
      scriptVersion: 'v1.0',
      executionMode: 'CLOUD_MODE',
    });

    // Unauthenticated SSE request -> 401
    const unauthStream = await request(app)
      .get(`/api/projects/${project.id}/timeline/stream`);
    expect(unauthStream.status).toBe(401);

    // Authenticated request with query parameter -> 200 OK
    const authTimeline = await request(app)
      .get(`/api/projects/${project.id}/timeline?token=judge-pass-2026`);
    expect(authTimeline.status).toBe(200);
    expect(Array.isArray(authTimeline.body.events)).toBe(true);
  });
});
