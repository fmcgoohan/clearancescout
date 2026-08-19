import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { rightsRepo } from '../../server/repositories/RightsRepo.js';

describe('Contract: Rights & Restrictions Domain Objects (Feature 016 Phase 4)', () => {
  it('FR-005: creates, retrieves, updates, and deletes rights records with territorial and media terms', async () => {
    // 1. Create project & entity
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Rights Contract Test Project',
        productionCompany: 'Universal Films',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    const entRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Summit Cola',
        entityCategory: 'BRAND',
        description: 'Beverage placement',
      });
    const entityId = entRes.body.id;

    // 2. Create Rights record
    const createRightsRes = await request(app)
      .post(`/api/projects/${projectId}/rights`)
      .send({
        canonicalEntityId: entityId,
        licensorName: 'Summit Beverages LLC',
        grantType: 'NON_EXCLUSIVE',
        territory: 'WORLDWIDE',
        mediaWindow: 'ALL_MEDIA_IN_PERPETUITY',
        effectiveDate: '2026-01-01',
        isPerpetual: true,
        covenants: ['No defamatory depiction', 'End credit required'],
        feeAmount: 12000,
        currency: 'USD',
        status: 'ACTIVE',
      });
    expect(createRightsRes.status).toBe(201);
    expect(createRightsRes.body.id).toMatch(/^rgt-/);
    expect(createRightsRes.body.licensorName).toBe('Summit Beverages LLC');
    expect(createRightsRes.body.territory).toBe('WORLDWIDE');
    expect(createRightsRes.body.covenants).toHaveLength(2);
    const rightsId = createRightsRes.body.id;

    // 3. List rights by project
    const listProjRes = await request(app).get(`/api/projects/${projectId}/rights`);
    expect(listProjRes.status).toBe(200);
    expect(listProjRes.body.some((r: any) => r.id === rightsId)).toBe(true);

    // 4. List rights by entity
    const listEntRes = await request(app).get(`/api/projects/${projectId}/entities/${entityId}/rights`);
    expect(listEntRes.status).toBe(200);
    expect(listEntRes.body).toHaveLength(1);
    expect(listEntRes.body[0].canonicalEntityId).toBe(entityId);

    // 5. Retrieve single rights record
    const getSingleRes = await request(app).get(`/api/projects/${projectId}/rights/${rightsId}`);
    expect(getSingleRes.status).toBe(200);
    expect(getSingleRes.body.id).toBe(rightsId);

    // 6. Update rights record
    const patchRes = await request(app)
      .patch(`/api/projects/${projectId}/rights/${rightsId}`)
      .send({
        status: 'EXPIRED',
        covenants: ['Historical archive only'],
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe('EXPIRED');
    expect(patchRes.body.covenants).toContain('Historical archive only');

    // 7. Delete rights record
    const deleteRes = await request(app).delete(`/api/projects/${projectId}/rights/${rightsId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.deleted).toBe(true);

    const checkDeleted = await request(app).get(`/api/projects/${projectId}/rights/${rightsId}`);
    expect(checkDeleted.status).toBe(404);
  });

  it('FR-005: evaluates rights coverage deterministically across entities and scene occurrences', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Rights Evaluation Test',
        productionCompany: 'StreamWorks',
        projectType: 'TV Show',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    const entRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Nocturne of the Wild',
        entityCategory: 'ART_MUSIC',
        description: 'Featured theme song',
      });
    const entityId = entRes.body.id;

    // Attach active license with covenants
    await rightsRepo.createRightsRecord(projectId, {
      canonicalEntityId: entityId,
      licensorName: 'Atlas Music Publishing',
      grantType: 'NON_EXCLUSIVE',
      territory: 'NORTH_AMERICA',
      mediaWindow: 'THEATRICAL_SVOD',
      effectiveDate: '2026-01-01',
      expirationDate: '2029-12-31',
      isPerpetual: false,
      covenants: ['Max 45 seconds sync duration', 'End credit required'],
      status: 'ACTIVE',
    });

    const coverage = await rightsRepo.evaluateRightsCoverage(projectId, entityId);
    expect(coverage.isCovered).toBe(true);
    expect(coverage.activeRights).toHaveLength(1);
    expect(coverage.covenants).toContain('Max 45 seconds sync duration');
    expect(coverage.summaryText).toContain('Atlas Music Publishing');
  });
});
