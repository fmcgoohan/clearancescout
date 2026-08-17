import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';

export interface SceneData {
  id: string;
  projectId: string;
  sceneNumber: number;
  heading: string;
  locationType: 'INT' | 'EXT' | 'INT/EXT';
  timeOfDay: string;
  rawText: string;
  characterActionSummary: string;
}

export class SceneRepo {
  private db = getDb();

  async createScene(input: Omit<SceneData, 'id'>): Promise<SceneData> {
    const id = `scene-${uuidv4().slice(0, 8)}`;
    const scene: SceneData = {
      id,
      ...input,
    };
    const docRef = await this.db.doc(`projects/${input.projectId}/scenes/${id}`);
    await docRef.set(scene);
    return scene;
  }

  async getScenesByProject(projectId: string): Promise<SceneData[]> {
    const colRef = await this.db.collection(`projects/${projectId}/scenes`);
    const snap = await colRef.get();
    return snap.docs.map((d: any) => d.data() as SceneData).sort((a: SceneData, b: SceneData) => a.sceneNumber - b.sceneNumber);
  }
}

export const sceneRepo = new SceneRepo();
