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

export type EntityOrigin = 'AUTO_EXTRACTED' | 'USER_EDITED' | 'MANUALLY_ADDED';

export interface CanonicalEntityData {
  id: string;
  projectId: string;
  canonicalName: string;
  entityCategory: EntityCategory;
  description: string;
  overallClearanceStatus: ClearanceStatus;
  origin?: EntityOrigin;
  isOverridden?: boolean;
  latestOverride?: {
    overrideId: string;
    overrideStatus: ClearanceStatus;
    rationale: string;
    counselName: string;
    timestamp: string;
  };
  replacementCard?: any;
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
      origin: input.origin || 'AUTO_EXTRACTED',
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.db.doc(`projects/${input.projectId}/entities/${id}`);
    await docRef.set(entity);
    return entity;
  }

  async getEntityById(projectId: string, entityId: string): Promise<CanonicalEntityData | null> {
    const docRef = await this.db.doc(`projects/${projectId}/entities/${entityId}`);
    const snap = await docRef.get();
    if (snap.exists) {
      return snap.data() as CanonicalEntityData;
    }
    return null;
  }

  async updateCanonicalEntity(
    projectId: string,
    entityId: string,
    updates: {
      canonicalName?: string;
      entityCategory?: EntityCategory;
      description?: string;
      origin?: EntityOrigin;
    }
  ): Promise<{ entity: CanonicalEntityData; assessmentInvalidated: boolean } | null> {
    const docRef = await this.db.doc(`projects/${projectId}/entities/${entityId}`);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const data = snap.data() as CanonicalEntityData;
    let assessmentInvalidated = false;

    if (
      (updates.canonicalName && updates.canonicalName !== data.canonicalName) ||
      (updates.entityCategory && updates.entityCategory !== data.entityCategory)
    ) {
      assessmentInvalidated = true;
      // Invalidate automated risk status iff counsel has not explicitly overridden
      if (!data.isOverridden) {
        data.overallClearanceStatus = 'INSUFFICIENT_EVIDENCE';
      }
      // Stale replacement cards are cleared upon item definition edit
      delete data.replacementCard;
    }

    if (updates.canonicalName) data.canonicalName = updates.canonicalName.trim();
    if (updates.entityCategory) data.entityCategory = updates.entityCategory;
    if (updates.description !== undefined) data.description = updates.description.trim();
    data.origin = updates.origin || 'USER_EDITED';
    data.updatedAt = new Date().toISOString();

    await docRef.set(data);
    return { entity: data, assessmentInvalidated };
  }

  async deleteCanonicalEntity(projectId: string, entityId: string): Promise<boolean> {
    const docRef = await this.db.doc(`projects/${projectId}/entities/${entityId}`);
    const snap = await docRef.get();
    if (!snap.exists) return false;

    await docRef.delete();
    await this.deleteOccurrencesByEntity(projectId, entityId);
    return true;
  }

  async deleteOccurrencesByEntity(projectId: string, entityId: string): Promise<void> {
    // Look across all project scenes to remove occurrences for this entity
    const scenesCol = await this.db.collection(`projects/${projectId}/scenes`);
    const scenesSnap = await scenesCol.get();
    for (const sceneDoc of scenesSnap.docs) {
      const occCol = await this.db.collection(`projects/${projectId}/scenes/${sceneDoc.id}/occurrences`);
      const occSnap = await occCol.get();
      for (const occDoc of occSnap.docs) {
        const occData = occDoc.data() as SceneEntityOccurrenceData;
        if (occData.canonicalEntityId === entityId) {
          const occDocRef = await this.db.doc(`projects/${projectId}/scenes/${sceneDoc.id}/occurrences/${occDoc.id}`);
          await occDocRef.delete();
        }
      }
    }
  }

  async updateCanonicalEntityStatus(projectId: string, entityId: string, status: ClearanceStatus): Promise<CanonicalEntityData | null> {
    const docRef = await this.db.doc(`projects/${projectId}/entities/${entityId}`);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data() as CanonicalEntityData;
      // Invariant: Automated batch re-evaluations MUST NOT overwrite an active counsel override
      if (data.isOverridden) {
        return data;
      }
      data.overallClearanceStatus = status;
      data.updatedAt = new Date().toISOString();
      await docRef.set(data);
      return data;
    }
    return null;
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

  async attachReplacementCard(projectId: string, entityId: string, card: any): Promise<CanonicalEntityData | null> {
    const docRef = await this.db.doc(`projects/${projectId}/entities/${entityId}`);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data() as CanonicalEntityData;
      data.replacementCard = card;
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
