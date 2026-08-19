import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';
import { entityRepo } from './EntityRepo.js';

export type GrantType =
  | 'EXCLUSIVE'
  | 'NON_EXCLUSIVE'
  | 'FAIR_USE'
  | 'PUBLIC_DOMAIN'
  | 'PROD_MADE';

export type TerritoryType =
  | 'WORLDWIDE'
  | 'NORTH_AMERICA'
  | 'EUROPE'
  | 'US_ONLY'
  | 'SPECIFIED_COUNTRIES';

export type MediaWindowType =
  | 'ALL_MEDIA_IN_PERPETUITY'
  | 'THEATRICAL_SVOD'
  | 'THEATRICAL_ONLY'
  | 'LINEAR_TV'
  | 'FESTIVAL_ONLY'
  | 'DIGITAL_PROMO';

export type RightsStatus =
  | 'ACTIVE'
  | 'PENDING_SIGNATURE'
  | 'EXPIRED'
  | 'REVOKED';

export interface RightsRecordData {
  id: string;
  projectId: string;
  canonicalEntityId: string;
  canonicalEntityName?: string;
  occurrenceIds?: string[];
  licensorName: string;
  grantType: GrantType;
  territory: TerritoryType;
  territoryDetails?: string;
  mediaWindow: MediaWindowType;
  effectiveDate: string; // ISO date YYYY-MM-DD
  expirationDate?: string; // ISO date YYYY-MM-DD
  isPerpetual: boolean;
  covenants?: string[];
  feeAmount?: number;
  currency?: string;
  documentReferenceUrl?: string;
  status: RightsStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RightsCoverageResult {
  isCovered: boolean;
  activeRights: RightsRecordData[];
  covenants: string[];
  hasExpiringSoon: boolean;
  expirationWarning?: string;
  summaryText: string;
}

export class RightsRepo {
  private db = getDb();

  async createRightsRecord(
    projectId: string,
    input: Omit<RightsRecordData, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
  ): Promise<RightsRecordData> {
    const id = `rgt-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    let entityName = input.canonicalEntityName;
    if (!entityName && input.canonicalEntityId) {
      const entity = await entityRepo.getEntityById(projectId, input.canonicalEntityId);
      if (entity) {
        entityName = entity.canonicalName;
      }
    }

    const record: RightsRecordData = {
      id,
      projectId,
      canonicalEntityName: entityName,
      occurrenceIds: [],
      covenants: [],
      ...input,
      isPerpetual: input.isPerpetual !== undefined ? input.isPerpetual : (!input.expirationDate),
      status: input.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.db.doc(`projects/${projectId}/rights/${id}`);
    await docRef.set(record);
    return record;
  }

  async getRightsRecordById(projectId: string, rightsId: string): Promise<RightsRecordData | null> {
    const docRef = await this.db.doc(`projects/${projectId}/rights/${rightsId}`);
    const snap = await docRef.get();
    if (snap.exists) {
      return snap.data() as RightsRecordData;
    }
    return null;
  }

  async getRightsByProject(projectId: string): Promise<RightsRecordData[]> {
    const colRef = await this.db.collection(`projects/${projectId}/rights`);
    const snap = await colRef.get();
    return snap.docs.map((d: any) => d.data() as RightsRecordData);
  }

  async getRightsByEntity(projectId: string, canonicalEntityId: string): Promise<RightsRecordData[]> {
    const all = await this.getRightsByProject(projectId);
    return all.filter((r) => r.canonicalEntityId === canonicalEntityId);
  }

  async getRightsByOccurrence(projectId: string, occurrenceId: string): Promise<RightsRecordData[]> {
    const all = await this.getRightsByProject(projectId);
    return all.filter(
      (r) => !r.occurrenceIds || r.occurrenceIds.length === 0 || r.occurrenceIds.includes(occurrenceId)
    );
  }

  async updateRightsRecord(
    projectId: string,
    rightsId: string,
    updates: Partial<Omit<RightsRecordData, 'id' | 'projectId' | 'createdAt'>>
  ): Promise<RightsRecordData | null> {
    const docRef = await this.db.doc(`projects/${projectId}/rights/${rightsId}`);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const existing = snap.data() as RightsRecordData;
    const updated: RightsRecordData = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(updated);
    return updated;
  }

  async deleteRightsRecord(projectId: string, rightsId: string): Promise<boolean> {
    const docRef = await this.db.doc(`projects/${projectId}/rights/${rightsId}`);
    const snap = await docRef.get();
    if (!snap.exists) return false;

    await docRef.delete();
    return true;
  }

  async evaluateRightsCoverage(
    projectId: string,
    canonicalEntityId: string,
    occurrenceId?: string,
    queryDateStr?: string
  ): Promise<RightsCoverageResult> {
    const rights = await this.getRightsByEntity(projectId, canonicalEntityId);
    const applicableRights = occurrenceId
      ? rights.filter(
          (r) => !r.occurrenceIds || r.occurrenceIds.length === 0 || r.occurrenceIds.includes(occurrenceId)
        )
      : rights;

    const queryDate = queryDateStr ? new Date(queryDateStr) : new Date();
    const todayIso = queryDate.toISOString().slice(0, 10);

    const activeRights: RightsRecordData[] = [];
    const covenantsSet = new Set<string>();
    let hasExpiringSoon = false;
    let expirationWarning: string | undefined = undefined;

    for (const r of applicableRights) {
      if (r.status !== 'ACTIVE') continue;

      const safeCovenants = Array.isArray(r.covenants) ? r.covenants : r.covenants ? [r.covenants] : [];

      // Check date validity
      if (r.isPerpetual || !r.expirationDate) {
        activeRights.push(r);
        safeCovenants.forEach((c) => covenantsSet.add(c));
      } else {
        if (r.expirationDate >= todayIso) {
          activeRights.push(r);
          safeCovenants.forEach((c) => covenantsSet.add(c));

          // Check if expiring within 60 days
          const expDate = new Date(r.expirationDate);
          const diffDays = Math.ceil((expDate.getTime() - queryDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 60 && diffDays >= 0) {
            hasExpiringSoon = true;
            expirationWarning = `License from ${r.licensorName} expires in ${diffDays} days (${r.expirationDate})`;
          }
        }
      }
    }

    const isCovered = activeRights.length > 0;
    const covenants = Array.from(covenantsSet);

    let summaryText = 'No active rights record on file.';
    if (isCovered) {
      const main = activeRights[0];
      const terr = main.territory === 'WORLDWIDE' ? 'Worldwide' : main.territory;
      const media = main.mediaWindow === 'ALL_MEDIA_IN_PERPETUITY' ? 'All Media in Perpetuity' : main.mediaWindow;
      summaryText = `Covered by ${main.grantType} license from ${main.licensorName} (${terr}, ${media}).`;
      if (covenants.length > 0) {
        summaryText += ` ${covenants.length} contractual covenant(s) apply.`;
      }
    }

    return {
      isCovered,
      activeRights,
      covenants,
      hasExpiringSoon,
      expirationWarning,
      summaryText,
    };
  }
}

export const rightsRepo = new RightsRepo();
