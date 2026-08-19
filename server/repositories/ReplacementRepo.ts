import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';
import { entityRepo, ClearanceStatus } from './EntityRepo.js';
import { assessmentRepo, ClearanceCitation, ProvenanceType } from './AssessmentRepo.js';

export interface ReplacementAttemptRecord {
  attemptNumber: number;          // 1, 2, or 3 (max 3)
  candidateName: string;          // Generated fictional brand candidate name
  designBrief: string;
  eraAesthetic?: string;
  clearanceStatus: ClearanceStatus; // 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE'
  collisionRationale?: string;    // If rejected, specific trademark or commercial collision reason
  negativeConstraintsApplied?: string[]; // Negative constraints applied during synthesis
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

export interface OriginalEntitySummary {
  id: string;
  canonicalName: string;
  entityCategory: string;
  description: string;
  overallClearanceStatus: ClearanceStatus;
  riskScore: number;
  legalRationale: string;
  citations: ClearanceCitation[];
  isOverridden?: boolean;
  latestOverride?: {
    overrideStatus: ClearanceStatus;
    rationale: string;
    counselName: string;
    timestamp: string;
  };
}

export interface ReplacementSummary {
  id: string;
  replacementName: string;
  entityCategory: string;
  clearanceStatus: ClearanceStatus;
  isEscalated: boolean;
  attemptsCount: number;
  generationPrompt: string;
  visualStyle: string;
  artworkImageUrl?: string;
  nonInfringementRationale?: string;
  citations: ClearanceCitation[];
  provenance: ProvenanceType;
}

export interface CandidateAttemptSummary {
  attemptNumber: number;
  candidateName: string;
  riskStatus: ClearanceStatus;
  rejectionRationale?: string;
  negativeConstraintsApplied?: string[];
  timestamp: string;
}

export interface ComparisonViewModel {
  projectId: string;
  original: OriginalEntitySummary;
  replacement: ReplacementSummary;
  attemptHistory: CandidateAttemptSummary[];
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

  async getComparisonData(projectId: string, canonicalEntityId: string): Promise<ComparisonViewModel> {
    const entity = await entityRepo.getEntityById(projectId, canonicalEntityId);
    if (!entity) {
      const err: any = new Error(`Entity ${canonicalEntityId} not found in project ${projectId}.`);
      err.status = 404;
      throw err;
    }

    if (!entity.replacementCard) {
      const err: any = new Error(
        `Entity ${canonicalEntityId} does not have an attached replacement card. Comparison is available only when a replacement card exists.`
      );
      err.status = 400;
      throw err;
    }

    const card = entity.replacementCard;
    const assessments = await assessmentRepo.getAssessmentsByEntity(projectId, canonicalEntityId);
    const latestAssessment = assessments.length > 0 ? assessments[assessments.length - 1] : null;

    const original: OriginalEntitySummary = {
      id: entity.id,
      canonicalName: entity.canonicalName,
      entityCategory: entity.entityCategory,
      description: entity.description || 'No detailed scene context provided.',
      overallClearanceStatus: entity.overallClearanceStatus,
      riskScore: latestAssessment ? latestAssessment.riskScore : 50,
      legalRationale: latestAssessment ? latestAssessment.legalRationale : 'Pending comprehensive clearance evaluation.',
      citations: latestAssessment ? latestAssessment.citations : [],
      isOverridden: entity.isOverridden,
      latestOverride: entity.latestOverride,
    };

    const isEscalated = card.selfClearanceResult === 'ESCALATED_TO_COUNSEL';

    const replacement: ReplacementSummary = {
      id: card.id,
      replacementName: card.fictionalBrandName,
      entityCategory: entity.entityCategory,
      clearanceStatus: card.clearanceStatus,
      isEscalated,
      attemptsCount: card.totalAttempts,
      generationPrompt: card.designBrief,
      visualStyle: card.eraAesthetic || 'Modern Cinematic',
      artworkImageUrl: card.artworkImageUrl,
      nonInfringementRationale: card.nonInfringementRationale,
      citations: card.citations || [],
      provenance: card.provenance,
    };

    const attemptHistory: CandidateAttemptSummary[] = (card.attemptHistory || []).map((att: ReplacementAttemptRecord) => ({
      attemptNumber: att.attemptNumber,
      candidateName: att.candidateName,
      riskStatus: att.clearanceStatus,
      rejectionRationale: att.collisionRationale,
      negativeConstraintsApplied: att.collisionRationale ? [att.collisionRationale] : [],
      timestamp: att.timestamp,
    }));

    return {
      projectId,
      original,
      replacement,
      attemptHistory,
    };
  }
}

export const replacementRepo = new ReplacementRepo();
