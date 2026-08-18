import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Integration: Failed Research Retry Workflow', () => {
  it('should support targeted research retry with sibling isolation, override preservation, and binder export', async () => {
    // 1. Create project
    const projRes = await request(app).post('/api/projects').send({
      title: 'Retry Integration Project',
      productionCompany: 'Entrant Studios',
      executionMode: 'DEMO_MODE',
    });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest screenplay
    const fixtureRes = await request(app).get('/api/fixtures/demo-screenplay');
    const parseRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: fixtureRes.body.scriptText, format: 'PLAINTEXT' });
    expect(parseRes.status).toBe(200);

    const initialEntities = parseRes.body.entities;
    const summitEntity = initialEntities.find((e: any) => e.canonicalName === 'Summit Cola');
    const aerotechEntity = initialEntities.find((e: any) => e.canonicalName.includes('AeroTech'));
    expect(summitEntity).toBeDefined();
    expect(aerotechEntity).toBeDefined();

    // 3. Evaluate only Summit Cola
    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [summitEntity.id] });
    expect(evalRes.status).toBe(200);

    // Verify aerotechEntity is still INSUFFICIENT_EVIDENCE
    const listRes1 = await request(app).get(`/api/projects/${projectId}/entities`);
    const fetchedAerotech1 = listRes1.body.find((e: any) => e.id === aerotechEntity.id);
    expect(fetchedAerotech1.overallClearanceStatus).toBe('INSUFFICIENT_EVIDENCE');

    // 4. Trigger single-item retry for AeroTech Laptop
    const retryRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${aerotechEntity.id}/retry-research`);
    expect(retryRes.status).toBe(200);
    expect(retryRes.body.entity.id).toBe(aerotechEntity.id);
    expect(retryRes.body.assessment).toBeDefined();
    expect(retryRes.body.assessment.citations.length).toBeGreaterThan(0);

    // 5. Verify sibling entity (Summit Cola) remained unaffected
    const listRes2 = await request(app).get(`/api/projects/${projectId}/entities`);
    const fetchedSummit2 = listRes2.body.find((e: any) => e.id === summitEntity.id);
    const fetchedAerotech2 = listRes2.body.find((e: any) => e.id === aerotechEntity.id);
    expect(fetchedSummit2.overallClearanceStatus).not.toBe('INSUFFICIENT_EVIDENCE');
    expect(fetchedAerotech2.overallClearanceStatus).not.toBe('INSUFFICIENT_EVIDENCE');

    // 6. Test Counsel Override Preservation on Retry
    // Record override on AeroTech
    const ovrRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${aerotechEntity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Studio signed product placement release with hardware vendor.',
        counselName: 'Jane Doe, Esq.',
      });
    expect(ovrRes.status).toBe(200);

    // Invalidate automated assessment via edit
    await request(app)
      .patch(`/api/projects/${projectId}/entities/${aerotechEntity.id}`)
      .send({ description: 'Updated prop placement notes' });

    // Retry research on AeroTech
    const retryRes2 = await request(app)
      .post(`/api/projects/${projectId}/entities/${aerotechEntity.id}/retry-research`);
    expect(retryRes2.status).toBe(200);
    // Entity overall status remains NO_ISSUE_SURFACED because of counsel override!
    expect(retryRes2.body.entity.isOverridden).toBe(true);
    expect(retryRes2.body.entity.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');

    // 7. Verify Timeline Events contain RESEARCH_RETRY_STARTED
    const timelineRes = await request(app).get(`/api/projects/${projectId}/timeline`);
    expect(timelineRes.status).toBe(200);
    const retryEvents = timelineRes.body.events.filter((evt: any) => evt.eventType === 'RESEARCH_RETRY_STARTED');
    expect(retryEvents.length).toBeGreaterThan(0);

    // 8. Compile and export Clearance Binder
    const binderRes = await request(app).get(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    expect(binderRes.body.integrityDigest).toBeDefined();
    expect(binderRes.body.integrityDigest).toHaveLength(64);
    expect(binderRes.body.canonicalEntities.length).toBeGreaterThanOrEqual(2);
  });
});
