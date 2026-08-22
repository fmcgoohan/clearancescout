import {
  actionNotificationRepo,
  ClearanceActionItem,
  DepartmentTarget,
  ClearanceActionType,
  ActionPriority,
} from '../repositories/ActionNotificationRepo.js';
import { entityRepo, CanonicalEntityData, SceneEntityOccurrenceData } from '../repositories/EntityRepo.js';
import { sceneRepo } from '../repositories/SceneRepo.js';
import { overrideRepo } from '../repositories/OverrideRepo.js';
import { rightsRepo } from '../repositories/RightsRepo.js';
import { placeholderRepo } from '../repositories/PlaceholderRepo.js';
import { timelineEmitter } from '../events/timelineEmitter.js';
import { sceneReadinessEngine } from './sceneReadinessEngine.js';

export class ActionDispatcher {
  /**
   * Dispatches department action items for an evaluated occurrence based on category and status
   */
  async dispatchOccurrenceAction(
    projectId: string,
    occurrence: SceneEntityOccurrenceData,
    entity: CanonicalEntityData
  ): Promise<ClearanceActionItem | null> {
    const existingOpenActions = await actionNotificationRepo.getActionsByProject(projectId, {
      canonicalEntityId: entity.id,
      sceneId: occurrence.sceneId,
      status: 'OPEN',
    });

    const scene = await sceneRepo.getSceneById(projectId, occurrence.sceneId);
    const sceneNumber = scene?.sceneNumber;
    const sceneLabel = sceneNumber ? (scene?.heading ? `Scene ${sceneNumber} (${scene.heading})` : `Scene ${sceneNumber}`) : occurrence.sceneId;

    let actionType: ClearanceActionType | null = null;
    let targetDepartment: DepartmentTarget = 'LEGAL_COUNSEL';
    let title = '';
    let description = '';
    let priority: ActionPriority = 'MEDIUM';

    if (occurrence.clearanceStatus === 'INSUFFICIENT_EVIDENCE') {
      actionType = 'RETRY_RESEARCH';
      targetDepartment = 'LEGAL_COUNSEL';
      title = `Retry Legal Research: ${entity.canonicalName}`;
      description = `Insufficient evidence surfaced for ${entity.canonicalName} in ${sceneLabel}. Live research retry required.`;
      priority = 'HIGH';
    } else if (occurrence.clearanceStatus === 'ACTION_REQUIRED') {
      if (entity.entityCategory === 'GRAPHIC_PROP') {
        actionType = 'ART_DEPT_REPLACEMENT';
        targetDepartment = 'ART_DEPT';
        title = `Create Fictional Prop Graphic: ${entity.canonicalName}`;
        description = `Proprietary graphic in ${sceneLabel} requires fictionalized non-infringing prop packaging/warning card.`;
        priority = 'HIGH';
      } else if (entity.entityCategory === 'ART_MUSIC') {
        actionType = 'LEGAL_COUNSEL_RELEASE';
        targetDepartment = 'LEGAL_COUNSEL';
        title = `Secure Music Synchronization License: ${entity.canonicalName}`;
        description = `Copyrighted musical work in ${sceneLabel} requires written synchronization license.`;
        priority = 'HIGH';
      } else if (entity.entityCategory === 'BRAND') {
        actionType = 'LEGAL_COUNSEL_RELEASE';
        targetDepartment = 'LEGAL_COUNSEL';
        title = `Draft Trademark Clearance Release: ${entity.canonicalName}`;
        description = `Prominent brand mark in ${sceneLabel} requires written trademark clearance release.`;
        priority = 'HIGH';
      } else {
        actionType = 'LEGAL_COUNSEL_RELEASE';
        targetDepartment = 'LEGAL_COUNSEL';
        title = `Clearance Release Required: ${entity.canonicalName}`;
        description = `Action required for ${entity.canonicalName} in ${sceneLabel}.`;
        priority = 'HIGH';
      }
    } else if (occurrence.clearanceStatus === 'REVIEW_RECOMMENDED') {
      if (entity.entityCategory === 'PROPRIETARY_LOCATION') {
        actionType = 'LOCATIONS_PERMIT';
        targetDepartment = 'LOCATIONS';
        title = `Secure Location Filming Permit: ${entity.canonicalName}`;
        description = `Proprietary location in ${sceneLabel} requires location release or filming permit.`;
        priority = 'MEDIUM';
      } else if (entity.entityCategory === 'PUBLIC_FIGURE') {
        actionType = 'COUNSEL_OVERRIDE_REVIEW';
        targetDepartment = 'LEGAL_COUNSEL';
        title = `Review Right of Publicity: ${entity.canonicalName}`;
        description = `Living public figure depicted in ${sceneLabel} requires legal counsel review.`;
        priority = 'MEDIUM';
      } else if (entity.entityCategory === 'BRAND') {
        actionType = 'LEGAL_COUNSEL_RELEASE';
        targetDepartment = 'LEGAL_COUNSEL';
        title = `Review Trademark Clearance: ${entity.canonicalName}`;
        description = `Brand mark in ${sceneLabel} requires trademark counsel review.`;
        priority = 'MEDIUM';
      } else if (entity.entityCategory === 'GRAPHIC_PROP') {
        actionType = 'ART_DEPT_REPLACEMENT';
        targetDepartment = 'ART_DEPT';
        title = `Review Graphic Prop: ${entity.canonicalName}`;
        description = `Graphic prop in ${sceneLabel} requires art department review.`;
        priority = 'MEDIUM';
      } else if (entity.entityCategory === 'ART_MUSIC') {
        actionType = 'LEGAL_COUNSEL_RELEASE';
        targetDepartment = 'LEGAL_COUNSEL';
        title = `Review Music License: ${entity.canonicalName}`;
        description = `Musical work in ${sceneLabel} requires licensing review.`;
        priority = 'MEDIUM';
      }
    }

    if (!actionType) return null;

    // Check if duplicate open action already exists
    const duplicate = existingOpenActions.find((a) => a.actionType === actionType);
    if (duplicate) {
      return duplicate;
    }

    const createdAction = await actionNotificationRepo.createActionItem(projectId, {
      sceneId: occurrence.sceneId,
      sceneNumber,
      canonicalEntityId: entity.id,
      canonicalName: entity.canonicalName,
      occurrenceId: occurrence.id,
      actionType,
      targetDepartment,
      title,
      description,
      priority,
      status: 'OPEN',
    });

    timelineEmitter.emit(projectId, 'TOOL_CALL', `Action Item Queued: ${title}`, {
      actionId: createdAction.id,
      actionType,
      targetDepartment,
      priority,
    });

    return createdAction;
  }

