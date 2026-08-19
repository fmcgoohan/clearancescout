import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';

describe('Integration: Comprehensive Legal Clearance Binder Export (Feature 016 Phase 10)', () => {
  it('should compile an audit-grade legal binder aggregating rights, placeholders, scene readiness, and open actions with SHA-256 digest', async () => {
    // 1. Create Movie project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Cyberpunk Odyssey',
        productionCompany: 'Universal Clearance Studios',
        scriptVersion: 'v2.4',
        projectType: 'Movie',
        executionMode: 'TEST_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest 4-scene screenplay
    const scriptText = `
INT. CYBER CAFE - NIGHT
Elena sits alone, drinking tea and reading a book.

INT. ROOFTOP - NIGHT
Marcus holds a cold can of Coca-Cola under neon rain.

INT. LABORATORY - DAY
Viktor types frantically on an AeroTech Prism Laptop.

INT. VAULT - NIGHT
Guard checks the time on a shiny Rolex while listening to Hotel California on the radio.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const cokeEntity = entities.find((e) => e.canonicalName.includes('Coca-Cola'));
    const laptopEntity = entities.find((e) => e.canonicalName.includes('AeroTech Prism Laptop') || e.canonicalName.includes('AeroTech'));
    const rolexEntity = entities.find((e) => e.canonicalName.includes('Rolex'));
    const songEntity = entities.find((e) => e.canonicalName.includes('Hotel California'));
    expect(cokeEntity).toBeDefined();
    expect(laptopEntity).toBeDefined();
    expect(rolexEntity).toBeDefined();
    expect(songEntity).toBeDefined();

    // 3. Attach an active rights agreement to Coca-Cola (expiring in 60 days)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    const expirationDate = futureDate.toISOString().split('T')[0];

    const rightsRes = await request(app)
      .post(`/api/projects/${projectId}/rights`)
      .send({
        canonicalEntityId: cokeEntity!.id,
        licensorName: 'Beverage Global Rights Ltd',
        grantType: 'NON_EXCLUSIVE',
        territory: 'WORLDWIDE',
        mediaWindow: 'THEATRICAL_SVOD',
        effectiveDate: '2026-01-01',
        expirationDate,
        isPerpetual: false,
        status: 'ACTIVE',
      });
    expect(rightsRes.status).toBe(201);

    // 4. Attach a placeholder to Laptop (TEMP_APPROVED)
    const phRes = await request(app)
      .post(`/api/projects/${projectId}/placeholders`)
      .send({
        canonicalEntityId: laptopEntity!.id,
        assetCategory: 'BRAND',
        fictionalName: 'NovaTech Zenith',
        description: 'Futuristic fictional laptop prop',
        clearanceTier: 'TEMP_APPROVED',
        creativeRationale: 'Cyberpunk prop replacement',
        approvedBy: 'Alex Chen (Lead Designer)',
        approvedRole: 'ART_DEPARTMENT',
      });
    expect(phRes.status).toBe(201);

    // 5. Evaluate clearance on Rolex and Song entities to generate open action item
    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [rolexEntity!.id, songEntity!.id] });
    expect(evalRes.status).toBe(200);

    // 6. Execute Counsel Override on Rolex only in Scene 4 (leaving Song action open)
    const ovrRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${rolexEntity!.id}/override`)
      .send({
        overrideStatus: 'REVIEW_RECOMMENDED',
        counselName: 'Sarah Jenkins, Esq.',
        counselRole: 'Production Legal Counsel',
        rationale: 'Rolex watch clearance approved for principal photography under fair use / incidental doctrine.',
      });
    expect(ovrRes.status).toBe(200);

    // 7. Compile and export the Legal Clearance Binder
    const binderRes = await request(app).post(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    const binder = binderRes.body;

    // Verify Executive Metadata & Project Summary
    expect(binder.id).toMatch(/^bnd-/);
    expect(binder.projectId).toBe(projectId);
    expect(binder.projectSummary.title).toBe('Cyberpunk Odyssey');
    expect(binder.projectSummary.projectType).toBe('Movie');
    expect(binder.projectSummary.productionCompany).toBe('Universal Clearance Studios');
    expect(binder.projectSummary.totalScenes).toBe(4);
    expect(binder.projectSummary.finalClearScenes).toBe(2); // Scene 1 clean + Scene 2 rights-covered
    expect(binder.projectSummary.workingClearScenes).toBe(1); // Scene 3 TEMP_APPROVED placeholder
    expect(binder.projectSummary.redScenes).toBe(1); // Scene 4 Sony Walkman action required
    expect(binder.projectSummary.overallReadinessPercentage).toBeGreaterThanOrEqual(50);
    expect(binder.projectSummary.activeRightsCount).toBe(1);
    expect(binder.projectSummary.activePlaceholdersCount).toBe(1);
    expect(binder.projectSummary.openActionsCount).toBeGreaterThanOrEqual(1);
    expect(binder.projectSummary.overridesCount).toBeGreaterThanOrEqual(1);

    // Verify Cryptographic Digest & Disclaimer
    expect(binder.integrityDigest).toBeDefined();
    expect(binder.integrityDigest.length).toBe(64);
    expect(binder.disclaimer).toContain('does NOT render formal legal advice');

    // Verify Domain Collections
    expect(binder.rightsAgreements).toHaveLength(1);
    expect(binder.rightsAgreements[0].licensorName).toBe('Beverage Global Rights Ltd');

    expect(binder.placeholders).toHaveLength(1);
    expect(binder.placeholders[0].fictionalName).toBe('NovaTech Zenith');
    expect(binder.placeholders[0].clearanceTier).toBe('TEMP_APPROVED');

    expect(binder.unresolvedActions.length).toBeGreaterThanOrEqual(1);
    expect(binder.unresolvedActions[0].status).toBe('OPEN');

    expect(binder.sceneReadinessSchedule).toHaveLength(4);

    // 8. Verify Formatted Markdown Download Route
    const mdRes = await request(app).get(`/api/projects/${projectId}/binder/markdown`);
    expect(mdRes.status).toBe(200);
    expect(mdRes.headers['content-type']).toContain('text/markdown');
    expect(mdRes.text).toContain('# Production Legal Clearance Binder');
    expect(mdRes.text).toContain('Cyberpunk Odyssey');
    expect(mdRes.text).toContain(binder.integrityDigest);
    expect(mdRes.text).toContain('Beverage Global Rights Ltd');
    expect(mdRes.text).toContain('NovaTech Zenith');
  });
});
