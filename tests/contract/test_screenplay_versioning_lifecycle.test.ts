import { describe, it, expect, beforeEach } from 'vitest';
import { canonicalRegistryWorkflow } from '../../server/workflows/canonicalRegistryWorkflow.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { actionNotificationRepo } from '../../server/repositories/ActionNotificationRepo.js';
import { clearanceEvaluator } from '../../server/workflows/clearanceEvaluator.js';

describe('Feature 019: Screenplay Draft Replacement & Cache Invalidation Lifecycle', () => {
  let projectId: string;

  beforeEach(async () => {
    const proj = await projectRepo.createProject({
      title: 'Versioning Lifecycle Test',
      productionCompany: 'Draft Revisions LLC',
      scriptVersion: 'v1.0',
      executionMode: 'TEST_MODE',
    });
    projectId = proj.id;
  });

  it('cleanly replaces old scenes on re-upload without duplicate scenes or ghost occurrences', async () => {
    // Draft 1: 3 Scenes
    const draft1 = `INT. COFFEE SHOP - DAY\n\nAlex drinks Summit Cola.\n\nEXT. ALLEY - DAY\n\nAlex runs past a Porsche 911.\n\nINT. CAR - DAY\n\nAlex checks an Apple iPhone.`;
    const res1 = await canonicalRegistryWorkflow.processScriptUpload(projectId, draft1, 'FOUNTAIN');
    expect(res1.scenesParsed).toBe(3);

    const scenesAfterDraft1 = await sceneRepo.getScenesByProject(projectId);
    expect(scenesAfterDraft1.length).toBe(3);
    const occsAfterDraft1 = await entityRepo.getAllOccurrences(projectId);
    expect(occsAfterDraft1.length).toBe(3);

    // Create an action item tied to Draft 1
    const act = await actionNotificationRepo.createAction({
      projectId,
      canonicalEntityId: occsAfterDraft1[0].canonicalEntityId,
      entityName: 'Summit Cola',
      department: 'LEGAL_COUNSEL',
      actionType: 'REQUEST_COUNSEL_OVERRIDE',
      priority: 'HIGH',
      assignedRole: 'Production Legal Counsel',
      description: 'Review brand mention',
      status: 'OPEN',
      sceneNumber: 1,
    });
    expect(act.status).toBe('OPEN');

    // Draft 2: 2 Scenes (Scene 3 removed)
    const draft2 = `INT. COFFEE SHOP - DAY\n\nAlex drinks Summit Cola.\n\nEXT. ALLEY - DAY\n\nAlex runs past a Porsche 911.`;
    const res2 = await canonicalRegistryWorkflow.processScriptUpload(projectId, draft2, 'FOUNTAIN');
    expect(res2.scenesParsed).toBe(2);

    const scenesAfterDraft2 = await sceneRepo.getScenesByProject(projectId);
    expect(scenesAfterDraft2.length).toBe(2);
    expect(scenesAfterDraft2.map(s => s.sceneNumber)).toEqual([1, 2]);

    const occsAfterDraft2 = await entityRepo.getAllOccurrences(projectId);
    expect(occsAfterDraft2.length).toBe(2);

    // Verify orphaned action item was auto-superseded
    const updatedAct = await actionNotificationRepo.getActionById(projectId, act.id);
    expect(updatedAct?.status).toBe('RESOLVED');
    expect(updatedAct?.resolutionReason).toBe('SCRIPT_REVISION_SUPERSEDED');
  });

  it('invalidates grounding search cache and updates groundingCacheVersion on entity name / metadata updates', async () => {
    const ent = await entityRepo.createCanonicalEntity({
      projectId,
      canonicalName: 'Original Brand Name',
      entityCategory: 'BRAND',
      description: 'Brand description',
      overallClearanceStatus: 'REVIEW_RECOMMENDED',
      groundingCacheVersion: 1,
    });

    // Update entity canonical name
    const updateResult = await entityRepo.updateCanonicalEntity(projectId, ent.id, {
      canonicalName: 'New Renamed Brand',
    });

    expect(updateResult?.assessmentInvalidated).toBe(true);
    expect(updateResult?.entity.groundingCacheVersion).toBe(2);
    expect(updateResult?.entity.isStale).toBe(true);
    expect(updateResult?.entity.overallClearanceStatus).toBe('INSUFFICIENT_EVIDENCE');

    // Run clearance evaluation on renamed entity
    const newAsm = await clearanceEvaluator.evaluateEntityClearance(projectId, ent.id);
    expect(newAsm).toBeDefined();

    // Verify entity isStale flag is reset after fresh evaluation
    const refreshed = await entityRepo.getEntityById(projectId, ent.id);
    expect(refreshed?.isStale).toBe(false);
  });
});
