import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('ClearanceScout End-to-End Integration Workflow', () => {
  let projectId: string;
  let entityId: string;

  it('Step 1: Project Creation', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({
        title: 'Full Heist Feature',
        productionCompany: 'Summit Studios',
        scriptVersion: 'v1.0-FinalDraft',
        executionMode: 'DEMO_MODE',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Full Heist Feature');
    projectId = res.body.id;
  });

  it('Step 2: Script Upload & Canonical Entity Deduplication', async () => {
    const sampleScript = `INT. COFFEE SHOP - DAY\nALEX drinks Coca-Cola while talking to JORDAN.\n\nEXT. CITY STREET - NIGHT\nJORDAN drives a Porsche 911. ALEX drinks Coca-Cola.`;

    const res = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: sampleScript });

    expect(res.status).toBe(200);
    expect(res.body.scenesParsed).toBe(2);
    expect(res.body.canonicalEntitiesExtracted).toBe(2);

    const cocaCola = res.body.entities.find((e: any) => e.canonicalName === 'Coca-Cola');
    expect(cocaCola).toBeDefined();
    expect(cocaCola.overallClearanceStatus).toBe('INSUFFICIENT_EVIDENCE');
    entityId = cocaCola.id;
  });

  it('Step 3: Grounded Trademark Research & Legal Risk Evaluation', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [entityId] });

    expect(res.status).toBe(200);
    const asm = res.body.assessments[0];
    expect(asm.riskStatus).toBe('ACTION_REQUIRED');
    expect(asm.citations.length).toBeGreaterThan(0);
    expect(asm.citations[0].sourceUrl).toContain('uspto.gov');
    expect(asm.disclaimer).toContain('does not render formal legal advice');
  });

  it('Step 4: Fictional Replacement Brand Card Generation', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/replacements/generate`)
      .send({ canonicalEntityId: entityId });

    expect(res.status).toBe(200);
    expect(res.body.fictionalBrandName).toBe('Summit Cola');
    expect(res.body.artworkImageUrl).toContain('data:image/svg+xml');
    expect(res.body.nonInfringementRationale).toBeDefined();
  });

  it('Step 5: Privacy Audit & Chain-of-Thought Sanitization', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/timeline`);
    expect(res.status).toBe(200);
    expect(res.body.events.length).toBeGreaterThan(0);

    const jsonString = JSON.stringify(res.body);
    expect(jsonString).not.toContain('"thought"');
    expect(jsonString).not.toContain('"thinking"');
    expect(jsonString).not.toContain('"chainOfThought"');
  });
});
