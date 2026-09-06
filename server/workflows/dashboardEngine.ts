import { projectRepo } from '../repositories/ProjectRepo.js';
import { entityRepo } from '../repositories/EntityRepo.js';
import { sceneReadinessEngine } from './sceneReadinessEngine.js';
import { rightsRepo } from '../repositories/RightsRepo.js';
import { placeholderRepo } from '../repositories/PlaceholderRepo.js';
import { actionNotificationRepo } from '../repositories/ActionNotificationRepo.js';
import { timelineEmitter } from '../events/timelineEmitter.js';

export interface ProductionDashboardKPIs {
  totalScenes: number;
  finalClearScenes: number;
  workingClearScenes: number;
  redScenes: number;
  readinessPercentage: number;
  totalEntities: number;
  criticalBlockersCount: number;
  activePlaceholdersCount: number;
  rightsExpiringSoonCount: number;
  pendingActionsCount: number;
}

export interface BlockerItemDetail {
  sceneId: string;
  sceneNumber: number;
  heading: string;
  occurrenceId: string;
  canonicalEntityId: string;
  canonicalName: string;
  clearanceStatus: string;
  riskRationale: string;
}

export interface ExpiringRightsDetail {
  rightsId: string;
  canonicalEntityId: string;
  canonicalName: string;
  agreementName: string;
  licensor: string;
  expirationDate: string;
  daysRemaining: number;
}

export interface ActivePlaceholderDetail {
  id: string;
  canonicalEntityId: string;
  canonicalName: string;
  fictionalName: string;
  assetCategory: string;
  clearanceTier: 'TEMP_APPROVED' | 'FINAL_CLEARED';
  approvedBy: string;
}

export interface SceneReadinessDistributionItem {
  sceneId: string;
  sceneNumber: number;
  heading: string;
  status: 'FINAL_CLEAR' | 'WORKING_CLEAR' | 'RED' | 'PENDING_REVIEW';
  blockerCount: number;
  workingCount: number;
  totalOccurrences: number;
  blockersCount?: number;
  workingClearCount?: number;
  finalClearCount?: number;
  blockingRationale?: string;
}

export interface ProductionDashboardData {
  projectId: string;
  projectTitle: string;
  projectType: string;
  kpis: ProductionDashboardKPIs;
  sceneReadinessDistribution: SceneReadinessDistributionItem[];
  shootBlockers: BlockerItemDetail[];
  expiringRights: ExpiringRightsDetail[];
  activePlaceholders: ActivePlaceholderDetail[];
  departmentActionsSummary: {
    ART_DEPT: number;
    LEGAL_COUNSEL: number;
    LOCATIONS: number;
    PRODUCTION_MGMT: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    label: string;
    timestamp: string;
  }>;
}

