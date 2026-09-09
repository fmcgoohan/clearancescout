import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';

export interface CounselOverride {
  id: string;
  projectId: string;
  canonicalEntityId: string;
  sceneId?: string;
  previousStatus: 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE';
  overrideStatus: 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE';
  rationale: string;
  counselName: string;
  counselRole?: string;
  timestamp: string;
}

export class OverrideRepo {
  private db = getDb();

  private async getCollection(projectId: string) {
    return await this.db.collection(`projects/${projectId}/overrides`);
  }

  async recordOverride(
    projectId: string,
    data: Omit<CounselOverride, 'id' | 'projectId' | 'timestamp'>
  ): Promise<CounselOverride> {
    const id = `ovr-${uuidv4().slice(0, 8)}`;
    const timestamp = new Date().toISOString();
    const override: CounselOverride = {
      id,
      projectId,
      timestamp,
      canonicalEntityId: data.canonicalEntityId,
      previousStatus: data.previousStatus || 'ACTION_REQUIRED',
      overrideStatus: data.overrideStatus || 'NO_ISSUE_SURFACED',
      rationale: data.rationale?.trim() || '',
      counselName: data.counselName?.trim() || 'Legal Counsel',
      counselRole: data.counselRole?.trim() || 'Clearance Counsel',
      ...(data.sceneId ? { sceneId: data.sceneId } : {}),
    };

    const col = await this.getCollection(projectId);
    const docRef = col.doc(id);
    await docRef.set(override);
    return override;
  }

  async createOverride(
    projectId: string,
    data: any
  ): Promise<CounselOverride> {
    return this.recordOverride(projectId, {
      canonicalEntityId: data.canonicalEntityId,
      sceneId: data.sceneId,
      previousStatus: data.previousStatus || 'ACTION_REQUIRED',
      overrideStatus: data.overrideStatus || data.status || 'NO_ISSUE_SURFACED',
      rationale: data.rationale?.trim() || '',
      counselName: data.counselName?.trim() || 'Legal Counsel',
      counselRole: data.counselRole?.trim() || 'Clearance Counsel',
    });
  }

  async create(
    projectId: string,
    data: any
  ): Promise<CounselOverride> {
    return this.createOverride(projectId, data);
  }

  async getOverridesByEntity(projectId: string, canonicalEntityId: string): Promise<CounselOverride[]> {
    const col = await this.getCollection(projectId);
    const snapshot = await col.where('canonicalEntityId', '==', canonicalEntityId).get();
    return snapshot.docs.map((doc: any) => doc.data() as CounselOverride);
  }

  async getAllOverrides(projectId: string): Promise<CounselOverride[]> {
    const col = await this.getCollection(projectId);
    const snapshot = await col.get();
    return snapshot.docs.map((doc: any) => doc.data() as CounselOverride);
  }
}

export const overrideRepo = new OverrideRepo();
