import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('Clearance Evaluation & Citation Contract API', () => {
  let projectId: string;
  let entityId: string;

  it('Setup: Create project and upload script', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Clearance Test Project',
        productionCompany: 'Test Co',
        executionMode: 'DEMO_MODE',
      });
    projectId = projRes.body.id;

    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: 'INT. BAR - NIGHT\nALEX drinks Coca-Cola in dangerous scene.' });
    
    entityId = scriptRes.body.entities[0].id;
  });

  it('POST /api/projects/:id/clearance/evaluate - should evaluate entity and return citations', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [entityId] });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.assessments)).toBe(true);
    expect(res.body.assessments.length).toBe(1);

    const asm = res.body.assessments[0];
    expect(asm).toHaveProperty('riskStatus');
    expect(asm).toHaveProperty('disclaimer');
    expect(asm.disclaimer).toContain('does not render formal legal advice');
    expect(Array.isArray(asm.citations)).toBe(true);
    expect(asm.citations.length).toBeGreaterThan(0);
    expect(asm.citations[0]).toHaveProperty('sourceUrl');
  });
});
