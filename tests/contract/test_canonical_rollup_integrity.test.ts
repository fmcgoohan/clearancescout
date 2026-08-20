import { describe, it, expect, beforeEach } from 'vitest';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';

describe('Feature 019: Canonical Roll-up with Unresolved Occurrences', () => {
  let projectId: string;
  let scene1Id: string;
  let scene2Id: string;
  let entityId: string;

  beforeEach(async () => {
    const proj = await projectRepo.createProject({
      title: 'Roll-up Integrity Test',
      productionCompany: 'Canonical Media',
      scriptVersion: 'v1.0',
      executionMode: 'TEST_MODE',
    });
    projectId = proj.id;

    const s1 = await sceneRepo.createScene({
      projectId,
      sceneNumber: 1,
      heading: 'INT. OFFICE - DAY',
      locationType: 'INT',
      timeOfDay: 'DAY',
      rawText: 'Text 1',
      characterActionSummary: 'Action 1',
    });
    scene1Id = s1.id;

    const s2 = await sceneRepo.createScene({
      projectId,
      sceneNumber: 2,
      heading: 'EXT. STREET - NIGHT',
      locationType: 'EXT',
      timeOfDay: 'NIGHT',
      rawText: 'Text 2',
      characterActionSummary: 'Action 2',
    });
    scene2Id = s2.id;

    const ent = await entityRepo.createCanonicalEntity({
      projectId,
      canonicalName: 'Dual Occurrence Brand',
      entityCategory: 'BRAND',
      description: 'Brand appearing in two scenes',
      overallClearanceStatus: 'INSUFFICIENT_EVIDENCE',
    });
    entityId = ent.id;
  });

  it('prohibits NO_ISSUE_SURFACED when one occurrence is cleared and another is unresolved', async () => {
    // Occurrence 1 is evaluated as NO_ISSUE_SURFACED
    const occ1 = await entityRepo.createOccurrence(projectId, {
      sceneId: scene1Id,
      canonicalEntityId: entityId,
      scriptLineNumber: 2,
      excerptText: 'Occ 1 text',
      usageContext: 'Background mention',
      clearanceStatus: 'NO_ISSUE_SURFACED',
      evaluatedAt: new Date().toISOString(),
    });

    // Occurrence 2 is unevaluated / unresolved (defaults to INSUFFICIENT_EVIDENCE)
    const occ2 = await entityRepo.createOccurrence(projectId, {
      sceneId: scene2Id,
      canonicalEntityId: entityId,
      scriptLineNumber: 10,
      excerptText: 'Occ 2 text',
      usageContext: 'Hero prop usage',
      clearanceStatus: 'INSUFFICIENT_EVIDENCE',
    });

    const derivedStatus = await entityRepo.computeDerivedCanonicalStatus(projectId, entityId);
    // Because occ2 is INSUFFICIENT_EVIDENCE, derivedStatus CANNOT be NO_ISSUE_SURFACED
    expect(derivedStatus).toBe('INSUFFICIENT_EVIDENCE');

    const updatedEntity = await entityRepo.getEntityById(projectId, entityId);
    expect(updatedEntity?.overallClearanceStatus).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('evaluates to ACTION_REQUIRED if any occurrence in the script has ACTION_REQUIRED status', async () => {
    await entityRepo.createOccurrence(projectId, {
      sceneId: scene1Id,
      canonicalEntityId: entityId,
      scriptLineNumber: 2,
      excerptText: 'Occ 1 text',
      usageContext: 'Background mention',
      clearanceStatus: 'NO_ISSUE_SURFACED',
      evaluatedAt: new Date().toISOString(),
    });

    await entityRepo.createOccurrence(projectId, {
      sceneId: scene2Id,
      canonicalEntityId: entityId,
      scriptLineNumber: 10,
      excerptText: 'Occ 2 text',
      usageContext: 'Hero prop usage',
      clearanceStatus: 'ACTION_REQUIRED',
      evaluatedAt: new Date().toISOString(),
    });

    const derivedStatus = await entityRepo.computeDerivedCanonicalStatus(projectId, entityId);
    expect(derivedStatus).toBe('ACTION_REQUIRED');
  });
});
