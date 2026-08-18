import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { getDb } from '../../server/repositories/firestoreClient.js';
import { runBatchClearancePool, BatchItemStatus } from '../../src/hooks/useBatchResearch.js';

describe('Integration Test: Multi-Item Clearance Research Workflow', () => {
  const projectId = 'proj-batch-research-integration';

  beforeEach(async () => {
    const db = getDb();
    if (db.reset) {
      await db.reset();
    }
  });

  it('T010: executes end-to-end multi-item batch research with concurrency bounding, progressive updates, and override preservation', async () => {
    // 1. Create Project
    const projectRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Batch Research Test Screenplay',
        productionCompany: 'SpecKit Productions',
        scriptVersion: 'v1.0',
      });
    expect(projectRes.status).toBe(201);
    const projectId = projectRes.body.id;

    // 2. Ingest Multi-Scene Script with Multiple Entities
    const scriptContent = `
SCENE 1 - INT. CAFE - DAY
ALEX sits at a table drinking Summit Cola while working on an AeroTech Laptop.
Nearby, the song Starlight Symphony plays on the jukebox.

SCENE 2 - EXT. CITY STREET - NIGHT
JORDAN drives a Veloce GT past the Titan Industrial Hazard Placard.
`;

    const ingestRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText: scriptContent, format: 'PLAINTEXT' });
    expect(ingestRes.status).toBe(200);

    // 3. Fetch Extracted Entities
    const entitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    expect(entitiesRes.status).toBe(200);
    const entities = entitiesRes.body;
    expect(entities.length).toBeGreaterThanOrEqual(4);

    // 4. Set a Counsel Override on the first entity to verify override protection
    const firstEntity = entities[0];
    const overrideRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${firstEntity.id}/override`)
      .send({
        overrideStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Counsel pre-approved this placement deal.',
        counselName: 'Jane Doe, Esq.',
      });
    expect(overrideRes.status).toBe(200);

    // 5. Execute Multi-Item Batch Research via runBatchClearancePool (concurrency = 2)
    const progressStatuses: Record<string, BatchItemStatus[]> = {};
    let maxObservedConcurrency = 0;
    let currentActive = 0;

    const evaluateSingle = async (entityId: string) => {
      currentActive++;
      if (currentActive > maxObservedConcurrency) {
        maxObservedConcurrency = currentActive;
      }

      const evalRes = await request(app)
        .post(`/api/projects/${projectId}/clearance/evaluate`)
        .send({ canonicalEntityIds: [entityId] });

      currentActive--;
      if (evalRes.status !== 200) {
        throw new Error(`Clearance evaluation failed with ${evalRes.status}`);
      }
    };

    const onItemProgress = (entityId: string, status: BatchItemStatus) => {
      if (!progressStatuses[entityId]) progressStatuses[entityId] = [];
      progressStatuses[entityId].push(status);
    };

    const batchEntities = entities.map((e: any) => ({ id: e.id, canonicalName: e.canonicalName }));
    const batchResult = await runBatchClearancePool(batchEntities, evaluateSingle, onItemProgress, 2);

    // 6. Verify Concurrency Bounding & Batch Completion
    expect(maxObservedConcurrency).toBeLessThanOrEqual(2);
    expect(batchResult.completedCount).toBe(entities.length);
    expect(batchResult.failedCount).toBe(0);

    // Verify all items progressed through QUEUED -> RESEARCHING -> COMPLETED
    for (const ent of entities) {
      expect(progressStatuses[ent.id]).toContain('QUEUED');
      expect(progressStatuses[ent.id]).toContain('RESEARCHING');
      expect(progressStatuses[ent.id]).toContain('COMPLETED');
    }

    // 7. Verify Entities in Database have Grounded Evaluations
    const updatedEntitiesRes = await request(app).get(`/api/projects/${projectId}/entities`);
    expect(updatedEntitiesRes.status).toBe(200);
    const updatedEntities = updatedEntitiesRes.body;

    for (const ent of updatedEntities) {
      expect(ent.overallClearanceStatus).toBeDefined();
      expect(['NO_ISSUE_SURFACED', 'REVIEW_RECOMMENDED', 'ACTION_REQUIRED', 'INSUFFICIENT_EVIDENCE']).toContain(
        ent.overallClearanceStatus
      );
    }

    // 8. Verify Counsel Override was NOT overwritten
    const overriddenEntity = updatedEntities.find((e: any) => e.id === firstEntity.id);
    expect(overriddenEntity).toBeDefined();
    expect(overriddenEntity.isOverridden).toBe(true);
    expect(overriddenEntity.latestOverride.counselName).toBe('Jane Doe, Esq.');
    expect(overriddenEntity.latestOverride.overrideStatus).toBe('NO_ISSUE_SURFACED');

    // 9. Export Clearance Binder and Verify Integrity Digest
    const binderRes = await request(app).get(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    const binder = binderRes.body;
    expect(binder.integrityDigest).toHaveLength(64);
    expect(binder.canonicalEntities.length).toBe(entities.length);
  });
});
