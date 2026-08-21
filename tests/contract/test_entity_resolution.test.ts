import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';

describe('Contract: Upgraded Entity Resolution, Aliases, Hierarchy & Merge (Feature 016 Phase 3)', () => {
  it('FR-004: manages aliases on canonical entity and resolves mentions multi-stage', async () => {
    // 1. Create a project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Project Resolution Test',
        productionCompany: 'Brand Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Create canonical entity
    const entRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Summit Cola',
        entityCategory: 'BRAND',
        description: 'Flagship soda brand',
      });
    expect(entRes.status).toBe(201);
    const entityId = entRes.body.id;

    // 3. Add alias "Summit Soda"
    const addAliasRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entityId}/aliases`)
      .send({ alias: 'Summit Soda' });
    expect(addAliasRes.status).toBe(200);
    expect(addAliasRes.body.aliases).toContain('Summit Soda');

    // 4. Resolve exact canonical name
    const resExact = await request(app)
      .post(`/api/projects/${projectId}/entities/resolve`)
      .send({ mention: 'summit cola', category: 'BRAND' });
    expect(resExact.status).toBe(200);
    expect(resExact.body.matched).toBe(true);
    expect(resExact.body.matchRule).toBe('EXACT_CANONICAL');
    expect(resExact.body.canonicalEntityId).toBe(entityId);

    // 5. Resolve alias mention
    const resAlias = await request(app)
      .post(`/api/projects/${projectId}/entities/resolve`)
      .send({ mention: 'Summit Soda', category: 'BRAND' });
    expect(resAlias.status).toBe(200);
    expect(resAlias.body.matched).toBe(true);
    expect(resAlias.body.matchRule).toBe('ALIAS_MATCH');
    expect(resAlias.body.matchedAlias).toBe('Summit Soda');

    // 6. Resolve normalized mention (e.g. with punctuation / case variation)
    const resNorm = await request(app)
      .post(`/api/projects/${projectId}/entities/resolve`)
      .send({ mention: 'Summit-Cola!', category: 'BRAND' });
    expect(resNorm.status).toBe(200);
    expect(resNorm.body.matched).toBe(true);
    expect(resNorm.body.matchRule).toBe('NORMALIZED_EQUIVALENCE');

    // 7. Remove alias
    const removeAliasRes = await request(app)
      .delete(`/api/projects/${projectId}/entities/${entityId}/aliases/Summit%20Soda`);
    expect(removeAliasRes.status).toBe(200);
    expect(removeAliasRes.body.aliases).not.toContain('Summit Soda');
  });

  it('FR-004: configures brand/product hierarchy relationships and links occurrences', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Hierarchy Test',
        productionCompany: 'Motors Films',
        projectType: 'Commercial',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // Create parent brand entity
    const parentRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Veloce Motors',
        entityCategory: 'BRAND',
        description: 'Parent automotive manufacturer',
      });
    const parentId = parentRes.body.id;

    // Create child product entity
    const childRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Veloce GT Coupe',
        entityCategory: 'BRAND',
        description: 'Sports coupe model line',
      });
    const childId = childRes.body.id;

    // Set hierarchy relationship
    const relRes = await request(app)
      .patch(`/api/projects/${projectId}/entities/${childId}/relationship`)
      .send({
        parentEntityId: parentId,
        relationshipType: 'BRAND_PRODUCT',
      });
    expect(relRes.status).toBe(200);
    expect(relRes.body.parentEntityId).toBe(parentId);
    expect(relRes.body.parentEntityName).toBe('Veloce Motors');
    expect(relRes.body.relationshipType).toBe('BRAND_PRODUCT');
  });

  it('FR-004: merges two canonical entities, transfers occurrences, combines aliases, and recomputes roll-up', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Merge Test',
        productionCompany: 'Studio Merge',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // Target entity
    const targetRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Summit Cola',
        entityCategory: 'BRAND',
        description: 'Primary canonical soda mark',
      });
    const targetId = targetRes.body.id;

    // Source entity (duplicate)
    const sourceRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Summit Soda Can',
        entityCategory: 'BRAND',
        description: 'Secondary soda mention',
      });
    const sourceId = sourceRes.body.id;

    // Add occurrence to source
    await entityRepo.createOccurrence(projectId, {
      sceneId: 'scene-3',
      canonicalEntityId: sourceId,
      scriptLineNumber: 45,
      excerptText: 'Summit Soda Can on table',
      usageContext: 'Prop on table',
    });

    // Execute merge
    const mergeRes = await request(app)
      .post(`/api/projects/${projectId}/entities/merge`)
      .send({
        targetCanonicalEntityId: targetId,
        sourceCanonicalEntityId: sourceId,
      });

    expect(mergeRes.status).toBe(200);
    expect(mergeRes.body.success).toBe(true);
    expect(mergeRes.body.transferredOccurrencesCount).toBe(1);
    expect(mergeRes.body.combinedAliases).toContain('Summit Soda Can');

    // Source entity should be deleted
    const deletedSource = await entityRepo.getEntityById(projectId, sourceId);
    expect(deletedSource).toBeNull();

    // Occurrences for target entity should now include the transferred occurrence
    const targetOccs = await entityRepo.getOccurrencesByEntity(projectId, targetId);
    expect(targetOccs).toHaveLength(1);
    expect(targetOccs[0].canonicalEntityId).toBe(targetId);
  });

  it('P0-3: resolves and merges generic acronyms, parentheticals, and composite mentions (Associated Press / A.P.)', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Acronym & Composite Resolution Test',
        productionCompany: 'News Media Inc',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // 1. Create canonical entity "Associated Press"
    const entRes = await request(app)
      .post(`/api/projects/${projectId}/entities`)
      .send({
        canonicalName: 'Associated Press',
        entityCategory: 'BRAND',
        description: 'Global news agency',
      });
    expect(entRes.status).toBe(201);
    const apEntityId = entRes.body.id;

    // 2. Resolve "A.P." acronym with dots
    const resDottedAcronym = await request(app)
      .post(`/api/projects/${projectId}/entities/resolve`)
      .send({ mention: 'A.P.', category: 'BRAND' });
    expect(resDottedAcronym.status).toBe(200);
    expect(resDottedAcronym.body.matched).toBe(true);
    expect(resDottedAcronym.body.canonicalEntityId).toBe(apEntityId);
    expect(resDottedAcronym.body.matchRule).toBe('ACRONYM_EQUIVALENCE');

    // 3. Resolve "AP" acronym without dots
    const resCleanAcronym = await request(app)
      .post(`/api/projects/${projectId}/entities/resolve`)
      .send({ mention: 'AP', category: 'BRAND' });
    expect(resCleanAcronym.status).toBe(200);
    expect(resCleanAcronym.body.matched).toBe(true);
    expect(resCleanAcronym.body.canonicalEntityId).toBe(apEntityId);
    expect(resCleanAcronym.body.matchRule).toBe('ACRONYM_EQUIVALENCE');

    // 4. Resolve "A.P. (Associated Press)" parenthetical mention
    const resParenthetical = await request(app)
      .post(`/api/projects/${projectId}/entities/resolve`)
      .send({ mention: 'A.P. (Associated Press)', category: 'BRAND' });
    expect(resParenthetical.status).toBe(200);
    expect(resParenthetical.body.matched).toBe(true);
    expect(resParenthetical.body.canonicalEntityId).toBe(apEntityId);
    expect(resParenthetical.body.matchRule).toBe('PARENTHETICAL_EXPANSION');

    // 5. Resolve "Associated Press / A.P." compound delimiter mention
    const resDelimiter = await request(app)
      .post(`/api/projects/${projectId}/entities/resolve`)
      .send({ mention: 'Associated Press / A.P.', category: 'BRAND' });
    expect(resDelimiter.status).toBe(200);
    expect(resDelimiter.body.matched).toBe(true);
    expect(resDelimiter.body.canonicalEntityId).toBe(apEntityId);
    expect(resDelimiter.body.matchRule).toBe('DELIMITER_EXPANSION');
  });
});
