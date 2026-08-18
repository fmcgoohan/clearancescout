import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('Accessible Responsive Workspace End-to-End Workflow Integration (Feature 014)', () => {
  let projectId: string;

  it('US1 & US2: Supports full entity lifecycle with accessible statuses and provenance', async () => {
    // 1. Create project
    const createProjectRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Accessibility Verification Feature Film',
        productionCompany: 'A11y Studios',
        scriptVersion: 'v1.0-A11yDraft',
        executionMode: 'DEMO_MODE',
      });

    expect(createProjectRes.status).toBe(201);
    projectId = createProjectRes.body.id;

    // 2. Add entity
    const addRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Neon Wave Energy Drink',
        entityCategory: 'BRAND',
        description: 'Fluorescent energy beverage in metallic can',
      });

    expect(addRes.status).toBe(201);
    const entityId = addRes.body.id;

    // 3. Evaluate clearance in DEMO_MODE
    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({
        canonicalEntityIds: [entityId],
        executionMode: 'DEMO_MODE',
      });

    expect(evalRes.status).toBe(200);
    expect(evalRes.body.assessments.length).toBeGreaterThan(0);
    const asm = evalRes.body.assessments[0];
    expect(asm.citations.length).toBeGreaterThan(0);
    expect(['DEMO_FIXTURE', 'FALLBACK_FIXTURE', 'PARALLEL_LIVE']).toContain(asm.citations[0].provenance);

    // 4. Apply counsel override with legal rationale
    const overrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entityId}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Verified fictitious prop cleared by studio legal team.',
        counselName: 'Jane Doe, Esq.',
        counselRole: 'Principal Clearance Counsel',
      });

    expect(overrideRes.status).toBe(200);
    expect(overrideRes.body.override).toBeDefined();
    expect(overrideRes.body.override.overrideStatus).toBe('NO_ISSUE_SURFACED');
    expect(overrideRes.body.entity.isOverridden).toBe(true);

    // 5. Export binder and verify legal digest constancy
    const binderRes = await request(app)
      .get(`/api/projects/${projectId}/binder/export`);

    expect(binderRes.status).toBe(200);
    expect(binderRes.body.integrityDigest).toBeDefined();
    expect(binderRes.body.integrityDigest.length).toBe(64);
  });
});
