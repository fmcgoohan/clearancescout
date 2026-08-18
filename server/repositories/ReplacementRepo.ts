import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';
import { ClearanceStatus } from './EntityRepo.js';
import { ClearanceCitation, ProvenanceType } from './AssessmentRepo.js';

export interface ReplacementAttemptRecord {
  attemptNumber: number;          // 1, 2, or 3 (max 3)
  candidateName: string;          // Generated fictional brand candidate name
  designBrief: string;
  eraAesthetic?: string;
  clearanceStatus: ClearanceStatus; // 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE'
  collisionRationale?: string;    // If rejected, specific trademark or commercial collision reason
  citations: ClearanceCitation[]; // Research citations grounded via ParallelSearch or fixture
  provenance: ProvenanceType;     // 'PARALLEL_LIVE' | 'DEMO_FIXTURE' | 'FALLBACK_FIXTURE'
  timestamp: string;               // ISO 8601 string
}

export interface ReplacementCardData {
  id: string;                      // e.g. 'rep-7b9a4c2d'
  projectId?: string;
  canonicalEntityId: string;
  targetEntityName?: string;
  fictionalBrandName: string;
  designBrief: string;
  eraAesthetic?: string;
  artworkImageUrl?: string;
  nonInfringementRationale?: string;
  clearanceStatus: ClearanceStatus; // 'NO_ISSUE_SURFACED' (accepted) or 'REVIEW_RECOMMENDED' / 'INSUFFICIENT_EVIDENCE' (escalated)
  selfClearanceResult: 'ACCEPTED' | 'ESCALATED_TO_COUNSEL';
  totalAttempts: number;           // 1 to 3
  attemptHistory: ReplacementAttemptRecord[];
  citations: ClearanceCitation[];
  provenance: ProvenanceType;
  status: 'DRAFT' | 'PROPOSED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export class ReplacementRepo {
  private db = getDb();

  async createReplacement(input: Omit<ReplacementCardData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReplacementCardData> {
    const id = `rep-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const replacement: ReplacementCardData = {
      id,
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.db.doc(`projects/${input.canonicalEntityId}/replacements/${id}`);
    await docRef.set(replacement);
    return replacement;
  }

  async getReplacementsByEntity(projectId: string, canonicalEntityId: string): Promise<ReplacementCardData[]> {
    const colRef = await this.db.collection(`projects/${canonicalEntityId}/replacements`);
    const snap = await colRef.get();
    return snap.docs.map((d: any) => d.data() as ReplacementCardData);
  }
}

export const replacementRepo = new ReplacementRepo();
