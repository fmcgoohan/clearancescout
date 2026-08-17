import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';

export interface ReplacementConceptCardData {
  id: string;
  canonicalEntityId: string;
  fictionalBrandName: string;
  designBrief: string;
  eraAesthetic?: string;
  artworkImageUrl: string;
  nonInfringementRationale: string;
  status: 'DRAFT' | 'PROPOSED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export class ReplacementRepo {
  private db = getDb();

  async createReplacement(input: Omit<ReplacementConceptCardData, 'id' | 'createdAt'>): Promise<ReplacementConceptCardData> {
    const id = `rep-${uuidv4().slice(0, 8)}`;
    const replacement: ReplacementConceptCardData = {
      id,
      ...input,
      createdAt: new Date().toISOString(),
    };

    const docRef = await this.db.doc(`projects/${input.canonicalEntityId}/replacements/${id}`);
    await docRef.set(replacement);
    return replacement;
  }

  async getReplacementsByEntity(projectId: string, canonicalEntityId: string): Promise<ReplacementConceptCardData[]> {
    const colRef = await this.db.collection(`projects/${canonicalEntityId}/replacements`);
    const snap = await colRef.get();
    return snap.docs.map((d: any) => d.data() as ReplacementConceptCardData);
  }
}

export const replacementRepo = new ReplacementRepo();
