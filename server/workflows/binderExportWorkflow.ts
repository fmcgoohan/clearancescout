import { projectRepo } from '../repositories/ProjectRepo.js';
import { sceneRepo } from '../repositories/SceneRepo.js';
import { entityRepo } from '../repositories/EntityRepo.js';
import { assessmentRepo } from '../repositories/AssessmentRepo.js';
import { replacementRepo } from '../repositories/ReplacementRepo.js';
import { binderRepo, ClearanceBinderData } from '../repositories/BinderRepo.js';
import { timelineEmitter } from '../events/timelineEmitter.js';

export class BinderExportWorkflow {
  async compileAndExportBinder(projectId: string): Promise<ClearanceBinderData> {
    timelineEmitter.emit(projectId, 'BINDER_EXPORT', 'Initiating Project Clearance Binder Compilation', {
      projectId,
    });

    const project = await projectRepo.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const scenes = await sceneRepo.getScenesByProject(projectId);
    const entities = await entityRepo.getEntitiesByProject(projectId);

    // Aggregate all citations and replacements
    const citationsIndex: any[] = [];
    const replacementCatalog: any[] = [];

    let clearedCount = 0;
    let actionRequiredCount = 0;
    let reviewRecommendedCount = 0;

    for (const ent of entities) {
      if (ent.overallClearanceStatus === 'NO_ISSUE_SURFACED') clearedCount++;
      else if (ent.overallClearanceStatus === 'ACTION_REQUIRED') actionRequiredCount++;
      else if (ent.overallClearanceStatus === 'REVIEW_RECOMMENDED') reviewRecommendedCount++;

      const assessments = await assessmentRepo.getAssessmentsByEntity(projectId, ent.id);
      for (const asm of assessments) {
        citationsIndex.push(...asm.citations);
      }

      const replacements = await replacementRepo.getReplacementsByEntity(projectId, ent.id);
      replacementCatalog.push(...replacements);
    }

    const projectSummary = {
      title: project.title,
      productionCompany: project.productionCompany,
      scriptVersion: project.scriptVersion,
      totalScenes: scenes.length,
      totalEntities: entities.length,
      clearedCount,
      actionRequiredCount,
      reviewRecommendedCount,
    };

    const binder = await binderRepo.saveBinderExport({
      projectId,
      projectSummary,
      scenes,
      canonicalEntities: entities,
      citationsIndex,
      replacementCatalog,
      disclaimer: 'ClearanceScout provides workflow issue-spotting and clearance risk categorization. It does NOT render formal legal advice.',
    });

    timelineEmitter.emit(projectId, 'BINDER_EXPORT', 'Project Clearance Binder Export Compiled', {
      exportId: binder.id,
      auditSignature: binder.auditSignature,
      totalEntities: entities.length,
    });

    return binder;
  }
}

export const binderExportWorkflow = new BinderExportWorkflow();
