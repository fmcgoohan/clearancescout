import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Contract: Feature 018 Structured Occurrence Context Interpretation', () => {
  it('should evaluate occurrence context and compute deterministic risk verdicts based on scene dramatic context', async () => {
    // 1. Create project in DEMO_MODE
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Context Interpretation Test Project',
        productionCompany: 'Cinematic Arts Legal',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Upload screenplay with two contrasting scenes for same brand
    const scriptText = `SCENE 1 - INT. COFFEE SHOP - DAY
Jordan sips a cool Summit Cola while reading a book in the quiet corner.

SCENE 2 - INT. LAB - NIGHT
Jordan drops the poisonous Summit Cola onto the floor as it exploded and caused a disaster.`;

    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });

    expect(scriptRes.status).toBe(200);

    // 3. Fetch occurrences
    const entitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    const summit = entitiesRes.body.find((e: any) => e.canonicalName.includes('Summit Cola'));
    expect(summit).toBeDefined();

    const occRes = await request(app).get(`/api/projects/${projectId}/entities/${summit.id}/occurrences`);
    expect(occRes.status).toBe(200);
    const occurrences = occRes.body.occurrences;
    expect(occurrences.length).toBe(2);

    const safeOcc = occurrences[0];
    const dangerOcc = occurrences[1];

    // 4. Evaluate Scene 1 occurrence (Neutral usage)
    const eval1Res = await request(app)
      .post(`/api/projects/${projectId}/occurrences/${safeOcc.id}/evaluate`);
    expect(eval1Res.status).toBe(200);
    expect(eval1Res.body.clearanceStatus).toBe('NO_ISSUE_SURFACED');
    expect(eval1Res.body.assessment.occurrenceContext).toBeDefined();
    expect(eval1Res.body.assessment.occurrenceContext.tone).toBe('NEUTRAL');

    // 5. Evaluate Scene 2 occurrence (Dangerous / Disparaging usage)
    const eval2Res = await request(app)
      .post(`/api/projects/${projectId}/occurrences/${dangerOcc.id}/evaluate`);
    expect(eval2Res.status).toBe(200);
    expect(eval2Res.body.clearanceStatus).toBe('ACTION_REQUIRED');
    expect(eval2Res.body.assessment.riskScore).toBeGreaterThanOrEqual(85);
    expect(eval2Res.body.assessment.occurrenceContext).toBeDefined();
    expect(eval2Res.body.assessment.occurrenceContext.tone).toBe('DISPARAGING');
    expect(eval2Res.body.assessment.contextFlags).toContain('DEFAMATION_RISK');
  });

  it('should cache and reuse canonical research across multiple scene occurrences consuming quota only once per entity', async () => {
    // 1. Create project in CLOUD_MODE
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Quota Caching Test Project',
        productionCompany: 'Cloud Hardened Studios',
        projectType: 'Movie',
        executionMode: 'CLOUD_MODE',
      });
    const projectId = projRes.body.id;

    // 2. Upload screenplay with two occurrences of the same entity
    const scriptText = `SCENE 1 - INT. OFFICE - DAY
Alex sets down the Summit Cola.

SCENE 2 - EXT. STREET - NIGHT
Alex opens another Summit Cola in the car.`;

    await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });

    const entitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    const summit = entitiesRes.body.find((e: any) => e.canonicalName.includes('Summit Cola'));
    expect(summit).toBeDefined();

    const occRes = await request(app).get(`/api/projects/${projectId}/entities/${summit.id}/occurrences`);
    const occs = occRes.body.occurrences;
    expect(occs.length).toBe(2);

    // Initial quota used
    const p1 = await request(app).get(`/api/projects/${projectId}`);
    const initialUsed = p1.body.liveQuotaUsed || 0;

    // Evaluate first occurrence
    await request(app).post(`/api/projects/${projectId}/occurrences/${occs[0].id}/evaluate`);

    const p2 = await request(app).get(`/api/projects/${projectId}`);
    const usedAfterFirst = p2.body.liveQuotaUsed || 0;
    expect(usedAfterFirst).toBe(initialUsed + 1);

    // Evaluate second occurrence of the same entity -> should reuse canonical cache and NOT consume additional quota
    await request(app).post(`/api/projects/${projectId}/occurrences/${occs[1].id}/evaluate`);

    const p3 = await request(app).get(`/api/projects/${projectId}`);
    const usedAfterSecond = p3.body.liveQuotaUsed || 0;
    expect(usedAfterSecond).toBe(usedAfterFirst); // Quota was consumed only once!
  });
});
