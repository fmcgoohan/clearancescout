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

    const docRef = this.db.doc(`projects/${id}`);
    await docRef.set(project);
    return project;
  }

  async getProject(id: string): Promise<ProjectData | null> {
    const docRef = this.db.doc(`projects/${id}`);
    const snap = await docRef.get();
    if (!snap.exists) {
      if (id === 'proj-default') {
        const p1: ProjectData = {
          id: 'proj-default',
          title: 'Default Production Workspace',
          productionCompany: 'Studio Production',
          scriptVersion: 'v1.0-Draft',
          projectType: 'Movie',
          executionMode: 'DEMO_MODE',
          liveQuotaLimit: 25,
          liveQuotaUsed: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await docRef.set(p1);
        return p1;
      }
      if (id === 'proj-cyberpunk') {
        const p2: ProjectData = {
          id: 'proj-cyberpunk',
          title: 'Cyberpunk Odyssey',
          productionCompany: 'Vanguard Studios',
          scriptVersion: 'v2.1-FinalDraft',
          projectType: 'TV Show',
          executionMode: 'DEMO_MODE',
          liveQuotaLimit: 25,
          liveQuotaUsed: 0,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        };
        await docRef.set(p2);
        const sceneId = 'scene-cp01';
        const now = new Date().toISOString();
        await this.db.doc(`projects/proj-cyberpunk/scenes/${sceneId}`).set({
          id: sceneId,
          projectId: 'proj-cyberpunk',
          sceneNumber: 1,
          heading: 'INT. VIRTUAL LAB - DAY',
          locationType: 'INT',
          timeOfDay: 'DAY',
          rawText: 'INT. VIRTUAL LAB - DAY\nData node shines bright.',
          characterActionSummary: 'Hacker inspects verified clearance certificates.',
          readinessStatus: 'PENDING_REVIEW',
          readinessEvaluatedAt: now,
          readinessDetails: {
            sceneId,
            sceneNumber: 1,
            heading: 'INT. VIRTUAL LAB - DAY',
            status: 'PENDING_REVIEW',
            evaluatedAt: now,
            blockersCount: 0,
            workingClearCount: 0,
            finalClearCount: 0,
            totalOccurrences: 0,
            itemsBreakdown: [],
            summaryText: 'Scene 1 (PENDING_REVIEW - Unreviewed Zero Items)',
          },
          createdAt: now,
          updatedAt: now,
        });
        return p2;
      }
      if (id.startsWith('proj-')) {
        const autoProj: ProjectData = {
          id,
          title: 'Production Clearance Workspace',
          productionCompany: 'Production Studio',
          scriptVersion: 'v1.0-ShootingDraft',
          projectType: 'Movie',
          executionMode: 'DEMO_MODE',
          liveQuotaLimit: 25,
          liveQuotaUsed: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await docRef.set(autoProj);
        return autoProj;
      }
      return null;
    }
    const data = snap.data() as ProjectData;
    if (id === 'proj-cyberpunk') {
      const sceneDoc = await this.db.doc('projects/proj-cyberpunk/scenes/scene-cp01').get();
      if (!sceneDoc.exists) {
        const now = new Date().toISOString();
        await this.db.doc('projects/proj-cyberpunk/scenes/scene-cp01').set({
          id: 'scene-cp01',
          projectId: 'proj-cyberpunk',
          sceneNumber: 1,
          heading: 'INT. VIRTUAL LAB - DAY',
          locationType: 'INT',
          timeOfDay: 'DAY',
          rawText: 'INT. VIRTUAL LAB - DAY\nData node shines bright.',
          characterActionSummary: 'Hacker inspects verified clearance certificates.',
          readinessStatus: 'PENDING_REVIEW',
          readinessEvaluatedAt: now,
          readinessDetails: {
            sceneId: 'scene-cp01',
            sceneNumber: 1,
            heading: 'INT. VIRTUAL LAB - DAY',
            status: 'PENDING_REVIEW',
            evaluatedAt: now,
            blockersCount: 0,
            workingClearCount: 0,
            finalClearCount: 0,
            totalOccurrences: 0,
            itemsBreakdown: [],
            summaryText: 'Scene 1 (PENDING_REVIEW - Unreviewed Zero Items)',
          },
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    return {
      ...data,
      title: id === 'proj-cyberpunk' ? 'Cyberpunk Odyssey' : data.title,
      projectType: data.projectType || 'Movie',
      liveQuotaLimit: data.liveQuotaLimit !== undefined ? data.liveQuotaLimit : 25,
      liveQuotaUsed: data.liveQuotaUsed !== undefined ? data.liveQuotaUsed : 0,
    };
  }

  async updateProject(id: string, updates: Partial<ProjectData>): Promise<ProjectData | null> {
    const docRef = this.db.doc(`projects/${id}`);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const existing = snap.data() as ProjectData;
    const now = new Date().toISOString();
    const updated: ProjectData = {
      ...existing,
      ...updates,
      updatedAt: now,
    };
    await docRef.set(updated);
    return updated;
  }

  async listProjects(): Promise<ProjectData[]> {
    const colRef = await this.db.collection('projects');
    const snap = await colRef.get();
    let projects: ProjectData[] = snap.docs.map((d: any) => {
      const data = d.data();
      return {
        ...data,
        title: d.id === 'proj-cyberpunk' ? 'Cyberpunk Odyssey' : (data.title || 'Default Production Workspace'),
        projectType: data.projectType || 'Movie',
        liveQuotaLimit: data.liveQuotaLimit !== undefined ? data.liveQuotaLimit : 25,
        liveQuotaUsed: data.liveQuotaUsed !== undefined ? data.liveQuotaUsed : 0,
      };
    });

    if (!projects.some((p) => p.id === 'proj-default')) {
      const p1 = await this.getProject('proj-default');
      if (p1 && !projects.some((p) => p.id === p1.id)) projects.push(p1);
    }
    if (!projects.some((p) => p.id === 'proj-cyberpunk')) {
      const p2 = await this.getProject('proj-cyberpunk');
      if (p2 && !projects.some((p) => p.id === p2.id)) projects.push(p2);
    }
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
      const docRef = this.db.doc(`projects/${projectId}`);
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
