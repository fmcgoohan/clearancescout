import { projectRepo } from '../repositories/ProjectRepo.js';
import { sceneRepo } from '../repositories/SceneRepo.js';
import { entityRepo } from '../repositories/EntityRepo.js';
import { assessmentRepo } from '../repositories/AssessmentRepo.js';
import { replacementRepo } from '../repositories/ReplacementRepo.js';
import { overrideRepo } from '../repositories/OverrideRepo.js';
import { rightsRepo } from '../repositories/RightsRepo.js';
import { placeholderRepo } from '../repositories/PlaceholderRepo.js';
import { sceneReadinessEngine } from './sceneReadinessEngine.js';
import { actionNotificationRepo } from '../repositories/ActionNotificationRepo.js';
import { binderRepo, ClearanceBinderData, ProvenanceSummary, BinderProjectSummary } from '../repositories/BinderRepo.js';
import { timelineEmitter } from '../events/timelineEmitter.js';
import { resolveEffectiveClearanceStatus } from './effectiveStatusResolver.js';

export class BinderExportWorkflow {
  async compileAndExportBinder(projectId: string): Promise<ClearanceBinderData> {
    timelineEmitter.emit(projectId, 'BINDER_EXPORT', 'Initiating Project Clearance Binder Compilation', {
      projectId,
    });

    const project = await projectRepo.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const [rawScenes, entities, overridesHistory, rights, placeholders, readinessSummary, unresolvedActions] =
      await Promise.all([
        sceneRepo.getScenesByProject(projectId),
        entityRepo.getEntitiesByProject(projectId),
        overrideRepo.getAllOverrides(projectId),
        rightsRepo.getRightsByProject(projectId),
        placeholderRepo.getPlaceholdersByProject(projectId),
        sceneReadinessEngine.evaluateAllScenesReadiness(projectId),
        actionNotificationRepo.getActionsByProject(projectId, { status: 'OPEN' }),
      ]);

    // Aggregate all citations and replacements
    const citationsIndex: any[] = [];
    const replacementCatalog: any[] = [];

    let clearedCount = 0;
    let actionRequiredCount = 0;
    let reviewRecommendedCount = 0;

    for (const ent of entities) {
      const effectiveProjectStatus = resolveEffectiveClearanceStatus(ent, overridesHistory);
      if (effectiveProjectStatus === 'NO_ISSUE_SURFACED') clearedCount++;
      else if (effectiveProjectStatus === 'ACTION_REQUIRED') actionRequiredCount++;
      else if (effectiveProjectStatus === 'REVIEW_RECOMMENDED') reviewRecommendedCount++;

      const assessments = await assessmentRepo.getAssessmentsByEntity(projectId, ent.id);
      for (const asm of assessments) {
        citationsIndex.push(...asm.citations);
      }

      const replacements = await replacementRepo.getReplacementsByEntity(projectId, ent.id);
      replacementCatalog.push(...replacements);
    }

    // Calculate aggregated mixed evidence provenance summary
    let liveCount = 0;
    let demoCount = 0;
    let fallbackCount = 0;

    for (const cit of citationsIndex) {
      if (cit.provenance === 'PARALLEL_LIVE') liveCount++;
      else if (cit.provenance === 'FALLBACK_FIXTURE') fallbackCount++;
      else demoCount++;
    }

    let dominantProvenance: 'PARALLEL_LIVE' | 'DEMO_FIXTURE' | 'FALLBACK_FIXTURE' | 'MIXED' = 'DEMO_FIXTURE';
    const distinctTypes = [liveCount > 0, demoCount > 0, fallbackCount > 0].filter(Boolean).length;
    if (distinctTypes > 1) {
      dominantProvenance = 'MIXED';
    } else if (liveCount > 0) {
      dominantProvenance = 'PARALLEL_LIVE';
    } else if (fallbackCount > 0) {
      dominantProvenance = 'FALLBACK_FIXTURE';
    } else {
      dominantProvenance = 'DEMO_FIXTURE';
    }

    const provenanceSummary: ProvenanceSummary = {
      liveCount,
      demoCount,
      fallbackCount,
      dominantProvenance,
    };

    // Enhance scenes with hierarchical effective status resolution for occurrences
    const scenes = await Promise.all(
      rawScenes.map(async (scene) => {
        const occurrences = await entityRepo.getOccurrencesByScene(projectId, scene.id);
        const resolvedOccurrences = occurrences.map((occ) => {
          const ent = entities.find((e) => e.id === occ.canonicalEntityId);
          const effectiveStatus = ent
            ? resolveEffectiveClearanceStatus(ent, overridesHistory, scene.id)
            : 'INSUFFICIENT_EVIDENCE';
          return {
            ...occ,
            effectiveStatus,
          };
        });
        return {
          ...scene,
          occurrences: resolvedOccurrences,
        };
      })
    );

    const projectSummary: BinderProjectSummary = {
      projectId,
      projectType: project.projectType || 'Movie',
      title: project.title,
      productionCompany: project.productionCompany,
      scriptVersion: project.scriptVersion,
      totalScenes: scenes.length,
      finalClearScenes: readinessSummary.finalClearScenesCount,
      workingClearScenes: readinessSummary.workingClearScenesCount,
      redScenes: readinessSummary.redScenesCount,
      pendingReviewScenes: readinessSummary.pendingReviewScenesCount || 0,
      overallReadinessPercentage: readinessSummary.overallReadinessPercentage,
      totalEntities: entities.length,
      clearedCount,
      actionRequiredCount,
      reviewRecommendedCount,
      activePlaceholdersCount: placeholders.length,
      activeRightsCount: rights.length,
      openActionsCount: unresolvedActions.length,
      overridesCount: overridesHistory.length,
    };

    const binder = await binderRepo.saveBinderExport({
      projectId,
      projectSummary,
      provenanceSummary,
      scenes,
      sceneReadinessSchedule: readinessSummary.scenes,
      canonicalEntities: entities,
      rightsAgreements: rights,
      placeholders,
      unresolvedActions,
      citationsIndex,
      replacementCatalog,
      overridesHistory,
      disclaimer: 'ClearanceScout provides workflow issue-spotting and clearance risk categorization. It does NOT render formal legal advice.',
    });

    timelineEmitter.emit(projectId, 'BINDER_EXPORT', 'Project Clearance Binder Export Compiled', {
      exportId: binder.id,
      integrityDigest: binder.integrityDigest,
      dominantProvenance: provenanceSummary.dominantProvenance,
      totalEntities: entities.length,
      readinessPercentage: readinessSummary.overallReadinessPercentage,
    });

    return binder;
  }
}

export const binderExportWorkflow = new BinderExportWorkflow();