export class DashboardEngine {
  async getDashboardSummary(projectId: string): Promise<ProductionDashboardData> {
    const project = await projectRepo.getProject(projectId);
    if (!project) {
      const err: any = new Error(`Project ${projectId} not found`);
      err.status = 404;
      throw err;
    }

    const [readinessSummary, entities, rights, placeholders, allActions] = await Promise.all([
      sceneReadinessEngine.getProjectReadinessSummaryReadOnly(projectId),
      entityRepo.getEntitiesByProject(projectId),
      rightsRepo.getRightsByProject(projectId),
      placeholderRepo.getPlaceholdersByProject(projectId),
      actionNotificationRepo.getActionsByProject(projectId),
    ]);

    const activeActions = allActions.filter((a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS');

    const entityMap = new Map(entities.map((e) => [e.id, e]));

    // 1. Shoot Blockers Extraction
    const shootBlockers: BlockerItemDetail[] = [];
    for (const scn of readinessSummary.scenes) {
      for (const item of scn.itemsBreakdown) {
        if (item.readinessTier === 'BLOCKER') {
          const ent = entityMap.get(item.canonicalEntityId);
          shootBlockers.push({
            sceneId: scn.sceneId,
            sceneNumber: scn.sceneNumber,
            heading: scn.heading,
            occurrenceId: item.occurrenceId,
            canonicalEntityId: item.canonicalEntityId,
            canonicalName: item.canonicalName,
            clearanceStatus: item.effectiveStatus,
            riskRationale: item.rationale || ent?.description || 'Active unmitigated clearance risk',
          });
        }
      }
    }

    // 2. Expiring Rights Filtering (<= 90 days)
    const nowMs = Date.now();
    const expiringRights: ExpiringRightsDetail[] = [];
    for (const r of rights) {
      if (r.status === 'ACTIVE' && !r.isPerpetual && r.expirationDate) {
        const expMs = new Date(r.expirationDate).getTime();
        const daysRemaining = Math.ceil((expMs - nowMs) / (1000 * 60 * 60 * 24));
        if (daysRemaining <= 90) {
          const ent = entityMap.get(r.canonicalEntityId);
          expiringRights.push({
            rightsId: r.id,
            canonicalEntityId: r.canonicalEntityId,
            canonicalName: ent?.canonicalName || r.canonicalEntityName || 'Protected Entity',
            agreementName: `${r.grantType} License (${r.mediaWindow})`,
            licensor: r.licensorName,
            expirationDate: r.expirationDate,
            daysRemaining,
          });
        }
      }
    }

    // 3. Active Placeholders Detail
    const activePlaceholders: ActivePlaceholderDetail[] = placeholders.map((p) => ({
      id: p.id,
      canonicalEntityId: p.canonicalEntityId,
      canonicalName: p.canonicalName,
      fictionalName: p.fictionalName,
      assetCategory: p.assetCategory,
      clearanceTier: p.clearanceTier,
      approvedBy: p.approvedBy,
    }));

    // 4. Department Actions Summary
    const departmentActionsSummary = {
      ART_DEPT: allActions.filter((a) => a.targetDepartment === 'ART_DEPT').length,
      LEGAL_COUNSEL: allActions.filter((a) => a.targetDepartment === 'LEGAL_COUNSEL').length,
      LOCATIONS: allActions.filter((a) => a.targetDepartment === 'LOCATIONS').length,
      PRODUCTION_MGMT: allActions.filter((a) => a.targetDepartment === 'PRODUCTION_MGMT' || a.targetDepartment === 'CLEARANCE_TEAM').length,
    };

    // 5. Scene Readiness Distribution
    const sceneReadinessDistribution: SceneReadinessDistributionItem[] = readinessSummary.scenes.map((s) => ({
      sceneId: s.sceneId,
      sceneNumber: s.sceneNumber,
      heading: s.heading,
      status: s.status,
      blockerCount: s.blockersCount,
      workingCount: s.workingClearCount,
      blockersCount: s.blockersCount,
      workingClearCount: s.workingClearCount,
      finalClearCount: s.finalClearCount,
      totalOccurrences: s.totalOccurrences,
      blockingRationale: s.blockingRationale,
    }));

    // 6. Recent Timeline Activity (last 10 events)
    const rawEvents = timelineEmitter.getEvents(projectId);
    const recentActivity = rawEvents.slice(-10).reverse().map((e, idx) => ({
      id: `act-${idx + 1}`,
      type: e.eventType,
      label: e.label,
      timestamp: e.timestamp,
    }));

    // 7. KPIs
    const kpis: ProductionDashboardKPIs = {
      totalScenes: readinessSummary.totalScenes,
      finalClearScenes: readinessSummary.finalClearScenesCount,
      workingClearScenes: readinessSummary.workingClearScenesCount,
      redScenes: readinessSummary.redScenesCount,
      readinessPercentage: readinessSummary.overallReadinessPercentage,
      totalEntities: entities.length,
      criticalBlockersCount: shootBlockers.length,
      activePlaceholdersCount: activePlaceholders.length,
      rightsExpiringSoonCount: expiringRights.length,
      pendingActionsCount: allActions.length,
    };

    return {
      projectId: project.id,
      projectTitle: project.title,
      projectType: project.projectType || 'Movie',
      kpis,
      sceneReadinessDistribution,
      shootBlockers,
      expiringRights,
      activePlaceholders,
      departmentActionsSummary,
      recentActivity,
    };
  }
}

export const dashboardEngine = new DashboardEngine();
