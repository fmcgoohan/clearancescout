import { getDb } from './firestoreClient.js';
import { v4 as uuidv4 } from 'uuid';
import { ClearanceStatus } from './EntityRepo.js';

export type ProvenanceType = 'PARALLEL_LIVE' | 'DEMO_FIXTURE' | 'FALLBACK_FIXTURE';

export interface ClearanceCitation {
  id: string;
  sourceUrl: string;
  query: string;
  retrievedAt: string;
  excerptSnippet: string;
  registrationStatus: 'REGISTERED_ACTIVE' | 'PENDING' | 'EXPIRED' | 'UNKNOWN';
  corporateOwner?: string;
  disputePrecedents?: string;
  provenance?: ProvenanceType;
}

export interface OccurrenceContextInterpretation {
  prominence: 'HERO_FOREGROUND' | 'BACKGROUND_INCIDENTAL';
  modality: 'VISUAL_PROP' | 'DIALOGUE_MENTION' | 'BOTH';
  tone: 'FAVORABLE' | 'NEUTRAL' | 'DISPARAGING';
  endorsementImplication: boolean;
  safetyHazardDepiction: boolean;
  defamationRisk: boolean;
  extractedContextSnippet?: string;
}

export interface ClearanceRiskAssessmentData {
  id: string;
  projectId?: string;
  occurrenceId: string;
  canonicalEntityId: string;
  sceneId: string;
  riskStatus: ClearanceStatus;
  riskScore: number;
  legalRationale: string;
  contextFlags: string[];
  citations: ClearanceCitation[];
  occurrenceContext?: OccurrenceContextInterpretation;
  provenance?: ProvenanceType;
  evaluatedAt: string;
  disclaimer: string;
}

export class AssessmentRepo {
  private db = getDb();

  async createAssessment(
    projectIdOrInput: string | Omit<ClearanceRiskAssessmentData, 'id' | 'evaluatedAt' | 'disclaimer'>,
    maybeInput?: Omit<ClearanceRiskAssessmentData, 'id' | 'evaluatedAt' | 'disclaimer'>
  ): Promise<ClearanceRiskAssessmentData> {
    const projectId = typeof projectIdOrInput === 'string' ? projectIdOrInput : (projectIdOrInput.projectId || 'default-project');
    const input = typeof projectIdOrInput === 'string' ? maybeInput! : projectIdOrInput;
    const id = `asm-${uuidv4().slice(0, 8)}`;
    const assessment: ClearanceRiskAssessmentData = {
      id,
      projectId,
      ...input,
      evaluatedAt: new Date().toISOString(),
      disclaimer: 'ClearanceScout provides workflow issue-spotting and clearance risk categorization. It does not render formal legal advice.',
    };

    const docRef = await this.db.doc(`projects/${projectId}/entities/${input.canonicalEntityId}/assessments/${id}`);
    await docRef.set(assessment);
    return assessment;
  }

  async getAssessmentsByEntity(projectId: string, canonicalEntityId: string): Promise<ClearanceRiskAssessmentData[]> {
    const colRef = await this.db.collection(`projects/${projectId}/entities/${canonicalEntityId}/assessments`);
    const snap = await colRef.get();
    return snap.docs.map((d: any) => d.data() as ClearanceRiskAssessmentData);
  }
}

export const assessmentRepo = new AssessmentRepo();
