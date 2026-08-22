import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';
import { sceneRepo, SceneData } from './SceneRepo.js';
import { entityRepo, CanonicalEntityData, SceneEntityOccurrenceData } from './EntityRepo.js';
import { sceneReadinessEngine } from '../workflows/sceneReadinessEngine.js';
import { actionNotificationRepo } from './ActionNotificationRepo.js';

export type ProductionProjectType = 'Movie' | 'TV Show' | 'Commercial';

export interface ProjectData {
  id: string;
  title: string;
  productionCompany: string;
  scriptVersion: string;
  projectType?: ProductionProjectType;
  executionMode: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
  liveQuotaLimit?: number;
  liveQuotaUsed?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectQuotaStatus {
  limit: number;
  used: number;
  remaining: number;
}

export interface ProjectWorkspaceSnapshot {
  project: ProjectData & {
    totalScenes: number;
    totalActiveEntities: number;
    sourceType?: string;
    sourceLabel?: string;
  };
  scenes: SceneData[];
  entities: CanonicalEntityData[];
  historicalEntitiesCount: number;
  occurrences: SceneEntityOccurrenceData[];
  readiness: any;
  actionsSummary: {
    totalActions: number;
    openActions: number;
    criticalActions: number;
  };
  snapshotTimestamp: string;
}

export class ProjectRepo {
  private db = getDb();

  async createProject(input: Omit<ProjectData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectData> {
    const id = `proj-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const project: ProjectData = {
      id,
      ...input,
      projectType: input.projectType || 'Movie',
      liveQuotaLimit: input.liveQuotaLimit !== undefined ? input.liveQuotaLimit : 25,
      liveQuotaUsed: input.liveQuotaUsed !== undefined ? input.liveQuotaUsed : 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.db.doc(`projects/${id}`);
    await docRef.set(project);
    return project;
  }

  async getProject(id: string): Promise<ProjectData | null> {
    const docRef = await this.db.doc(`projects/${id}`);
    const snap = await docRef.get();
    if (!snap.exists) return null;
    const data = snap.data() as ProjectData;
    return {
      ...data,
      projectType: data.projectType || 'Movie',
      liveQuotaLimit: data.liveQuotaLimit !== undefined ? data.liveQuotaLimit : 25,
      liveQuotaUsed: data.liveQuotaUsed !== undefined ? data.liveQuotaUsed : 0,
    };
  }

  async listProjects(): Promise<ProjectData[]> {
    const colRef = await this.db.collection('projects');
    const snap = await colRef.get();
    const projects: ProjectData[] = snap.docs.map((d: any) => {
      const data = d.data();
      return {
        ...data,
        projectType: data.projectType || 'Movie',
        liveQuotaLimit: data.liveQuotaLimit !== undefined ? data.liveQuotaLimit : 25,
        liveQuotaUsed: data.liveQuotaUsed !== undefined ? data.liveQuotaUsed : 0,
      };
    });

    return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getLiveQuota(projectId: string): Promise<ProjectQuotaStatus> {
    const project = await this.getProject(projectId);
    const limit = project?.liveQuotaLimit !== undefined ? project.liveQuotaLimit : 25;
    const used = project?.liveQuotaUsed !== undefined ? project.liveQuotaUsed : 0;
    const remaining = Math.max(0, limit - used);
    return { limit, used, remaining };
  }

  async consumeLiveQuota(projectId: string, count: number = 1): Promise<{ success: boolean; quota: ProjectQuotaStatus }> {
    return await this.db.runTransaction(async (transaction: any) => {
      const docRef = await this.db.doc(`projects/${projectId}`);
      const snap = await transaction.get(docRef);
      if (!snap.exists) {
        throw new Error(`Project ${projectId} not found`);
      }

      const data = snap.data() as ProjectData;
      const limit = data.liveQuotaLimit !== undefined ? data.liveQuotaLimit : 25;
      const currentUsed = data.liveQuotaUsed !== undefined ? data.liveQuotaUsed : 0;
      const remaining = Math.max(0, limit - currentUsed);

      if (remaining < count) {
        return {
          success: false,
          quota: { limit, used: currentUsed, remaining },
        };
      }

      const newUsed = currentUsed + count;
      await transaction.update(docRef, {
        liveQuotaUsed: newUsed,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        quota: { limit, used: newUsed, remaining: Math.max(0, limit - newUsed) },
      };
    });
  }

  async getProjectSnapshot(projectId: string): Promise<ProjectWorkspaceSnapshot | null> {
    const project = await this.getProject(projectId);
    if (!project) return null;

    const [scenes, allEntities, allOccurrences, readiness, actions] = await Promise.all([
      sceneRepo.getScenesByProject(projectId),
      entityRepo.getEntitiesByProject(projectId, { includeArchived: true }),
      entityRepo.getAllOccurrences(projectId),
      sceneReadinessEngine.getProjectReadinessSummaryReadOnly(projectId),
      actionNotificationRepo.getActionsByProject(projectId).catch(() => []),
    ]);

    const activeSceneIds = new Set(scenes.map((s) => s.id));
    const activeOccurrences = allOccurrences.filter((o) => activeSceneIds.has(o.sceneId));
    const activeEntities = allEntities.filter((e) => e.activeInCurrentDraft !== false);
    const historicalEntities = allEntities.filter((e) => e.isArchivedHistorical === true);
    const openActions = actions.filter((a: any) => a.status === 'OPEN' || a.status === 'IN_PROGRESS');
    const criticalActions = openActions.filter((a: any) => a.priority === 'CRITICAL');

    return {
      project: {
        ...project,
        totalScenes: scenes.length,
        totalActiveEntities: activeEntities.length,
      },
      scenes,
      entities: activeEntities,
      historicalEntitiesCount: historicalEntities.length,
      occurrences: activeOccurrences,
      readiness,
      actionsSummary: {
        totalActions: actions.length,
        openActions: openActions.length,
        criticalActions: criticalActions.length,
      },
      snapshotTimestamp: new Date().toISOString(),
    };
  }
}

export const projectRepo = new ProjectRepo();
