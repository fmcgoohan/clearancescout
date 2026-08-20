import { describe, it, expect, beforeEach } from 'vitest';
import { sceneReadinessEngine } from '../../server/workflows/sceneReadinessEngine.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { placeholderRepo } from '../../server/repositories/PlaceholderRepo.js';

describe('Feature 019: Failed Replacement Exclusion from Scene Readiness', () => {
  let projectId: string;
  let sceneId: string;
  let entityId: string;

  beforeEach(async () => {
    const proj = await projectRepo.createProject({
      title: 'Failed Replacement Test',
      productionCompany: 'Safety First Films',
      scriptVersion: 'v1.0',
      executionMode: 'TEST_MODE',
    });
    projectId = proj.id;

    const scene = await sceneRepo.createScene({
      projectId,
      sceneNumber: 1,
      heading: 'INT. WORKSHOP - DAY',
      locationType: 'INT',
      timeOfDay: 'DAY',
      rawText: 'Alex examines the hazardous prop.',
      characterActionSummary: 'Alex inspects prop.',
    });
    sceneId = scene.id;

    const entity = await entityRepo.createCanonicalEntity({
      projectId,
      canonicalName: 'Hazardous Brand Prop',
      entityCategory: 'BRAND',
      description: 'High risk brand',
      overallClearanceStatus: 'ACTION_REQUIRED',
    });
    entityId = entity.id;

    await entityRepo.createOccurrence(projectId, {
      sceneId,
      canonicalEntityId: entityId,
      scriptLineNumber: 1,
      excerptText: 'Alex examines the Hazardous Brand Prop',
      usageContext: 'Hero prop usage',
      clearanceStatus: 'ACTION_REQUIRED',
    });
  });

  it('keeps scene RED when entity has an unapproved / proposed replacement card', async () => {
    // Attach an unapproved (PROPOSED) replacement card
    await entityRepo.attachReplacementCard(projectId, entityId, {
      id: 'rep-proposed',
      projectId,
      canonicalEntityId: entityId,
      targetEntityName: 'Hazardous Brand Prop',
      fictionalBrandName: 'Unverified Brand Candidate',
      designBrief: 'Brief',
      eraAesthetic: 'Contemporary',
      clearanceStatus: 'ACTION_REQUIRED',
      selfClearanceResult: 'ESCALATED_TO_COUNSEL',
      totalAttempts: 3,
      attemptHistory: [],
      citations: [],
      status: 'PROPOSED', // Not APPROVED
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const readiness = await sceneReadinessEngine.evaluateSceneReadiness(projectId, sceneId);
    expect(readiness.status).toBe('RED');
    expect(readiness.blockersCount).toBe(1);
    expect(readiness.workingClearCount).toBe(0);
  });

  it('transitions scene to WORKING_CLEAR only when placeholder is TEMP_APPROVED', async () => {
    await placeholderRepo.createPlaceholder(projectId, {
      canonicalEntityId: entityId,
      canonicalName: 'Hazardous Brand Prop',
      assetCategory: 'BRAND',
      fictionalName: 'Safe Approved Brand',
      description: 'Safe prop',
      clearanceTier: 'TEMP_APPROVED',
      creativeRationale: 'Vetted prop',
      approvedBy: 'Legal Counsel',
      approvalDate: new Date().toISOString(),
      scope: 'PROJECT_WIDE',
    });

    const readiness = await sceneReadinessEngine.evaluateSceneReadiness(projectId, sceneId);
    expect(readiness.status).toBe('WORKING_CLEAR');
    expect(readiness.blockersCount).toBe(0);
    expect(readiness.workingClearCount).toBe(1);
  });
});
