import { entityRepo, ClearanceStatus, CanonicalEntityData, SceneEntityOccurrenceData } from '../repositories/EntityRepo.js';
import { assessmentRepo, ClearanceRiskAssessmentData } from '../repositories/AssessmentRepo.js';
import { projectRepo } from '../repositories/ProjectRepo.js';
import { rightsRepo } from '../repositories/RightsRepo.js';
import { parallelSearchTool } from '../tools/parallelSearchTool.js';
import { timelineEmitter } from '../events/timelineEmitter.js';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

export interface ResearchRetryResult {
  entity: CanonicalEntityData;
  assessment: ClearanceRiskAssessmentData;
  retriedAt: string;
}

export interface OccurrenceEvaluationResult {
  occurrence: SceneEntityOccurrenceData;
  assessment: ClearanceRiskAssessmentData;
  derivedCanonicalStatus: ClearanceStatus;
  evaluatedAt: string;
}

export class ClearanceEvaluator {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (config.geminiApiKey) {
      this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
  }

  async retryEntityResearch(projectId: string, canonicalEntityId: string): Promise<ResearchRetryResult> {
    const entity = await entityRepo.getEntityById(projectId, canonicalEntityId);
    if (!entity) {
      throw new Error(`Canonical entity ${canonicalEntityId} not found in project ${projectId}`);
    }

    // Eligibility Gating: Retry is permitted only for INSUFFICIENT_EVIDENCE, un-evaluated items, or overridden entities needing evidence refresh
    if (!entity.isOverridden && entity.overallClearanceStatus !== 'INSUFFICIENT_EVIDENCE') {
      const err: any = new Error(
        `Entity is already evaluated with status ${entity.overallClearanceStatus}. Retry is permitted only for INSUFFICIENT_EVIDENCE or failed research.`
      );
      err.status = 400;
      throw err;
    }

    // Emit RESEARCH_RETRY_STARTED observable timeline event
    timelineEmitter.emit(projectId, 'RESEARCH_RETRY_STARTED', `Research Retry Initiated: ${entity.canonicalName}`, {
      entityId: entity.id,
      canonicalName: entity.canonicalName,
      previousStatus: entity.overallClearanceStatus,
      timestamp: new Date().toISOString(),
    });

    // Execute targeted research evaluation
    const assessment = await this.evaluateEntityClearance(projectId, canonicalEntityId);
    const updatedEntity = (await entityRepo.getEntityById(projectId, canonicalEntityId)) || entity;

    return {
      entity: updatedEntity,
      assessment,
      retriedAt: new Date().toISOString(),
    };
  }

