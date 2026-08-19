import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';
import { overrideRepo } from './OverrideRepo.js';

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

export type EntityRelationshipType =
  | 'BRAND_PRODUCT'
  | 'SUBSIDIARY'
  | 'PARENT_COMPANY'
  | 'PRODUCT_LINE'
  | 'VARIATION';

export interface CanonicalEntityData {
  id: string;
  projectId: string;
  canonicalName: string;
  entityCategory: EntityCategory;
  description: string;
  overallClearanceStatus: ClearanceStatus;
  origin?: EntityOrigin;

  // Phase 3 Entity Resolution & Hierarchy
  aliases?: string[];
  parentEntityId?: string;
  parentEntityName?: string;
  relationshipType?: EntityRelationshipType;

  // Counsel Overrides & Cards
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
  clearanceStatus?: ClearanceStatus;
  riskScore?: number;
  riskRationale?: string;
  contextFlags?: string[];
  citations?: any[];
  evaluatedAt?: string;

  // Phase 3 Surface Mention Provenance
  surfaceMention?: string;
  matchedVia?: 'EXACT_CANONICAL' | 'ALIAS_MATCH' | 'NORMALIZED_EQUIVALENCE' | 'HIERARCHY_PARENT_MATCH' | 'MANUAL_ENTRY';
}

export interface MergeEntitiesResult {
  success: boolean;
  targetEntity: CanonicalEntityData;
  sourceEntityId: string;
  transferredOccurrencesCount: number;
  combinedAliases: string[];
  derivedCanonicalStatus: ClearanceStatus;
  mergedAt: string;
}

export const STATUS_SEVERITY_RANK: Record<ClearanceStatus, number> = {
  ACTION_REQUIRED: 4,
  REVIEW_RECOMMENDED: 3,
  INSUFFICIENT_EVIDENCE: 2,
  NO_ISSUE_SURFACED: 1,
};

export class EntityRepo {
  private db = getDb();