  /**
   * Dispatches critical shooting blocker alert and production management action when scene is RED
   */
  async dispatchSceneRedAlert(
    projectId: string,
    sceneId: string,
    sceneNumber: number,
    heading: string,
    rationale?: string
  ): Promise<void> {
    const existing = await actionNotificationRepo.getActionsByProject(projectId, {
      sceneId,
      status: 'OPEN',
    });

    const hasProdReview = existing.some((a) => a.actionType === 'PRODUCTION_REVIEW');
    if (!hasProdReview) {
      await actionNotificationRepo.createActionItem(projectId, {
        sceneId,
        sceneNumber,
        actionType: 'PRODUCTION_REVIEW',
        targetDepartment: 'PRODUCTION_MGMT',
        title: `Scene ${sceneNumber} Shooting Blocker: RED`,
        description: rationale || `Clearance blocker prevents shooting Scene ${sceneNumber} (${heading}).`,
        priority: 'CRITICAL',
        status: 'OPEN',
      });
    }

    await actionNotificationRepo.createNotification(projectId, {
      sceneId,
      sceneNumber,
      targetDepartment: 'PRODUCTION_MGMT',
      headline: `🚨 Shooting Alert: Scene ${sceneNumber} Blocked (RED)`,
      message: rationale || `Clearance blocker detected in Scene ${sceneNumber}: ${heading}.`,
      severity: 'CRITICAL',
    });
  }

