import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';
import { ClearanceStatus } from './EntityRepo.js';

export type SceneReadinessStatus = 'RED' | 'WORKING_CLEAR' | 'FINAL_CLEAR';
export type ItemReadinessTier = 'BLOCKER' | 'WORKING_CLEAR' | 'FINAL_CLEAR';

export interface SceneItemReadinessDetail {
  occurrenceId: string;
  canonicalEntityId: string;
  canonicalName: string;
  clearanceStatus: ClearanceStatus;
  effectiveStatus: ClearanceStatus;
  rightsStatus: 'COVERED' | 'EXPIRED' | 'NONE';
  hasReplacementCard: boolean;
  hasSignedOverride: boolean;
  readinessTier: ItemReadinessTier;
  rationale: string;
}

export interface SceneReadinessAssessment {
  sceneId: string;
  sceneNumber: number;
  heading: string;
  status: SceneReadinessStatus;
  evaluatedAt: string;
  blockersCount: number;
  workingClearCount: number;
  finalClearCount: number;
  totalOccurrences: number;
  itemsBreakdown: SceneItemReadinessDetail[];
  interimMitigations?: Array<{
    occurrenceId: string;
    entityName: string;
    basis: string;
    referenceId: string;
    details: string;
  }>;
  summaryText: string;
  blockingRationale?: string;
}

export interface ProjectReadinessSummary {
  projectId: string;
  totalScenes: number;
  redScenesCount: number;
  workingClearScenesCount: number;
  finalClearScenesCount: number;
  overallReadinessPercentage: number;
  scenes: SceneReadinessAssessment[];
  evaluatedAt: string;
}

export interface SceneData {
  id: string;
  projectId: string;
  sceneNumber: number;
  heading: string;
  locationType: 'INT' | 'EXT' | 'INT/EXT';
  timeOfDay: string;
  rawText: string;
  characterActionSummary: string;
  readinessStatus?: SceneReadinessStatus;
  readinessEvaluatedAt?: string;
  readinessDetails?: SceneReadinessAssessment;
  createdAt?: string;
  updatedAt?: string;
}

export class SceneRepo {
  private db = getDb();

  async createScene(input: Omit<SceneData, 'id'>): Promise<SceneData> {
    const id = `scene-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const scene: SceneData = {
      id,
      readinessStatus: 'RED',
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await this.db.doc(`projects/${input.projectId}/scenes/${id}`);
    await docRef.set(scene);
    return scene;
  }

  async getScenesByProject(projectId: string): Promise<SceneData[]> {
    const colRef = await this.db.collection(`projects/${projectId}/scenes`);
    const snap = await colRef.get();
    return snap.docs
      .map((d: any) => d.data() as SceneData)
      .sort((a: SceneData, b: SceneData) => a.sceneNumber - b.sceneNumber);
  }

  async getSceneById(projectId: string, sceneId: string): Promise<SceneData | null> {
    const docRef = await this.db.doc(`projects/${projectId}/scenes/${sceneId}`);
    const snap = await docRef.get();
    if (!snap.exists) {
      return null;
    }
    return snap.data() as SceneData;
  }

  async updateSceneReadiness(
    projectId: string,
    sceneId: string,
    assessment: SceneReadinessAssessment
  ): Promise<SceneData | null> {
    const docRef = await this.db.doc(`projects/${projectId}/scenes/${sceneId}`);
    const snap = await docRef.get();
    if (!snap.exists) {
      return null;
    }
    const current = snap.data() as SceneData;
    const updated: SceneData = {
      ...current,
      readinessStatus: assessment.status,
      readinessEvaluatedAt: assessment.evaluatedAt,
      readinessDetails: assessment,
      updatedAt: new Date().toISOString(),
    };
    await docRef.set(updated);
    return updated;
  }

  async getSceneReadiness(projectId: string, sceneId: string): Promise<SceneReadinessAssessment | null> {
    const scene = await this.getSceneById(projectId, sceneId);
    return scene?.readinessDetails || null;
  }

  async deleteScenesByProject(projectId: string): Promise<number> {
    const colRef = await this.db.collection(`projects/${projectId}/scenes`);
    const snap = await colRef.get();
    let count = 0;
    for (const doc of snap.docs) {
      await colRef.doc(doc.id).delete();
      count++;
    }
    return count;
  }
}

export const sceneRepo = new SceneRepo();