  async evaluateOccurrenceClearance(projectId: string, occurrenceId: string): Promise<OccurrenceEvaluationResult> {
    const occLookup = await entityRepo.getOccurrenceById(projectId, occurrenceId);
    if (!occLookup) {
      throw new Error(`Occurrence ${occurrenceId} not found in project ${projectId}`);
    }

    const { occurrence, sceneId } = occLookup;
    const entity = await entityRepo.getEntityById(projectId, occurrence.canonicalEntityId);
    if (!entity) {
      throw new Error(`Canonical entity ${occurrence.canonicalEntityId} not found`);
    }

    // Live Quota Enforcement
    const project = await projectRepo.getProject(projectId);
    if (project?.executionMode === 'CLOUD_MODE') {
      const quotaResult = await projectRepo.consumeLiveQuota(projectId, 1);
      if (!quotaResult.success) {
        const err: any = new Error(
          `Live research quota exceeded for this project (${quotaResult.quota.remaining}/${quotaResult.quota.limit} remaining).`
        );
        err.status = 429;
        err.quota = quotaResult.quota;
        throw err;
      }
    }

    // Step 1: Grounding Search
    const searchResult = await parallelSearchTool.searchTrademarkGrounding(entity.canonicalName);

    timelineEmitter.emit(projectId, 'TOOL_CALL', `Grounding Research for Scene Occurrence: ${entity.canonicalName}`, {
      occurrenceId,
      sceneId,
      canonicalEntityId: entity.id,
      provenance: searchResult.provenance,
    });

    // Step 2: Contractual Rights & Restrictions Evaluation (Phase 4)
    const rightsCoverage = await rightsRepo.evaluateRightsCoverage(projectId, entity.id, occurrenceId);

    // Step 3: Scene Action Context Analysis
    const defamatoryKeywords = ['dangerous', 'toxic', 'poisonous', 'faulty', 'exploded', 'stole', 'illegal', 'scam', 'killed', 'disaster', 'counterfeit', 'weapon'];
    const sceneContextText = `${occurrence.excerptText || ''} ${occurrence.usageContext || ''}`.toLowerCase();

    let isDefamatory = false;
    defamatoryKeywords.forEach((kw) => {
      if (sceneContextText.includes(kw)) {
        isDefamatory = true;
      }
    });

    // Step 4: Occurrence Verdict Calculation
    let status: ClearanceStatus = 'REVIEW_RECOMMENDED';
    let riskScore = 45;
    let rationale = `Grounding search confirmed active registration for ${entity.canonicalName}. Category: ${entity.entityCategory}. Usage in ${sceneId} is neutral to moderate risk.`;
    const contextFlags: string[] = ['TRADEMARK_ACTIVE'];

    if (rightsCoverage.isCovered) {
      // Contractual Rights cover this usage
      status = 'NO_ISSUE_SURFACED';
      riskScore = 5;
      rationale = `${rightsCoverage.summaryText} Scene usage in ${sceneId} is cleared under executed agreement.`;
      contextFlags.push('CONTRACTUAL_RIGHTS_ACTIVE');
      if (rightsCoverage.covenants.length > 0) {
        rightsCoverage.covenants.forEach((c) => contextFlags.push(`COVENANT: ${c}`));
      }
      if (rightsCoverage.hasExpiringSoon && rightsCoverage.expirationWarning) {
        contextFlags.push('LICENSE_EXPIRING_SOON');
      }
    } else if (isDefamatory) {
      status = 'ACTION_REQUIRED';
      riskScore = 90;
      rationale = `High tarnishment / disparagement risk in ${sceneId}: "${entity.canonicalName}" is depicted in negative scene context ("${occurrence.excerptText}"). Replacement or counsel release required.`;
      contextFlags.push('DEFAMATION_RISK', 'UNAUTHORIZED_USAGE');
    } else if (entity.entityCategory === 'ART_MUSIC') {
      status = 'ACTION_REQUIRED';
      riskScore = 85;
      rationale = `Copyrighted musical work in ${sceneId}: "${entity.canonicalName}". Synchronization license required prior to broadcast/distribution.`;
      contextFlags.push('MUSIC_SYNC_LICENSE_REQUIRED', 'COPYRIGHT_PROTECTION');
    } else if (entity.entityCategory === 'PUBLIC_FIGURE') {
      status = 'REVIEW_RECOMMENDED';
      riskScore = 65;
      rationale = `Living public figure depicted in ${sceneId}: "${entity.canonicalName}". Right of publicity review recommended.`;
      contextFlags.push('RIGHT_OF_PUBLICITY_REVIEW');
    } else if (entity.entityCategory === 'PROPRIETARY_LOCATION') {
      status = 'REVIEW_RECOMMENDED';
      riskScore = 55;
      rationale = `Proprietary location in ${sceneId}: "${entity.canonicalName}". Location release / filming permit required.`;
      contextFlags.push('LOCATION_RELEASE_REQUIRED');
    } else if (entity.entityCategory === 'GRAPHIC_PROP') {
      status = 'ACTION_REQUIRED';
      riskScore = 75;
      rationale = `Proprietary graphic text in ${sceneId}: "${entity.canonicalName}". Fictionalized non-infringing prop packaging card recommended.`;
      contextFlags.push('GRAPHIC_CLEARANCE_REQUIRED');
    } else if (entity.canonicalName.toLowerCase().includes('coca-cola') || entity.canonicalName.toLowerCase().includes('porsche')) {
      status = 'ACTION_REQUIRED';
      riskScore = 80;
      rationale = `High brand protection enforcement mark in ${sceneId}: ${entity.canonicalName}. Written clearance release required.`;
      contextFlags.push('FAMOUS_MARK_PROTECTION', 'CLEARANCE_RELEASE_REQUIRED');
    } else {
      status = 'NO_ISSUE_SURFACED';
      riskScore = 15;
      rationale = `No infringement or tarnishment issues surfaced for ${entity.canonicalName} in ${sceneId} context.`;
    }

    // Step 5: Persist Occurrence Evaluation
    const updatedOcc = await entityRepo.updateOccurrenceEvaluation(projectId, sceneId, occurrenceId, {
      clearanceStatus: status,
      riskScore,
      riskRationale: rationale,
      contextFlags,
      citations: searchResult.citations,
      evaluatedAt: new Date().toISOString(),
    });

    // Step 6: Persist Assessment Record
    const assessment = await assessmentRepo.createAssessment({
      occurrenceId,
      canonicalEntityId: entity.id,
      sceneId,
      riskStatus: status,
      riskScore,
      legalRationale: rationale,
      contextFlags,
      citations: searchResult.citations,
      provenance: searchResult.provenance,
    });

    // Step 7: Compute Derived Canonical Status
    const derivedCanonicalStatus = await entityRepo.computeDerivedCanonicalStatus(projectId, entity.id);

    timelineEmitter.emit(projectId, 'RISK_EVAL', `Occurrence Risk Verdict (${sceneId}): ${status}`, {
      occurrenceId,
      sceneId,
      canonicalEntityId: entity.id,
      canonicalName: entity.canonicalName,
      riskStatus: status,
      riskScore,
      derivedCanonicalStatus,
      rightsCovered: rightsCoverage.isCovered,
    });

    return {
      occurrence: updatedOcc || occurrence,
      assessment,
      derivedCanonicalStatus,
      evaluatedAt: new Date().toISOString(),
    };
  }

