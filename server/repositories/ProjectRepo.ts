import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';

export interface ProjectData {
  id: string;
  title: string;
  productionCompany: string;
  scriptVersion: string;
  executionMode: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
  createdAt: string;
  updatedAt: string;
}

export class ProjectRepo {
  private db = getDb();

  async createProject(input: Omit<ProjectData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectData> {
    const id = `proj-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const project: ProjectData = {
      id,
      ...input,
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
    return snap.data() as ProjectData;
  }
}

export const projectRepo = new ProjectRepo();
