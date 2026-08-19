import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { rightsRepo } from '../../server/repositories/RightsRepo.js';
import { placeholderRepo } from '../../server/repositories/PlaceholderRepo.js';

describe('Contract: Production Operations Dashboard (Feature 016 Phase 9)', () => {
  it('GET /api/projects/:id/dashboard returns consolidated KPIs, blockers, expiring rights, and department summary', async () => {
    // 1. Create a Movie Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Executive Dashboard Odyssey',
        productionCompany: 'Specter Media Corp',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest 3-scene script (Scene 1: clean; Scene 2: Coca-Cola; Scene 3: AeroTech Laptop)
    const scriptText = `
INT. OFFICE - DAY
Maria writes notes at her desk.

INT. DINER - NIGHT
Leo drinks a cold can of Coca-Cola with ice.

INT. APARTMENT - NIGHT
Alex types on an AeroTech Prism Laptop.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const cokeEntity = entities.find((e) => e.canonicalName.includes('Coca-Cola'));
    const laptopEntity = entities.find((e) => e.canonicalName.includes('AeroTech Prism Laptop') || e.canonicalName.includes('AeroTech'));
    expect(cokeEntity).toBeDefined();
    expect(laptopEntity).toBeDefined();

    // 3. Attach a placeholder to Laptop (TEMP_APPROVED)
    const phRes = await request(app)
      .post(`/api/projects/${projectId}/placeholders`)
      .send({
        canonicalEntityId: laptopEntity!.id,
        assetCategory: 'BRAND',
        fictionalName: 'Summit Pop',
        description: 'Retro 80s laptop prop',
        clearanceTier: 'TEMP_APPROVED',
        creativeRationale: 'Period prop replacement',
        approvedBy: 'Alex Turner (Art Director)',
        approvedRole: 'ART_DEPARTMENT',
      });
    expect(phRes.status).toBe(201);

    // 4. Attach an Expiring Rights agreement to Coca-Cola (expiring in 30 days)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const expirationDate = futureDate.toISOString().split('T')[0];

    const rightsRes = await request(app)
      .post(`/api/projects/${projectId}/rights`)
      .send({
        canonicalEntityId: cokeEntity!.id,
        licensorName: 'Beverage Brands LLC',
        grantType: 'NON_EXCLUSIVE',
        territory: 'WORLDWIDE',
        mediaWindow: 'THEATRICAL_SVOD',
        effectiveDate: '2026-01-01',
        expirationDate,
        isPerpetual: false,
        status: 'ACTIVE',
      });
    expect(rightsRes.status).toBe(201);

    // 5. Query Production Operations Dashboard
    const dashRes = await request(app).get(`/api/projects/${projectId}/dashboard`);
    expect(dashRes.status).toBe(200);
    const dash = dashRes.body;

    expect(dash.projectId).toBe(projectId);
    expect(dash.projectTitle).toBe('Executive Dashboard Odyssey');
    expect(dash.projectType).toBe('Movie');

    // Verify KPIs
    expect(dash.kpis.totalScenes).toBe(3);
    expect(dash.kpis.finalClearScenes).toBe(2); // Clean scene 1 + rights-cleared scene 2
    expect(dash.kpis.workingClearScenes).toBe(1); // TEMP_APPROVED scene 3
    expect(dash.kpis.redScenes).toBe(0);
    expect(dash.kpis.readinessPercentage).toBeGreaterThanOrEqual(75);
    expect(dash.kpis.activePlaceholdersCount).toBe(1);
    expect(dash.kpis.rightsExpiringSoonCount).toBe(1);

    // Verify Active Placeholders
    expect(dash.activePlaceholders).toHaveLength(1);
    expect(dash.activePlaceholders[0].fictionalName).toBe('Summit Pop');
    expect(dash.activePlaceholders[0].clearanceTier).toBe('TEMP_APPROVED');

    // Verify Expiring Rights
    expect(dash.expiringRights).toHaveLength(1);
    expect(dash.expiringRights[0].licensor).toBe('Beverage Brands LLC');
    expect(dash.expiringRights[0].daysRemaining).toBeLessThanOrEqual(30);

    // Verify Scene Distribution
    expect(dash.sceneReadinessDistribution).toHaveLength(3);
  });
});
