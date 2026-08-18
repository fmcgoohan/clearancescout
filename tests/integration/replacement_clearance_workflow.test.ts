import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Integration: Replacement Brand Candidate Self-Clearance Workflow', () => {
  it('should execute full candidate verification loop: single-attempt clear, multi-attempt rejection, and max-attempt escalation to legal counsel', async () => {
    // 1. Create Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Replacement Integration Feature',
        productionCompany: 'Warner Bros. Pictures',
        scriptVersion: 'v1.0',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest Script with multiple branded entities
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: 'INT. GARAGE - DAY\nAlex repairs a vintage Porsche while drinking a cold Coca-Cola.',
        format: 'PLAINTEXT',
      });
    expect(scriptRes.status).toBe(200);
    const porscheEntity = scriptRes.body.entities.find((e: any) => e.canonicalName.toLowerCase().includes('porsche'));
    expect(porscheEntity).toBeDefined();

    // 3. Generate replacement for Porsche (clears on attempt 1 -> Veloce GT)
    const porscheRepRes = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({
        canonicalEntityId: porscheEntity.id,
        eraAesthetic: '1970s Vintage Euro',
      });

    expect(porscheRepRes.status).toBe(200);
    expect(porscheRepRes.body.selfClearanceResult).toBe('ACCEPTED');
    expect(porscheRepRes.body.clearanceStatus).toBe('NO_ISSUE_SURFACED');
    expect(porscheRepRes.body.totalAttempts).toBe(1);
    expect(porscheRepRes.body.attemptHistory.length).toBe(1);
    expect(porscheRepRes.body.attemptHistory[0].clearanceStatus).toBe('NO_ISSUE_SURFACED');
    expect(porscheRepRes.body.citations.length).toBeGreaterThanOrEqual(1);

    // 4. Verify entity in registry now has replacementCard attached
    const entitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    expect(entitiesRes.status).toBe(200);
    const updatedPorsche = entitiesRes.body.find((e: any) => e.id === porscheEntity.id);
    expect(updatedPorsche.replacementCard).toBeDefined();
    expect(updatedPorsche.replacementCard.fictionalBrandName).toBe(porscheRepRes.body.fictionalBrandName);

    // 5. Test 3-Attempt Bounding & Escalation for Colliding Entity
    const collScriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: 'INT. WAREHOUSE - NIGHT\nJordan checks a box of [COLLISION] Goods.',
        format: 'PLAINTEXT',
      });
    const collidingEntity = collScriptRes.body.entities.find((e: any) => e.canonicalName.includes('[COLLISION]')) || collScriptRes.body.entities[0];

    const collRepRes = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({
        canonicalEntityId: collidingEntity.id,
        eraAesthetic: 'Modern Industrial',
      });

    expect(collRepRes.status).toBe(200);
    expect(collRepRes.body.totalAttempts).toBe(3);
    expect(collRepRes.body.attemptHistory.length).toBe(3);
    expect(collRepRes.body.selfClearanceResult).toBe('ESCALATED_TO_COUNSEL');
    expect(collRepRes.body.clearanceStatus).not.toBe('NO_ISSUE_SURFACED');

    // 6. Verify Timeline events recorded strictly authorized event types
    const timelineRes = await request(app).get(`/api/projects/${projectId}/timeline`);
    expect(timelineRes.status).toBe(200);
    const timelineTypes = timelineRes.body.events.map((e: any) => e.eventType);
    expect(timelineTypes).toContain('REPLACEMENT_ATTEMPT');
    expect(timelineTypes).toContain('REPLACEMENT_RESEARCH_STARTED');
    expect(timelineTypes).toContain('REPLACEMENT_REJECTED');
    expect(timelineTypes).toContain('REPLACEMENT_ACCEPTED');
  });
});
