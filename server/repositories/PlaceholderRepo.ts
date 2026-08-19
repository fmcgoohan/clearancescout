import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';

export type PlaceholderAssetCategory =
  | 'BRAND'
  | 'ART_MUSIC'
  | 'ARTWORK'
  | 'DIALOGUE'
  | 'GRAPHIC_PROP';

export type PlaceholderClearanceTier = 'TEMP_APPROVED' | 'FINAL_CLEARED';

export interface CategoryDetails {
  // Brand
  trademarkSearchNotes?: string;
  packagingDimensions?: string;
  fictionalTagline?: string;

  // Music
  bpm?: number;
  key?: string;
  musicalStyle?: string;
  licenseType?: string;

  // Artwork
  artistPrompt?: string;
  visualStyle?: string;
  dimensions?: string;
  imageUrl?: string;

  // Dialogue
  alternativeLines?: string[];
  subtextRationale?: string;

  // Prop
  physicalSpecs?: string;
  safetyClearanceNotes?: string;
  graphicLabelUrl?: string;
}

export interface ReplacementPlaceholderData {
  id: string;
  projectId: string;
  canonicalEntityId: string;
  canonicalName: string;
  assetCategory: PlaceholderAssetCategory;
  fictionalName: string;
  description: string;
  clearanceTier: PlaceholderClearanceTier;
  creativeRationale: string;
  approvedBy: string;
  approvedRole?: string;
  approvalDate: string;
  expirationDate?: string;
  categoryDetails?: CategoryDetails;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceholderFilter {
  assetCategory?: PlaceholderAssetCategory;
  clearanceTier?: PlaceholderClearanceTier;
  canonicalEntityId?: string;
}

export class PlaceholderRepo {
  private db = getDb();

  private async getCollection(projectId: string) {
    return await this.db.collection(`projects/${projectId}/placeholders`);
  }

  async createPlaceholder(
    projectId: string,
    input: Omit<ReplacementPlaceholderData, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
  ): Promise<ReplacementPlaceholderData> {
    const id = `ph-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const placeholder: ReplacementPlaceholderData = {
      id,
      projectId,
      ...input,
      approvalDate: input.approvalDate || now,
      createdAt: now,
      updatedAt: now,
    };

    const col = await this.getCollection(projectId);
    await col.doc(id).set(placeholder);
    return placeholder;
  }

  async getPlaceholderById(
    projectId: string,
    placeholderId: string
  ): Promise<ReplacementPlaceholderData | null> {
    const col = await this.getCollection(projectId);
    const snap = await col.doc(placeholderId).get();
    if (!snap.exists) return null;
    return snap.data() as ReplacementPlaceholderData;
  }

  async getPlaceholderByEntity(
    projectId: string,
    canonicalEntityId: string
  ): Promise<ReplacementPlaceholderData | null> {
    const col = await this.getCollection(projectId);
    const snap = await col.where('canonicalEntityId', '==', canonicalEntityId).get();
    if (!snap || snap.empty || !snap.docs || snap.docs.length === 0) return null;
    return snap.docs[0].data() as ReplacementPlaceholderData;
  }

  async getPlaceholdersByProject(
    projectId: string,
    filter?: PlaceholderFilter
  ): Promise<ReplacementPlaceholderData[]> {
    const col = await this.getCollection(projectId);
    const snap = await col.get();
    let placeholders: ReplacementPlaceholderData[] = snap.docs.map(
      (doc: any) => doc.data() as ReplacementPlaceholderData
    );

    if (filter) {
      if (filter.assetCategory) {
        placeholders = placeholders.filter((p) => p.assetCategory === filter.assetCategory);
      }
      if (filter.clearanceTier) {
        placeholders = placeholders.filter((p) => p.clearanceTier === filter.clearanceTier);
      }
      if (filter.canonicalEntityId) {
        placeholders = placeholders.filter((p) => p.canonicalEntityId === filter.canonicalEntityId);
      }
    }

    return placeholders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updatePlaceholderTier(
    projectId: string,
    placeholderId: string,
    clearanceTier: PlaceholderClearanceTier,
    approvedBy: string,
    approvedRole?: string
  ): Promise<ReplacementPlaceholderData | null> {
    const col = await this.getCollection(projectId);
    const docRef = col.doc(placeholderId);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const current = snap.data() as ReplacementPlaceholderData;
    const now = new Date().toISOString();
    const updated: ReplacementPlaceholderData = {
      ...current,
      clearanceTier,
      approvedBy,
      approvedRole: approvedRole || current.approvedRole,
      approvalDate: now,
      updatedAt: now,
    };

    await docRef.set(updated);
    return updated;
  }

  async deletePlaceholder(projectId: string, placeholderId: string): Promise<boolean> {
    const col = await this.getCollection(projectId);
    const docRef = col.doc(placeholderId);
    const snap = await docRef.get();
    if (!snap.exists) return false;

    await docRef.delete();
    return true;
  }
}

export const placeholderRepo = new PlaceholderRepo();
