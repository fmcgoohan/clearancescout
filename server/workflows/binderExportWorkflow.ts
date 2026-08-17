import { projectRepo } from '../repositories/ProjectRepo.js';
import { sceneRepo } from '../repositories/SceneRepo.js';
import { entityRepo } from '../repositories/EntityRepo.js';
import { assessmentRepo } from '../repositories/AssessmentRepo.js';
import { replacementRepo } from '../repositories/ReplacementRepo.js';
import { overrideRepo } from '../repositories/OverrideRepo.js';
import { binderRepo, ClearanceBinderData } from '../repositories/BinderRepo.js';
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

    const rawScenes = await sceneRepo.getScenesByProject(projectId);
    const entities = await entityRepo.getEntitiesByProject(projectId);
    const overridesHistory = await overrideRepo.getAllOverrides(projectId);

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

    const projectSummary = {
      title: project.title,
      productionCompany: project.productionCompany,
      scriptVersion: project.scriptVersion,
      totalScenes: scenes.length,
      totalEntities: entities.length,
      clearedCount,
      actionRequiredCount,
      reviewRecommendedCount,
      overridesCount: overridesHistory.length,
    };

    const binder = await binderRepo.saveBinderExport({
      projectId,
      projectSummary,
      scenes,
      canonicalEntities: entities,
      citationsIndex,
      replacementCatalog,
      overridesHistory,
      disclaimer: 'ClearanceScout provides workflow issue-spotting and clearance risk categorization. It does NOT render formal legal advice.',
    });

    timelineEmitter.emit(projectId, 'BINDER_EXPORT', 'Project Clearance Binder Export Compiled', {
      exportId: binder.id,
      integrityDigest: binder.integrityDigest,
      totalEntities: entities.length,
    });

    return binder;
  }
}

export const binderExportWorkflow = new BinderExportWorkflow();
