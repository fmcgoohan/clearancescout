import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Bundled Fictional Demo Screenplay Fixture', () => {
  it('GET /api/fixtures/demo-screenplay - should return the bundled fictional screenplay', async () => {
    const res = await request(app).get('/api/fixtures/demo-screenplay');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body.title).toBe('The Neon Horizon');
    expect(res.body).toHaveProperty('scriptText');
    expect(res.body.scriptText).toContain('Summit Cola');
    expect(res.body.scriptText).toContain('AeroTech Prism Laptop');
    expect(res.body.scriptText).toContain('Veloce GT');
    expect(res.body.scriptText).toContain('Midtown Spire Tower');
    expect(res.body.scriptText).toContain('Elena Vance');
    expect(res.body.scriptText).toContain('Nocturne of the Wild');
    expect(res.body.scriptText).toContain('Titan Industrial Hazard Placard');
  });

  it('POST /api/projects/:id/script with demo screenplay - should extract 5 clearance categories cleanly', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Demo Script Project',
        productionCompany: 'Entrant Studios',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    const fixtureRes = await request(app).get('/api/fixtures/demo-screenplay');
    const scriptText = fixtureRes.body.scriptText;

    const parseRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });

    expect(parseRes.status).toBe(200);
    expect(parseRes.body.scenesParsed).toBeGreaterThanOrEqual(3);
    expect(parseRes.body.entities.length).toBeGreaterThanOrEqual(5);

    const categories = parseRes.body.entities.map((e: any) => e.entityCategory);
    expect(categories).toContain('BRAND');
    expect(categories).toContain('ART_MUSIC');
    expect(categories).toContain('PUBLIC_FIGURE');
    expect(categories).toContain('PROPRIETARY_LOCATION');
    expect(categories).toContain('GRAPHIC_PROP');
  });
});