  async createCanonicalEntity(input: Omit<CanonicalEntityData, 'id' | 'createdAt' | 'updatedAt'>): Promise<CanonicalEntityData> {
    const id = `ent-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const entity: CanonicalEntityData = {
      id,
      isOverridden: false,
      origin: input.origin || 'AUTO_EXTRACTED',
      aliases: input.aliases || [],
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
      aliases?: string[];
      parentEntityId?: string;
      parentEntityName?: string;
      relationshipType?: EntityRelationshipType;
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
    if (updates.aliases) data.aliases = updates.aliases;
    if (updates.parentEntityId !== undefined) data.parentEntityId = updates.parentEntityId;
    if (updates.parentEntityName !== undefined) data.parentEntityName = updates.parentEntityName;
    if (updates.relationshipType !== undefined) data.relationshipType = updates.relationshipType;

    data.origin = updates.origin || 'USER_EDITED';
    data.updatedAt = new Date().toISOString();

    await docRef.set(data);
    return { entity: data, assessmentInvalidated };
  }

  async addAlias(projectId: string, entityId: string, alias: string): Promise<CanonicalEntityData | null> {
    const docRef = await this.db.doc(`projects/${projectId}/entities/${entityId}`);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const data = snap.data() as CanonicalEntityData;
    const cleanAlias = alias.trim();
    if (!cleanAlias) return data;

    const aliases = data.aliases || [];
    if (!aliases.some((a) => a.toLowerCase() === cleanAlias.toLowerCase())) {
      aliases.push(cleanAlias);
      data.aliases = aliases;
      data.updatedAt = new Date().toISOString();
      await docRef.set(data);
    }
    return data;
  }

  async removeAlias(projectId: string, entityId: string, alias: string): Promise<CanonicalEntityData | null> {
    const docRef = await this.db.doc(`projects/${projectId}/entities/${entityId}`);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const data = snap.data() as CanonicalEntityData;
    const cleanAlias = alias.trim().toLowerCase();
    data.aliases = (data.aliases || []).filter((a) => a.toLowerCase() !== cleanAlias);
    data.updatedAt = new Date().toISOString();
    await docRef.set(data);
    return data;
  }

  async setEntityRelationship(
    projectId: string,
    entityId: string,
    parentEntityId: string,
    relationshipType: EntityRelationshipType
  ): Promise<CanonicalEntityData | null> {
    const childRef = await this.db.doc(`projects/${projectId}/entities/${entityId}`);
    const childSnap = await childRef.get();
    if (!childSnap.exists) return null;

    const parentRef = await this.db.doc(`projects/${projectId}/entities/${parentEntityId}`);
    const parentSnap = await parentRef.get();
    if (!parentSnap.exists) {
      throw new Error(`Parent entity ${parentEntityId} not found in project ${projectId}`);
    }

    const parentData = parentSnap.data() as CanonicalEntityData;
    const childData = childSnap.data() as CanonicalEntityData;

    childData.parentEntityId = parentEntityId;
    childData.parentEntityName = parentData.canonicalName;
    childData.relationshipType = relationshipType;
    childData.updatedAt = new Date().toISOString();

    await childRef.set(childData);
    return childData;
  }

  async mergeEntities(projectId: string, targetId: string, sourceId: string): Promise<MergeEntitiesResult | null> {
    if (targetId === sourceId) {
      throw new Error('Cannot merge entity into itself.');
    }

    const targetRef = await this.db.doc(`projects/${projectId}/entities/${targetId}`);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) return null;

    const sourceRef = await this.db.doc(`projects/${projectId}/entities/${sourceId}`);
    const sourceSnap = await sourceRef.get();
    if (!sourceSnap.exists) return null;

    const target = targetSnap.data() as CanonicalEntityData;
    const source = sourceSnap.data() as CanonicalEntityData;

    // 1. Transfer all occurrences of source to target
    const sourceOccurrences = await this.getOccurrencesByEntity(projectId, sourceId);
    for (const occ of sourceOccurrences) {
      const occDocRef = await this.db.doc(`projects/${projectId}/scenes/${occ.sceneId}/occurrences/${occ.id}`);
      await occDocRef.set({
        ...occ,
        canonicalEntityId: targetId,
      });
    }

    // 2. Combine aliases (add source canonical name and its aliases into target)
    const combinedAliasesSet = new Set<string>(target.aliases || []);
    if (source.canonicalName.toLowerCase() !== target.canonicalName.toLowerCase()) {
      combinedAliasesSet.add(source.canonicalName);
    }
    (source.aliases || []).forEach((a) => {
      if (a.toLowerCase() !== target.canonicalName.toLowerCase()) {
        combinedAliasesSet.add(a);
      }
    });
    target.aliases = Array.from(combinedAliasesSet);

    // 3. Inherit replacement card if target has none and source does
    if (!target.replacementCard && source.replacementCard) {
      target.replacementCard = source.replacementCard;
    }

    target.updatedAt = new Date().toISOString();
    await targetRef.set(target);

    // 4. Delete source entity
    await sourceRef.delete();

    // 5. Recompute derived canonical status across all combined occurrences
    const derivedStatus = await this.computeDerivedCanonicalStatus(projectId, targetId);
    const updatedTarget = (await this.getEntityById(projectId, targetId)) || target;

    return {
      success: true,
      targetEntity: updatedTarget,
      sourceEntityId: sourceId,
      transferredOccurrencesCount: sourceOccurrences.length,
      combinedAliases: updatedTarget.aliases || [],
      derivedCanonicalStatus: derivedStatus,
      mergedAt: new Date().toISOString(),
    };
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
    if (!snap.exists) return null;

    const data = snap.data() as CanonicalEntityData;
    data.replacementCard = card;
    data.updatedAt = new Date().toISOString();
    await docRef.set(data);
    return data;
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
      clearanceStatus: input.clearanceStatus || 'INSUFFICIENT_EVIDENCE',
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

  async getAllOccurrences(projectId: string): Promise<SceneEntityOccurrenceData[]> {
    if (typeof this.db.listCollectionNames === 'function') {
      const colNames: string[] = this.db.listCollectionNames();
      const occCols = colNames.filter(
        (name) => name.startsWith(`projects/${projectId}/scenes/`) && name.endsWith('/occurrences')
      );
      const allOccurrences: SceneEntityOccurrenceData[] = [];
      for (const colName of occCols) {
        const col = await this.db.collection(colName);
        const snap = await col.get();
        for (const doc of snap.docs) {
          allOccurrences.push(doc.data() as SceneEntityOccurrenceData);
        }
      }
      return allOccurrences;
    }

    const scenesCol = await this.db.collection(`projects/${projectId}/scenes`);
    const scenesSnap = await scenesCol.get();
    const allOccurrences: SceneEntityOccurrenceData[] = [];

    for (const sceneDoc of scenesSnap.docs) {
      const occCol = await this.db.collection(`projects/${projectId}/scenes/${sceneDoc.id}/occurrences`);
      const occSnap = await occCol.get();
      for (const occDoc of occSnap.docs) {
        allOccurrences.push(occDoc.data() as SceneEntityOccurrenceData);
      }
    }
    return allOccurrences;
  }

  async getOccurrencesByEntity(projectId: string, canonicalEntityId: string): Promise<SceneEntityOccurrenceData[]> {
    const all = await this.getAllOccurrences(projectId);
    return all.filter((occ) => occ.canonicalEntityId === canonicalEntityId);
  }

  async getOccurrenceById(projectId: string, occurrenceId: string): Promise<{ occurrence: SceneEntityOccurrenceData; sceneId: string } | null> {
    const all = await this.getAllOccurrences(projectId);
    const found = all.find((o) => o.id === occurrenceId);
    if (found) {
      return {
        occurrence: found,
        sceneId: found.sceneId,
      };
    }
    return null;
  }

  async updateOccurrenceEvaluation(
    projectId: string,
    sceneId: string,
    occurrenceId: string,
    evaluation: Partial<SceneEntityOccurrenceData>
  ): Promise<SceneEntityOccurrenceData | null> {
    const docRef = await this.db.doc(`projects/${projectId}/scenes/${sceneId}/occurrences/${occurrenceId}`);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const existing = snap.data() as SceneEntityOccurrenceData;
    const updated: SceneEntityOccurrenceData = {
      ...existing,
      ...evaluation,
      evaluatedAt: evaluation.evaluatedAt || new Date().toISOString(),
    };

    await docRef.set(updated);
    return updated;
  }

  async computeDerivedCanonicalStatus(projectId: string, canonicalEntityId: string): Promise<ClearanceStatus> {
    const occurrences = await this.getOccurrencesByEntity(projectId, canonicalEntityId);
    
    // Fetch overrides for this entity via overrideRepo
    const overrides = await overrideRepo.getOverridesByEntity(projectId, canonicalEntityId);

    if (occurrences.length === 0) {
      const entity = await this.getEntityById(projectId, canonicalEntityId);
      return entity?.overallClearanceStatus || 'INSUFFICIENT_EVIDENCE';
    }

    // Filter to evaluated occurrences or occurrences with scene overrides
    const evaluatedOccurrences = occurrences.filter(
      (occ) => occ.evaluatedAt || overrides.some((o: any) => o.sceneId === occ.sceneId)
    );

    const targetOccurrences = evaluatedOccurrences.length > 0 ? evaluatedOccurrences : occurrences;

    // Determine effective status for each occurrence taking into account scene overrides (Feature 003)
    let maxSeverity = 0;
    let derivedStatus: ClearanceStatus = 'NO_ISSUE_SURFACED';

    for (const occ of targetOccurrences) {
      // Check for scene-specific override
      const sceneOvr = overrides.find((o: any) => o.sceneId === occ.sceneId);
      const effectiveOccStatus: ClearanceStatus = sceneOvr?.overrideStatus || occ.clearanceStatus || 'INSUFFICIENT_EVIDENCE';
      const severity = STATUS_SEVERITY_RANK[effectiveOccStatus] || 1;

      if (severity > maxSeverity) {
        maxSeverity = severity;
        derivedStatus = effectiveOccStatus;
      }
    }

    // Update canonical entity overallClearanceStatus unless it has an active direct entity override
    const entity = await this.getEntityById(projectId, canonicalEntityId);
    if (entity && !entity.isOverridden) {
      await this.updateCanonicalEntityStatus(projectId, canonicalEntityId, derivedStatus);
    }

    return derivedStatus;
  }
}

export const entityRepo = new EntityRepo();
