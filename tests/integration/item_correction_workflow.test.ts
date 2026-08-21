import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Integration: Manual Clearance Item Correction Workflow (Add, Edit, Delete, Invalidate, Binder)', () => {
  it('should support full item correction lifecycle: edit with invalidation, manual addition, deletion, and binder export', async () => {
    // 1. Create project & Ingest demo script
    const projRes = await request(app).post('/api/projects').send({
      title: 'Correction Integration Project',
      productionCompany: 'Entrant Studios',
      executionMode: 'DEMO_MODE',
    });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    const fixtureRes = await request(app).get('/api/fixtures/demo-screenplay');
    const parseRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: fixtureRes.body.scriptText, format: 'PLAINTEXT' });
    expect(parseRes.status).toBe(200);

    const initialEntities = parseRes.body.entities;
    const summitEntity = initialEntities.find((e: any) => e.canonicalName === 'Summit Cola');
    expect(summitEntity).toBeDefined();

    // 2. Evaluate initial clearance for Summit Cola
    const eval1Res = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [summitEntity.id] });
    expect(eval1Res.status).toBe(200);

    // 3. Edit entity: change name to "Apex Energy Drink"
    const editRes = await request(app)
      .patch(`/api/projects/${projectId}/entities/${summitEntity.id}`)
      .send({
        canonicalName: 'Apex Energy Drink',
        entityCategory: 'BRAND',
        description: 'Co-branded energy drink in glass bottle',
      });
    expect(editRes.status).toBe(200);
    expect(editRes.body.canonicalName).toBe('Apex Energy Drink');
    expect(editRes.body.origin).toBe('USER_EDITED');
    expect(editRes.body.overallClearanceStatus).toBe('INSUFFICIENT_EVIDENCE'); // Invalidation verified!

    // 4. Evaluate clearance on edited entity
    const eval2Res = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [summitEntity.id] });
    expect(eval2Res.status).toBe(200);
    expect(eval2Res.body.assessments.length).toBe(1);
    expect(eval2Res.body.assessments[0].canonicalEntityId).toBe(summitEntity.id);
    expect(eval2Res.body.assessments[0].riskStatus).toBeDefined();

    // 5. Manually add a new unscripted clearance item
    const addRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Cyberdyne Security Badge',
        entityCategory: 'GRAPHIC_PROP',
        description: 'Laminated visitor badge worn on lapel',
      });
    expect(addRes.status).toBe(201);
    expect(addRes.body.canonicalName).toBe('Cyberdyne Security Badge');
    expect(addRes.body.origin).toBe('MANUALLY_ADDED');
    const addedEntityId = addRes.body.id;

    // 6. Delete an unwanted entity (e.g. Veloce GT)
    const veloceEntity = initialEntities.find((e: any) => e.canonicalName.includes('Veloce'));
    expect(veloceEntity).toBeDefined();

    const delRes = await request(app).delete(`/api/projects/${projectId}/entities/${veloceEntity.id}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.deleted).toBe(true);

    // 7. Verify entity list
    const listRes = await request(app).get(`/api/projects/${projectId}/entities`);
    expect(listRes.status).toBe(200);
    const allNames = listRes.body.map((e: any) => e.canonicalName);
    expect(allNames).toContain('Apex Energy Drink');
    expect(allNames).toContain('Cyberdyne Security Badge');
    expect(allNames).not.toContain('Summit Cola');
    expect(allNames).not.toContain('Veloce GT');

    // 8. Compile and export clearance binder
    const binderRes = await request(app).get(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    const binderEntities = binderRes.body.canonicalEntities.map((e: any) => e.canonicalName);
    expect(binderEntities).toContain('Apex Energy Drink');
    expect(binderEntities).toContain('Cyberdyne Security Badge');
    expect(binderEntities).not.toContain('Veloce GT');
    expect(binderRes.body.integrityDigest).toBeDefined();
    expect(binderRes.body.integrityDigest).toHaveLength(64);
  });
});
