import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('SSE Timeline Contract API & Replacement Event Taxonomy', () => {
  let projectId: string;
  let entityId: string;

  it('Setup: Create project and entity', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({
        title: 'Timeline Contract Test',
        productionCompany: 'Test Co',
        executionMode: 'DEMO_MODE',
      });
    projectId = res.body.id;

    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: 'INT. OFFICE - DAY\nAlex checks his Rolex.' });
    entityId = scriptRes.body.entities[0].id;
  });

  it('POST /api/projects/:id/replacements/generate - should emit strict replacement events and return history without chain of thought', async () => {
    await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({ canonicalEntityId: entityId, eraAesthetic: '1980s Retro' });

    const res = await request(app).get(`/api/projects/${projectId}/timeline`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);

    const eventTypes = res.body.events.map((e: any) => e.eventType);
    expect(eventTypes).toContain('REPLACEMENT_ATTEMPT');
    expect(eventTypes).toContain('REPLACEMENT_RESEARCH_STARTED');
    expect(eventTypes).toContain('REPLACEMENT_ACCEPTED');

    res.body.events.forEach((evt: any) => {
      expect(evt).not.toHaveProperty('thought');
      expect(evt).not.toHaveProperty('thinking');
    });
  });
});
