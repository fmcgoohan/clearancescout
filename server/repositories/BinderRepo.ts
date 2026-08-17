import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface ClearanceBinderData {
  id: string;
  projectId: string;
  projectSummary: {
    title: string;
    productionCompany: string;
    scriptVersion: string;
    totalScenes: number;
    totalEntities: number;
    clearedCount: number;
    actionRequiredCount: number;
    reviewRecommendedCount: number;
    overridesCount?: number;
  };
  scenes: any[];
  canonicalEntities: any[];
  citationsIndex: any[];
  replacementCatalog: any[];
  overridesHistory?: any[];
  exportedAt: string;
  auditSignature: string;
  disclaimer: string;
}

export class BinderRepo {
  private db = getDb();

  generateAuditSignature(data: Omit<ClearanceBinderData, 'id' | 'auditSignature'>): string {
    const payload = JSON.stringify(data);
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  async saveBinderExport(input: Omit<ClearanceBinderData, 'id' | 'auditSignature' | 'exportedAt'>): Promise<ClearanceBinderData> {
    const id = `bnd-${uuidv4().slice(0, 8)}`;
    const exportedAt = new Date().toISOString();
    const signaturePayload = { ...input, exportedAt };
    const auditSignature = this.generateAuditSignature(signaturePayload);

    const binderData: ClearanceBinderData = {
      id,
      ...signaturePayload,
      auditSignature,
    };

    const docRef = await this.db.doc(`projects/${input.projectId}/binder_exports/${id}`);
    await docRef.set(binderData);
    return binderData;
  }

  async getLatestBinderExport(projectId: string): Promise<ClearanceBinderData | null> {
    const colRef = await this.db.collection(`projects/${projectId}/binder_exports`);
    const snap = await colRef.get();
    if (snap.empty) {
      return null;
    }
    const docs = snap.docs.map((d: any) => d.data() as ClearanceBinderData);
    docs.sort((a: any, b: any) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime());
    return docs[0] || null;
  }
}

export const binderRepo = new BinderRepo();
