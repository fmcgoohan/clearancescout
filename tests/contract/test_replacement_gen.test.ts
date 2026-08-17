import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('Replacement Brand Concept Card Contract API', () => {
  let projectId: string;
  let entityId: string;

  it('Setup: Create project and upload script', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Replacement Test Project',
        productionCompany: 'Test Co',
        executionMode: 'DEMO_MODE',
      });
    projectId = projRes.body.id;

    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: 'INT. CAR - DAY\nALEX drives a Porsche.' });

    entityId = scriptRes.body.entities[0].id;
  });

  it('POST /api/projects/:id/replacements/generate - should generate replacement brand card', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({ canonicalEntityId: entityId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('fictionalBrandName');
    expect(res.body).toHaveProperty('artworkImageUrl');
    expect(res.body).toHaveProperty('nonInfringementRationale');
  });
});
