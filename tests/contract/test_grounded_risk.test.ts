import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Live Grounding & Contextual Risk Engine', () => {
  let projectId: string;
  let entityId: string;

  beforeEach(async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Risk Evaluation Project',
        productionCompany: 'Grounding Media',
        scriptVersion: 'v1.0',
        executionMode: 'TEST_MODE',
      });
    projectId = projRes.body.id;

    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({
        scriptText: 'INT. DINER - DAY\nJORDAN drinks a bottle of Coca-Cola.',
        format: 'PLAINTEXT',
      });

    entityId = scriptRes.body.entities[0].id;
  });

  it('should evaluate clearance risk and attach corporate owner citations with disclaimer', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({
        canonicalEntityIds: [entityId],
      });

    expect(res.status).toBe(200);
    expect(res.body.assessments.length).toBe(1);

    const asm = res.body.assessments[0];
    expect(asm.canonicalEntityId).toBe(entityId);
    expect(asm.riskStatus).toBe('ACTION_REQUIRED');
    expect(asm.citations.length).toBeGreaterThanOrEqual(1);

    const cit = asm.citations[0];
    expect(cit.sourceUrl).toBeDefined();
    expect(cit.corporateOwner).toBeDefined();
    expect(asm.disclaimer).toContain('does not render formal legal advice');
  });
});
