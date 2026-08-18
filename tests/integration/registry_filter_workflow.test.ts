import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';
import { filterEntities, RegistryFilterState } from '../../src/components/EntityRegistryTable.js';

describe('Workspace Registry Multi-Dimension Filters Workflow (Integration)', () => {
  let projectId: string;
  let demoScriptText: string;

  beforeEach(async () => {
    const fixtureRes = await request(app).get('/api/fixtures/demo-screenplay');
    demoScriptText = fixtureRes.body.scriptText;

    const project = await projectRepo.createProject({
      title: 'Filter Workflow Screenplay',
      productionCompany: 'Test Studios',
      scriptVersion: 'v1.0',
      executionMode: 'TEST_MODE',
    });
    projectId = project.id;
  });

  it('T010: executes end-to-end multi-dimension filtering, empty state recovery, and complete binder export', async () => {
    // 1. Ingest demo screenplay
    const parseRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: demoScriptText, format: 'PLAINTEXT' });

    expect(parseRes.status).toBe(200);
    const entities = parseRes.body.entities || [];
    expect(entities.length).toBeGreaterThanOrEqual(5);

    // Fetch scenes
    const scenesRes = await request(app).get(`/api/projects/${projectId}/scenes`);
    expect(scenesRes.status).toBe(200);
    const scenes = scenesRes.body || [];
    expect(scenes.length).toBeGreaterThanOrEqual(3);

    // 2. Test Client-Side Filtering - Default ALL
    const defaultFilter: RegistryFilterState = {
      status: 'ALL',
      category: 'ALL',
      sceneId: 'ALL',
    };
    const allFiltered = filterEntities(entities, defaultFilter, scenes);
    expect(allFiltered.length).toBe(entities.length);

    // 3. Test Multi-Dimension Filtering (e.g. BRAND category)
    const brandFilter: RegistryFilterState = {
      status: 'ALL',
      category: 'BRAND',
      sceneId: 'ALL',
    };
    const brandFiltered = filterEntities(entities, brandFilter, scenes);
    expect(brandFiltered.length).toBeGreaterThan(0);
    brandFiltered.forEach((e) => expect(e.entityCategory).toBe('BRAND'));

    // 4. Test Scene-Specific Filtering
    const testScene = scenes.find((s: any) => s.occurrences && s.occurrences.length > 0) || scenes[0];
    const sceneFilter: RegistryFilterState = {
      status: 'ALL',
      category: 'ALL',
      sceneId: testScene.id,
    };
    const sceneFiltered = filterEntities(entities, sceneFilter, scenes);
    expect(sceneFiltered.length).toBeGreaterThan(0);

    // 5. Test Zero-Match Combination & Reset
    const zeroMatchFilter: RegistryFilterState = {
      status: 'NO_ISSUE_SURFACED',
      category: 'PROPRIETARY_LOCATION',
      sceneId: testScene.id,
    };
    const zeroMatches = filterEntities(entities, zeroMatchFilter, scenes);
    expect(zeroMatches.length).toBe(0);

    // Reset restores all items
    const restored = filterEntities(entities, { status: 'ALL', category: 'ALL', sceneId: 'ALL' }, scenes);
    expect(restored.length).toBe(entities.length);

    // 6. Test Binder Export Retention (Non-destructive invariant)
    const binderRes = await request(app)
      .get(`/api/projects/${projectId}/binder/export`);

    expect(binderRes.status).toBe(200);
    expect(binderRes.body.projectId).toBe(projectId);
    expect(binderRes.body.canonicalEntities.length).toBe(entities.length);
    expect(binderRes.body.integrityDigest).toBeDefined();
    expect(binderRes.body.integrityDigest.length).toBe(64);
  });
});
