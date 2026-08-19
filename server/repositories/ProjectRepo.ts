import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';

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
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const limit = project.liveQuotaLimit !== undefined ? project.liveQuotaLimit : 25;
    const currentUsed = project.liveQuotaUsed !== undefined ? project.liveQuotaUsed : 0;
    const remaining = Math.max(0, limit - currentUsed);

    if (remaining < count) {
      return {
        success: false,
        quota: { limit, used: currentUsed, remaining },
      };
    }

    const newUsed = currentUsed + count;
    const docRef = await this.db.doc(`projects/${projectId}`);
    await docRef.update({
      liveQuotaUsed: newUsed,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      quota: { limit, used: newUsed, remaining: Math.max(0, limit - newUsed) },
    };
  }
}

export const projectRepo = new ProjectRepo();