  /**
   * Synchronizes and generates all derived action items from current project state
   */
  async syncProjectActions(projectId: string): Promise<{
    actionsGenerated: number;
    actionsResolved: number;
    activeOpenActionsCount: number;
    syncedAt: string;
  }> {
    const [entities, scenes] = await Promise.all([
      entityRepo.getEntitiesByProject(projectId),
      sceneRepo.getScenesByProject(projectId),
    ]);

    let actionsGenerated = 0;
    let actionsResolved = 0;

    for (const entity of entities) {
      const [occurrences, overrides, rights, placeholders] = await Promise.all([
        entityRepo.getOccurrencesByEntity(projectId, entity.id),
        overrideRepo.getOverridesByEntity(projectId, entity.id),
        rightsRepo.getRightsByEntity(projectId, entity.id),
        placeholderRepo.getPlaceholdersByEntity(projectId, entity.id),
      ]);

      for (const occ of occurrences) {
        if (occ.clearanceStatus === 'ACTION_REQUIRED' || occ.clearanceStatus === 'REVIEW_RECOMMENDED' || occ.clearanceStatus === 'INSUFFICIENT_EVIDENCE') {
          // 1. Check if covered by a scoped placeholder
          const coveringPlaceholder = placeholders.find((ph) =>
            placeholderRepo.isOccurrenceCovered(ph, occ.sceneId, occ.id)
          );

          // 2. Check if covered by an active scoped rights agreement
          const rightsCoverage = await rightsRepo.evaluateRightsCoverage(projectId, entity.id, occ.id);

          // 3. Check if covered by an active scoped counsel override
          const coveringOverride = overrides.find(
            (o) =>
              (o.overrideStatus === 'NO_ISSUE_SURFACED' || o.overrideStatus === 'REVIEW_RECOMMENDED') &&
              (!o.sceneId || o.sceneId === occ.sceneId)
          );
          const hasCoveringOverride = Boolean(coveringOverride) || (entity.isOverridden && !overrides.some((o) => o.sceneId && o.sceneId !== occ.sceneId));

          if (coveringPlaceholder) {
            const actions = await actionNotificationRepo.getActionsByProject(projectId, {
              canonicalEntityId: entity.id,
              sceneId: occ.sceneId,
            });
            const openActions = actions.filter(
              (a) => (a.status === 'OPEN' || a.status === 'IN_PROGRESS') && (!a.occurrenceId || a.occurrenceId === occ.id)
            );
            for (const act of openActions) {
              await actionNotificationRepo.updateActionStatus(
                projectId,
                act.id,
                'RESOLVED',
                `PLACEHOLDER_ATTACHED_${coveringPlaceholder.clearanceTier}`
              );
              actionsResolved++;
            }
          } else if (entity.replacementCard) {
            const actions = await actionNotificationRepo.getActionsByProject(projectId, {
              canonicalEntityId: entity.id,
              sceneId: occ.sceneId,
            });
            const openActions = actions.filter(
              (a) => (a.status === 'OPEN' || a.status === 'IN_PROGRESS') && (!a.occurrenceId || a.occurrenceId === occ.id)
            );
            for (const act of openActions) {
              await actionNotificationRepo.updateActionStatus(
                projectId,
                act.id,
                'RESOLVED',
                'REPLACEMENT_CARD_ATTACHED'
              );
              actionsResolved++;
            }
          } else if (rightsCoverage.isCovered) {
            const actions = await actionNotificationRepo.getActionsByProject(projectId, {
              canonicalEntityId: entity.id,
              sceneId: occ.sceneId,
            });
            const openActions = actions.filter(
              (a) => (a.status === 'OPEN' || a.status === 'IN_PROGRESS') && (!a.occurrenceId || a.occurrenceId === occ.id)
            );
            for (const act of openActions) {
              await actionNotificationRepo.updateActionStatus(
                projectId,
                act.id,
                'RESOLVED',
                'RIGHTS_LICENSE_ATTACHED'
              );
              actionsResolved++;
            }
          } else if (hasCoveringOverride) {
            const actions = await actionNotificationRepo.getActionsByProject(projectId, {
              canonicalEntityId: entity.id,
              sceneId: occ.sceneId,
            });
            const openActions = actions.filter(
              (a) => (a.status === 'OPEN' || a.status === 'IN_PROGRESS') && (!a.occurrenceId || a.occurrenceId === occ.id)
            );
            for (const act of openActions) {
              await actionNotificationRepo.updateActionStatus(
                projectId,
                act.id,
                'RESOLVED',
                'COUNSEL_OVERRIDE_RECORDED'
              );
              actionsResolved++;
            }
          } else {
            const act = await this.dispatchOccurrenceAction(projectId, occ, entity);
            if (act) actionsGenerated++;
          }
        }
      }
    }

    // Check scene readiness
    for (const scene of scenes) {
      const readiness = await sceneReadinessEngine.evaluateSceneReadiness(projectId, scene.id);
      if (readiness.status === 'RED') {
        await this.dispatchSceneRedAlert(
          projectId,
          scene.id,
          scene.sceneNumber,
          scene.heading,
          readiness.blockingRationale
        );
        actionsGenerated++;
      } else {
        const resCount = await actionNotificationRepo.resolveActionsForScene(
          projectId,
          scene.id,
          'SCENE_CLEARED'
        );
        actionsResolved += resCount;
      }
    }

    const openActions = await actionNotificationRepo.getActionsByProject(projectId, { status: 'OPEN' });

    return {
      actionsGenerated,
      actionsResolved,
      activeOpenActionsCount: openActions.length,
      syncedAt: new Date().toISOString(),
    };
  }
}

export const actionDispatcher = new ActionDispatcher();
