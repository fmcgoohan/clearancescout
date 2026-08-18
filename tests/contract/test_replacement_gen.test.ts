import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Replacement Brand Concept Card & Self-Clearance Loop', () => {
  let projectId: string;
  let entityId: string;

  beforeEach(async () => {
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

  it('POST /api/projects/:id/replacements/generate - should execute self-clearance loop and accept clean candidate on attempt 1', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({ canonicalEntityId: entityId, eraAesthetic: '1970s Vintage' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('fictionalBrandName');
    expect(res.body).toHaveProperty('artworkImageUrl');
    expect(res.body).toHaveProperty('selfClearanceResult');
    expect(res.body.selfClearanceResult).toBe('ACCEPTED');
    expect(res.body.clearanceStatus).toBe('NO_ISSUE_SURFACED');
    expect(res.body.totalAttempts).toBe(1);
    expect(res.body.attemptHistory).toHaveLength(1);
    expect(res.body.attemptHistory[0].candidateName).toBe(res.body.fictionalBrandName);
    expect(res.body.citations.length).toBeGreaterThanOrEqual(1);
  });

  it('should enforce deterministic 3-attempt ceiling and escalate to legal counsel when candidates fail clearance', async () => {
    // Create an entity configured to trigger collisions on candidates
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: 'INT. STREET - NIGHT\nJohn drinks from a can of [COLLISION] Soda.' });

    const collidingEntityId = scriptRes.body.entities.find((e: any) => e.canonicalName.includes('[COLLISION]'))?.id || scriptRes.body.entities[0].id;

    const res = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({ canonicalEntityId: collidingEntityId });

    expect(res.status).toBe(200);
    expect(res.body.totalAttempts).toBe(3);
    expect(res.body.attemptHistory).toHaveLength(3);
    expect(res.body.selfClearanceResult).toBe('ESCALATED_TO_COUNSEL');
    expect(res.body.clearanceStatus).not.toBe('NO_ISSUE_SURFACED');
    expect(res.body.fictionalBrandName).toBe(res.body.attemptHistory[2].candidateName);
    expect(res.body.attemptHistory[0].collisionRationale).toBeDefined();
  });
});