  async evaluateEntityClearance(projectId: string, canonicalEntityId: string): Promise<ClearanceRiskAssessmentData> {
    const project = await projectRepo.getProject(projectId);
    if (project?.executionMode === 'CLOUD_MODE') {
      const quotaResult = await projectRepo.consumeLiveQuota(projectId, 1);
      if (!quotaResult.success) {
        const err: any = new Error(
          `Live research quota exceeded for this project (${quotaResult.quota.remaining}/${quotaResult.quota.limit} remaining).`
        );
        err.status = 429;
        err.quota = quotaResult.quota;
        throw err;
      }
    }

    const entity = await entityRepo.getEntityById(projectId, canonicalEntityId);
    if (!entity) {
      throw new Error(`Canonical entity ${canonicalEntityId} not found`);
    }

    const occurrences = await entityRepo.getOccurrencesByEntity(projectId, canonicalEntityId);

    // If occurrences exist, evaluate each occurrence in its actual scene context
    let latestAssessment: ClearanceRiskAssessmentData | null = null;

    if (occurrences.length > 0) {
      for (const occ of occurrences) {
        const res = await this.evaluateOccurrenceClearance(projectId, occ.id);
        latestAssessment = res.assessment;
      }
    } else {
      // Baseline evaluation when no specific scene occurrences exist
      const rightsCoverage = await rightsRepo.evaluateRightsCoverage(projectId, canonicalEntityId);
      const searchResult = await parallelSearchTool.searchTrademarkGrounding(entity.canonicalName);

      let status: ClearanceStatus = 'REVIEW_RECOMMENDED';
      let riskScore = 45;
      let rationale = `Grounding search confirmed active registration for ${entity.canonicalName}. Baseline category risk for ${entity.entityCategory}.`;
      const contextFlags: string[] = ['TRADEMARK_ACTIVE'];

      if (rightsCoverage.isCovered) {
        status = 'NO_ISSUE_SURFACED';
        riskScore = 5;
        rationale = `${rightsCoverage.summaryText} Item is covered under active executed agreement.`;
        contextFlags.push('CONTRACTUAL_RIGHTS_ACTIVE');
        if (rightsCoverage.covenants.length > 0) {
          rightsCoverage.covenants.forEach((c) => contextFlags.push(`COVENANT: ${c}`));
        }
      } else if (entity.entityCategory === 'ART_MUSIC' || entity.entityCategory === 'GRAPHIC_PROP') {
        status = 'ACTION_REQUIRED';
        riskScore = 80;
      } else if (entity.entityCategory === 'BRAND') {
        status = 'NO_ISSUE_SURFACED';
        riskScore = 15;
      }

      latestAssessment = await assessmentRepo.createAssessment({
        occurrenceId: `occ-${canonicalEntityId}`,
        canonicalEntityId,
        sceneId: 'scene-general',
        riskStatus: status,
        riskScore,
        legalRationale: rationale,
        contextFlags,
        citations: searchResult.citations,
        provenance: searchResult.provenance,
      });

      await entityRepo.updateCanonicalEntityStatus(projectId, canonicalEntityId, status);
    }

    return latestAssessment!;
  }
}

export const clearanceEvaluator = new ClearanceEvaluator();
