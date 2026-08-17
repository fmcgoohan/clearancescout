import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('Script Parser & Canonical Registry Contract API', () => {
  let projectId: string;

  it('POST /api/projects - should create a new project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({
        title: 'Contract Test Film',
        productionCompany: 'Test Production',
        scriptVersion: 'v1.0',
        executionMode: 'DEMO_MODE',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Contract Test Film');
    projectId = res.body.id;
  });

  it('POST /api/projects/:id/script - should parse script and register canonical entities', async () => {
    const sampleScript = `INT. COFFEE SHOP - DAY\nALEX drinks Coca-Cola.\n\nEXT. STREET - NIGHT\nJORDAN drives a Porsche and drinks Coca-Cola.`;

    const res = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: sampleScript });

    expect(res.status).toBe(200);
    expect(res.body.scenesParsed).toBeGreaterThanOrEqual(2);
    expect(res.body.canonicalEntitiesExtracted).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.entities)).toBe(true);
  });
});
