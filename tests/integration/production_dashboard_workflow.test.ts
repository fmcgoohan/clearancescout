import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';

describe('Integration: Production Clearance Operations Dashboard Workflow (Feature 016 Phase 9)', () => {
  it('verifies full dashboard lifecycle: initial multi-scene blockers, KPI updates, and live mitigation resolution', async () => {
    // 1. Create a Commercial Production Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Cyberpunk Commercial Shoot',
        productionCompany: 'Specter Media Studio',
        projectType: 'Commercial',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest 3-scene screenplay
    const scriptText = `
INT. STUDIO - DAY
Actor speaks into the microphone.

INT. DINER - NIGHT
Actor takes a sip from a chilled Coca-Cola bottle.

EXT. CITY SKYLINE - NIGHT
In the background, Nocturne of the Wild plays through the radio.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const cokeEntity = entities.find((e) => e.canonicalName.includes('Coca-Cola'));
    const musicEntity = entities.find((e) => e.canonicalName.includes('Nocturne of the Wild'));
    expect(cokeEntity).toBeDefined();
    expect(musicEntity).toBeDefined();

    // 3. Initial Dashboard Query (Should show blockers)
    const initialDashRes = await request(app).get(`/api/projects/${projectId}/dashboard`);
    expect(initialDashRes.status).toBe(200);
    const initialDash = initialDashRes.body;

    expect(initialDash.kpis.totalScenes).toBe(3);
    expect(initialDash.kpis.finalClearScenes).toBe(1); // Clean Scene 1
    expect(initialDash.kpis.redScenes).toBe(2); // Scene 2 and Scene 3 blocked
    expect(initialDash.shootBlockers.length).toBeGreaterThanOrEqual(2);

    // 4. Mitigate Scene 3 with a Temporary Music Placeholder
    const phRes = await request(app)
      .post(`/api/projects/${projectId}/placeholders`)
      .send({
        canonicalEntityId: musicEntity!.id,
        assetCategory: 'ART_MUSIC',
        fictionalName: 'Echoes of Midnight',
        description: 'Original synth ambient track',
        clearanceTier: 'TEMP_APPROVED',
        creativeRationale: 'Safe on-set temp track',
        approvedBy: 'Music Supervisor',
        approvedRole: 'MUSIC_SUPERVISOR',
      });
    expect(phRes.status).toBe(201);

    // 5. Mitigate Scene 2 with a Rights Agreement (expiring in 60 days)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    const expirationDate = futureDate.toISOString().split('T')[0];

    const rightsRes = await request(app)
      .post(`/api/projects/${projectId}/rights`)
      .send({
        canonicalEntityId: cokeEntity!.id,
        licensorName: 'Beverage Corporation',
        grantType: 'NON_EXCLUSIVE',
        territory: 'WORLDWIDE',
        mediaWindow: 'ALL_MEDIA_IN_PERPETUITY',
        effectiveDate: '2026-01-01',
        expirationDate,
        isPerpetual: false,
        status: 'ACTIVE',
      });
    expect(rightsRes.status).toBe(201);

    // 6. Post-Mitigation Dashboard Query
    const postDashRes = await request(app).get(`/api/projects/${projectId}/dashboard`);
    expect(postDashRes.status).toBe(200);
    const postDash = postDashRes.body;

    // All blockers resolved
    expect(postDash.kpis.redScenes).toBe(0);
    expect(postDash.kpis.criticalBlockersCount).toBe(0);
    expect(postDash.shootBlockers).toHaveLength(0);

    // Working clear from temp placeholder + Final clear from rights + clean scene
    expect(postDash.kpis.finalClearScenes).toBe(2);
    expect(postDash.kpis.workingClearScenes).toBe(1);
    expect(postDash.kpis.readinessPercentage).toBeGreaterThanOrEqual(80);

    // Verify Active Placeholders & Expiring Rights
    expect(postDash.activePlaceholders).toHaveLength(1);
    expect(postDash.activePlaceholders[0].fictionalName).toBe('Echoes of Midnight');
    expect(postDash.expiringRights).toHaveLength(1);
    expect(postDash.expiringRights[0].licensor).toBe('Beverage Corporation');
  });
});
