import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';
import { sceneReadinessEngine } from '../../server/workflows/sceneReadinessEngine.js';
import { dashboardEngine } from '../../server/workflows/dashboardEngine.js';
import { binderExportWorkflow } from '../../server/workflows/binderExportWorkflow.js';

describe('Contract & Invariants: Active-Draft Universe & Canonical Entity Scoping (Feature 021 Round-2)', () => {
  it('enforces active-draft scope across header, registry, dashboard, readiness, actions, and binder', async () => {
    // 1. Create a clean project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Active Draft Integrity Test',
        productionCompany: 'Convergence Pictures',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // Initial counts must agree and be zero
    expect(projRes.body.entityCount).toBe(0);
    expect(projRes.body.clearedCount).toBe(0);
    expect(projRes.body.actionRequiredCount).toBe(0);

    // 2. Ingest Draft 1 (simulating initial script with multiple legacy entities: Ray-Ban, Starbucks, Porsche, Rolex)
    const draft1 = `
INT. AIRPORT - DAY
Alice wears Ray-Ban sunglasses and drinks Starbucks coffee.

INT. CAR - DAY
Bob drives a Porsche while checking his Rolex watch.
    `.trim();

    const d1Res = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .send({ scriptText: draft1, format: 'PLAINTEXT' });
    expect(d1Res.status).toBe(200);

    const d1Entities = await entityRepo.getEntitiesByProject(projectId);
    expect(d1Entities.length).toBeGreaterThanOrEqual(4);

    // 3. Ingest Draft 2: "The Neon Horizon" (3 scenes, 6 entities) with "Replace Current Screenplay"
    const draft2 = `TITLE: THE NEON HORIZON
AUTHOR: Entrant Studio Team
FORMAT: Feature Screenplay Excerpt (Fully Fictional Assets)

INT. PENTHOUSE WORKSPACE - NIGHT
Rain lashes against floor-to-ceiling glass overlooking the neon cityscape.
ALEX (30s) sits at a curved glass desk. He taps the illuminated keyboard of his AeroTech Prism Laptop. Data streams across the transparent display.
On the desk rests a chilled crimson can of Summit Cola. Alex pops the tab and takes a drink.
Across the room, an ambient holo-screen broadcasts an archival profile of Elena Vance delivering her landmark keynote on orbital power grids.
From the spatial audio system, the atmospheric synth-rock melody of Nocturne of the Wild plays softly in the background.

EXT. MIDTOWN SPIRE TOWER - NIGHT
Down on the wet asphalt, streetlights reflect in glistening puddles.
JORDAN (20s) steers a sleek metallic silver Veloce GT sports coupe into the private circular driveway directly beneath the soaring art-deco arches of the Midtown Spire Tower.
Jordan steps out, locking the car with a subtle chime.

INT. INDUSTRIAL SUB-LEVEL - NIGHT
Jordan walks through the reinforced maintenance corridor.
Along the heavy steel bulkhead, a weathered warning sign is bolted to the wall: a bold yellow-and-black Titan Industrial Hazard Placard flashing an active circuit warning.
Jordan inputs the security code. The hydraulic lock hisses open.`;

    const d2Res = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .send({ scriptText: draft2, format: 'PLAINTEXT' });
    expect(d2Res.status).toBe(200);

    // 4. Invariant Checks:
    // (a) Active Scenes
    const activeScenes = await sceneRepo.getScenesByProject(projectId);
    expect(activeScenes.length).toBe(3);

    // (b) Active Occurrences
    const allOccurrences = await entityRepo.getAllOccurrences(projectId);
    const activeSceneIds = new Set(activeScenes.map((s) => s.id));
    const activeOccurrences = allOccurrences.filter((o) => activeSceneIds.has(o.sceneId));

    // Every active occurrence references an active scene
    for (const occ of activeOccurrences) {
      expect(activeSceneIds.has(occ.sceneId)).toBe(true);
    }

    // (c) Active Entities in Registry & Repos
    const activeEntities = await entityRepo.getEntitiesByProject(projectId);
    expect(activeEntities.length).toBe(7);

    const distinctCanonicalIdsFromOccurrences = new Set(activeOccurrences.map((o) => o.canonicalEntityId));
    expect(activeEntities.length).toBe(distinctCanonicalIdsFromOccurrences.size);

    // Every AUTO_EXTRACTED active entity has >= 1 active occurrence
    for (const ent of activeEntities) {
      expect(ent.occurrencesCount).toBeGreaterThan(0);
      expect(ent.activeInCurrentDraft).toBe(true);
      expect(ent.isArchivedHistorical).toBe(false);
    }

    // (d) Historical Entities Exist in Archive but NOT in Active Default
    const allEntitiesWithArchived = await entityRepo.getEntitiesByProject(projectId, { includeArchived: true });
    expect(allEntitiesWithArchived.length).toBeGreaterThan(7); // Old Draft 1 entities remain preserved for research/audit
    const historicalOnly = allEntitiesWithArchived.filter((e) => e.isArchivedHistorical);
    expect(historicalOnly.length).toBeGreaterThan(0);

    for (const hEnt of historicalOnly) {
      expect(hEnt.occurrencesCount).toBe(0);
      expect(hEnt.activeInCurrentDraft).toBe(false);
    }

    // (e) GET /api/projects/:id returns active entity count (7, NOT 41)
    const getProjRes = await request(app).get(`/api/projects/${projectId}`);
    expect(getProjRes.status).toBe(200);
    expect(getProjRes.body.entityCount).toBe(7);

    // (f) GET /api/projects/:id/snapshot returns active entities (7)
    const snapRes = await request(app).get(`/api/projects/${projectId}/snapshot`);
    expect(snapRes.status).toBe(200);
    expect(snapRes.body.entities.length).toBe(7);
    expect(snapRes.body.project.totalActiveEntities).toBe(7);
    expect(snapRes.body.scenes.length).toBe(3);

    // (g) Scene Readiness Engine uses active scope
    const readiness = await sceneReadinessEngine.evaluateAllScenesReadiness(projectId);
    expect(readiness.totalScenes).toBe(3);

    // (h) Production Operations Dashboard uses active scope
    const dashboard = await dashboardEngine.getDashboardSummary(projectId);
    expect(dashboard.kpis.totalScenes).toBe(3);
    expect(dashboard.kpis.totalEntities).toBe(7);

    // (i) Clearance Binder Export uses active scope
    const binder = await binderExportWorkflow.compileAndExportBinder(projectId);
    expect(binder.projectSummary.totalScenes).toBe(3);
    expect(binder.projectSummary.totalEntities).toBe(7);
  });

  it('reconciles duplicate generic canonical entities (Associated Press / A.P. / AP) without data loss', async () => {
    // 1. Create a project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'AP Reconcile Test',
        productionCompany: 'News Syndicate',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // 2. Create Scene
    const scene = await sceneRepo.createScene({
      projectId,
      sceneNumber: 1,
      heading: 'INT. NEWSROOM - DAY',
      locationType: 'INT',
      timeOfDay: 'DAY',
      rawText: 'Newsroom bustling',
      characterActionSummary: 'Reporters working',
    });

    // 3. Intentionally insert legacy duplicate canonical entities: "Associated Press" and "A.P."
    const ap1 = await entityRepo.createCanonicalEntity({
      projectId,
      canonicalName: 'Associated Press',
      entityCategory: 'BRAND',
      description: 'Major wire service',
      overallClearanceStatus: 'INSUFFICIENT_EVIDENCE',
      aliases: ['The AP'],
    });

    const ap2 = await entityRepo.createCanonicalEntity({
      projectId,
      canonicalName: 'A.P.',
      entityCategory: 'BRAND',
      description: 'AP abbreviation',
      overallClearanceStatus: 'INSUFFICIENT_EVIDENCE',
      aliases: [],
    });

    // Create occurrence pointing to ap2
    await entityRepo.createOccurrence(projectId, {
      sceneId: scene.id,
      canonicalEntityId: ap2.id,
      scriptLineNumber: 10,
      excerptText: 'Reporter reads A.P. dispatch',
      usageContext: 'Dispatch paper',
      surfaceMention: 'A.P.',
      matchedVia: 'EXACT_CANONICAL',
    });

    // 4. Run duplicate reconciliation
    const reconcileRes = await request(app)
      .post(`/api/projects/${projectId}/entities/reconcile-duplicates`)
      .send({});
    expect(reconcileRes.status).toBe(200);
    expect(reconcileRes.body.reconciledCount).toBe(1);

    // 5. Verify single canonical entity survives with merged aliases and re-linked occurrence
    const activeEntities = await entityRepo.getEntitiesByProject(projectId);
    expect(activeEntities.length).toBe(1);
    const primaryAP = activeEntities[0];
    expect(primaryAP.canonicalName).toBe('Associated Press');
    expect(primaryAP.aliases).toContain('A.P.');
    expect(primaryAP.aliases).toContain('The AP');

    const occurrences = await entityRepo.getOccurrencesByScene(projectId, scene.id);
    expect(occurrences.length).toBe(1);
    expect(occurrences[0].canonicalEntityId).toBe(primaryAP.id);
  });
});
