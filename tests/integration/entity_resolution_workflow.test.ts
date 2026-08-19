import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';

describe('Integration: Upgraded Entity Resolution, Aliases & Hierarchy Workflow (Feature 016 Phase 3)', () => {
  it('deduplicates multi-scene script mentions using aliases, links brand-product hierarchy, and re-links occurrences upon entity merge', async () => {
    // 1. Create a Movie Project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Project Apex Velocity III',
        productionCompany: 'Summit Studio',
        scriptVersion: 'v3.0-Production',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Pre-register a primary brand entity with an alias
    const brandRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Summit Cola',
        entityCategory: 'BRAND',
        description: 'Primary beverage brand',
        aliases: ['Summit Pop', 'Summit Soda'],
      });
    expect(brandRes.status).toBe(201);
    const summitEntityId = brandRes.body.id;

    // 3. Ingest screenplay referencing the alias "Summit Pop" in Scene 1 and canonical "Summit Cola" in Scene 2
    const scriptText = `
INT. DINER - DAY
Alex opens a cold can of Summit Pop while reading the report.

INT. OFFICE - NIGHT
Jordan drinks a chilled Summit Cola at the desk.
`;
    const scriptRes = await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });
    expect(scriptRes.status).toBe(200);

    // Verify entity resolution deduplicated "Summit Pop" to "Summit Cola"
    const entities = await entityRepo.getEntitiesByProject(projectId);
    const matchedSummit = entities.filter((e) => e.canonicalName === 'Summit Cola');
    expect(matchedSummit).toHaveLength(1);

    // Verify occurrences under Summit Cola include both Scene 1 and Scene 2 mentions
    const summitOccs = await entityRepo.getOccurrencesByEntity(projectId, summitEntityId);
    expect(summitOccs.length).toBeGreaterThanOrEqual(2);

    const aliasOcc = summitOccs.find((o) => o.surfaceMention === 'Summit Pop' || o.excerptText.includes('Summit Pop'));
    expect(aliasOcc).toBeDefined();
    expect(aliasOcc?.canonicalEntityId).toBe(summitEntityId);

    // 4. Test Brand-Product Hierarchy
    const childProductRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Summit Cola Zero',
        entityCategory: 'BRAND',
        description: 'Sugar-free beverage variant',
      });
    const childId = childProductRes.body.id;

    const hierRes = await request(app)
      .patch(`/api/projects/${projectId}/entities/${childId}/relationship`)
      .send({
        parentEntityId: summitEntityId,
        relationshipType: 'PRODUCT_LINE',
      });
    expect(hierRes.status).toBe(200);
    expect(hierRes.body.parentEntityId).toBe(summitEntityId);
    expect(hierRes.body.parentEntityName).toBe('Summit Cola');
    expect(hierRes.body.relationshipType).toBe('PRODUCT_LINE');

    // 5. Test Entity Merge
    // Create a rogue duplicate entity
    const duplicateRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Summit Energy Drink',
        entityCategory: 'BRAND',
        description: 'Separate energy drink entry',
      });
    const duplicateId = duplicateRes.body.id;

    // Add occurrence to duplicate
    const rogueOcc = await entityRepo.createOccurrence(projectId, {
      sceneId: 'scene-3',
      canonicalEntityId: duplicateId,
      scriptLineNumber: 44,
      excerptText: 'Stunt driver grabs a Summit Energy Drink.',
      usageContext: 'High-speed action placement',
    });

    // Merge duplicate into primary Summit Cola
    const mergeRes = await request(app)
      .post(`/api/projects/${projectId}/entities/merge`)
      .send({
        targetCanonicalEntityId: summitEntityId,
        sourceCanonicalEntityId: duplicateId,
      });
    expect(mergeRes.status).toBe(200);
    expect(mergeRes.body.success).toBe(true);
    expect(mergeRes.body.combinedAliases).toContain('Summit Energy Drink');

    // Verify rogue occurrence is re-linked to target
    const reLinkedOcc = await entityRepo.getOccurrenceById(projectId, rogueOcc.id);
    expect(reLinkedOcc?.occurrence.canonicalEntityId).toBe(summitEntityId);

    // Verify duplicate entity is deleted
    const deletedCheck = await entityRepo.getEntityById(projectId, duplicateId);
    expect(deletedCheck).toBeNull();
  });
});
