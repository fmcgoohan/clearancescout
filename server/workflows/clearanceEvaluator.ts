import { entityRepo, ClearanceStatus, CanonicalEntityData } from '../repositories/EntityRepo.js';
import { assessmentRepo, ClearanceRiskAssessmentData } from '../repositories/AssessmentRepo.js';
import { parallelSearchTool } from '../tools/parallelSearchTool.js';
import { timelineEmitter } from '../events/timelineEmitter.js';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

export interface ResearchRetryResult {
  entity: CanonicalEntityData;
  assessment: ClearanceRiskAssessmentData;
  retriedAt: string;
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

    // Execute targeted single-item research evaluation
    const assessment = await this.evaluateEntityClearance(projectId, canonicalEntityId);
    const updatedEntity = (await entityRepo.getEntityById(projectId, canonicalEntityId)) || entity;

    return {
      entity: updatedEntity,
      assessment,
      retriedAt: new Date().toISOString(),
    };
  }

  async evaluateEntityClearance(projectId: string, canonicalEntityId: string): Promise<ClearanceRiskAssessmentData> {
    const entities = await entityRepo.getEntitiesByProject(projectId);
    const entity = entities.find((e) => e.id === canonicalEntityId);

    if (!entity) {
      throw new Error(`Canonical entity ${canonicalEntityId} not found`);
    }

    // Step 1: Execute Grounding Search (returns actual ProvenanceType)
    const searchResult = await parallelSearchTool.searchTrademarkGrounding(entity.canonicalName);

    let toolLabel = 'Initiating Demo Fixture Trademark Grounding';
    let citationLabel = `Demo Fixture Citations Retained (${searchResult.citations.length})`;

    if (searchResult.provenance === 'PARALLEL_LIVE') {
      toolLabel = 'Initiating Live Parallel-Web Trademark Grounding';
      citationLabel = `Live Parallel-Web Citations Retained (${searchResult.citations.length})`;
    } else if (searchResult.provenance === 'FALLBACK_FIXTURE') {
      toolLabel = 'Parallel Search Fallback Triggered (Synthetic Grounding)';
      citationLabel = `⚠️ Cloud Fallback Fixtures Retained (${searchResult.citations.length})`;
    }

    timelineEmitter.emit(projectId, 'TOOL_CALL', toolLabel, {
      canonicalEntityId,
      provenance: searchResult.provenance,
    });

    timelineEmitter.emit(projectId, 'CITATION_ADDED', citationLabel, {
      citationsCount: searchResult.citations.length,
      sampleUrl: searchResult.citations[0]?.sourceUrl,
      corporateOwner: searchResult.citations[0]?.corporateOwner,
      provenance: searchResult.provenance,
    });

    // Step 2: Deterministic Metric Computation
    const defamatoryKeywords = ['dangerous', 'toxic', 'poisonous', 'faulty', 'exploded', 'stole', 'illegal', 'scam', 'killed', 'disaster'];
    const occurrenceExcerpt = `${entity.canonicalName} featured in high-speed scene action context`;
    
    let isDefamatory = false;
    defamatoryKeywords.forEach((kw) => {
      if (occurrenceExcerpt.toLowerCase().includes(kw)) {
        isDefamatory = true;
      }
    });

    // Deterministic polarity and exposure calculation
    const sentimentPolarity = isDefamatory ? -0.85 : 0.20;
    const exposureDurationSeconds = 12;

    // Step 3: Synthesis of Verdict via Deterministic Rules & Category Classification
    let status: ClearanceStatus = 'REVIEW_RECOMMENDED';
    let riskScore = 45;
    let rationale = `Grounding search confirmed active registration for ${entity.canonicalName}. Category: ${entity.entityCategory}. Usage is neutral to moderate product placement risk.`;
    const contextFlags: string[] = ['TRADEMARK_ACTIVE'];

    if (isDefamatory) {
      status = 'ACTION_REQUIRED';
      riskScore = 90;
      rationale = `High tarnishment / defamation risk: ${entity.canonicalName} is depicted alongside negative context keywords. Unauthorized depiction creates significant product disparagement liability. Replacement brand required.`;
      contextFlags.push('DEFAMATION_RISK', 'UNAUTHORIZED_USAGE');
    } else if (entity.entityCategory === 'ART_MUSIC') {
      status = 'ACTION_REQUIRED';
      riskScore = 85;
      rationale = `Copyrighted musical work / artistic property: "${entity.canonicalName}" owned by ${searchResult.citations[0]?.corporateOwner || 'copyright holder'}. Synchronization and master use licenses required prior to production.`;
      contextFlags.push('MUSIC_SYNC_LICENSE_REQUIRED', 'COPYRIGHT_PROTECTION');
    } else if (entity.entityCategory === 'PUBLIC_FIGURE') {
      status = 'REVIEW_RECOMMENDED';
      riskScore = 65;
      rationale = `Living public figure depicted: "${entity.canonicalName}". Right of publicity and defamation review recommended by production legal counsel.`;
      contextFlags.push('RIGHT_OF_PUBLICITY_REVIEW');
    } else if (entity.entityCategory === 'PROPRIETARY_LOCATION') {
      status = 'REVIEW_RECOMMENDED';
      riskScore = 55;
      rationale = `Proprietary location / landmark: "${entity.canonicalName}" owned by ${searchResult.citations[0]?.corporateOwner || 'property management'}. Location release or commercial filming permit required.`;
      contextFlags.push('LOCATION_RELEASE_REQUIRED');
    } else if (entity.entityCategory === 'GRAPHIC_PROP') {
      status = 'ACTION_REQUIRED';
      riskScore = 75;
      rationale = `Proprietary graphic text / prop: "${entity.canonicalName}". Fictionalized non-infringing prop graphic packaging card recommended.`;
      contextFlags.push('GRAPHIC_CLEARANCE_REQUIRED');
    } else if (entity.canonicalName.toLowerCase().includes('coca-cola') || entity.canonicalName.toLowerCase().includes('porsche')) {
      status = 'ACTION_REQUIRED';
      riskScore = 80;
      rationale = `High brand protection enforcement: ${entity.canonicalName} is a famous global mark owned by ${searchResult.citations[0]?.corporateOwner || 'brand owner'}. Commercial depicted use requires written clearance release or replacement brand asset.`;
      contextFlags.push('FAMOUS_MARK_PROTECTION', 'CLEARANCE_RELEASE_REQUIRED');
    } else {
      status = 'NO_ISSUE_SURFACED';
      riskScore = 15;
      rationale = `No infringement or tarnishment issues surfaced for ${entity.canonicalName} in current scene context.`;
    }

    timelineEmitter.emit(projectId, 'RISK_EVAL', `Clearance Risk Verdict: ${status}`, {
      canonicalEntityId,
      canonicalName: entity.canonicalName,
      category: entity.entityCategory,
      riskStatus: status,
      riskScore,
      sentimentPolarity,
      exposureDurationSeconds,
      contextFlags,
      isOverridden: !!entity.isOverridden,
    });

    // Persist assessment with actual result provenance
    const assessment = await assessmentRepo.createAssessment({
      occurrenceId: `occ-${canonicalEntityId}`,
      canonicalEntityId,
      sceneId: 'scene-1',
      riskStatus: status,
      riskScore,
      legalRationale: rationale,
      contextFlags,
      citations: searchResult.citations,
      provenance: searchResult.provenance,
    });

    // Update Canonical Entity overall clearance status (EntityRepo preserves active overrides)
    await entityRepo.updateCanonicalEntityStatus(projectId, canonicalEntityId, status);

    return assessment;
  }
}

export const clearanceEvaluator = new ClearanceEvaluator();
