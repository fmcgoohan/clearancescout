import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Entity Mutation API (Add, Edit, Delete, Invalidation)', () => {
  it('POST /api/projects/:id/entities - should manually add a clearance item', async () => {
    const projRes = await request(app).post('/api/projects').send({
      title: 'Mutation Contract Project',
      productionCompany: 'Entrant Studios',
      executionMode: 'DEMO_MODE',
    });
    const projectId = projRes.body.id;

    const createRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Veloce Custom Spoiler',
        entityCategory: 'GRAPHIC_PROP',
        description: 'Aftermarket branded spoiler',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty('id');
    expect(createRes.body.canonicalName).toBe('Veloce Custom Spoiler');
    expect(createRes.body.entityCategory).toBe('GRAPHIC_PROP');
    expect(createRes.body.origin).toBe('MANUALLY_ADDED');
    expect(createRes.body.overallClearanceStatus).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('PATCH /api/projects/:id/entities/:entityId - should update name and invalidate automated assessment', async () => {
    const projRes = await request(app).post('/api/projects').send({
      title: 'Edit Contract Project',
      productionCompany: 'Entrant Studios',
      executionMode: 'DEMO_MODE',
    });
    const projectId = projRes.body.id;

    const createRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Coca-Cola',
        entityCategory: 'BRAND',
      });
    const entityId = createRes.body.id;

    // Simulate clearance evaluation
    await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [entityId] });

    // Update entity name to Pepsi
    const updateRes = await request(app)
      .patch(`/api/projects/${projectId}/entities/${entityId}`)
      .send({
        canonicalName: 'Pepsi-Cola',
        entityCategory: 'BRAND',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.canonicalName).toBe('Pepsi-Cola');
    expect(updateRes.body.origin).toBe('USER_EDITED');
    expect(updateRes.body.overallClearanceStatus).toBe('INSUFFICIENT_EVIDENCE'); // Reset for re-evaluation
  });

  it('PATCH /api/projects/:id/entities/:entityId - should preserve counsel overrides upon edit', async () => {
    const projRes = await request(app).post('/api/projects').send({
      title: 'Override Preserve Project',
      productionCompany: 'Entrant Studios',
      executionMode: 'DEMO_MODE',
    });
    const projectId = projRes.body.id;

    const createRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Rolex Watch',
        entityCategory: 'BRAND',
      });
    const entityId = createRes.body.id;

    // Record counsel override on entity
    const ovrRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entityId}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Studio product placement agreement signed.',
        counselName: 'Jane Doe, Esq.',
      });
    expect(ovrRes.status).toBe(200);

    // Update entity description/name
    const updateRes = await request(app)
      .patch(`/api/projects/${projectId}/entities/${entityId}`)
      .send({
        canonicalName: 'Rolex Submariner Watch',
        description: 'Updated hero prop description',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.canonicalName).toBe('Rolex Submariner Watch');
    expect(updateRes.body.isOverridden).toBe(true);
    expect(updateRes.body.overallClearanceStatus).toBe('NO_ISSUE_SURFACED'); // Override preserved!
  });

  it('DELETE /api/projects/:id/entities/:entityId - should delete clearance item', async () => {
    const projRes = await request(app).post('/api/projects').send({
      title: 'Delete Contract Project',
      productionCompany: 'Entrant Studios',
      executionMode: 'DEMO_MODE',
    });
    const projectId = projRes.body.id;

    const createRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Temporary Prop',
        entityCategory: 'GRAPHIC_PROP',
      });
    const entityId = createRes.body.id;

    const delRes = await request(app).delete(`/api/projects/${projectId}/entities/${entityId}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.deleted).toBe(true);

    const listRes = await request(app).get(`/api/projects/${projectId}/entities`);
    const ids = listRes.body.map((e: any) => e.id);
    expect(ids).not.toContain(entityId);
  });
});
