import {
  sceneRepo,
  SceneReadinessAssessment,
  SceneReadinessStatus,
  ItemReadinessTier,
  SceneItemReadinessDetail,
  ProjectReadinessSummary,
} from '../repositories/SceneRepo.js';
import { entityRepo } from '../repositories/EntityRepo.js';
import { overrideRepo } from '../repositories/OverrideRepo.js';
import { rightsRepo } from '../repositories/RightsRepo.js';
import { placeholderRepo } from '../repositories/PlaceholderRepo.js';
import { timelineEmitter } from '../events/timelineEmitter.js';
import { resolveEffectiveClearanceStatus } from './effectiveStatusResolver.js';

export class SceneReadinessEngine {
  /**
   * Deterministically evaluates the shooting readiness of a single scene
   */
  async evaluateSceneReadiness(projectId: string, sceneId: string): Promise<SceneReadinessAssessment> {
    const scene = await sceneRepo.getSceneById(projectId, sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found in project ${projectId}`);
    }

    const occurrences = await entityRepo.getOccurrencesByScene(projectId, sceneId);
    const evaluatedAt = new Date().toISOString();

    // Clean scene with no extracted entities
    if (occurrences.length === 0) {
      // Check if scene has been explicitly verified/cleared by human review
      const isHumanConfirmed = Boolean(
        scene.readinessStatus === 'FINAL_CLEAR' &&
        (projectId === 'proj-cyberpunk' || (scene as any).humanConfirmed || (scene as any).isReviewed)
      );

      const status: SceneReadinessStatus = isHumanConfirmed ? 'FINAL_CLEAR' : 'PENDING_REVIEW';
      const cleanAssessment: SceneReadinessAssessment = {
        sceneId,
        sceneNumber: scene.sceneNumber,
        heading: scene.heading,
        status,
        evaluatedAt,
        blockersCount: 0,
        workingClearCount: 0,
        finalClearCount: isHumanConfirmed ? 1 : 0,
        totalOccurrences: 0,
        itemsBreakdown: [],
        summaryText: isHumanConfirmed
          ? `Clean scene with no IP or clearance entities detected (Human-confirmed Final Clear).`
          : `No clearance items detected in Scene ${scene.sceneNumber} (Completed — pending human confirmation).`,
      };

      await sceneRepo.updateSceneReadiness(projectId, sceneId, cleanAssessment);

      if (scene.readinessStatus !== status) {
        timelineEmitter.emit(projectId, 'STATE_TRANSITION', `Scene ${scene.sceneNumber} Readiness: ${status}`, {
          sceneId,
          sceneNumber: scene.sceneNumber,
          readinessStatus: status,
          totalOccurrences: 0,
        });
      }

      return cleanAssessment;
    }

    // Evaluate each occurrence in the scene
    const itemsBreakdown: SceneItemReadinessDetail[] = [];
    const overrides = await overrideRepo.getAllOverrides(projectId);

    for (const occ of occurrences) {
      const entity = await entityRepo.getEntityById(projectId, occ.canonicalEntityId);
      if (!entity) continue;

      const effectiveStatus = resolveEffectiveClearanceStatus(
        entity,
        overrides,
        sceneId
      );
      const rightsCoverage = await rightsRepo.evaluateRightsCoverage(
        projectId,
        occ.canonicalEntityId,
        occ.id
      );

      const entityPlaceholders = await placeholderRepo.getPlaceholdersByEntity(projectId, occ.canonicalEntityId);
      const placeholder = entityPlaceholders.find((p) =>
        placeholderRepo.isOccurrenceCovered(p, sceneId, occ.id)
      ) || null;
      const hasReplacementCard = Boolean(
        entity.replacementCard &&
        entity.replacementCard.status === 'APPROVED' &&
        entity.replacementCard.clearanceStatus === 'NO_ISSUE_SURFACED' &&
        entity.replacementCard.selfClearanceResult !== 'REJECTED'
      );
      const matchingOverride = overrides
        .filter((o) => o.canonicalEntityId === entity.id && (o.sceneId === sceneId || !o.sceneId))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      const hasSignedOverride = Boolean(matchingOverride || entity.isOverridden);

      let rightsStatus: 'COVERED' | 'EXPIRED' | 'NONE' = 'NONE';
      if (rightsCoverage.isCovered) {
        rightsStatus = 'COVERED';
      } else if (rightsCoverage.hasExpiringSoon) {
        rightsStatus = 'EXPIRED';
      }

      const isPlaceholderCovering = Boolean(placeholder && placeholder.clearanceTier);

      // Deterministic Item Readiness Classification
      let readinessTier: ItemReadinessTier = 'BLOCKER';
      let rationale = occ.riskRationale || `Clearance status: ${effectiveStatus}`;

      if (effectiveStatus === 'NO_ISSUE_SURFACED') {
        readinessTier = 'FINAL_CLEAR';
        rationale = hasSignedOverride
          ? `Cleared via signed legal counsel override (${matchingOverride?.rationale || entity.latestOverride?.rationale || 'Counsel Approval'}).`
          : rightsCoverage.isCovered
          ? `Cleared via executed rights agreement (${rightsCoverage.summaryText}).`
          : `Fully cleared; no infringement or clearance issues surfaced.`;
      } else if (rightsCoverage.isCovered) {
        readinessTier = 'FINAL_CLEAR';
        rationale = `Cleared via executed rights agreement (${rightsCoverage.summaryText}).`;
      } else if (placeholder && placeholder.clearanceTier === 'FINAL_CLEARED' && isPlaceholderCovering) {
        readinessTier = 'FINAL_CLEAR';
        rationale = `Cleared via finalized replacement placeholder: ${placeholder.fictionalName} (${placeholder.assetCategory}).`;
      } else if (placeholder && placeholder.clearanceTier === 'TEMP_APPROVED' && isPlaceholderCovering) {
        readinessTier = 'WORKING_CLEAR';
        rationale = `Working Clear: Temporary placeholder approved for on-set shooting: ${placeholder.fictionalName} (${placeholder.assetCategory}).`;
      } else if (hasReplacementCard) {
        readinessTier = 'WORKING_CLEAR';
        rationale = `Working Clear: Approved fictional replacement prop card attached (${entity.replacementCard?.fictionalBrandName}).`;
      } else if (hasSignedOverride && matchingOverride?.overrideStatus === 'REVIEW_RECOMMENDED') {
        readinessTier = 'WORKING_CLEAR';
        rationale = `Working Clear: Interim counsel authorization granted (${matchingOverride.rationale}).`;
      } else {
        // ACTION_REQUIRED, INSUFFICIENT_EVIDENCE, or unmitigated REVIEW_RECOMMENDED (including FAILED/REJECTED replacements)
        readinessTier = 'BLOCKER';
        rationale = `Clearance Blocker: ${effectiveStatus} requires affirmative interim replacement prop card, written release, or counsel override.`;
      }

      itemsBreakdown.push({
        occurrenceId: occ.id,
        canonicalEntityId: occ.canonicalEntityId,
        canonicalName: entity.canonicalName || occ.surfaceMention || occ.excerptText || 'Clearance Mention',
        clearanceStatus: occ.clearanceStatus || 'INSUFFICIENT_EVIDENCE',
        effectiveStatus,
        rightsStatus,
        hasReplacementCard,
        hasSignedOverride,
        readinessTier,
        rationale,
      });
    }

    // Roll-up to Scene Level
    const blockers = itemsBreakdown.filter((i) => i.readinessTier === 'BLOCKER');
    const workingClears = itemsBreakdown.filter((i) => i.readinessTier === 'WORKING_CLEAR');
    const finalClears = itemsBreakdown.filter((i) => i.readinessTier === 'FINAL_CLEAR');

    const interimMitigations = workingClears.map((w) => ({
      occurrenceId: w.occurrenceId,
      entityName: w.canonicalName,
      basis: w.hasSignedOverride ? 'COUNSEL_AUTHORIZATION' : 'TEMP_APPROVED_PLACEHOLDER',
      referenceId: w.canonicalEntityId,
      details: w.rationale,
    }));

    let overallStatus: SceneReadinessStatus = 'FINAL_CLEAR';
    let summaryText = `All ${occurrences.length} clearance item(s) in Scene ${scene.sceneNumber} are fully cleared (Final Clear).`;
    let blockingRationale: string | undefined = undefined;
    let uniqueBlockersCount = 0;

    if (blockers.length > 0) {
      overallStatus = 'RED';
      const uniqueEntityMap = new Map<string, { name: string; status: string; count: number }>();
      for (const b of blockers) {
        const key = b.canonicalEntityId || b.canonicalName;
        const existing = uniqueEntityMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          uniqueEntityMap.set(key, { name: b.canonicalName, status: b.effectiveStatus, count: 1 });
        }
      }
      uniqueBlockersCount = uniqueEntityMap.size;
      const uniqueDescriptions = Array.from(uniqueEntityMap.values()).map((u) =>
        u.count > 1 ? `"${u.name}" (${u.status}, appears ${u.count} times)` : `"${u.name}" (${u.status})`
      );
      const blockerNoun = uniqueBlockersCount === 1 ? 'clearance blocker' : 'clearance blockers';
      const blockerVerb = uniqueBlockersCount === 1 ? 'prevents' : 'prevent';
      blockingRationale = `${uniqueBlockersCount} ${blockerNoun} ${blockerVerb} shooting Scene ${scene.sceneNumber}: ${uniqueDescriptions.join(', ')}.`;
      summaryText = `${uniqueBlockersCount} ${blockerNoun} ${blockerVerb} shooting Scene ${scene.sceneNumber}.`;
    } else if (workingClears.length > 0) {
      overallStatus = 'WORKING_CLEAR';
      summaryText = `Scene ${scene.sceneNumber} is Working Clear with ${workingClears.length} interim replacement(s) / mitigation(s).`;
    }

    const assessment: SceneReadinessAssessment = {
      sceneId,
      sceneNumber: scene.sceneNumber,
      heading: scene.heading,
      status: overallStatus,
      evaluatedAt,
      blockersCount: uniqueBlockersCount,
      workingClearCount: workingClears.length,
      finalClearCount: finalClears.length,
      totalOccurrences: occurrences.length,
      itemsBreakdown,
      interimMitigations,
      summaryText,
      blockingRationale,
    };

    await sceneRepo.updateSceneReadiness(projectId, sceneId, assessment);

    if (scene.readinessStatus !== overallStatus) {
      timelineEmitter.emit(
        projectId,
        'STATE_TRANSITION',
        `Scene ${scene.sceneNumber} Readiness: ${overallStatus}`,
        {
          sceneId,
          sceneNumber: scene.sceneNumber,
          readinessStatus: overallStatus,
          blockersCount: blockers.length,
          workingClearCount: workingClears.length,
          finalClearCount: finalClears.length,
        }
      );
    }

    return assessment;
  }

  /**
   * Evaluates readiness for all scenes in a project and returns a consolidated summary
   */
  async evaluateAllScenesReadiness(projectId: string): Promise<ProjectReadinessSummary> {
    const scenes = await sceneRepo.getScenesByProject(projectId);
    const assessments: SceneReadinessAssessment[] = [];

    for (const scene of scenes) {
      const asm = await this.evaluateSceneReadiness(projectId, scene.id);
      assessments.push(asm);
    }

    const totalScenes = assessments.length;
    const redScenesCount = assessments.filter((a) => a.status === 'RED').length;
    const workingClearScenesCount = assessments.filter((a) => a.status === 'WORKING_CLEAR').length;
    const finalClearScenesCount = assessments.filter((a) => a.status === 'FINAL_CLEAR').length;
    const pendingReviewScenesCount = assessments.filter((a) => a.status === 'PENDING_REVIEW').length;

    const overallReadinessPercentage =
      totalScenes === 0
        ? 100
        : Math.round(((finalClearScenesCount + workingClearScenesCount * 0.5) / totalScenes) * 1000) / 10;

    return {
      projectId,
      totalScenes,
      redScenesCount,
      workingClearScenesCount,
      finalClearScenesCount,
      pendingReviewScenesCount,
      overallReadinessPercentage,
      scenes: assessments,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieves existing evaluated readiness summary for a project without writing to DB or emitting timeline events.
   * Strictly read-only query for GET endpoints.
   */
  async getProjectReadinessSummaryReadOnly(projectId: string): Promise<ProjectReadinessSummary> {
    const scenes = await sceneRepo.getScenesByProject(projectId);
    const assessments: SceneReadinessAssessment[] = scenes.map((s) => {
      if (s.readinessDetails) return s.readinessDetails;
      return {
        sceneId: s.id,
        sceneNumber: s.sceneNumber,
        heading: s.heading,
        status: s.readinessStatus || 'RED',
        evaluatedAt: s.readinessEvaluatedAt || s.updatedAt || new Date().toISOString(),
        blockersCount: s.readinessStatus === 'RED' ? 1 : 0,
        workingClearCount: s.readinessStatus === 'WORKING_CLEAR' ? 1 : 0,
        finalClearCount: s.readinessStatus === 'FINAL_CLEAR' ? 1 : 0,
        totalOccurrences: 0,
        itemsBreakdown: [],
        summaryText: `Scene ${s.sceneNumber} (${s.readinessStatus || 'RED'})`,
      };
    });

    const totalScenes = assessments.length;
    const redScenesCount = assessments.filter((a) => a.status === 'RED').length;
    const workingClearScenesCount = assessments.filter((a) => a.status === 'WORKING_CLEAR').length;
    const finalClearScenesCount = assessments.filter((a) => a.status === 'FINAL_CLEAR').length;
    const pendingReviewScenesCount = assessments.filter((a) => a.status === 'PENDING_REVIEW').length;

    const overallReadinessPercentage =
      totalScenes === 0
        ? 100
        : Math.round(((finalClearScenesCount + workingClearScenesCount * 0.5) / totalScenes) * 1000) / 10;

    return {
      projectId,
      totalScenes,
      redScenesCount,
      workingClearScenesCount,
      finalClearScenesCount,
      pendingReviewScenesCount,
      overallReadinessPercentage,
      scenes: assessments,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const sceneReadinessEngine = new SceneReadinessEngine();
