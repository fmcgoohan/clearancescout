import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('SSE Timeline Contract API', () => {
  let projectId: string;

  it('Setup: Create project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({
        title: 'Timeline Contract Test',
        productionCompany: 'Test Co',
        executionMode: 'DEMO_MODE',
      });
    projectId = res.body.id;
  });

  it('GET /api/projects/:id/timeline - should return history without chain of thought', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/timeline`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);

    res.body.events.forEach((evt: any) => {
      expect(evt).not.toHaveProperty('thought');
      expect(evt).not.toHaveProperty('thinking');
    });
  });
});
