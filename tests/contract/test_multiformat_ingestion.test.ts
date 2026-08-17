import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Multi-Format Screenplay Ingestion & 5-Category Extraction', () => {
  let projectId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({
        title: 'Multi-Format Test Script',
        productionCompany: 'Spec Studios',
        scriptVersion: 'v1.0-Fountain',
        executionMode: 'TEST_MODE',
      });
    projectId = res.body.id;
  });

  it('should parse Fountain format script and extract entities across multiple categories', async () => {
    const fountainScript = `
.INT. COFFEE SHOP - DAY
ALEX sits by the window drinking a bottle of Coca-Cola while listening to Bohemian Rhapsody on an Apple iPad.

.EXT. CITY STREET - NIGHT
JORDAN walks past the Empire State Building holding an Acme Explosives warning label.
`;

    const res = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: fountainScript,
        format: 'FOUNTAIN',
      });

    expect(res.status).toBe(200);
    expect(res.body.scenesParsed).toBe(2);
    expect(res.body.entities.length).toBeGreaterThanOrEqual(4);

    const categories = res.body.entities.map((e: any) => e.entityCategory);
    expect(categories).toContain('BRAND');
    expect(categories).toContain('ART_MUSIC');
    expect(categories).toContain('PROPRIETARY_LOCATION');
    expect(categories).toContain('GRAPHIC_PROP');
  });

  it('should deduplicate multiple mentions across scenes into a single canonical entity', async () => {
    const multiSceneScript = `
INT. DINER - DAY
ALEX orders a Coca-Cola.

EXT. PARKING LOT - DAY
ALEX finishes the can of Coca-Cola and throws it away.
`;

    const res = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: multiSceneScript,
        format: 'PLAINTEXT',
      });

    expect(res.status).toBe(200);
    expect(res.body.scenesParsed).toBe(2);
    const cokeEntities = res.body.entities.filter((e: any) => e.canonicalName.toLowerCase().includes('coca-cola'));
    expect(cokeEntities.length).toBe(1);
  });
});
