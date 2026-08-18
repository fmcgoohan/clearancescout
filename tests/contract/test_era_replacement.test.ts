import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Era-Appropriate Replacement Brand & Artwork Card Generation', () => {
  let projectId: string;
  let entityId: string;

  beforeEach(async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Replacement Project',
        productionCompany: 'Retro Films',
        scriptVersion: 'v1.0',
        executionMode: 'TEST_MODE',
      });
    projectId = projRes.body.id;

    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: 'INT. DINER - DAY\nCharacter drinks a Coca-Cola from a vintage bottle.',
        format: 'PLAINTEXT',
      });

    entityId = scriptRes.body.entities[0].id;
  });

  it('should generate an era-appropriate fictional brand concept and visual artwork image URL', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({
        canonicalEntityId: entityId,
        eraAesthetic: '1970s Vintage Diner',
      });

    expect(res.status).toBe(200);
    expect(res.body.fictionalBrandName).toBeDefined();
    expect(res.body.designBrief).toBeDefined();
    expect(res.body.eraAesthetic).toBe('1970s Vintage Diner');
    expect(res.body.artworkImageUrl).toContain('data:image/');
    expect(res.body.nonInfringementRationale).toBeDefined();
    expect(['PROPOSED', 'APPROVED']).toContain(res.body.status);
    expect(res.body.selfClearanceResult).toBe('ACCEPTED');
  });
});
