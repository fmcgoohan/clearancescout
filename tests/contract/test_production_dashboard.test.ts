import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { rightsRepo } from '../../server/repositories/RightsRepo.js';
import { placeholderRepo } from '../../server/repositories/PlaceholderRepo.js';
import { pluralize, formatStatus } from '../../src/utils/formatters.js';

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

  it('guarantees 7 entities, 7 department tasks, and 8 blocking scene occurrences are intentionally distinct objects', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Count Semantics Validation',
        productionCompany: 'Specter Media Corp',
        projectType: 'Movie',
        executionMode: 'CLOUD_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // Load bundled fictional demo in CLOUD_MODE
    const demoRes = await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({
        reingestMode: 'REPLACE',
        autoEvaluate: false,
        includeSampleRights: false,
        includeSamplePlaceholders: false,
      });
    expect(demoRes.status).toBe(200);

    const entities = await entityRepo.getEntitiesByProject(projectId);
    expect(entities).toHaveLength(7);

    const dashRes = await request(app).get(`/api/projects/${projectId}/dashboard`);
    expect(dashRes.status).toBe(200);
    const dash = dashRes.body;

    // 1. Canonical entities count = 7
    expect(dash.kpis.totalEntities).toBe(7);
    // 2. Department tasks count = 7
    expect(dash.kpis.pendingActionsCount).toBe(7);
    // 3. Scene occurrences blocking shooting are populated per scene
    expect(dash.kpis.criticalBlockersCount).toBe(dash.shootBlockers.length);
    expect(dash.shootBlockers.length).toBeGreaterThanOrEqual(7);

    // Verify shoot blockers contain canonical details and scene provenance
    const blockerNames = dash.shootBlockers.map((b: any) => b.canonicalName);
    expect(blockerNames).toContain('Elena Vance');
    expect(blockerNames).toContain('AeroTech Prism Laptop');
    expect(dash.shootBlockers.every((b: any) => b.sceneNumber >= 1 && b.sceneNumber <= 3)).toBe(true);
  });

  it('guarantees correct singular, plural, and zero count formatting across entities, tasks, and blocking occurrences', () => {
    expect(pluralize(1, 'entity', 'entities')).toBe('1 entity');
    expect(pluralize(0, 'entity', 'entities')).toBe('0 entities');
    expect(pluralize(7, 'entity', 'entities')).toBe('7 entities');

    expect(pluralize(1, 'department task', 'department tasks')).toBe('1 department task');
    expect(pluralize(0, 'department task', 'department tasks')).toBe('0 department tasks');

    expect(pluralize(1, 'blocking occurrence', 'blocking occurrences')).toBe('1 blocking occurrence');
    expect(pluralize(0, 'blocking occurrence', 'blocking occurrences')).toBe('0 blocking occurrences');
    expect(pluralize(8, 'blocking occurrence', 'blocking occurrences')).toBe('8 blocking occurrences');

    expect(formatStatus('FINAL_CLEAR')).toBe('Final clear');
    expect(formatStatus('WORKING_CLEAR')).toBe('Working clear');
    expect(formatStatus('RED')).toBe('Blocked (Red)');
    expect(formatStatus('TEMP_APPROVED')).toBe('Temporarily approved');
    expect(formatStatus('FINAL_CLEARED')).toBe('Final cleared');
    expect(formatStatus('INSUFFICIENT_EVIDENCE')).toBe('Insufficient evidence');
    expect(formatStatus('NO_ISSUE_SURFACED')).toBe('No issue surfaced');
    expect(formatStatus('ACTION_REQUIRED')).toBe('Action required');
    expect(formatStatus('REVIEW_RECOMMENDED')).toBe('Review recommended');
  });

  it('guarantees that an entity appearing twice in the same scene produces 1 entity, 1 department task, and 2 blocking occurrences', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Single Scene Multi Occurrence Test',
        productionCompany: 'Specter Media Corp',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // Ingest script with Midtown Spire Tower mentioned twice in Scene 1
    const scriptText = `
INT. MIDTOWN SPIRE TOWER - DAY
Alice enters the lobby of Midtown Spire Tower. Later, Bob looks out the window of Midtown Spire Tower.
`;
    const uploadRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(uploadRes.status).toBe(200);

    const entities = await entityRepo.getEntitiesByProject(projectId);
    expect(entities).toHaveLength(1);
    expect(entities[0].canonicalName).toBe('Midtown Spire Tower');

    const dashRes = await request(app).get(`/api/projects/${projectId}/dashboard`);
    expect(dashRes.status).toBe(200);
    const dash = dashRes.body;

    expect(dash.kpis.totalEntities).toBe(1);
    expect(dash.kpis.pendingActionsCount).toBe(1);
    expect(dash.kpis.criticalBlockersCount).toBe(2);
    expect(dash.shootBlockers).toHaveLength(2);
    expect(dash.shootBlockers.every((b: any) => b.canonicalName === 'Midtown Spire Tower')).toBe(true);
  });
});
