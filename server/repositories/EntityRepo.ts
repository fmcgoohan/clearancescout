import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';

export type EntityCategory =
  | 'BRAND'
  | 'ART_MUSIC'
  | 'PUBLIC_FIGURE'
  | 'PROPRIETARY_LOCATION'
  | 'GRAPHIC_PROP'
  | 'TRADEMARK'
  | 'PRODUCT'
  | 'LOGO'
  | 'LOCATION'
  | 'CHARACTER_NAME';

export type ClearanceStatus =
  | 'NO_ISSUE_SURFACED'
  | 'REVIEW_RECOMMENDED'
  | 'ACTION_REQUIRED'
  | 'INSUFFICIENT_EVIDENCE';

export interface CanonicalEntityData {
  id: string;
  projectId: string;
  canonicalName: string;
  entityCategory: EntityCategory;
  description: string;
  overallClearanceStatus: ClearanceStatus;
  isOverridden?: boolean;
  latestOverride?: {
    overrideId: string;
    overrideStatus: ClearanceStatus;
    rationale: string;
    counselName: string;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SceneEntityOccurrenceData {
  id: string;
  sceneId: string;
  canonicalEntityId: string;
  scriptLineNumber: number;
  excerptText: string;
  usageContext: string;
  sentimentScore?: number;
  exposureDurationSeconds?: number;
}

export class EntityRepo {
  private db = getDb();

  async createCanonicalEntity(input: Omit<CanonicalEntityData, 'id' | 'createdAt' | 'updatedAt'>): Promise<CanonicalEntityData> {
    const id = `ent-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const entity: CanonicalEntityData = {
      id,
      isOverridden: false,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await this.db.doc(`projects/${input.projectId}/entities/${id}`);
    await docRef.set(entity);
    return entity;
  }

  async updateCanonicalEntityStatus(projectId: string, entityId: string, status: ClearanceStatus): Promise<void> {
    const docRef = await this.db.doc(`projects/${projectId}/entities/${entityId}`);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data();
      data.overallClearanceStatus = status;
      data.updatedAt = new Date().toISOString();
      await docRef.set(data);
    }
  }

  async updateCanonicalEntityOverride(
    projectId: string,
    entityId: string,
    overrideStatus: ClearanceStatus,
    overrideDetails: { overrideId: string; rationale: string; counselName: string; timestamp: string }
  ): Promise<CanonicalEntityData | null> {
    const docRef = await this.db.doc(`projects/${projectId}/entities/${entityId}`);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data() as CanonicalEntityData;
      data.overallClearanceStatus = overrideStatus;
      data.isOverridden = true;
      data.latestOverride = {
        overrideId: overrideDetails.overrideId,
        overrideStatus,
        rationale: overrideDetails.rationale,
        counselName: overrideDetails.counselName,
        timestamp: overrideDetails.timestamp,
      };
      data.updatedAt = new Date().toISOString();
      await docRef.set(data);
      return data;
    }
    return null;
  }

  async getEntitiesByProject(projectId: string): Promise<CanonicalEntityData[]> {
    const colRef = await this.db.collection(`projects/${projectId}/entities`);
    const snap = await colRef.get();
    return snap.docs.map((d: any) => d.data() as CanonicalEntityData);
  }

  async createOccurrence(projectId: string, input: Omit<SceneEntityOccurrenceData, 'id'>): Promise<SceneEntityOccurrenceData> {
    const id = `occ-${uuidv4().slice(0, 8)}`;
    const occurrence: SceneEntityOccurrenceData = {
      id,
      ...input,
    };
    const docRef = await this.db.doc(`projects/${projectId}/scenes/${input.sceneId}/occurrences/${id}`);
    await docRef.set(occurrence);
    return occurrence;
  }

  async getOccurrencesByScene(projectId: string, sceneId: string): Promise<SceneEntityOccurrenceData[]> {
    const colRef = await this.db.collection(`projects/${projectId}/scenes/${sceneId}/occurrences`);
    const snap = await colRef.get();
    return snap.docs.map((d: any) => d.data() as SceneEntityOccurrenceData);
  }
}

export const entityRepo = new EntityRepo();
