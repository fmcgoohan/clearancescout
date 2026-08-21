import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';
import { actionNotificationRepo } from '../../server/repositories/ActionNotificationRepo.js';
import { canonicalRegistryWorkflow } from '../../server/workflows/canonicalRegistryWorkflow.js';

describe('Contract & Invariants: Staged Screenplay Replacement Integrity & Action Regeneration (T059-T064)', () => {
  const demoScreenplay = `TITLE: THE NEON HORIZON
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

  it('proves bundled_demo_replace_preserves_7_entities and replace_same_screenplay_is_idempotent', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Demo Replace Idempotency Test',
        productionCompany: 'Entrant Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // Ingestion 1: Initial load
    const demo1 = await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({ autoEvaluate: true, includeSampleRights: true, includeSamplePlaceholders: true });
    expect(demo1.status).toBe(200);

    const entities1 = await entityRepo.getEntitiesByProject(projectId);
    expect(entities1.length).toBe(7);
    const scenes1 = await sceneRepo.getScenesByProject(projectId);
    expect(scenes1.length).toBe(3);

    // Ingestion 2: Replace with same demo screenplay
    const demo2 = await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({ autoEvaluate: true, includeSampleRights: true, includeSamplePlaceholders: true });
    expect(demo2.status).toBe(200);

    const entities2 = await entityRepo.getEntitiesByProject(projectId);
    expect(entities2.length).toBe(7);
    const scenes2 = await sceneRepo.getScenesByProject(projectId);
    expect(scenes2.length).toBe(3);

    // Verify all 7 entities are active with valid occurrence counts
    const names = entities2.map((e) => e.canonicalName);
    expect(names).toContain('AeroTech Prism Laptop');
    expect(names).toContain('Summit Cola');
    expect(names).toContain('Elena Vance');
    expect(names).toContain('Nocturne of the Wild');
    expect(names).toContain('Veloce GT');
    expect(names).toContain('Midtown Spire Tower');
    expect(names).toContain('Titan Industrial Hazard Placard');

    for (const ent of entities2) {
      expect(ent.activeInCurrentDraft).toBe(true);
      expect(ent.occurrencesCount).toBeGreaterThan(0);
      expect(ent.isArchivedHistorical).toBe(false);
    }
  });

  it('proves replace_never_commits_dangling_occurrence_entity_links', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Dangling Link Invariant Test',
        productionCompany: 'Entrant Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // Load initial script
    await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .send({ scriptText: demoScreenplay, format: 'PLAINTEXT' });

    // Replace script
    await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .send({ scriptText: demoScreenplay, format: 'PLAINTEXT' });

    const activeScenes = await sceneRepo.getScenesByProject(projectId);
    const activeSceneIds = new Set(activeScenes.map((s) => s.id));
    const allOccurrences = await entityRepo.getAllOccurrences(projectId);
    const activeEntities = await entityRepo.getEntitiesByProject(projectId, { includeArchived: true });
    const entityMap = new Map(activeEntities.map((e) => [e.id, e]));

    expect(allOccurrences.length).toBeGreaterThan(0);

    for (const occ of allOccurrences) {
      // 1. Every occurrence must point to an existing active scene
      expect(activeSceneIds.has(occ.sceneId)).toBe(true);
      // 2. Every occurrence must point to an existing canonical entity
      expect(entityMap.has(occ.canonicalEntityId)).toBe(true);
    }
  });

  it('proves replacement_failure_preserves_previous_active_snapshot', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Fail-Closed Rollback Test',
        productionCompany: 'Entrant Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // 1. Initial valid screenplay upload
    await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .send({ scriptText: demoScreenplay, format: 'PLAINTEXT' });

    const initialSnapshot = await projectRepo.getProjectSnapshot(projectId);
    expect(initialSnapshot).not.toBeNull();
    expect(initialSnapshot!.scenes.length).toBe(3);
    expect(initialSnapshot!.entities.length).toBe(7);

    // 2. Attempt replacement with invalid empty script
    const failRes = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .send({ scriptText: '   ', format: 'PLAINTEXT' });
    expect(failRes.status).toBe(400);

    // 3. Verify previous snapshot is completely intact
    const afterSnapshot = await projectRepo.getProjectSnapshot(projectId);
    expect(afterSnapshot).not.toBeNull();
    expect(afterSnapshot!.scenes.length).toBe(3);
    expect(afterSnapshot!.entities.length).toBe(7);
    expect(afterSnapshot!.scenes.map((s: any) => s.id)).toEqual(initialSnapshot!.scenes.map((s: any) => s.id));
  });

  it('proves current_action_required_items_regenerate_open_actions and superseded_actions_do_not_block_new_action_creation', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Action Regeneration Test',
        productionCompany: 'Entrant Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // 1. Initial ingestion with autoEvaluate (Titan & Nocturne become ACTION_REQUIRED)
    await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({ autoEvaluate: true, includeSampleRights: false, includeSamplePlaceholders: false });

    const actionsBefore = await actionNotificationRepo.getActionsByProject(projectId, { status: 'OPEN' });
    expect(actionsBefore.length).toBeGreaterThanOrEqual(2);

    // 2. Replace current screenplay with the same demo script
    await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({ autoEvaluate: true, includeSampleRights: false, includeSamplePlaceholders: false });

    // 3. Verify that old actions are RESOLVED as SCRIPT_REVISION_SUPERSEDED and new OPEN actions exist
    const allActions = await actionNotificationRepo.getActionsByProject(projectId);
    const supersededActions = allActions.filter((a) => a.resolutionTrigger === 'SCRIPT_REVISION_SUPERSEDED');
    expect(supersededActions.length).toBeGreaterThanOrEqual(2);

    const openActionsAfter = await actionNotificationRepo.getActionsByProject(projectId, { status: 'OPEN' });
    expect(openActionsAfter.length).toBeGreaterThanOrEqual(2);

    // Scene references in action descriptions must be humanized
    for (const act of openActionsAfter) {
      expect(act.description).toMatch(/Scene \d/);
    }
  });

  it('proves completion_counts_equal_committed_active_snapshot', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Completion Count Invariant Test',
        productionCompany: 'Entrant Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    const res = await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({ autoEvaluate: true, includeSampleRights: true, includeSamplePlaceholders: true });

    expect(res.status).toBe(200);
    const { scenesCount, entitiesCount, snapshot } = res.body;

    expect(scenesCount).toBe(3);
    expect(entitiesCount).toBe(7);
    expect(snapshot.scenes.length).toBe(3);
    expect(snapshot.entities.length).toBe(7);
    expect(snapshot.project.totalActiveEntities).toBe(7);
  });
});
