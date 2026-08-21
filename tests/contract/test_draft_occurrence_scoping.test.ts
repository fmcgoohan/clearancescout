import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';

describe('Contract: Current-Draft Occurrence Grounding & Historical Archival (Feature 021)', () => {
  it('P0-4 & FR-013: scopes active entities to occurrencesCount > 0 and archives removed draft entities', async () => {
    // 1. Create a project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Draft Revision Test',
        productionCompany: 'Continuity Films',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Draft 1 contains Summit Cola and Rolex Submariner
    const draft1 = `
INT. OFFICE - DAY
Alice drinks Summit Cola.

INT. VAULT - NIGHT
Bob checks his Rolex Submariner.
    `.trim();

    const d1Res = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .send({ scriptText: draft1, format: 'PLAINTEXT' });
    expect(d1Res.status).toBe(200);

    const entitiesD1 = await entityRepo.getEntitiesByProject(projectId);
    expect(entitiesD1.length).toBeGreaterThanOrEqual(2);
    for (const ent of entitiesD1) {
      expect(ent.occurrencesCount).toBeGreaterThan(0);
      expect(ent.activeInCurrentDraft).toBe(true);
      expect(ent.isArchivedHistorical).toBe(false);
    }

    // 3. Draft 2 is uploaded without Rolex Submariner (Summit Cola only)
    const draft2 = `
INT. OFFICE - DAY
Alice drinks Summit Cola.
    `.trim();

    // Re-ingest draft 2 (simulating revised draft upload)
    const d2Res = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .send({ scriptText: draft2, format: 'PLAINTEXT' });
    expect(d2Res.status).toBe(200);

    const activeEntitiesD2 = await entityRepo.getEntitiesByProject(projectId);
    const summitCola = activeEntitiesD2.find((e) => e.canonicalName.toLowerCase().includes('summit cola'));
    const rolexInActive = activeEntitiesD2.find((e) => e.canonicalName.toLowerCase().includes('rolex'));

    expect(summitCola).toBeDefined();
    expect(summitCola?.occurrencesCount).toBeGreaterThan(0);
    expect(summitCola?.activeInCurrentDraft).toBe(true);
    expect(rolexInActive).toBeUndefined(); // Role-ex is historical-only, so not in default active entities!

    const allEntitiesD2 = await entityRepo.getEntitiesByProject(projectId, { includeArchived: true });
    const rolexArchived = allEntitiesD2.find((e) => e.canonicalName.toLowerCase().includes('rolex'));
    if (rolexArchived) {
      expect(rolexArchived.occurrencesCount).toBe(0);
      expect(rolexArchived.activeInCurrentDraft).toBe(false);
      expect(rolexArchived.isArchivedHistorical).toBe(true);
    }
  });
});
